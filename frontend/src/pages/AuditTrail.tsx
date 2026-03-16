import React, { useState } from "react";
import {
  History,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  Shield,
  FileText,
  Settings,
  Lock,
  Upload,
  Clock,
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { AppShell } from "../components/AppShell";
import { Card } from "../components/UI";
import { cn } from "../constants";
import { motion, AnimatePresence } from "motion/react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LogEntry {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  target: string;
  ip: string;
  detail: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockLogs: LogEntry[] = [
  {
    id: "1",
    timestamp: "2026-03-09 14:22:05",
    user: "Jean Dupont",
    role: "ADMIN",
    action: "CLOSE_DELIBERATION",
    target: "Session 2026",
    ip: "192.168.1.10",
    detail: "Closed deliberation and lifted anonymity for Session 2026",
  },
  {
    id: "2",
    timestamp: "2026-03-09 14:20:30",
    user: "Jean Dupont",
    role: "ADMIN",
    action: "EXPORT_RESULTS",
    target: "PV Final 2026",
    ip: "192.168.1.10",
    detail: "Exported final PV as signed PDF document",
  },
  {
    id: "3",
    timestamp: "2026-03-09 10:15:42",
    user: "Amina Saidi",
    role: "COORDINATOR",
    action: "ASSIGN_CORRECTOR",
    target: "ANO-7F3A92",
    ip: "192.168.1.22",
    detail: "Assigned 3rd corrector Dr. Ahmed for grade discrepancy",
  },
  {
    id: "4",
    timestamp: "2026-03-08 16:45:10",
    user: "Rachid Kermiche",
    role: "CORRECTOR",
    action: "SUBMIT_GRADE",
    target: "ANO-B1E4D8",
    ip: "192.168.1.35",
    detail: "Submitted grade 14.25/20 for Mathematics & Logic",
  },
  {
    id: "5",
    timestamp: "2026-03-08 14:30:00",
    user: "Jean Dupont",
    role: "ADMIN",
    action: "LOCK_SUBJECT",
    target: "Mathematics & Logic",
    ip: "192.168.1.10",
    detail: "Locked subject grades — no further modifications allowed",
  },
  {
    id: "6",
    timestamp: "2026-03-08 09:00:15",
    user: "Amina Saidi",
    role: "COORDINATOR",
    action: "GENERATE_CODES",
    target: "Session 2026",
    ip: "192.168.1.22",
    detail: "Generated 1,248 anonymous codes for present candidates",
  },
  {
    id: "7",
    timestamp: "2026-03-07 11:20:00",
    user: "Jean Dupont",
    role: "ADMIN",
    action: "IMPORT_CANDIDATES",
    target: "candidates_2026.csv",
    ip: "192.168.1.10",
    detail: "Imported 450 new candidates from CSV file",
  },
  {
    id: "8",
    timestamp: "2026-03-07 09:30:45",
    user: "Fatima Belhadj",
    role: "CFD_HEAD",
    action: "SUBJECT_LOTTERY",
    target: "Mathematics & Logic",
    ip: "192.168.1.18",
    detail: "Subject lottery drawn: Version B selected by department head",
  },
];

// ─── Action config — plain styles, no Badge ──────────────────────────────────

const actionConfig: Record<
  string,
  { icon: React.ReactNode; iconCls: string; pillCls: string }
> = {
  CLOSE_DELIBERATION: {
    icon: <Lock size={14} />,
    iconCls: "bg-red-50 text-red-600",
    pillCls: "bg-red-50 text-red-700 border border-red-200",
  },
  EXPORT_RESULTS: {
    icon: <Download size={14} />,
    iconCls: "bg-primary-accent/10 text-primary-accent",
    pillCls:
      "bg-primary-accent/10 text-primary-accent border border-primary-accent/20",
  },
  ASSIGN_CORRECTOR: {
    icon: <User size={14} />,
    iconCls: "bg-amber-50 text-amber-600",
    pillCls: "bg-amber-50 text-amber-700 border border-amber-200",
  },
  SUBMIT_GRADE: {
    icon: <FileText size={14} />,
    iconCls: "bg-emerald-50 text-emerald-600",
    pillCls: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  },
  LOCK_SUBJECT: {
    icon: <Lock size={14} />,
    iconCls: "bg-amber-50 text-amber-600",
    pillCls: "bg-amber-50 text-amber-700 border border-amber-200",
  },
  GENERATE_CODES: {
    icon: <Shield size={14} />,
    iconCls: "bg-sky-50 text-sky-600",
    pillCls: "bg-sky-50 text-sky-700 border border-sky-200",
  },
  IMPORT_CANDIDATES: {
    icon: <Upload size={14} />,
    iconCls: "bg-emerald-50 text-emerald-600",
    pillCls: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  },
  SUBJECT_LOTTERY: {
    icon: <Settings size={14} />,
    iconCls: "bg-purple-50 text-purple-600",
    pillCls: "bg-purple-50 text-purple-700 border border-purple-200",
  },
};

const fallbackConfig = {
  icon: <FileText size={14} />,
  iconCls: "bg-gray-100 text-gray-500",
  pillCls: "bg-gray-100 text-gray-600 border border-gray-200",
};

const rolePill: Record<string, string> = {
  ADMIN: "bg-red-50 text-red-700 border border-red-200",
  COORDINATOR: "bg-amber-50 text-amber-700 border border-amber-200",
  CORRECTOR: "bg-sky-50 text-sky-700 border border-sky-200",
  CFD_HEAD: "bg-purple-50 text-purple-700 border border-purple-200",
  SUPERVISOR: "bg-emerald-50 text-emerald-700 border border-emerald-200",
};

// ─── Filter Modal ─────────────────────────────────────────────────────────────

const FilterModal = ({
  onClose,
  onApply,
}: {
  onClose: () => void;
  onApply: (role: string) => void;
}) => {
  const [role, setRole] = useState("ALL");
  const roles = [
    "ALL",
    "ADMIN",
    "COORDINATOR",
    "CORRECTOR",
    "CFD_HEAD",
    "SUPERVISOR",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        className="bg-white rounded-2xl w-full max-w-[340px] shadow-2xl overflow-hidden"
      >
        <div className="bg-[#8B7355] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Filter size={14} className="text-white/80" />
            <p className="font-bold text-white text-sm">Filter Logs</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/60 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
              Filter by Role
            </p>
            <div className="grid grid-cols-2 gap-2">
              {roles.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={cn(
                    "py-2 px-3 rounded-lg text-xs font-semibold border transition-all text-left",
                    role === r
                      ? "bg-[#8B7355] text-white border-[#8B7355]"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300",
                  )}
                >
                  {r === "ALL" ? "All Roles" : r.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onApply(role);
              onClose();
            }}
            className="flex-1 py-2.5 rounded-xl bg-[#8B7355] text-white text-xs font-bold hover:bg-[#7a6449] transition-colors"
          >
            Apply Filter
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Date Range Modal ─────────────────────────────────────────────────────────

const DateModal = ({
  onClose,
  onApply,
}: {
  onClose: () => void;
  onApply: (from: string, to: string) => void;
}) => {
  const [from, setFrom] = useState("2026-03-07");
  const [to, setTo] = useState("2026-03-09");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        className="bg-white rounded-2xl w-full max-w-[320px] shadow-2xl overflow-hidden"
      >
        <div className="bg-[#8B7355] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Calendar size={14} className="text-white/80" />
            <p className="font-bold text-white text-sm">Date Range</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/60 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-5 space-y-3">
          {[
            ["From", from, setFrom],
            ["To", to, setTo],
          ].map(([label, val, setter]) => (
            <div key={label as string}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                {label as string}
              </p>
              <input
                type="date"
                value={val as string}
                onChange={(e) =>
                  (setter as (v: string) => void)(e.target.value)
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B7355]/25 focus:border-[#8B7355]"
              />
            </div>
          ))}
        </div>
        <div className="px-5 pb-5 flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onApply(from, to);
              onClose();
            }}
            className="flex-1 py-2.5 rounded-xl bg-[#8B7355] text-white text-xs font-bold hover:bg-[#7a6449] transition-colors"
          >
            Apply
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Export Modal ─────────────────────────────────────────────────────────────

const ExportModal = ({ onClose }: { onClose: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleExport = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setDone(true);
    }, 1400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        className="bg-white rounded-2xl w-full max-w-[340px] shadow-2xl overflow-hidden"
      >
        <div className="bg-[#8B7355] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Download size={14} className="text-white/80" />
            <p className="font-bold text-white text-sm">Export Audit Log</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/60 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-5">
          {done ? (
            <div className="text-center py-5 space-y-2">
              <CheckCircle2 size={32} className="mx-auto text-emerald-500" />
              <p className="font-semibold text-sm">Export Ready</p>
              <button
                type="button"
                className="flex items-center gap-2 mx-auto px-4 py-2 rounded-xl bg-primary-accent text-white text-xs font-bold hover:opacity-90 transition-opacity"
              >
                <Download size={12} /> Download CSV
              </button>
            </div>
          ) : (
            <>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2 mb-4">
                {[
                  ["Entries", "156 log entries"],
                  ["Format", "CSV / JSON"],
                  ["Retention", "Kept for 5 years (SRS)"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-xs">
                    <span className="text-muted">{k}</span>
                    <span className="font-semibold">{v}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-[#8B7355] text-white text-xs font-bold hover:bg-[#7a6449] transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={12} className="animate-spin" />{" "}
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download size={12} /> Export
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const AuditTrailPage = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [showFilter, setShowFilter] = useState(false);
  const [showDate, setShowDate] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [dateRange, setDateRange] = useState<{
    from: string;
    to: string;
  } | null>(null);

  const filtered = mockLogs.filter((log) => {
    const matchSearch =
      search === "" ||
      log.user.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.target.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "ALL" || log.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <AppShell title="Audit Trail">
      <AnimatePresence>
        {showFilter && (
          <FilterModal
            onClose={() => setShowFilter(false)}
            onApply={(r) => setRoleFilter(r)}
          />
        )}
        {showDate && (
          <DateModal
            onClose={() => setShowDate(false)}
            onApply={(f, t) => setDateRange({ from: f, to: t })}
          />
        )}
        {showExport && <ExportModal onClose={() => setShowExport(false)} />}
      </AnimatePresence>

      {/* Fixed height layout */}
      <div className="flex flex-col gap-4 h-full">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 shrink-0 flex-wrap">
          <div className="flex items-center gap-2 flex-1 max-w-xl">
            <div className="relative flex-1">
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted"
                size={13}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by user, action, or target..."
                className="input-field pl-8 text-xs h-9 w-full"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilter(true)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors",
                roleFilter !== "ALL"
                  ? "border-primary-accent bg-primary-accent/5 text-primary-accent"
                  : "border-border text-text-primary hover:bg-black/[0.03]",
              )}
            >
              <Filter size={13} /> Filter
              {roleFilter !== "ALL" && (
                <span className="ml-1 text-[10px] font-bold">
                  · {roleFilter}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowDate(true)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors",
                dateRange
                  ? "border-primary-accent bg-primary-accent/5 text-primary-accent"
                  : "border-border text-text-primary hover:bg-black/[0.03]",
              )}
            >
              <Calendar size={13} /> Date Range
              {dateRange && (
                <span className="ml-1 text-[10px] font-bold">
                  · {dateRange.from}
                </span>
              )}
            </button>
            {(roleFilter !== "ALL" || dateRange) && (
              <button
                type="button"
                onClick={() => {
                  setRoleFilter("ALL");
                  setDateRange(null);
                }}
                className="flex items-center gap-1 px-2.5 py-2 rounded-xl border border-border text-xs text-muted hover:text-text-primary hover:bg-black/[0.03] transition-colors"
              >
                <X size={12} /> Clear
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowExport(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs font-semibold text-text-primary hover:bg-black/[0.03] transition-colors shrink-0"
          >
            <Download size={13} /> Export Log
          </button>
        </div>

        {/* Immutability banner */}
        <div className="flex items-center gap-3 px-4 py-2.5 bg-primary-accent/5 border border-primary-accent/15 rounded-xl shrink-0">
          <Shield size={14} className="text-primary-accent shrink-0" />
          <p className="text-xs text-muted">
            All entries are{" "}
            <span className="font-bold text-text-primary">immutable</span> and
            cryptographically signed. Audit logs cannot be modified or deleted.
          </p>
        </div>

        {/* Log card — fills remaining height, scrolls internally */}
        <Card className="overflow-hidden flex flex-col flex-1 min-h-0">
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-border flex items-center justify-between shrink-0">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <History size={15} className="text-primary-accent" /> Activity Log
            </h3>
            <span className="text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200 px-2.5 py-0.5 rounded-full">
              {filtered.length} entries shown
            </span>
          </div>

          {/* Scrollable log entries */}
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {filtered.map((log) => {
              const cfg = actionConfig[log.action] ?? fallbackConfig;
              const isExpanded = expandedId === log.id;

              return (
                <div key={log.id}>
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : log.id)}
                    className="w-full px-4 py-3.5 flex items-center gap-3.5 hover:bg-black/[0.015] transition-colors text-left"
                  >
                    {/* Action icon */}
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                        cfg.iconCls,
                      )}
                    >
                      {cfg.icon}
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-text-primary leading-tight">
                        <span className="font-bold">{log.user}</span>
                        <span className="text-muted"> · </span>
                        <span
                          className={cn(
                            "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold",
                            rolePill[log.role] ??
                              "bg-gray-100 text-gray-500 border border-gray-200",
                          )}
                        >
                          {log.role}
                        </span>
                      </p>
                      <p className="text-[11px] text-muted mt-0.5 flex items-center gap-2 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock size={10} /> {log.timestamp}
                        </span>
                        <span>·</span>
                        <span>
                          Target:{" "}
                          <span className="font-mono">{log.target}</span>
                        </span>
                      </p>
                    </div>

                    {/* Action pill */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap",
                          cfg.pillCls,
                        )}
                      >
                        {log.action.replace(/_/g, " ")}
                      </span>
                      {isExpanded ? (
                        <ChevronUp size={13} className="text-muted" />
                      ) : (
                        <ChevronDown size={13} className="text-muted" />
                      )}
                    </div>
                  </button>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-3 ml-11">
                          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 grid grid-cols-3 gap-4">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1">
                                Detail
                              </p>
                              <p className="text-xs text-text-primary">
                                {log.detail}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1">
                                IP Address
                              </p>
                              <p className="text-xs font-mono text-text-primary">
                                {log.ip}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1">
                                User ID
                              </p>
                              <p className="text-xs font-mono text-text-primary">
                                {log.role}-
                                {log.user.split(" ")[1]?.toUpperCase() ?? "???"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="p-10 text-center text-muted text-xs">
                No log entries match your search or filter.
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-border flex items-center justify-between shrink-0">
            <p className="text-xs text-muted">
              Showing{" "}
              <span className="font-semibold text-text-primary">
                {filtered.length}
              </span>{" "}
              of <span className="font-semibold text-text-primary">156</span>{" "}
              entries
            </p>
            <p className="text-xs text-muted flex items-center gap-1.5">
              <Shield size={10} className="text-primary-accent" /> Retained for
              5 years · Immutable
            </p>
          </div>
        </Card>
      </div>
    </AppShell>
  );
};
