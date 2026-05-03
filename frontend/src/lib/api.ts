/**
 * Shared typed API helper for concour-doctora frontend.
 * All calls go through authFetch which auto-refreshes the JWT on 401.
 */
import { authFetch, API_BASE } from '../context/AuthContext';

// ─── Generic helpers ──────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body.error || body.detail || body.message) {
        message = body.error || body.detail || body.message;
      } else if (body && typeof body === 'object') {
        message = Object.entries(body)
          .map(([field, value]) => `${field}: ${Array.isArray(value) ? value.join(', ') : String(value)}`)
          .join('; ') || message;
      }
    } catch { /* ignore */ }
    throw new ApiError(res.status, message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

function get<T>(path: string): Promise<T> {
  return authFetch(`${API_BASE}${path}`).then(r => handleResponse<T>(r));
}

function getAbsolute<T>(url: string): Promise<T> {
  return authFetch(url).then(r => handleResponse<T>(r));
}

async function getAllPages<T>(path: string): Promise<T[]> {
  let page = await get<PaginatedResponse<T>>(path);
  const results = [...page.results];

  while (page.next) {
    page = await getAbsolute<PaginatedResponse<T>>(page.next);
    results.push(...page.results);
  }

  return results;
}

function post<T>(path: string, body?: unknown): Promise<T> {
  return authFetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  }).then(r => handleResponse<T>(r));
}

function put<T>(path: string, body?: unknown): Promise<T> {
  return authFetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  }).then(r => handleResponse<T>(r));
}

function patch<T>(path: string, body?: unknown): Promise<T> {
  return authFetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  }).then(r => handleResponse<T>(r));
}

function del<T>(path: string): Promise<T> {
  return authFetch(`${API_BASE}${path}`, { method: 'DELETE' }).then(r => handleResponse<T>(r));
}

async function postForm<T>(path: string, form: FormData): Promise<T> {
  const res = await authFetch(`${API_BASE}${path}`, { method: 'POST', body: form });
  return handleResponse<T>(res);
}

// ─── Backend types ────────────────────────────────────────────────────────────

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  phone: string;
  department: string;
  signature?: string;
  email_notifications: boolean;
  must_change_password?: boolean;
  created_at: string;
  updated_at: string;
}

export interface AppUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  is_active: boolean;
  date_joined: string;
  last_login: string | null;
  must_change_password?: boolean;
  profile: UserProfile;
}

export interface ExamSession {
  id: number;
  name: string;
  year: number;
  date: string;
  status: 'DRAFT' | 'ACTIVE' | 'CLOSED';
  description: string;
  created_at: string;
  updated_at: string;
  subjects_count: number;
  candidates_count: number;
}

export interface Subject {
  id: number;
  name: string;
  code: string;
  coefficient: string;
  max_score: string;
  discrepancy_threshold: string;
  final_grade_rule: 'AVERAGE' | 'MEDIAN' | 'THIRD';
  status: 'DRAFT' | 'ACTIVE' | 'LOCKED';
  exam_session: number;
  exam_session_name: string;
  scheduled_date: string | null;
  start_time: string | null;
  duration_minutes: number;
  room: number | null;
  room_name: string | null;
}

export interface Candidate {
  id: number;
  application_number: string;
  first_name: string;
  last_name: string;
  full_name: string;
  national_id: string;
  email: string;
  phone: string;
  date_of_birth: string;
  place_of_birth: string;
  address: string;
  status: 'REGISTERED' | 'PRESENT' | 'ELIMINATED';
  exam_session: number;
  exam_session_name: string;
  anonymous_code: string | null;
  created_at: string;
}

export interface Attendance {
  id: number;
  candidate: number;
  candidate_name: string;
  candidate_application: string;
  session: number;
  present: boolean;
  notes: string;
  marked_at: string;
  marked_by: number;
  marked_by_name: string;
}

export interface Copy {
  id: number;
  anonymous_code: number;
  anonymous_code_value: string;
  subject: number;
  subject_name: string;
  scan_file: string;
  uploaded_at: string;
  qr_detected: boolean;
  page_count: number;
  corrections_count: number;
}

