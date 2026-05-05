import { pathToFileURL } from 'node:url';

const DEFAULT_API_BASE = (process.env.API_BASE_URL || process.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/$/, '');
const DEFAULT_EMAIL = process.env.SUPERVISOR_EMAIL || 'admin@admin.com';
const DEFAULT_PASSWORD = process.env.SUPERVISOR_PASSWORD || 'admin';
const DEFAULT_EXAM_NAME = process.env.EXAM_NAME || 'Mathematics & Logic';
const DEFAULT_EXAM_YEAR = Number(process.env.EXAM_YEAR || 2026);

// If your API denies deleting a session directly, set DEEP_DELETE=1
// to delete dependent objects first (submissions -> schedules -> rooms/subjects -> session).
const DEEP_DELETE = ['1', 'true', 'yes'].includes(String(process.env.DEEP_DELETE || '').toLowerCase());

// Optional: also remove demo candidates created by the bootstrap script.
// This targets application_number prefix "DOCT-" and national_id prefix "NAT-<year>-".
const DELETE_DEMO_CANDIDATES = ['1', 'true', 'yes'].includes(
  String(process.env.DELETE_DEMO_CANDIDATES || '').toLowerCase(),
);

const apiStats = {
  totalCalls: 0,
  successes: 0,
  failures: 0,
};

async function apiFetch(url, options = {}, accessToken) {
  apiStats.totalCalls += 1;
  const headers = new Headers(options.headers || {});
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  if (options.body && !headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, { ...options, headers });
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    apiStats.failures += 1;
    const message =
      typeof data === 'object' && data !== null ? JSON.stringify(data, null, 2) : String(data || response.statusText);
    throw new Error(`Request failed (${response.status}) ${url}: ${message}`);
  }

  apiStats.successes += 1;
  return data;
}

async function apiDelete(url, accessToken) {
  apiStats.totalCalls += 1;
  const headers = new Headers();
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);

  const response = await fetch(url, { method: 'DELETE', headers });
  if (response.status === 204) {
    apiStats.successes += 1;
    return null;
  }

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    apiStats.failures += 1;
    const message =
      typeof data === 'object' && data !== null ? JSON.stringify(data, null, 2) : String(data || response.statusText);
    throw new Error(`DELETE failed (${response.status}) ${url}: ${message}`);
  }

  apiStats.successes += 1;
  return data;
}

