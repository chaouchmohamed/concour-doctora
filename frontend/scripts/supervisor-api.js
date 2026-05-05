import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const DEFAULT_API_BASE = (process.env.API_BASE_URL || process.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/$/, '');
const DEFAULT_EMAIL = process.env.SUPERVISOR_EMAIL || 'admin@admin.com';
const DEFAULT_PASSWORD = process.env.SUPERVISOR_PASSWORD || 'admin';
const DEFAULT_EXAM_NAME = process.env.EXAM_NAME || 'Mathematics & Logic';
const DEFAULT_EXAM_YEAR = Number(process.env.EXAM_YEAR || 2026);
const DEFAULT_EXAM_STATUS = process.env.EXAM_STATUS || 'ACTIVE';
const DEFAULT_EXAM_STARTS_AT = process.env.EXAM_STARTS_AT || '2026-04-28';
const DEFAULT_EXAM_ENDS_AT = process.env.EXAM_ENDS_AT || '2026-04-28';
const DEFAULT_SUBJECT_NAME = process.env.SUBJECT_NAME || 'Mathematics & Logic';
const DEFAULT_SUBJECT_COEFFICIENT = Number(process.env.SUBJECT_COEFFICIENT || 1);
const DEFAULT_SUBJECT_MAX_SCORE = Number(process.env.SUBJECT_MAX_SCORE || 20);
const DEFAULT_SUBJECT_PASS_THRESHOLD = Number(process.env.SUBJECT_PASS_THRESHOLD || 10);
const DEFAULT_SUBJECT_DISCREPANCY_THRESHOLD = Number(process.env.SUBJECT_DISCREPANCY_THRESHOLD || 3);
const DEFAULT_SUBJECT_RULE = process.env.SUBJECT_RULE || 'AVERAGE';
const DEFAULT_ROOM_NAME = process.env.ROOM_NAME || 'Room A102';
const DEFAULT_ROOM_CAPACITY = Number(process.env.ROOM_CAPACITY || 53);
const DEFAULT_SCHEDULE_DATE = process.env.SCHEDULE_DATE || '2026-04-28';
const DEFAULT_SCHEDULE_TIME = process.env.SCHEDULE_TIME || '13:00:00';
const DEFAULT_SCHEDULE_DURATION = Number(process.env.SCHEDULE_DURATION || 180);
const DEFAULT_CANDIDATE_COUNT = Number(process.env.CANDIDATE_COUNT || 7);

const apiStats = {
  totalCalls: 0,
  successes: 0,
  failures: 0,
};

const __filename = fileURLToPath(import.meta.url);

async function apiFetch(url, options = {}, accessToken) {
  apiStats.totalCalls += 1;
  const headers = new Headers(options.headers || {});
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
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
    const message = typeof data === 'object' && data !== null
      ? JSON.stringify(data, null, 2)
      : String(data || response.statusText);
    throw new Error(`Request failed (${response.status}) ${url}: ${message}`);
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

async function me(accessToken) {
  return apiFetch(`${DEFAULT_API_BASE}/auth/me/`, {}, accessToken);
}

async function listSessions(accessToken) {
  return apiFetch(`${DEFAULT_API_BASE}/examinations/sessions/`, {}, accessToken);
}

async function listRooms(accessToken) {
  return apiFetch(`${DEFAULT_API_BASE}/examinations/rooms/`, {}, accessToken);
}

async function listSchedules(accessToken) {
  return apiFetch(`${DEFAULT_API_BASE}/examinations/schedules/`, {}, accessToken);
}

async function listCandidates(accessToken) {
  return apiFetch(`${DEFAULT_API_BASE}/candidates/`, {}, accessToken);
}

async function createCandidate(accessToken, payload) {
  return apiFetch(`${DEFAULT_API_BASE}/candidates/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }, accessToken);
}

async function createExamSession(accessToken, payload) {
  return apiFetch(`${DEFAULT_API_BASE}/examinations/sessions/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }, accessToken);
}

async function createSubject(accessToken, payload) {
  return apiFetch(`${DEFAULT_API_BASE}/examinations/subjects/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }, accessToken);
}

async function createRoom(accessToken, payload) {
  return apiFetch(`${DEFAULT_API_BASE}/examinations/rooms/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }, accessToken);
}

