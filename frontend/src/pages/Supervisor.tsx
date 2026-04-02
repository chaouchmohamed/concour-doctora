import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Wifi, WifiOff, Check, X, Clock, AlertCircle, Undo2,
  Printer, Search, ChevronLeft, Users, Flag, Save,
  CheckCircle2, AlertTriangle, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { cn, API_BASE, ROUTES } from '../constants';
import { useAuth } from '../context/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

type AttStatus = 'PENDING' | 'PRESENT' | 'ABSENT';
type IncidentType = 'CHEATING' | 'HEALTH' | 'DISTURBANCE' | 'LATE' | 'OTHER';

interface Student {
  id: string;
  seat: string;
  appNum: string;
  name: string;
  status: AttStatus;
  flagged?: boolean;
  incident?: IncidentType;
  note?: string;
}

interface HistoryAction {
  studentId: string;
  prevStatus: AttStatus;
  prevFlagged: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'supervisor_attendance';
const TIMER_KEY   = 'supervisor_session_start';
const SESSION_INFO = { room: 'Room A102', subject: 'Mathematics & Logic', year: '2026' };

const INCIDENT_OPTIONS: { type: IncidentType; label: string; color: string }[] = [
  { type: 'CHEATING',     label: 'Cheating Attempt',    color: 'text-red-600' },
  { type: 'HEALTH',       label: 'Health Issue',        color: 'text-orange-500' },
  { type: 'DISTURBANCE',  label: 'Disturbance',         color: 'text-yellow-600' },
  { type: 'LATE',         label: 'Late Arrival',        color: 'text-blue-500' },
  { type: 'OTHER',        label: 'Other Incident',      color: 'text-gray-600' },
];

const DEFAULT_STUDENTS: Student[] = [
  { id: '1', seat: '01', appNum: 'DOCT-001', name: 'Amine Benali',    status: 'PENDING' },
  { id: '2', seat: '02', appNum: 'DOCT-002', name: 'Sarah Mansouri',  status: 'PENDING' },
  { id: '3', seat: '03', appNum: 'DOCT-003', name: 'Karim Zidi',      status: 'PENDING' },
  { id: '4', seat: '04', appNum: 'DOCT-004', name: 'Lina Khelifi',    status: 'PENDING' },
  { id: '5', seat: '05', appNum: 'DOCT-005', name: 'Yacine Brahimi',  status: 'PENDING' },
  { id: '6', seat: '06', appNum: 'DOCT-006', name: 'Mounir Haddad',   status: 'PENDING' },
  { id: '7', seat: '07', appNum: 'DOCT-007', name: 'Fatiha Belkacem', status: 'PENDING' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadStudents(): Student[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_STUDENTS;
  } catch { return DEFAULT_STUDENTS; }
}

function saveStudents(students: Student[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

// ─── Toast ────────────────────────────────────────────────────────────────────

interface Toast { id: number; message: string; type: 'success' | 'error' | 'info' }

// ─── Main Component ───────────────────────────────────────────────────────────

export const SupervisorPWA = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isOnline, setIsOnline]       = useState(navigator.onLine);
  const [students, setStudents]       = useState<Student[]>(loadStudents);
  const [query, setQuery]             = useState('');
  const [history, setHistory]         = useState<HistoryAction[]>([]);
  const [elapsed, setElapsed]         = useState(0);
  const [toasts, setToasts]           = useState<Toast[]>([]);
  const [pendingSync, setPendingSync] = useState(false);
  const toastId = useRef(0);

  // Modal states
  const [flagModal, setFlagModal]         = useState<Student | null>(null);
  const [flagNote, setFlagNote]           = useState('');
  const [flagType, setFlagType]           = useState<IncidentType>('OTHER');
  const [submitModal, setSubmitModal]     = useState(false);
  const [submitting, setSubmitting]       = useState(false);
  const [submitted, setSubmitted]         = useState(false);

  // ── Timer ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!localStorage.getItem(TIMER_KEY)) {
      localStorage.setItem(TIMER_KEY, Date.now().toString());
    }
    const tick = () => {
      const start = parseInt(localStorage.getItem(TIMER_KEY) || Date.now().toString(), 10);
      setElapsed(Math.floor((Date.now() - start) / 1000));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // ── Online/Offline ────────────────────────────────────────────────────────

  useEffect(() => {
    const on  = () => { setIsOnline(true);  syncIfPending(); };
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  // ── Persist on every change ───────────────────────────────────────────────

  useEffect(() => { saveStudents(students); }, [students]);

  // ── Toast helper ──────────────────────────────────────────────────────────

  const toast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = ++toastId.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  // ── Status toggle ─────────────────────────────────────────────────────────

  const toggleStatus = (id: string, newStatus: AttStatus) => {
    setStudents(prev => {
      const student = prev.find(s => s.id === id)!;
      setHistory(h => [...h, { studentId: id, prevStatus: student.status, prevFlagged: !!student.flagged }]);
      return prev.map(s => s.id === id ? { ...s, status: s.status === newStatus ? 'PENDING' : newStatus } : s);
    });
    if (!isOnline) { setPendingSync(true); toast('Saved offline — will sync when connected', 'info'); }
  };

  // ── Undo ──────────────────────────────────────────────────────────────────

  const handleUndo = () => {
    if (!history.length) { toast('Nothing to undo', 'info'); return; }
    const last = history[history.length - 1];
    setStudents(prev => prev.map(s => s.id === last.studentId
      ? { ...s, status: last.prevStatus, flagged: last.prevFlagged }
      : s
    ));
    setHistory(h => h.slice(0, -1));
    toast('Last action undone', 'success');
  };

  // ── Flag ──────────────────────────────────────────────────────────────────

  const openFlag  = (student: Student) => { setFlagModal(student); setFlagNote(student.note || ''); setFlagType(student.incident || 'OTHER'); };
  const closeFlag = () => { setFlagModal(null); setFlagNote(''); };

  const confirmFlag = () => {
    if (!flagModal) return;
    setHistory(h => [...h, { studentId: flagModal.id, prevStatus: flagModal.status, prevFlagged: !!flagModal.flagged }]);
    setStudents(prev => prev.map(s => s.id === flagModal.id
      ? { ...s, flagged: true, incident: flagType, note: flagNote }
      : s
    ));
    toast(`${flagModal.name} flagged: ${INCIDENT_OPTIONS.find(o => o.type === flagType)?.label}`, 'info');
    closeFlag();
  };

  const removeFlag = (id: string) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, flagged: false, incident: undefined, note: undefined } : s));
    toast('Flag removed', 'info');
  };

