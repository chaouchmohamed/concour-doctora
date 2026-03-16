import React, { useState } from "react";
import {
  Lock,
  Unlock,
  TrendingUp,
  CheckCircle2,
  Download,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Info,
  Settings,
  FileSignature,
  Archive,
  AlertTriangle,
  Users,
  Medal,
  ClipboardCheck,
  X,
  RefreshCw,
  Pen,
} from "lucide-react";
import { AppShell } from "../components/AppShell";
import { Card } from "../components/UI";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../constants";

// ─── Types ────────────────────────────────────────────────────────────────────

type CandidateStatus = "ADMITTED" | "WAITING_LIST" | "REJECTED";

interface Candidate {
  rank: number;
  code: string;
  realName?: string;
  avg: number;
  subjects: { name: string; grade: number; coeff: number }[];
  status: CandidateStatus;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockCandidates: Candidate[] = [
  {
    rank: 1,
    code: "DOCT-2026-042",
    realName: "Amine Benali",
    avg: 17.45,
    status: "ADMITTED",
    subjects: [
      { name: "Math", grade: 18.5, coeff: 3 },
      { name: "English", grade: 16.4, coeff: 2 },
      { name: "Specialty", grade: 17.2, coeff: 4 },
    ],
  },
  {
    rank: 2,
    code: "DOCT-2026-118",
    realName: "Sara Khelil",
    avg: 16.82,
    status: "ADMITTED",
    subjects: [
      { name: "Math", grade: 15.0, coeff: 3 },
      { name: "English", grade: 18.6, coeff: 2 },
      { name: "Specialty", grade: 16.8, coeff: 4 },
    ],
  },
  {
    rank: 3,
    code: "DOCT-2026-009",
    realName: "Youcef Hamdi",
    avg: 16.1,
    status: "ADMITTED",
    subjects: [
      { name: "Math", grade: 17.2, coeff: 3 },
      { name: "English", grade: 15.0, coeff: 2 },
      { name: "Specialty", grade: 15.9, coeff: 4 },
    ],
  },
  {
    rank: 4,
    code: "DOCT-2026-254",
    realName: "Nadia Boudjema",
    avg: 15.95,
    status: "WAITING_LIST",
    subjects: [
      { name: "Math", grade: 14.5, coeff: 3 },
      { name: "English", grade: 17.4, coeff: 2 },
      { name: "Specialty", grade: 16.0, coeff: 4 },
    ],
  },
  {
    rank: 5,
    code: "DOCT-2026-087",
    realName: "Karim Meziane",
    avg: 15.42,
    status: "WAITING_LIST",
    subjects: [
      { name: "Math", grade: 16.0, coeff: 3 },
      { name: "English", grade: 14.8, coeff: 2 },
      { name: "Specialty", grade: 15.5, coeff: 4 },
    ],
  },
  {
    rank: 6,
    code: "DOCT-2026-156",
    realName: "Fatima Zouaoui",
    avg: 14.2,
    status: "REJECTED",
    subjects: [
      { name: "Math", grade: 12.0, coeff: 3 },
      { name: "English", grade: 16.4, coeff: 2 },
      { name: "Specialty", grade: 14.0, coeff: 4 },
    ],
  },
  {
    rank: 7,
    code: "DOCT-2026-203",
    realName: "Omar Bensalem",
    avg: 11.8,
    status: "REJECTED",
    subjects: [
      { name: "Math", grade: 10.5, coeff: 3 },
      { name: "English", grade: 13.0, coeff: 2 },
      { name: "Specialty", grade: 12.1, coeff: 4 },
    ],
  },
];

const juryMembers = [
  "Prof. Malki Mimoun",
  "Dr. Malki Abdelhamid",
  "Prof. Kechar Mohamed",
];

// ─── Status pill ──────────────────────────────────────────────────────────────

const statusPill: Record<CandidateStatus, string> = {
  ADMITTED:
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200",
  WAITING_LIST:
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200",
  REJECTED:
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-500 border border-gray-200",
};

const statusLabel: Record<CandidateStatus, string> = {
  ADMITTED: "Admitted",
  WAITING_LIST: "Waiting List",
  REJECTED: "Rejected",
};

// ─── Close Deliberation Modal ─────────────────────────────────────────────────

const CloseModal = ({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: () => void;
}) => {
  const [step, setStep] = useState<"confirm" | "signing" | "done">("confirm");
  const [signed, setSigned] = useState<Record<string, boolean>>({});

  const allSigned = juryMembers.every((m) => signed[m]);

  const handleSign = (member: string) =>
    setSigned((prev) => ({ ...prev, [member]: true }));

  const handleFinalize = () => {
    setStep("signing");
  };

  const handleComplete = () => {
    setStep("done");
    setTimeout(() => {
      onConfirm();
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white rounded-2xl w-full max-w-[440px] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#8B7355] to-[#6d5a42] px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck size={18} className="text-white/80" />
            <div>
              <p className="font-bold text-white text-sm">Close Deliberation</p>
              <p className="text-white/60 text-[11px] mt-0.5">
                Irreversible — requires jury signatures
              </p>
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

        {step === "confirm" && (
          <>
            <div className="px-6 py-5 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
                <AlertTriangle
                  size={15}
                  className="text-amber-500 shrink-0 mt-0.5"
                />
                <p className="text-xs text-amber-800">
                  Closing will{" "}
                  <span className="font-bold">permanently lift anonymity</span>,
                  lock all grades, and generate the official PV of Deliberation.
                  This action cannot be undone without Administrator
                  intervention.
                </p>
              </div>

              <div className="space-y-2">
                {[
                  {
                    label: "Total candidates ranked",
                    value: mockCandidates.length,
                  },
                  {
                    label: "Admitted",
                    value: mockCandidates.filter((c) => c.status === "ADMITTED")
                      .length,
                    cls: "text-emerald-600 font-bold",
                  },
                  {
                    label: "Waiting list",
                    value: mockCandidates.filter(
                      (c) => c.status === "WAITING_LIST",
                    ).length,
                    cls: "text-amber-600 font-bold",
                  },
                  {
                    label: "Rejected",
                    value: mockCandidates.filter((c) => c.status === "REJECTED")
                      .length,
                    cls: "text-gray-500 font-bold",
                  },
                ].map(({ label, value, cls }) => (
                  <div
                    key={label}
                    className="flex justify-between items-center bg-gray-50 rounded-lg px-3 py-2 border border-gray-100"
                  >
                    <span className="text-xs text-muted">{label}</span>
                    <span
                      className={cn(
                        "text-sm",
                        cls ?? "font-semibold text-text-primary",
                      )}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFinalize}
                className="flex-1 py-2.5 rounded-xl bg-[#8B7355] text-white text-xs font-bold hover:bg-[#7a6449] transition-colors"
              >
                Proceed to Sign
              </button>
            </div>
          </>
        )}

        {step === "signing" && (
          <>
            <div className="px-6 py-5 space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-3">
                Electronic Signatures — Jury Members
              </p>
              {juryMembers.map((member) => (
                <div
                  key={member}
                  className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3"
                >
                  <div className="flex items-center gap-2.5">
                    {signed[member] ? (
                      <CheckCircle2 size={15} className="text-emerald-500" />
                    ) : (
                      <Pen size={15} className="text-gray-400" />
                    )}
                    <span className="text-xs font-medium text-gray-700">
                      {member}
                    </span>
                  </div>
                  {signed[member] ? (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Signed
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSign(member)}
                      className="text-[10px] font-bold text-[#8B7355] bg-[#8B7355]/5 border border-[#8B7355]/20 px-2.5 py-1 rounded-full hover:bg-[#8B7355]/10 transition-colors"
                    >
                      Sign
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="px-6 pb-6 flex gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleComplete}
                disabled={!allSigned}
                className={cn(
                  "flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-all",
                  allSigned
                    ? "bg-[#8B7355] hover:bg-[#7a6449]"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed",
                )}
              >
                Finalize & Close
              </button>
            </div>
          </>
        )}

        {step === "done" && (
          <div className="py-10 text-center space-y-2 px-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring" }}
            >
              <CheckCircle2 size={40} className="mx-auto text-emerald-500" />
            </motion.div>
            <p className="font-bold text-gray-800 text-sm mt-2">
              Deliberation Closed
            </p>
            <p className="text-xs text-gray-400">
              Anonymity lifted · PV generated · Results archived
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

// ─── PV Modal ─────────────────────────────────────────────────────────────────

const PVModal = ({ onClose }: { onClose: () => void }) => {
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setDone(true);
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl w-full max-w-[400px] shadow-2xl overflow-hidden"
      >
        <div className="bg-gradient-to-r from-[#8B7355] to-[#6d5a42] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileSignature size={15} className="text-white/80" />
            <p className="font-bold text-white text-sm">
              Official PV of Deliberation
            </p>
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
          {done ? (
            <div className="text-center py-6 space-y-3">
              <CheckCircle2 size={36} className="mx-auto text-emerald-500" />
              <p className="font-semibold text-sm">PV Generated Successfully</p>
              <p className="text-xs text-muted">
                Signed · Timestamped · Archived
              </p>
              <button
                type="button"
                className="flex items-center gap-2 mx-auto px-4 py-2 rounded-xl bg-primary-accent text-white text-xs font-bold hover:opacity-90 transition-opacity"
              >
                <Download size={13} /> Download PDF
              </button>
            </div>
          ) : (
            <>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
                {[
                  [
                    "Document ID",
                    `PV-DEL-2026-${Math.floor(Math.random() * 9000) + 1000}`,
                  ],
                  [
                    "Admitted",
                    `${mockCandidates.filter((c) => c.status === "ADMITTED").length} candidates`,
                  ],
                  [
                    "Waiting list",
                    `${mockCandidates.filter((c) => c.status === "WAITING_LIST").length} candidates`,
                  ],
                  [
                    "Rejected",
                    `${mockCandidates.filter((c) => c.status === "REJECTED").length} candidates`,
                  ],
                  ["Timestamp", new Date().toLocaleString()],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-xs">
                    <span className="text-muted">{k}</span>
                    <span className="font-semibold">{v}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={generating}
                  className="flex-1 py-2.5 rounded-xl bg-[#8B7355] text-white text-xs font-bold hover:bg-[#7a6449] transition-colors flex items-center justify-center gap-2"
                >
                  {generating ? (
                    <>
                      <RefreshCw size={12} className="animate-spin" />{" "}
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileSignature size={12} /> Generate & Sign
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

// ─── Candidate Row ────────────────────────────────────────────────────────────

const CandidateRow = ({
  item,
  showReal,
}: {
  item: Candidate;
  showReal: boolean;
}) => {
  const [expanded, setExpanded] = useState(false);

  const rankStyle =
    item.rank === 1
      ? "bg-amber-400 text-white"
      : item.rank === 2
        ? "bg-gray-400 text-white"
        : item.rank === 3
          ? "bg-amber-700 text-white"
          : "bg-gray-100 text-gray-600";

  return (
    <>
      <tr
        className={cn(
          "transition-colors",
          expanded ? "bg-primary-accent/[0.02]" : "hover:bg-black/[0.01]",
        )}
      >
        <td className="p-3">
          <div
            className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0",
              rankStyle,
            )}
          >
            {item.rank <= 3 ? <Medal size={13} /> : item.rank}
          </div>
        </td>
        <td className="p-3">
          <p className="text-xs font-bold text-text-primary font-mono">
            {showReal ? item.realName : item.code}
          </p>
          {showReal && (
            <p className="text-[10px] text-muted font-mono mt-0.5">
              {item.code}
            </p>
          )}
        </td>
        <td className="p-3">
          <span className="text-base font-bold tabular-nums">
            {item.avg.toFixed(2)}
          </span>
          <span className="text-[10px] text-muted ml-1">/ 20</span>
        </td>
        <td className="p-3">
          <span className={statusPill[item.status]}>
            {statusLabel[item.status]}
          </span>
        </td>
        <td className="p-3 text-right">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 rounded-lg hover:bg-black/[0.05] text-muted transition-colors"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </td>
      </tr>

      {/* Expanded subject breakdown */}
      <AnimatePresence>
        {expanded && (
          <tr>
            <td colSpan={5} className="px-3 pb-3 pt-0">
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 overflow-hidden"
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-2.5">
                  Subject Breakdown
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {item.subjects.map((s) => (
                    <div
                      key={s.name}
                      className="text-center bg-white border border-gray-200 rounded-lg p-2.5"
                    >
                      <p className="text-[10px] text-muted font-medium">
                        {s.name}
                      </p>
                      <p className="text-lg font-bold mt-0.5">
                        {s.grade.toFixed(1)}
                      </p>
                      <p className="text-[10px] text-muted">
                        Coeff. ×{s.coeff}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-2.5 pt-2.5 border-t border-gray-200 flex items-center justify-between">
                  <p className="text-[10px] text-muted">Weighted Average</p>
                  <p className="text-sm font-bold text-primary-accent">
                    {item.avg.toFixed(2)} / 20
                  </p>
                </div>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const DeliberationPage = () => {
  const [isClosed, setIsClosed] = useState(false);
  const [showReal, setShowReal] = useState(false);
  const [showClose, setShowClose] = useState(false);
  const [showPV, setShowPV] = useState(false);
  const [threshold, setThreshold] = useState(10.0);
  const [quota, setQuota] = useState(45);
  const [checklist, setChecklist] = useState([
    { label: "All subjects validated", checked: true },
    { label: "Attendance PVs signed", checked: true },
    { label: "Discrepancies resolved", checked: true },
    { label: "Jury signatures collected", checked: false },
  ]);
  const [applyDone, setApplyDone] = useState(false);

  const admitted = mockCandidates.filter((c) => c.status === "ADMITTED").length;
  const waitlist = mockCandidates.filter(
    (c) => c.status === "WAITING_LIST",
  ).length;
  const rejected = mockCandidates.filter((c) => c.status === "REJECTED").length;
  const lastAdmAvg =
    mockCandidates.filter((c) => c.status === "ADMITTED").at(-1)?.avg ?? 0;
  const checklistOk = checklist.every((i) => i.checked);

  const handleConfirmClose = () => {
    setIsClosed(true);
    setShowReal(true);
    setChecklist((prev) => prev.map((i) => ({ ...i, checked: true })));
  };

  const handleApplyRules = () => {
    setApplyDone(true);
    setTimeout(() => setApplyDone(false), 2000);
  };

  const toggleCheck = (idx: number) => {
    if (isClosed) return;
    setChecklist((prev) =>
      prev.map((item, i) =>
        i === idx ? { ...item, checked: !item.checked } : item,
      ),
    );
  };

  return (
    <AppShell title="Final Deliberation Panel">
      <AnimatePresence>
        {showClose && (
          <CloseModal
            onClose={() => setShowClose(false)}
            onConfirm={handleConfirmClose}
          />
        )}
        {showPV && <PVModal onClose={() => setShowPV(false)} />}
      </AnimatePresence>

      <div className="flex flex-col gap-4 h-full">
        {/* Status banner */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "rounded-2xl px-6 py-4 flex items-center justify-between border",
            isClosed
              ? "bg-emerald-50 border-emerald-200"
              : "bg-amber-50 border-amber-200",
          )}
        >
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "w-11 h-11 rounded-full flex items-center justify-center border-2 shrink-0",
                isClosed
                  ? "bg-emerald-100 border-emerald-400 text-emerald-600"
                  : "bg-amber-100 border-amber-400 text-amber-600",
              )}
            >
              {isClosed ? <Lock size={20} /> : <Unlock size={20} />}
            </div>
            <div>
              <p
                className={cn(
                  "font-bold text-base",
                  isClosed ? "text-emerald-800" : "text-amber-800",
                )}
              >
                {isClosed
                  ? "Deliberation Closed & Finalized"
                  : "Open Deliberation"}
                {isClosed && (
                  <span className="ml-2 text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                    OFFICIAL
                  </span>
                )}
              </p>
              <p
                className={cn(
                  "text-xs mt-0.5",
                  isClosed ? "text-emerald-700" : "text-amber-700",
                )}
              >
                {isClosed
                  ? "Anonymity lifted · Grades locked · Results archived and immutable"
                  : "Reviewing aggregated grades. Anonymity is active — only anonymous codes are visible."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isClosed ? (
              <button
                type="button"
                onClick={() => setShowClose(true)}
                disabled={!checklistOk}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
                  checklistOk
                    ? "bg-[#8B7355] text-white hover:bg-[#7a6449] shadow-sm"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed",
                )}
              >
                <ShieldCheck size={16} /> Close Deliberation
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setShowPV(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-300 text-emerald-700 text-sm font-semibold hover:bg-emerald-50 transition-colors"
                >
                  <FileSignature size={15} /> Generate PV
                </button>
                <button
                  type="button"
                  onClick={() => setShowPV(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors"
                >
                  <Download size={15} /> Publish Results
                </button>
              </>
            )}
          </div>
        </motion.div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3">
          {[
            {
              label: "Total Candidates",
              value: mockCandidates.length,
              Icon: Users,
              cls: "text-primary-accent bg-primary-accent/10",
            },
            {
              label: "Admitted",
              value: admitted,
              Icon: CheckCircle2,
              cls: "text-emerald-600 bg-emerald-50",
            },
            {
              label: "Waiting List",
              value: waitlist,
              Icon: AlertTriangle,
              cls: "text-amber-600 bg-amber-50",
            },
            {
              label: "Rejected",
              value: rejected,
              Icon: X,
              cls: "text-gray-500 bg-gray-100",
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

        {/* Body — fixed height, both sides scroll independently */}
        <div className="flex gap-4 flex-1 min-h-0">
          {/* Ranking table — scrolls internally */}
          <div className="flex-1 min-w-0 overflow-y-auto pb-4">
            <Card className="overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <TrendingUp size={16} className="text-primary-accent" />
                  {isClosed ? "Final Ranking" : "Provisional Ranking"}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold bg-primary-accent/10 text-primary-accent px-2.5 py-1 rounded-full border border-primary-accent/20">
                    {mockCandidates.length} Candidates
                  </span>
                  <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full border border-gray-200">
                    3 Subjects
                  </span>
                  {isClosed && (
                    <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                      <Archive size={10} /> Archived
                    </span>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-black/[0.02] border-b border-border">
                      <th className="p-3 text-[10px] font-bold text-muted uppercase tracking-wider w-14">
                        Rank
                      </th>
                      <th className="p-3 text-[10px] font-bold text-muted uppercase tracking-wider">
                        {isClosed ? "Full Name" : "Anonymous Code"}
                      </th>
                      <th className="p-3 text-[10px] font-bold text-muted uppercase tracking-wider">
                        Weighted Avg.
                      </th>
                      <th className="p-3 text-[10px] font-bold text-muted uppercase tracking-wider">
                        Status
                      </th>
                      <th className="p-3 text-[10px] font-bold text-muted uppercase tracking-wider text-right">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {mockCandidates.map((item) => (
                      <CandidateRow
                        key={item.code}
                        item={item}
                        showReal={showReal}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="px-5 py-3 border-t border-border flex items-center justify-between">
                <p className="text-xs text-muted">
                  Admissibility threshold:{" "}
                  <span className="font-bold text-primary-accent">
                    {threshold.toFixed(1)} / 20
                  </span>
                </p>
                {isClosed && (
                  <p className="text-xs text-muted flex items-center gap-1.5">
                    <Lock size={11} className="text-emerald-500" /> Grades
                    immutable
                  </p>
                )}
              </div>
            </Card>
          </div>

          {/* Right panel — scrolls internally */}
          <div className="w-[252px] shrink-0 overflow-y-auto space-y-3 pb-4">
            {/* Deliberation Rules */}
            <Card className="p-4">
              <h3 className="text-xs font-bold mb-4 flex items-center gap-2">
                <Settings size={14} className="text-muted" /> Deliberation Rules
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-2">
                    Admissibility Threshold
                  </p>
                  <input
                    type="range"
                    className="w-full accent-primary-accent mb-2"
                    min="8"
                    max="14"
                    step="0.1"
                    value={threshold}
                    onChange={(e) => setThreshold(+e.target.value)}
                    disabled={isClosed}
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-muted">8.0 – 14.0 / 20</p>
                    <span className="text-sm font-bold text-primary-accent bg-primary-accent/5 border border-primary-accent/20 rounded-lg px-2 py-0.5">
                      {threshold.toFixed(1)}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-2">
                    Quota (Admitted)
                  </p>
                  <input
                    type="number"
                    value={quota}
                    onChange={(e) => setQuota(+e.target.value)}
                    disabled={isClosed}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent disabled:opacity-60"
                  />
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
                  {[
                    {
                      label: "Admitted",
                      value: admitted,
                      cls: "text-emerald-600 font-bold",
                    },
                    {
                      label: "Waiting List",
                      value: waitlist,
                      cls: "text-amber-600 font-bold",
                    },
                    {
                      label: "Last Admitted Avg.",
                      value: lastAdmAvg.toFixed(2),
                      cls: "text-primary-accent font-bold",
                    },
                  ].map(({ label, value, cls }) => (
                    <div
                      key={label}
                      className="flex justify-between items-center"
                    >
                      <span className="text-[11px] text-muted">{label}</span>
                      <span className={cn("text-sm", cls)}>{value}</span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleApplyRules}
                  disabled={isClosed}
                  className={cn(
                    "w-full py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2",
                    isClosed
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : applyDone
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "border border-border text-text-primary hover:bg-black/[0.03]",
                  )}
                >
                  {applyDone ? (
                    <>
                      <CheckCircle2 size={12} /> Applied
                    </>
                  ) : (
                    "Apply Rules"
                  )}
                </button>
              </div>
            </Card>

            {/* Checklist */}
            <Card className="p-4">
              <h3 className="text-xs font-bold mb-3 flex items-center gap-2">
                <ClipboardCheck size={14} className="text-primary-accent" />{" "}
                Pre-Close Checklist
              </h3>
              <div className="space-y-2.5">
                {checklist.map((item, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleCheck(i)}
                    className="w-full flex items-center gap-2.5 text-left group"
                  >
                    <div
                      className={cn(
                        "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all",
                        item.checked
                          ? "bg-emerald-500 border-emerald-500"
                          : "border-gray-300 group-hover:border-primary-accent",
                      )}
                    >
                      {item.checked && (
                        <CheckCircle2 size={10} className="text-white" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-xs transition-colors",
                        item.checked
                          ? "text-text-primary font-medium line-through text-muted"
                          : "text-muted group-hover:text-text-primary",
                      )}
                    >
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
              {!checklistOk && !isClosed && (
                <p className="text-[10px] text-amber-600 mt-3 flex items-center gap-1">
                  <AlertTriangle size={10} /> Complete all items to close
                  deliberation.
                </p>
              )}
              {checklistOk && !isClosed && (
                <p className="text-[10px] text-emerald-600 mt-3 flex items-center gap-1">
                  <CheckCircle2 size={10} /> Ready to close deliberation.
                </p>
              )}
            </Card>

            {/* Info box */}
            <div className="flex gap-2.5 bg-primary-accent/5 border border-primary-accent/15 rounded-xl px-4 py-3">
              <Info size={14} className="text-primary-accent shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted leading-relaxed">
                Closing locks all grades and generates the official PV. Every
                action is logged in the audit trail and immutable after closure.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};