async function createSchedule(accessToken, payload) {
  return apiFetch(`${DEFAULT_API_BASE}/examinations/schedules/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }, accessToken);
}

async function autoAllocateSchedule(accessToken, scheduleId) {
  return apiFetch(`${DEFAULT_API_BASE}/examinations/schedules/${scheduleId}/auto_allocate/`, {
    method: 'POST',
  }, accessToken);
}

async function createAttendanceSubmission(accessToken, payload) {
  return apiFetch(`${DEFAULT_API_BASE}/attendance/submissions/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }, accessToken);
}

function buildDemoCandidate(index) {
  const seat = String(index + 1).padStart(2, '0');
  const yearTag = String(DEFAULT_EXAM_YEAR);
  return {
    first_name: ['Amine', 'Sarah', 'Karim', 'Lina', 'Yacine', 'Mounir', 'Fatiha'][index] || `Candidate${seat}`,
    last_name: ['Benali', 'Mansouri', 'Zidi', 'Khelifi', 'Brahimi', 'Haddad', 'Belkacem'][index] || `Demo${seat}`,
    national_id: `NAT-${yearTag}-${seat}`,
    email: `candidate${seat}@example.test`,
    phone: `055000${seat}${seat}`,
    application_number: `DOCT-${seat}`,
    status: 'REGISTERED',
  };
}

async function ensureDemoCandidates(accessToken, minimumCount = DEFAULT_CANDIDATE_COUNT) {
  const existing = await listCandidates(accessToken);
  const existingApplications = new Set((existing || []).map((candidate) => candidate.application_number));
  const existingNationalIds = new Set((existing || []).map((candidate) => candidate.national_id));
  const createdCandidates = [];

  for (let index = 0; index < minimumCount; index += 1) {
    const payload = buildDemoCandidate(index);
    if (existingApplications.has(payload.application_number) || existingNationalIds.has(payload.national_id)) {
      continue;
    }
    const created = await createCandidate(accessToken, payload);
    createdCandidates.push(created);
  }

  return {
    existingCount: (existing || []).length,
    createdCount: createdCandidates.length,
    candidates: [...(existing || []), ...createdCandidates],
  };
}

async function getCallList(accessToken, scheduleId) {
  return apiFetch(`${DEFAULT_API_BASE}/examinations/schedules/${scheduleId}/call_list/`, {}, accessToken);
}

async function getAttendanceCounter(accessToken, submissionId) {
  return apiFetch(`${DEFAULT_API_BASE}/attendance/submissions/${submissionId}/counter/`, {}, accessToken);
}

