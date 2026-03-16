import React, { useState } from "react";
import {
  AlertTriangle,
  UserPlus,
  Eye,
  CheckCircle2,
  XCircle,
  Search,
  ArrowUpDown,
  Settings,
  TrendingUp,
  Lock,
  X,
  ChevronDown,
  Bell,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { AppShell } from "../components/AppShell";
import { Card } from "../components/UI";
import { cn } from "../constants";
import { motion, AnimatePresence } from "motion/react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Severity = "CRITICAL" | "HIGH" | "MEDIUM";
type DiscStatus = "PENDING" | "ASSIGNED" | "RESOLVED";
type FinalRule = "AVERAGE" | "MEDIAN" | "THIRD_CORRECTOR";

interface Discrepancy {
  id: string;
  copyCode: string;
  subject: string;
  c1Grade: number;
  c2Grade: number;
  delta: number;
  status: DiscStatus;
  severity: Severity;
  thirdCorrector?: string;
  finalGrade?: number;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const initialData: Discrepancy[] = [
  {
    id: "1",
    copyCode: "ANO-7F3A92",
    subject: "Mathematics",
    c1Grade: 16.5,
    c2Grade: 12.0,
    delta: 4.5,
    status: "PENDING",
    severity: "HIGH",
  },
  {
    id: "2",
    copyCode: "ANO-B1E4D8",
    subject: "Mathematics",
    c1Grade: 14.25,
    c2Grade: 11.0,
    delta: 3.25,
    status: "ASSIGNED",
    severity: "MEDIUM",
    thirdCorrector: "Dr. Ahmed",
  },
  {
    id: "3",
    copyCode: "ANO-9C2F15",
    subject: "English",
    c1Grade: 15.0,
    c2Grade: 8.5,
    delta: 6.5,
    status: "PENDING",
    severity: "CRITICAL",
  },
  {
    id: "4",
    copyCode: "ANO-4D8E71",
    subject: "Computer Science",
    c1Grade: 17.0,
    c2Grade: 13.75,
    delta: 3.25,
    status: "RESOLVED",
    severity: "MEDIUM",
    finalGrade: 15.5,
  },
  {
    id: "5",
    copyCode: "ANO-F6A023",
    subject: "Mathematics",
    c1Grade: 12.0,
    c2Grade: 8.75,
    delta: 3.25,
    status: "RESOLVED",
    severity: "MEDIUM",
    finalGrade: 10.25,
  },
  {
    id: "6",
    copyCode: "ANO-2B9D44",
    subject: "English",
    c1Grade: 18.0,
    c2Grade: 13.0,
    delta: 5.0,
    status: "PENDING",
    severity: "HIGH",
  },
];

const seniorCorrectors = [
  "Prof. Malki Mimoun",
  "Dr. Malki Abdelhamid",
  "Prof. Kechar Mohamed",
  "Dr. Belfaci Younes",
];

// ─── Pills — plain spans, no Badge component ──────────────────────────────────

const severityPill: Record<Severity, string> = {
  CRITICAL:
    "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200 whitespace-nowrap",
  HIGH: "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap",
  MEDIUM:
    "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200 whitespace-nowrap",
};

const statusPill: Record<DiscStatus, string> = {
  PENDING:
    "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-orange-50 text-orange-700 border border-orange-200 whitespace-nowrap",
  ASSIGNED:
    "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200 whitespace-nowrap",
  RESOLVED:
    "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap",
};

// ─── Assign 3rd Modal ─────────────────────────────────────────────────────────

const AssignModal = ({
  disc,
  onClose,
  onConfirm,
}: {
  disc: Discrepancy;
  onClose: () => void;
  onConfirm: (id: string, corrector: string) => void;
}) => {
  const [selected, setSelected] = useState("");
  const [priority, setPriority] = useState<"Normal" | "High" | "Urgent">(
    "Normal",
  );
  const [notify, setNotify] = useState(true);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleConfirm = () => {
    if (!selected) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setDone(true);
      setTimeout(() => {
        onConfirm(disc.id, selected);
        onClose();
      }, 900);
    }, 1100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        className="bg-white rounded-2xl w-full max-w-[400px] shadow-2xl overflow-hidden"
      >
        <div className="bg-[#8B7355] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <UserPlus size={15} className="text-white/80" />
            <div>
              <p className="font-bold text-white text-sm leading-tight">
                Third Corrector Assignment
              </p>
              <p className="text-white/60 text-[11px]">Copy: {disc.copyCode}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {done ? (
          <div className="py-10 text-center space-y-2">
            <CheckCircle2 size={36} className="mx-auto text-emerald-500" />
            <p className="font-semibold text-gray-800 text-sm">
              Assignment Confirmed
            </p>
            <p className="text-xs text-gray-400">
              {selected} has been notified
            </p>
          </div>
        ) : (
          <div className="px-5 py-4 space-y-3.5">
            <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2.5 flex items-center gap-2">
              <AlertTriangle size={13} className="text-red-500 shrink-0" />
              <p className="text-xs text-red-700">
                Δ <span className="font-bold">{disc.delta.toFixed(2)} pts</span>{" "}
                exceeds the 3.00 pt threshold.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["Corrector #1", disc.c1Grade],
                  ["Corrector #2", disc.c2Grade],
                ] as [string, number][]
              ).map(([label, val]) => (
                <div
                  key={label}
                  className="bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-center"
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    {label}
                  </p>
                  <p className="text-xl font-bold text-gray-700 my-0.5">
                    {val.toFixed(2)}
                  </p>
                  <p className="text-[10px] text-gray-400">Anonymous</p>
                </div>
              ))}
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                Select Expert Corrector
              </p>
              <div className="relative">
                <select
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                  className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white pr-8 focus:outline-none focus:ring-2 focus:ring-[#8B7355]/25 focus:border-[#8B7355]"
                >
                  <option value="">Choose a Senior Corrector...</option>
                  {seniorCorrectors.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                <CheckCircle2 size={10} /> Senior clearance only.
              </p>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                Priority Level
              </p>
              <div className="flex gap-2">
                {(["Normal", "High", "Urgent"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={cn(
                      "flex-1 py-1.5 rounded-full text-xs font-semibold border transition-all",
                      priority === p
                        ? p === "Urgent"
                          ? "bg-red-500 text-white border-red-500"
                          : p === "High"
                            ? "bg-amber-500 text-white border-amber-500"
                            : "bg-[#8B7355] text-white border-[#8B7355]"
                        : "bg-white text-gray-500 border-gray-200 hover:border-gray-300",
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
              <div className="flex items-center gap-2.5">
                <Bell size={13} className="text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-gray-700 leading-tight">
                    Notify immediately
                  </p>
                  <p className="text-[10px] text-gray-400">
                    Via email and push notification
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNotify((v) => !v)}
                className={cn(
                  "w-9 h-5 rounded-full transition-colors relative shrink-0",
                  notify ? "bg-[#8B7355]" : "bg-gray-300",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform",
                    notify ? "translate-x-4" : "translate-x-0.5",
                  )}
                />
              </button>
            </div>
          </div>
        )}

        {!done && (
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
              onClick={handleConfirm}
              disabled={!selected || loading}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-all",
                selected && !loading
                  ? "bg-[#8B7355] hover:bg-[#7a6449]"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed",
              )}
            >
              {loading ? "Assigning..." : "Confirm Assignment"}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

// ─── Detail Drawer ────────────────────────────────────────────────────────────

const DetailDrawer = ({
  disc,
  onClose,
  onValidate,
}: {
  disc: Discrepancy;
  onClose: () => void;
  onValidate: (id: string, grade: number) => void;
}) => {
  const [manualGrade, setManualGrade] = useState("");
  const [justification, setJustification] = useState("");
  const [saving, setSaving] = useState(false);

  const avg = ((disc.c1Grade + disc.c2Grade) / 2).toFixed(2);
  const med = (
    Math.min(disc.c1Grade, disc.c2Grade) +
    Math.abs(disc.c1Grade - disc.c2Grade) / 2
  ).toFixed(2);

  const handleValidate = () => {
    const g = parseFloat(manualGrade);
    if (isNaN(g)) return;
    setSaving(true);
    setTimeout(() => {
      onValidate(disc.id, g);
      setSaving(false);
      onClose();
    }, 900);
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed right-0 top-0 h-full w-[340px] bg-white border-l border-border shadow-2xl z-40 flex flex-col"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
        <div>
          <p className="font-bold text-sm font-mono text-primary-accent">
            {disc.copyCode}
          </p>
          <p className="text-xs text-muted">{disc.subject}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-muted hover:text-text-primary transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              ["Grade 1", disc.c1Grade],
              ["Grade 2", disc.c2Grade],
            ] as [string, number][]
          ).map(([label, val]) => (
            <div
              key={label}
              className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center"
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                {label}
              </p>
              <p className="text-2xl font-bold text-gray-700 my-1">
                {val.toFixed(2)}
              </p>
            </div>
          ))}
        </div>

        <div
          className={cn(
            "rounded-xl px-4 py-3 flex items-center gap-3 border",
            disc.severity === "CRITICAL"
              ? "bg-red-50 border-red-200"
              : disc.severity === "HIGH"
                ? "bg-amber-50 border-amber-200"
                : "bg-yellow-50 border-yellow-200",
          )}
        >
          <ShieldAlert
            size={15}
            className={
              disc.severity === "CRITICAL"
                ? "text-red-500"
                : disc.severity === "HIGH"
                  ? "text-amber-500"
                  : "text-yellow-500"
            }
          />
          <div>
            <p className="text-sm font-bold">
              Δ {disc.delta.toFixed(2)} points
            </p>
            <p className="text-xs text-muted">
              {disc.severity.charAt(0) + disc.severity.slice(1).toLowerCase()}{" "}
              severity
            </p>
          </div>
        </div>

        {disc.thirdCorrector && (
          <div className="bg-sky-50 border border-sky-200 rounded-xl px-4 py-3">
            <p className="text-xs font-bold text-sky-700 mb-0.5">
              3rd Corrector Assigned
            </p>
            <p className="text-sm text-sky-800">{disc.thirdCorrector}</p>
          </div>
        )}

        {disc.status !== "RESOLVED" && (
          <>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-2">
                Grade Suggestions
              </p>
              <div className="space-y-2">
                {(
                  [
                    ["Average", avg],
                    ["Median", med],
                  ] as [string, string][]
                ).map(([rule, val]) => (
                  <div
                    key={rule}
                    className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
                  >
                    <p className="text-xs text-muted font-medium">{rule}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{val}</span>
                      <button
                        type="button"
                        onClick={() => setManualGrade(val)}
                        className="text-[10px] text-primary-accent font-bold hover:underline"
                      >
                        Use
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-2">
                Accept Final Grade
              </p>
              <div className="relative mb-2">
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  max="20"
                  placeholder="0.00"
                  value={manualGrade}
                  onChange={(e) => setManualGrade(e.target.value)}
                  className="w-full border border-border rounded-xl text-xl font-bold text-center h-12 focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-xs font-bold">
                  / 20
                </span>
              </div>
              <textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value.slice(0, 200))}
                placeholder="Written justification..."
                className="w-full border border-border rounded-xl p-3 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-primary-accent/20"
                rows={3}
              />
              <p className="text-right text-[10px] text-muted mb-2">
                {justification.length}/200
              </p>
              <button
                type="button"
                onClick={handleValidate}
                disabled={!manualGrade || saving}
                className={cn(
                  "w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all",
                  manualGrade
                    ? "bg-primary-accent text-white hover:opacity-90"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed",
                )}
              >
                {saving ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />{" "}
                    Validating...
                  </>
                ) : (
                  <>
                    <Lock size={13} /> Validate & Lock Grade
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {disc.status === "RESOLVED" && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
            <CheckCircle2 size={24} className="mx-auto text-emerald-500 mb-1" />
            <p className="text-sm font-bold text-emerald-700">Grade Locked</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">
              {disc.finalGrade?.toFixed(2)}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const DiscrepanciesPage = () => {
  const [data, setData] = useState<Discrepancy[]>(initialData);
  const [filter, setFilter] = useState<DiscStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [assignTarget, setAssignTarget] = useState<Discrepancy | null>(null);
  const [viewTarget, setViewTarget] = useState<Discrepancy | null>(null);
  const [threshold, setThreshold] = useState(3.0);
  const [finalRule, setFinalRule] = useState<FinalRule>("AVERAGE");
  const [savedConfig, setSavedConfig] = useState(false);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const stats = {
    total: data.length,
    pending: data.filter((d) => d.status === "PENDING").length,
    assigned: data.filter((d) => d.status === "ASSIGNED").length,
    resolved: data.filter((d) => d.status === "RESOLVED").length,
  };

  const filtered = data
    .filter((d) => filter === "ALL" || d.status === filter)
    .filter(
      (d) =>
        search === "" ||
        d.copyCode.toLowerCase().includes(search.toLowerCase()) ||
        d.subject.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) =>
      sortDir === "desc" ? b.delta - a.delta : a.delta - b.delta,
    );

  const handleAssignConfirm = (id: string, corrector: string) =>
    setData((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              status: "ASSIGNED" as DiscStatus,
              thirdCorrector: corrector,
            }
          : d,
      ),
    );

  const handleValidate = (id: string, grade: number) =>
    setData((prev) =>
      prev.map((d) =>
        d.id === id
          ? { ...d, status: "RESOLVED" as DiscStatus, finalGrade: grade }
          : d,
      ),
    );

  const handleSaveConfig = () => {
    setSavedConfig(true);
    setTimeout(() => setSavedConfig(false), 2000);
  };

  const resolutionPct =
    data.length > 0 ? Math.round((stats.resolved / data.length) * 100) : 0;

  return (
    <AppShell title="Discrepancy Management">
      <AnimatePresence>
        {assignTarget && (
          <AssignModal
            disc={assignTarget}
            onClose={() => setAssignTarget(null)}
            onConfirm={handleAssignConfirm}
          />
        )}
        {viewTarget && (
          <DetailDrawer
            disc={viewTarget}
            onClose={() => setViewTarget(null)}
            onValidate={handleValidate}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {savedConfig && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="fixed top-5 right-5 z-50 bg-emerald-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-semibold"
          >
            <CheckCircle2 size={15} /> Configuration saved
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full height layout */}
      <div className="flex flex-col gap-4 h-full">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 shrink-0">
          {[
            {
              label: "Total Discrepancies",
              value: stats.total,
              Icon: AlertTriangle,
              cls: "text-primary-accent bg-primary-accent/10",
            },
            {
              label: "Pending Review",
              value: stats.pending,
              Icon: XCircle,
              cls: "text-orange-500 bg-orange-50",
            },
            {
              label: "3rd Corrector Assigned",
              value: stats.assigned,
              Icon: UserPlus,
              cls: "text-sky-500 bg-sky-50",
            },
            {
              label: "Resolved",
              value: stats.resolved,
              Icon: CheckCircle2,
              cls: "text-emerald-500 bg-emerald-50",
            },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Card className="p-4 flex items-center gap-3">
                <div
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
                    s.cls,
                  )}
                >
                  <s.Icon size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted leading-tight">
                    {s.label}
                  </p>
                  <p className="text-2xl font-bold text-text-primary leading-none mt-0.5">
                    {s.value}
                  </p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Body */}
        <div className="flex gap-4 flex-1 min-h-0">
          {/* Table column */}
          <div className="flex-1 min-w-0 flex flex-col gap-3 min-h-0">
            {/* Toolbar */}
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <div className="flex items-center gap-1 bg-white border border-border rounded-xl p-1">
                {(["ALL", "PENDING", "ASSIGNED", "RESOLVED"] as const).map(
                  (f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFilter(f)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                        filter === f
                          ? "bg-primary-accent text-white shadow-sm"
                          : "text-muted hover:text-text-primary hover:bg-black/[0.03]",
                      )}
                    >
                      {f === "ALL"
                        ? "All"
                        : f === "PENDING"
                          ? "Pending"
                          : f === "ASSIGNED"
                            ? "3rd Assigned"
                            : "Resolved"}
                      {f !== "ALL" && (
                        <span
                          className={cn(
                            "ml-1.5 px-1.5 py-0.5 rounded-full text-[10px]",
                            filter === f ? "bg-white/20" : "bg-black/[0.06]",
                          )}
                        >
                          {f === "PENDING"
                            ? stats.pending
                            : f === "ASSIGNED"
                              ? stats.assigned
                              : stats.resolved}
                        </span>
                      )}
                    </button>
                  ),
                )}
              </div>
              <div className="relative">
                <Search
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted"
                  size={13}
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by code or subject..."
                  className="input-field pl-8 text-xs h-9 w-52"
                />
              </div>
            </div>

            {/* Table */}
            <Card className="overflow-hidden flex flex-col flex-1 min-h-0">
              <div className="overflow-y-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-black/[0.02] border-b border-border">
                      {[
                        "Copy Code",
                        "Subject",
                        "C1",
                        "C2",
                        "Delta",
                        "Severity",
                        "Status",
                        "Action",
                      ].map((h) => (
                        <th
                          key={h}
                          className="p-3 text-[10px] font-bold text-muted uppercase tracking-wider whitespace-nowrap"
                        >
                          {h === "Delta" ? (
                            <button
                              type="button"
                              onClick={() =>
                                setSortDir((d) =>
                                  d === "desc" ? "asc" : "desc",
                                )
                              }
                              className="flex items-center gap-1 hover:text-text-primary transition-colors"
                            >
                              Delta <ArrowUpDown size={10} />
                            </button>
                          ) : (
                            h
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((d) => (
                      <tr
                        key={d.id}
                        className="hover:bg-black/[0.015] transition-colors"
                      >
                        <td className="p-3 text-xs font-mono font-bold text-primary-accent">
                          {d.copyCode}
                        </td>
                        <td className="p-3 text-xs text-muted">{d.subject}</td>
                        <td className="p-3 text-xs font-bold tabular-nums">
                          {d.c1Grade.toFixed(2)}
                        </td>
                        <td className="p-3 text-xs font-bold tabular-nums">
                          {d.c2Grade.toFixed(2)}
                        </td>
                        <td className="p-3">
                          <span
                            className={cn(
                              "text-xs font-bold tabular-nums",
                              d.delta >= 5
                                ? "text-red-600"
                                : d.delta >= 4
                                  ? "text-amber-600"
                                  : "text-yellow-600",
                            )}
                          >
                            +{d.delta.toFixed(2)}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={severityPill[d.severity]}>
                            {d.severity.charAt(0) +
                              d.severity.slice(1).toLowerCase()}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={statusPill[d.status]}>
                            {d.status === "ASSIGNED"
                              ? "3rd Assigned"
                              : d.status === "PENDING"
                                ? "Pending"
                                : "Resolved"}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            {d.status === "PENDING" && (
                              <button
                                type="button"
                                onClick={() => setAssignTarget(d)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary-accent text-white text-xs font-semibold hover:opacity-90 transition-opacity whitespace-nowrap"
                              >
                                <UserPlus size={11} /> Assign 3rd
                              </button>
                            )}
                            {d.status === "RESOLVED" && (
                              <div className="flex items-center gap-1.5">
                                <Lock size={11} className="text-emerald-500" />
                                <span className="text-xs font-bold text-emerald-600 tabular-nums">
                                  {d.finalGrade?.toFixed(2)}
                                </span>
                              </div>
                            )}
                            {d.status !== "RESOLVED" && (
                              <button
                                type="button"
                                onClick={() => setViewTarget(d)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-xs font-medium text-muted hover:text-text-primary hover:bg-black/[0.03] transition-colors"
                              >
                                <Eye size={11} /> View
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td
                          colSpan={8}
                          className="p-10 text-center text-muted text-xs"
                        >
                          No discrepancies match your filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 border-t border-border flex items-center justify-between">
                <p className="text-xs text-muted">
                  Showing{" "}
                  <span className="font-semibold text-text-primary">
                    {filtered.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-text-primary">
                    {data.length}
                  </span>
                </p>
                <p className="text-xs text-muted">
                  Threshold:{" "}
                  <span className="font-bold text-primary-accent">
                    {threshold.toFixed(2)} pts
                  </span>
                </p>
              </div>
            </Card>
          </div>

          {/* Right panel — sticky, same height as left, internal scroll */}
          <div className="w-[252px] shrink-0 space-y-3 overflow-y-auto">
            <div className="space-y-3 pb-1">
              {/* Threshold Config */}
              <Card className="p-5">
                <h3 className="text-xs font-bold mb-4 flex items-center gap-2">
                  <Settings size={14} className="text-muted" /> Threshold Config
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-2">
                      Discrepancy Threshold
                    </p>
                    <input
                      type="range"
                      className="w-full accent-primary-accent mb-2"
                      min="1"
                      max="6"
                      step="0.25"
                      value={threshold}
                      onChange={(e) => setThreshold(+e.target.value)}
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-muted">1.00 – 6.00 pts</p>
                      <span className="text-sm font-bold text-primary-accent bg-primary-accent/5 border border-primary-accent/20 rounded-lg px-2 py-0.5">
                        {threshold.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted mt-1.5">
                      Differences above this trigger a 3rd correction.
                    </p>
                  </div>

                  <div className="border-t border-border pt-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-2">
                      Final Grade Rule
                    </p>
                    <div className="relative">
                      <select
                        value={finalRule}
                        onChange={(e) =>
                          setFinalRule(e.target.value as FinalRule)
                        }
                        className="w-full appearance-none border border-border rounded-lg px-3 py-2 text-xs bg-white pr-7 focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent"
                      >
                        <option value="AVERAGE">
                          Average of all correctors
                        </option>
                        <option value="MEDIAN">Median score</option>
                        <option value="THIRD_CORRECTOR">
                          3rd corrector only
                        </option>
                      </select>
                      <ChevronDown
                        size={12}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                      />
                    </div>
                    <p className="text-[10px] text-muted mt-1.5">
                      Applied when computing the final grade after 3rd
                      correction.
                    </p>
                  </div>

                  <div className="border-t border-border pt-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-3">
                      Resolution Rate
                    </p>
                    <div className="text-center py-1">
                      <p className="text-3xl font-bold text-primary-accent">
                        {resolutionPct}%
                      </p>
                      <p className="text-xs text-muted mt-0.5">
                        {stats.resolved} of {data.length} resolved
                      </p>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mt-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${resolutionPct}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-primary-accent rounded-full"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveConfig}
                    className="w-full py-2.5 rounded-xl border border-border text-xs font-semibold text-text-primary hover:bg-black/[0.03] transition-colors"
                  >
                    Save Configuration
                  </button>
                </div>
              </Card>

              {/* Delta Distribution */}
              <Card className="p-5">
                <h4 className="text-xs font-bold mb-4 flex items-center gap-2">
                  <TrendingUp size={14} className="text-primary-accent" /> Delta
                  Distribution
                </h4>
                <div className="space-y-3">
                  {[
                    {
                      label: "Critical (Δ ≥ 5.0)",
                      count: data.filter((d) => d.delta >= 5).length,
                      color: "bg-red-500",
                    },
                    {
                      label: "High (Δ ≥ 4.0)",
                      count: data.filter((d) => d.delta >= 4 && d.delta < 5)
                        .length,
                      color: "bg-amber-500",
                    },
                    {
                      label: "Medium (Δ ≥ 3.0)",
                      count: data.filter((d) => d.delta >= 3 && d.delta < 4)
                        .length,
                      color: "bg-yellow-500",
                    },
                  ].map((item) => {
                    const pct =
                      data.length > 0
                        ? Math.round((item.count / data.length) * 100)
                        : 0;
                    return (
                      <div key={item.label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-muted">
                            {item.label}
                          </span>
                          <span className="text-[10px] font-bold">
                            {item.count}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className={cn("h-full rounded-full", item.color)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
            {/* end inner space-y-3 */}
          </div>
        </div>
      </div>
    </AppShell>
  );
};