async function login(email = DEFAULT_EMAIL, password = DEFAULT_PASSWORD) {
  return apiFetch(`${DEFAULT_API_BASE}/auth/login/`, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

async function listSessions(accessToken) {
  return apiFetch(`${DEFAULT_API_BASE}/examinations/sessions/`, {}, accessToken);
}

async function listSubjects(accessToken) {
  return apiFetch(`${DEFAULT_API_BASE}/examinations/subjects/`, {}, accessToken);
}

async function listRooms(accessToken) {
  return apiFetch(`${DEFAULT_API_BASE}/examinations/rooms/`, {}, accessToken);
}

async function listSchedules(accessToken) {
  return apiFetch(`${DEFAULT_API_BASE}/examinations/schedules/`, {}, accessToken);
}

async function listAttendanceSubmissions(accessToken) {
  return apiFetch(`${DEFAULT_API_BASE}/attendance/submissions/`, {}, accessToken);
}

async function listCandidates(accessToken) {
  return apiFetch(`${DEFAULT_API_BASE}/candidates/`, {}, accessToken);
}

function pickSession(sessions) {
  const matches = (sessions || []).filter(
    (s) => s && s.name === DEFAULT_EXAM_NAME && Number(s.year) === DEFAULT_EXAM_YEAR,
  );
  if (!matches.length) return null;
  if (matches.length === 1) return matches[0];
  // Prefer most recent id if duplicates exist
  return matches.slice().sort((a, b) => Number(b.id || 0) - Number(a.id || 0))[0];
}

async function deepDeleteSession(accessToken, sessionId) {
  const [subjects, rooms, schedules, submissions] = await Promise.all([
    listSubjects(accessToken),
    listRooms(accessToken),
    listSchedules(accessToken),
    listAttendanceSubmissions(accessToken),
  ]);

  const subjectIds = new Set(
    (subjects || []).filter((s) => Number(s.exam_session) === Number(sessionId)).map((s) => s.id),
  );
  const roomIds = new Set(
    (rooms || []).filter((r) => Number(r.exam_session) === Number(sessionId)).map((r) => r.id),
  );
  const scheduleIds = (schedules || [])
    .filter((sch) => subjectIds.has(sch.subject) || roomIds.has(sch.room))
    .map((sch) => sch.id);

  const submissionIds = (submissions || [])
    .filter((sub) => scheduleIds.includes(sub.exam_schedule))
    .map((sub) => sub.id);

  // Delete submissions first (cascades attendance records)
  for (const submissionId of submissionIds) {
    await apiDelete(`${DEFAULT_API_BASE}/attendance/submissions/${submissionId}/`, accessToken);
  }

  // Delete schedules (cascades allocations + any remaining submissions)
  for (const scheduleId of scheduleIds) {
    await apiDelete(`${DEFAULT_API_BASE}/examinations/schedules/${scheduleId}/`, accessToken);
  }

  // Delete rooms, subjects, then session
  for (const roomId of roomIds) {
    await apiDelete(`${DEFAULT_API_BASE}/examinations/rooms/${roomId}/`, accessToken);
  }
  for (const subjectId of subjectIds) {
    await apiDelete(`${DEFAULT_API_BASE}/examinations/subjects/${subjectId}/`, accessToken);
  }

  await apiDelete(`${DEFAULT_API_BASE}/examinations/sessions/${sessionId}/`, accessToken);

  return { subjectIds: [...subjectIds], roomIds: [...roomIds], scheduleIds, submissionIds };
}

async function maybeDeleteDemoCandidates(accessToken) {
  if (!DELETE_DEMO_CANDIDATES) return { deleted: 0 };
  const candidates = await listCandidates(accessToken);
  const yearTag = String(DEFAULT_EXAM_YEAR);
  const targets = (candidates || []).filter((c) => {
    const app = String(c?.application_number || '');
    const nat = String(c?.national_id || '');
    return app.startsWith('DOCT-') && nat.startsWith(`NAT-${yearTag}-`);
  });

  for (const candidate of targets) {
    await apiDelete(`${DEFAULT_API_BASE}/candidates/${candidate.id}/`, accessToken);
  }

  return { deleted: targets.length, ids: targets.map((c) => c.id) };
}

async function main() {
  const { access: accessToken } = await login();
  const sessions = await listSessions(accessToken);
  const session = pickSession(sessions);

  if (!session?.id) {
    console.log(
      JSON.stringify(
        {
          apiBase: DEFAULT_API_BASE,
          matched: false,
          examName: DEFAULT_EXAM_NAME,
          examYear: DEFAULT_EXAM_YEAR,
          statistics: {
            api_calls_total: apiStats.totalCalls,
            api_calls_successful: apiStats.successes,
            api_calls_failed: apiStats.failures,
          },
        },
        null,
        2,
      ),
    );
    return;
  }

  let deletion = null;
  if (DEEP_DELETE) {
    deletion = await deepDeleteSession(accessToken, session.id);
  } else {
    // This is usually enough because of CASCADE relations in the DB.
    await apiDelete(`${DEFAULT_API_BASE}/examinations/sessions/${session.id}/`, accessToken);
  }

  const demoCandidates = await maybeDeleteDemoCandidates(accessToken);

  console.log(
    JSON.stringify(
      {
        apiBase: DEFAULT_API_BASE,
        matched: true,
        deletedSessionId: session.id,
        deletedSession: session,
        deepDelete: DEEP_DELETE,
        deepDeleteDetails: deletion,
        deleteDemoCandidates: DELETE_DEMO_CANDIDATES,
        demoCandidates,
        statistics: {
          api_calls_total: apiStats.totalCalls,
          api_calls_successful: apiStats.successes,
          api_calls_failed: apiStats.failures,
        },
      },
      null,
      2,
    ),
  );
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}