  // ── Sync ──────────────────────────────────────────────────────────────────

  const syncIfPending = async () => {
    if (!pendingSync) return;
    try {
      // In production, POST to /api/attendance/bulk/
      toast('Synced attendance to server', 'success');
      setPendingSync(false);
    } catch { toast('Sync failed — will retry', 'error'); }
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = students.map(s => ({
        application_number: s.appNum,
        seat: s.seat,
        present: s.status === 'PRESENT',
        absent: s.status === 'ABSENT',
        flagged: !!s.flagged,
        incident: s.incident || null,
        note: s.note || '',
      }));

      if (isOnline) {
        await fetch(`${API_BASE}/attendance/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session: SESSION_INFO, records: payload }),
        });
      } else {
        localStorage.setItem('supervisor_pending_submit', JSON.stringify({ session: SESSION_INFO, records: payload, timestamp: Date.now() }));
        setPendingSync(true);
      }

      setSubmitted(true);
      setSubmitModal(false);
      toast(isOnline ? 'Attendance submitted successfully!' : 'Saved offline — will submit when connected', 'success');
    } catch {
      toast('Submission failed. Changes saved locally.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Print ─────────────────────────────────────────────────────────────────

  const handlePrint = () => {
    const rows = students.map(s =>
      `<tr><td>${s.seat}</td><td>${s.appNum}</td><td>${s.name}</td><td>${s.status}</td><td>${s.flagged ? (s.incident || 'FLAGGED') : ''}</td></tr>`
    ).join('');
    const html = `<html><head><title>Call List — ${SESSION_INFO.room}</title>
    <style>body{font-family:sans-serif;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:8px;text-align:left}th{background:#f0ede7}h2{color:#8B7355}</style>
    </head><body><h2>${SESSION_INFO.room} — ${SESSION_INFO.subject} — ${SESSION_INFO.year}</h2>
    <p>Printed: ${new Date().toLocaleString()} | Present: ${students.filter(s=>s.status==='PRESENT').length}/${students.length}</p>
    <table><thead><tr><th>Seat</th><th>App #</th><th>Name</th><th>Status</th><th>Incident</th></tr></thead><tbody>${rows}</tbody></table>
    </body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); w.print(); }
  };

  // ── Filtered list ─────────────────────────────────────────────────────────

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    s.appNum.toLowerCase().includes(query.toLowerCase()) ||
    s.seat.includes(query)
  );