export interface Correction {
  id: number;
  copy: number;
  copy_anonymous_code: string;
  subject_name: string;
  corrector: number;
  corrector_name: string;
  grade: string;
  comment: string;
  attempt: 1 | 2 | 3;
  submitted_at: string;
}

export interface Discrepancy {
  id: number;
  copy: number;
  copy_anonymous_code: string;
  subject_name: string;
  grade1: string;
  grade2: string;
  difference: string;
  resolved: boolean;
  third_corrector: number | null;
  third_corrector_name: string | null;
  third_grade: string | null;
  final_grade: string | null;
  coordinator_note: string;
  created_at: string;
  resolved_at: string | null;
}

export interface DeliberationResult {
  candidate_id: number;
  anonymous_code: string | null;
  final_score: number;
  rank: number;
}

export interface OfficialResult {
  rank: number;
  candidate_name: string;
  application_number: string;
  final_score: string;
  decision: 'ADMITTED' | 'WAITLIST' | 'REJECTED';
}

export interface PVReport {
  id: number;
  title: string;
  session: number;
  session_name: string;
  pdf_file: string;
  created_at: string;
  signed: boolean;
  signers: { user_id: number; name: string; role: string; signed_at: string }[];
}

export interface AuditLog {
  id: number;
  user: number;
  username: string;
  user_full_name: string;
  action: string;
  object_type: string;
  object_id: string;
  details: Record<string, unknown>;
  ip_address: string;
  user_agent: string;
  timestamp: string;
}