async function createAttendanceRecord(accessToken, payload) {
  return apiFetch(`${DEFAULT_API_BASE}/attendance/records/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }, accessToken);
}

async function toggleAttendanceRecord(accessToken, recordId) {
  return apiFetch(`${DEFAULT_API_BASE}/attendance/records/${recordId}/toggle/`, {
    method: 'POST',
  }, accessToken);
}

async function undoAttendanceRecord(accessToken, recordId) {
  return apiFetch(`${DEFAULT_API_BASE}/attendance/records/${recordId}/undo/`, {
    method: 'POST',
  }, accessToken);
}

async function finalizeAttendance(accessToken, submissionId) {
  return apiFetch(`${DEFAULT_API_BASE}/attendance/submissions/${submissionId}/finalize/`, {
    method: 'POST',
  }, accessToken);
}

async function importAttendanceCsv(accessToken, submissionId, csvFilePath) {
  const fileBuffer = await readFile(csvFilePath);
  const formData = new FormData();
  formData.append('file', new Blob([fileBuffer], { type: 'text/csv' }), path.basename(csvFilePath));

  return apiFetch(`${DEFAULT_API_BASE}/attendance/submissions/${submissionId}/import_csv/`, {
    method: 'POST',
    body: formData,
  }, accessToken);
}

async function bootstrapSupervisor() {
  const loginResult = await login();
  const accessToken = loginResult.access;
  const refreshToken = loginResult.refresh;

  const profile = await me(accessToken);
  const candidateSetup = await ensureDemoCandidates(accessToken);
  const createdSession = await createExamSession(accessToken, {
    name: DEFAULT_EXAM_NAME,
    year: DEFAULT_EXAM_YEAR,
    status: DEFAULT_EXAM_STATUS,
    starts_at: DEFAULT_EXAM_STARTS_AT,
    ends_at: DEFAULT_EXAM_ENDS_AT,
  });

  const createdSubject = await createSubject(accessToken, {
    exam_session: createdSession.id,
    name: DEFAULT_SUBJECT_NAME,
    coefficient: DEFAULT_SUBJECT_COEFFICIENT,
    max_score: DEFAULT_SUBJECT_MAX_SCORE,
    pass_threshold: DEFAULT_SUBJECT_PASS_THRESHOLD,
    discrepancy_threshold: DEFAULT_SUBJECT_DISCREPANCY_THRESHOLD,
    final_grade_rule: DEFAULT_SUBJECT_RULE,
    status: 'ACTIVE',
  });

  const createdRoom = await createRoom(accessToken, {
    exam_session: createdSession.id,
    name: DEFAULT_ROOM_NAME,
    capacity: DEFAULT_ROOM_CAPACITY,
  });

  const createdSchedule = await createSchedule(accessToken, {
    subject: createdSubject.id,
    room: createdRoom.id,
    exam_date: DEFAULT_SCHEDULE_DATE,
    start_time: DEFAULT_SCHEDULE_TIME,
    duration_minutes: DEFAULT_SCHEDULE_DURATION,
  });

  const autoAllocation = await autoAllocateSchedule(accessToken, createdSchedule.id);
  const attendanceSubmission = await createAttendanceSubmission(accessToken, {
    exam_schedule: createdSchedule.id,
  });

  const sessions = await listSessions(accessToken);
  const rooms = await listRooms(accessToken);
  const schedules = await listSchedules(accessToken);

  const firstScheduleId = createdSchedule.id || schedules?.[0]?.id;
  const firstSubmissionId = attendanceSubmission?.id || (process.env.SUBMISSION_ID ? Number(process.env.SUBMISSION_ID) : undefined);
  const callList = firstScheduleId ? await getCallList(accessToken, firstScheduleId) : [];
  const counter = firstSubmissionId ? await getAttendanceCounter(accessToken, firstSubmissionId) : null;

  return {
    auth: { accessToken, refreshToken, profile },
    created: {
      session: createdSession,
      subject: createdSubject,
      room: createdRoom,
      schedule: createdSchedule,
      attendanceSubmission,
      autoAllocation,
    },
    data: { sessions, rooms, schedules, callList, counter, candidates: candidateSetup },
  };
}

async function main() {
  try {
    const result = await bootstrapSupervisor();
    const statistics = {
      api_calls_total: apiStats.totalCalls,
      api_calls_successful: apiStats.successes,
      api_calls_failed: apiStats.failures,
      candidates_existing: result.data.candidates.existingCount,
      candidates_created: result.data.candidates.createdCount,
      candidates_available_for_allocation: result.data.candidates.candidates.length,
      session_created: Boolean(result.created.session?.id),
      subject_created: Boolean(result.created.subject?.id),
      room_created: Boolean(result.created.room?.id),
      schedule_created: Boolean(result.created.schedule?.id),
      attendance_submission_created: Boolean(result.created.attendanceSubmission?.id),
      auto_allocation_created: result.created.autoAllocation?.candidates_allocated || 0,
      call_list_items: Array.isArray(result.data.callList) ? result.data.callList.length : 0,
      attendance_marked: result.data.counter?.total_marked ?? 0,
      attendance_expected: result.data.counter?.total_expected ?? 0,
      attendance_pending: result.data.counter?.total_unmarked ?? 0,
    };

    console.log(JSON.stringify({
      apiBase: DEFAULT_API_BASE,
      loggedInAs: DEFAULT_EMAIL,
      role: result.auth.profile?.role || result.auth.profile?.profile?.role || null,
      accessToken: result.auth.accessToken,
      refreshToken: result.auth.refreshToken,
      profile: result.auth.profile,
      createdExamSession: result.created.session,
      createdSubject: result.created.subject,
      createdRoom: result.created.room,
      createdSchedule: result.created.schedule,
      attendanceSubmission: result.created.attendanceSubmission,
      autoAllocation: result.created.autoAllocation,
      candidateSetup: result.data.candidates,
      sessions: result.data.sessions,
      rooms: result.data.rooms,
      schedules: result.data.schedules,
      callList: result.data.callList,
      attendanceCounter: result.data.counter,
      statistics,
    }, null, 2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main();
}

export {
  DEFAULT_API_BASE,
  DEFAULT_EMAIL,
  DEFAULT_PASSWORD,
  login,
  me,
  listSessions,
  listRooms,
  listSchedules,
  listCandidates,
  createCandidate,
  createExamSession,
  createSubject,
  createRoom,
  createSchedule,
  autoAllocateSchedule,
  createAttendanceSubmission,
  ensureDemoCandidates,
  getCallList,
  getAttendanceCounter,
  createAttendanceRecord,
  toggleAttendanceRecord,
  undoAttendanceRecord,
  finalizeAttendance,
  importAttendanceCsv,
  bootstrapSupervisor,
};