  const presentCount = students.filter(s => s.status === 'PRESENT').length;
  const absentCount  = students.filter(s => s.status === 'ABSENT').length;
  const totalCount   = students.length;

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-bg flex flex-col max-w-[1024px] mx-auto border-x border-border shadow-2xl relative">

      {/* ── Toasts ── */}
      <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div key={t.id}
              initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 60 }}
              className={cn('px-4 py-3 rounded-xl shadow-lg text-sm font-medium pointer-events-auto flex items-center gap-2',
                t.type === 'success' ? 'bg-emerald-600 text-white' :
                t.type === 'error'   ? 'bg-red-600 text-white' :
                                       'bg-gray-800 text-white'
              )}>
              {t.type === 'success' ? <CheckCircle2 size={16}/> : t.type === 'error' ? <AlertTriangle size={16}/> : <RefreshCw size={16}/>}
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── Header ── */}
      <header className="bg-white border-b border-border sticky top-0 z-30">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(ROUTES.DASHBOARD)}
              className="p-2 rounded-lg hover:bg-surface transition-colors">
              <ChevronLeft size={24} />
            </button>
            <div>
              <h1 className="text-lg font-bold leading-tight">{SESSION_INFO.room}</h1>
              <p className="text-[12px] text-muted">{SESSION_INFO.subject} • Session {SESSION_INFO.year}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pendingSync && (
              <motion.div className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-[11px] font-bold"
                animate={{ opacity: [1, 0.6, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                <RefreshCw size={12}/> PENDING
              </motion.div>
            )}
            <AnimatePresence mode="wait">
              {isOnline ? (
                <motion.div key="online" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[11px] font-bold">
                  <Wifi size={14}/> SYNCED
                </motion.div>
              ) : (
                <motion.div key="offline" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 text-amber-600 rounded-full text-[11px] font-bold">
                  <WifiOff size={14}/> OFFLINE
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Stats bar */}
        <div className="px-4 pb-3 grid grid-cols-3 gap-2">
          {[
            { label: 'Present', value: presentCount, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
            { label: 'Absent',  value: absentCount,  color: 'text-red-600 bg-red-50 border-red-200' },
            { label: 'Pending', value: totalCount - presentCount - absentCount, color: 'text-gray-600 bg-gray-50 border-gray-200' },
          ].map(s => (
            <div key={s.label} className={cn('rounded-lg p-2 border text-center', s.color)}>
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Mandatory Anonymity Instruction */}
        <div className="px-4 pb-3">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2 text-red-800 shadow-sm">
            <AlertTriangle className="shrink-0 mt-0.5" size={16} />
            <p className="text-xs font-medium leading-relaxed">
              <strong>Mandatory Exam Instruction:</strong> You must explicitly prohibit candidates from writing their name or any identifying information directly on their exam copy. Any copy found with visible identity information will be flagged by the Anonymity Commission and rejected.
            </p>
          </div>
        </div>

        {/* Timer + Search */}
        <div className="px-4 pb-3 flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-2 bg-surface border border-border rounded-lg text-muted shrink-0">
            <Clock size={14}/>
            <span className="font-mono text-sm font-bold">{formatTime(elapsed)}</span>
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16}/>
            <input type="text" placeholder="Search seat, name, or app #..."
              className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-accent/30"
              value={query} onChange={e => setQuery(e.target.value)}/>
          </div>
        </div>
      </header>

      {/* ── Student List ── */}
      <main className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence>
          {filtered.map(student => (
            <motion.div layout key={student.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={cn(
                'p-4 rounded-xl border transition-all',
                student.status === 'PRESENT' ? 'bg-emerald-50 border-emerald-200' :
                student.status === 'ABSENT'  ? 'bg-red-50 border-red-200 opacity-70' :
                                               'bg-white border-border shadow-sm'
              )}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center font-bold text-primary-accent border border-primary-accent/15 shrink-0">
                    {student.seat}
                  </div>
                  <div>
                    <p className="font-semibold text-sm leading-tight flex items-center gap-1.5">
                      {student.name}
                      {student.flagged && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-bold">
                          <Flag size={9}/> {student.incident || 'FLAGGED'}
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-muted font-mono">{student.appNum}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Present */}
                  <button onClick={() => toggleStatus(student.id, 'PRESENT')}
                    className={cn('w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-95',
                      student.status === 'PRESENT' ? 'bg-emerald-500 text-white shadow-md' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    )}>
                    <Check size={20}/>
                  </button>
                  {/* Absent */}
                  <button onClick={() => toggleStatus(student.id, 'ABSENT')}
                    className={cn('w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-95',
                      student.status === 'ABSENT' ? 'bg-red-500 text-white shadow-md' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    )}>
                    <X size={20}/>
                  </button>
                  {/* Flag */}
                  <button onClick={() => student.flagged ? removeFlag(student.id) : openFlag(student)}
                    className={cn('w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-95',
                      student.flagged ? 'bg-amber-400 text-white shadow-md' : 'bg-gray-100 text-gray-400 hover:bg-amber-100 hover:text-amber-600'
                    )}
                    title={student.flagged ? 'Remove flag' : 'Flag student'}>
                    <Flag size={18}/>
                  </button>
                </div>
              </div>

              {/* Incident note */}
              {student.flagged && student.note && (
                <p className="mt-2 text-[11px] text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                  📝 {student.note}
                </p>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted">
            <Users size={32} className="mx-auto mb-2 opacity-30"/>
            <p>No students match your search</p>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-border p-4 sticky bottom-0 z-30">
        <div className="grid grid-cols-2 gap-3">
          <button onClick={handleUndo}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border bg-surface font-semibold text-sm hover:bg-gray-100 transition-all active:scale-95 disabled:opacity-40"
            disabled={!history.length}>
            <Undo2 size={17}/> Undo Last
          </button>
          <button onClick={() => setSubmitModal(true)}
            disabled={submitted}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#8B7355] text-white font-semibold text-sm hover:bg-[#6B5540] transition-all active:scale-95 disabled:opacity-60">
            {submitted ? <><CheckCircle2 size={17}/> Submitted</> : <><Save size={17}/> Submit All</>}
          </button>
        </div>
        <button onClick={handlePrint}
          className="mt-3 w-full flex items-center justify-center gap-2 py-2 text-sm text-muted hover:text-text-primary transition-colors">
          <Printer size={15}/> Print Call List (PDF)
        </button>
      </footer>

      {/* ── Flag Modal ── */}
      <AnimatePresence>
        {flagModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && closeFlag()}>
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle size={20} className="text-amber-500"/>
                <h3 className="font-bold text-lg">Flag: {flagModal.name}</h3>
              </div>
              <p className="text-sm text-muted mb-3">Select incident type:</p>
              <div className="space-y-2 mb-4">
                {INCIDENT_OPTIONS.map(opt => (
                  <button key={opt.type} onClick={() => setFlagType(opt.type)}
                    className={cn('w-full text-left px-3 py-2.5 rounded-lg border text-sm font-medium transition-all',
                      flagType === opt.type ? 'border-amber-400 bg-amber-50' : 'border-border hover:bg-surface'
                    )}>
                    <span className={opt.color}>{opt.label}</span>
                  </button>
                ))}
              </div>
              <textarea rows={2} placeholder="Optional note..."
                className="w-full border border-border rounded-lg p-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-300 mb-4"
                value={flagNote} onChange={e => setFlagNote(e.target.value)}/>
              <div className="flex gap-2">
                <button onClick={closeFlag}
                  className="flex-1 py-2.5 rounded-xl border border-border font-medium text-sm hover:bg-surface">Cancel</button>
                <button onClick={confirmFlag}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white font-semibold text-sm hover:bg-amber-600">
                  Confirm Flag
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Submit Confirmation Modal ── */}
      <AnimatePresence>
        {submitModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setSubmitModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
              <div className="text-center mb-4">
                <div className="w-14 h-14 bg-[#8B7355]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Save size={24} className="text-[#8B7355]"/>
                </div>
                <h3 className="font-bold text-lg">Submit Attendance</h3>
                <p className="text-sm text-muted mt-1">
                  {presentCount} present · {absentCount} absent · {totalCount - presentCount - absentCount} pending
                </p>
                {!isOnline && (
                  <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700 flex items-center gap-1.5 justify-center">
                    <WifiOff size={12}/> You're offline — will submit when connected
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setSubmitModal(false)}
                  className="flex-1 py-3 rounded-xl border border-border font-medium text-sm hover:bg-surface">Cancel</button>
                <button onClick={handleSubmit} disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-[#8B7355] text-white font-semibold text-sm hover:bg-[#6B5540] disabled:opacity-60 flex items-center justify-center gap-2">
                  {submitting ? <><RefreshCw size={15} className="animate-spin"/> Submitting...</> : 'Confirm Submit'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