export interface DashboardStats {
  active_session: ExamSession | null;
  total_candidates?: number;
  total_present?: number;
  pending_corrections?: number;
  active_discrepancies?: number;
  subjects_by_status?: { status: string; count: number }[];
  recent_activities?: AuditLog[];
  assigned_copies?: number;
  completed_corrections?: number;
  today_attendance?: number;
  total_today?: number;
  candidates_to_deliberate?: number;
  deliberation_completed?: boolean;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ─── API namespace ────────────────────────────────────────────────────────────

export const api = {

  // ── Dashboard ───────────────────────────────────────────────────────────────
  dashboard: {
    stats: () => get<DashboardStats>('/dashboard/stats/'),
    activityFeed: () => get<AuditLog[]>('/dashboard/activity_feed/'),
  },

  // ── Auth ────────────────────────────────────────────────────────────────────
  auth: {
    me: () => get<AppUser>('/auth/me/'),
    changePasswordVoluntary: (current_password: string, new_password: string) =>
      post('/auth/change-password-voluntary/', { current_password, new_password }),
  },

  // ── Users ───────────────────────────────────────────────────────────────────
  users: {
    list: (params?: string) => get<PaginatedResponse<AppUser>>(`/users/${params ? '?' + params : ''}`),
    invite: (data: { email: string; role: string; first_name?: string; last_name?: string; phone?: string; department?: string }) =>
      post<AppUser>('/users/invite/', data),
    changeRole: (id: number, role: string) => put<AppUser>(`/users/${id}/change_role/`, { role }),
    update: (id: number, data: Partial<AppUser>) => patch<AppUser>(`/users/${id}/`, data),
  },

  // ── Sessions ────────────────────────────────────────────────────────────────
  sessions: {
    list: () => get<PaginatedResponse<ExamSession>>('/sessions/'),
    create: (data: Partial<ExamSession>) => post<ExamSession>('/sessions/', data),
    update: (id: number, data: Partial<ExamSession>) => patch<ExamSession>(`/sessions/${id}/`, data),
    delete: (id: number) => del<void>(`/sessions/${id}/`),
    activate: (id: number) => post<{ status: string }>(`/sessions/${id}/activate/`),
    close: (id: number) => post<{ status: string }>(`/sessions/${id}/close/`),
  },

  // ── Subjects ────────────────────────────────────────────────────────────────
  subjects: {
    list: (sessionId?: number) => get<PaginatedResponse<Subject>>(`/subjects/${sessionId ? '?exam_session=' + sessionId : ''}`),
    create: (data: Partial<Subject>) => post<Subject>('/subjects/', data),
    update: (id: number, data: Partial<Subject>) => patch<Subject>(`/subjects/${id}/`, data),
    delete: (id: number) => del<void>(`/subjects/${id}/`),
    activate: (id: number) => post<{ status: string }>(`/subjects/${id}/activate/`),
    lock: (id: number) => post<{ status: string }>(`/subjects/${id}/lock/`),
  },

  // ── Candidates ──────────────────────────────────────────────────────────────
  candidates: {
    list: (params?: string) => get<PaginatedResponse<Candidate>>(`/candidates/${params ? '?' + params : ''}`),
    listAll: (params?: string) => getAllPages<Candidate>(`/candidates/${params ? '?' + params : ''}`),
    create: (data: Partial<Candidate>) => post<Candidate>('/candidates/', data),
    update: (id: number, data: Partial<Candidate>) => patch<Candidate>(`/candidates/${id}/`, data),
    delete: (id: number) => del<void>(`/candidates/${id}/`),
    importCsv: (file: File, session_id: number) => {
      const form = new FormData();
      form.append('file', file);
      form.append('session_id', String(session_id));
      return postForm<{ created: number; errors: string[] }>('/candidates/import_csv/', form);
    },
    exportCsv: async (sessionId?: number) => {
      const url = `${API_BASE}/candidates/export/${sessionId ? '?session=' + sessionId : ''}`;
      const res = await authFetch(url);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'candidates.csv';
      a.click();
    },
    generateCode: (id: number) => post(`/candidates/${id}/generate_code/`),
  },

  // ── Attendance ──────────────────────────────────────────────────────────────
  attendance: {
    bulk: (session: Record<string, unknown>, records: Record<string, unknown>[]) =>
      post('/attendance/bulk/', { session, records }),
  },

  // ── Copies ──────────────────────────────────────────────────────────────────
  copies: {
    list: (params?: string) => get<PaginatedResponse<Copy>>(`/copies/${params ? '?' + params : ''}`),
    downloadUrl: (id: number) => `${API_BASE}/copies/${id}/download/`,
    upload: (form: FormData) => postForm<Copy>('/copies/', form),
  },

  // ── Corrections ─────────────────────────────────────────────────────────────
  corrections: {
    assigned: () => get<Copy[]>('/corrections/assigned/'),
    list: () => get<PaginatedResponse<Correction>>('/corrections/'),
    submit: (data: { copy: number; grade: number; comment?: string; attempt: 1 | 2 | 3 }) =>
      post<Correction>('/corrections/', data),
  },

  // ── Discrepancies ───────────────────────────────────────────────────────────
  discrepancies: {
    list: (resolved?: boolean) =>
      get<PaginatedResponse<Discrepancy>>(`/discrepancies/${resolved !== undefined ? '?resolved=' + resolved : ''}`),
    assignThird: (id: number, corrector_id: number) =>
      post(`/discrepancies/${id}/assign_third/`, { corrector_id }),
    resolve: (id: number, final_grade: number, note?: string) =>
      post(`/discrepancies/${id}/resolve/`, { final_grade, note }),
  },

  // ── Deliberation ────────────────────────────────────────────────────────────
  deliberation: {
    ranking: (sessionId: number) => get<DeliberationResult[]>(`/deliberation/ranking/?session=${sessionId}`),
    closeSession: (session_id: number, decisions: unknown[]) =>
      post<{ status: string; deliberations_created: number; pv_id: number | null }>(
        '/deliberation/close_session/', { session_id, decisions }
      ),
    results: (sessionId: number) => get<OfficialResult[]>(`/deliberation/results/?session=${sessionId}`),
  },

  // ── PV Reports ──────────────────────────────────────────────────────────────
  pv: {
    list: () => get<PaginatedResponse<PVReport>>('/pv/'),
    generate: (session_id: number, title?: string) =>
      post<PVReport>('/pv/generate/', { session_id, title }),
    sign: (id: number) => post<{ status: string }>(`/pv/${id}/sign/`),
    downloadUrl: (id: number) => `${API_BASE}/pv/${id}/download/`,
  },

  // ── Audit Logs ──────────────────────────────────────────────────────────────
  auditLogs: {
    list: (params?: string) => get<PaginatedResponse<AuditLog>>(`/audit-logs/${params ? '?' + params : ''}`),
    exportCsv: async () => {
      const res = await authFetch(`${API_BASE}/audit-logs/export/`);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'audit_logs.csv';
      a.click();
    },
  },
};
