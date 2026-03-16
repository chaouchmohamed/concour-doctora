import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Save,
  AlertCircle,
  CheckCircle2,
  Lock,
  UserPlus,
  X,
  FileText,
  ClipboardList,
  AlertTriangle,
  Bell,
  ChevronDown,
} from "lucide-react";
import { AppShell } from "../components/AppShell";
import { Card } from "../components/UI";
import { cn } from "../constants";
import { motion, AnimatePresence } from "motion/react";

// ─── Types ────────────────────────────────────────────────────────────────────

type CopyStatus =
  | "PENDING"
  | "GRADED_1"
  | "GRADED_BOTH"
  | "DISCREPANCY"
  | "LOCKED";

interface Copy {
  id: string;
  code: string;
  subject: string;
  grade1: number | null;
  grade2: number | null;
  finalGrade: number | null;
  status: CopyStatus;
  pages: number;
  correctionOrder: "FIRST" | "SECOND" | "THIRD";
  thirdCorrector?: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const mockCopies: Copy[] = [
  {
    id: "1",
    code: "DOCT-2026-042",
    subject: "Mathematics & Logic",
    grade1: null,
    grade2: null,
    finalGrade: null,
    status: "PENDING",
    pages: 4,
    correctionOrder: "FIRST",
  },
  {
    id: "2",
    code: "DOCT-2026-051",
    subject: "Mathematics & Logic",
    grade1: 14.5,
    grade2: null,
    finalGrade: null,
    status: "GRADED_1",
    pages: 4,
    correctionOrder: "FIRST",
  },
  {
    id: "3",
    code: "DOCT-2026-063",
    subject: "Research Methodology",
    grade1: 12.0,
    grade2: 15.5,
    finalGrade: null,
    status: "DISCREPANCY",
    pages: 3,
    correctionOrder: "FIRST",
  },
  {
    id: "4",
    code: "DOCT-2026-077",
    subject: "Mathematics & Logic",
    grade1: 16.0,
    grade2: 17.0,
    finalGrade: 16.5,
    status: "LOCKED",
    pages: 4,
    correctionOrder: "FIRST",
  },
  {
    id: "5",
    code: "DOCT-2026-088",
    subject: "Specialty: Computer Sci.",
    grade1: 9.5,
    grade2: 10.0,
    finalGrade: 9.75,
    status: "LOCKED",
    pages: 4,
    correctionOrder: "FIRST",
  },
];

const seniorCorrectors = [
  "Prof. Malki Mimoun",
  "Dr. Malki Abdelhamid",
  "Prof. Kechar Mohamed",
  "Dr. Belfaci Younes",
];

// ─── Status pill ──────────────────────────────────────────────────────────────

const statusPill: Record<CopyStatus, { label: string; cls: string }> = {
  PENDING: {
    label: "Pending",
    cls: "bg-gray-100 text-gray-600 border border-gray-200",
  },
  GRADED_1: {
    label: "1 Grade",
    cls: "bg-blue-50 text-blue-700 border border-blue-200",
  },
  GRADED_BOTH: {
    label: "2 Grades",
    cls: "bg-purple-50 text-purple-700 border border-purple-200",
  },
  DISCREPANCY: {
    label: "Discrepancy",
    cls: "bg-red-50 text-red-700 border border-red-200",
  },
  LOCKED: {
    label: "Locked",
    cls: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  },
};

// ─── Third Corrector Modal ────────────────────────────────────────────────────

const ThirdCorrectorModal = ({
  copy,
  onClose,
  onConfirm,
}: {
  copy: Copy;
  onClose: () => void;
  onConfirm: (copyId: string, corrector: string) => void;
}) => {
  const [selected, setSelected] = useState("");
  const [priority, setPriority] = useState<"Normal" | "High" | "Urgent">(
    "Normal",
  );
  const [notify, setNotify] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);

  const diff =
    copy.grade1 !== null && copy.grade2 !== null
      ? Math.abs(copy.grade1 - copy.grade2).toFixed(2)
      : "—";

  const handleConfirm = () => {
    if (!selected) return;
    setConfirming(true);
    setTimeout(() => {
      setConfirming(false);
      setDone(true);
      setTimeout(() => {
        onConfirm(copy.id, selected);
        onClose();
      }, 1000);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        className="bg-white rounded-2xl w-full max-w-[420px] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-[#8B7355] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <UserPlus size={16} className="text-white/80" />
            <div>
              <h2 className="font-bold text-white text-sm leading-tight">
                Third Corrector Assignment
              </h2>
              <p className="text-white/60 text-[11px] mt-0.5">
                Resolution for Copy ID: {copy.code}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors p-0.5"
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
            {/* Grade diff alert */}
            <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2.5 flex items-center gap-2.5">
              <AlertTriangle size={14} className="text-red-500 shrink-0" />
              <p className="text-xs text-red-700">
                Grade difference of{" "}
                <span className="font-bold">{diff} pts</span> exceeds the 3.00
                pt threshold.
              </p>
            </div>

            {/* Both grades */}
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: "Corrector #1", val: copy.grade1 },
                { label: "Corrector #2", val: copy.grade2 },
              ].map(({ label, val }) => (
                <div
                  key={label}
                  className="bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-center"
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    {label}
                  </p>
                  <p className="text-xl font-bold text-gray-700 my-0.5">
                    {val?.toFixed(2)}
                  </p>
                  <p className="text-[10px] text-gray-400">Anonymous view</p>
                </div>
              ))}
            </div>

            {/* Select corrector */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
                Select Expert Corrector
              </label>
              <div className="relative">
                <select
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                  className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white pr-8 focus:outline-none focus:ring-2 focus:ring-[#8B7355]/25 focus:border-[#8B7355] transition-colors"
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
                <CheckCircle2 size={10} />
                Showing only 'Senior' clearance correctors for this subject.
              </p>
            </div>

            {/* Priority */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
                Priority Level
              </label>
              <div className="flex gap-2">
                {(["Normal", "High", "Urgent"] as const).map((p) => (
                  <button
                    key={p}
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

            {/* Notify toggle */}
            <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
              <div className="flex items-center gap-2.5">
                <Bell size={14} className="text-gray-400 shrink-0" />
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
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selected || confirming}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-all",
                selected && !confirming
                  ? "bg-[#8B7355] hover:bg-[#7a6449]"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed",
              )}
            >
              {confirming ? "Assigning..." : "Confirm Assignment"}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

// ─── Copy List Sidebar ────────────────────────────────────────────────────────

const CopyListSidebar = ({
  copies,
  activeId,
  onSelect,
}: {
  copies: Copy[];
  activeId: string;
  onSelect: (id: string) => void;
}) => (
  <div className="w-[220px] shrink-0 flex flex-col border-r border-border bg-black/[0.01]">
    <div className="p-3 border-b border-border">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
        Assigned Copies
      </p>
      <p className="text-xs text-muted mt-0.5">{copies.length} copies</p>
    </div>
    <div className="flex-1 overflow-y-auto">
      {copies.map((c) => {
        const pill = statusPill[c.status];
        const isActive = c.id === activeId;
        return (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={cn(
              "w-full text-left px-3 py-3 border-b border-border/50 transition-colors",
              isActive
                ? "bg-primary-accent/5 border-l-2 border-l-primary-accent"
                : "hover:bg-black/[0.02]",
            )}
          >
            <p
              className={cn(
                "text-xs font-mono font-bold",
                isActive ? "text-primary-accent" : "text-text-primary",
              )}
            >
              {c.code}
            </p>
            <p className="text-[10px] text-muted mt-0.5 truncate">
              {c.subject}
            </p>
            <span
              className={cn(
                "inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold",
                pill.cls,
              )}
            >
              {pill.label}
            </span>
          </button>
        );
      })}
    </div>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

export const CorrectionPage = () => {
  const [copies, setCopies] = useState<Copy[]>(mockCopies);
  const [activeId, setActiveId] = useState(mockCopies[0].id);
  const [currentPage, setCurrentPage] = useState(1);
  const [grade, setGrade] = useState("");
  const [comment, setComment] = useState("");
  const [savedMsg, setSavedMsg] = useState(false);
  const [showThirdModal, setShowThirdModal] = useState(false);
  const [zoom, setZoom] = useState(100);

  const copy = copies.find((c) => c.id === activeId)!;
  const isLocked = copy.status === "LOCKED";
  const hasDiscrepancy = copy.status === "DISCREPANCY";
  const myGrade = copy.correctionOrder === "FIRST" ? copy.grade1 : copy.grade2;

  // Switch copy → reset local state
  const handleSelect = (id: string) => {
    setActiveId(id);
    setCurrentPage(1);
    setGrade("");
    setComment("");
    setSavedMsg(false);
  };

  const handleSave = () => {
    const g = parseFloat(grade);
    if (isNaN(g) || g < 0 || g > 20) return;
    setCopies((prev) =>
      prev.map((c) => {
        if (c.id !== activeId) return c;
        const updated = { ...c };
        if (c.correctionOrder === "FIRST") {
          updated.grade1 = g;
          updated.status =
            c.grade2 !== null
              ? Math.abs(g - c.grade2) > 3
                ? "DISCREPANCY"
                : "GRADED_BOTH"
              : "GRADED_1";
        } else {
          updated.grade2 = g;
          updated.status =
            c.grade1 !== null
              ? Math.abs(g - c.grade1) > 3
                ? "DISCREPANCY"
                : "GRADED_BOTH"
              : "GRADED_1";
        }
        return updated;
      }),
    );
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  const handleThirdConfirm = (copyId: string, corrector: string) => {
    setCopies((prev) =>
      prev.map((c) =>
        c.id === copyId ? { ...c, thirdCorrector: corrector } : c,
      ),
    );
  };

  const gradeVal = parseFloat(grade);
  const gradeInvalid =
    grade !== "" && (isNaN(gradeVal) || gradeVal < 0 || gradeVal > 20);

  return (
    <AppShell title="Double-Blind Correction">
      <AnimatePresence>
        {showThirdModal && hasDiscrepancy && (
          <ThirdCorrectorModal
            copy={copy}
            onClose={() => setShowThirdModal(false)}
            onConfirm={handleThirdConfirm}
          />
        )}
      </AnimatePresence>

      {/* Saved toast */}
      <AnimatePresence>
        {savedMsg && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="fixed top-5 right-5 z-50 bg-emerald-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-semibold"
          >
            <CheckCircle2 size={16} /> Grade saved successfully!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main layout — h-full fills AppShell passthrough */}
      <div className="h-full flex flex-col">
        <div className="flex flex-1 min-h-0 border border-border rounded-xl overflow-hidden">
          {/* Copy List Sidebar */}
          <CopyListSidebar
            copies={copies}
            activeId={activeId}
            onSelect={handleSelect}
          />

          {/* Document Viewer */}
          <div className="flex-1 flex flex-col min-w-0 bg-black/[0.02]">
            {/* Viewer toolbar */}
            <div className="px-4 py-2.5 bg-white border-b border-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary-accent/10 text-primary-accent border border-primary-accent/20">
                  🔒 {copy.code}
                </span>
                <span className="text-xs text-muted">
                  Page {currentPage} of {copy.pages}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setZoom((z) => Math.max(60, z - 10))}
                  className="p-1.5 rounded-lg hover:bg-black/[0.05] text-muted transition-colors"
                >
                  <ZoomOut size={16} />
                </button>
                <span className="text-xs text-muted w-10 text-center">
                  {zoom}%
                </span>
                <button
                  onClick={() => setZoom((z) => Math.min(150, z + 10))}
                  className="p-1.5 rounded-lg hover:bg-black/[0.05] text-muted transition-colors"
                >
                  <ZoomIn size={16} />
                </button>
                <button className="p-1.5 rounded-lg hover:bg-black/[0.05] text-muted transition-colors">
                  <Maximize2 size={16} />
                </button>
              </div>
            </div>

            {/* Document area */}
            <div className="flex-1 overflow-auto p-6 flex justify-center items-start">
              <div
                className="bg-white shadow-xl rounded border border-border relative transition-all"
                style={{
                  width: `${zoom}%`,
                  maxWidth: 720,
                  aspectRatio: "1 / 1.414",
                  padding: "6%",
                }}
              >
                {/* Mock scan content */}
                <div className="space-y-5 opacity-40 select-none">
                  <div className="h-7 bg-black/[0.06] w-3/4 rounded" />
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-3.5 bg-black/[0.05] rounded"
                        style={{ width: i === 3 ? "70%" : "100%" }}
                      />
                    ))}
                  </div>
                  <div className="h-36 bg-black/[0.03] rounded border-2 border-dashed border-border flex items-center justify-center">
                    <p className="text-muted text-xs italic">
                      Handwritten response area
                    </p>
                  </div>
                  <div className="space-y-2">
                    {[1, 2].map((i) => (
                      <div
                        key={i}
                        className="h-3.5 bg-black/[0.05] rounded"
                        style={{ width: i === 2 ? "55%" : "100%" }}
                      />
                    ))}
                  </div>
                  <div className="h-28 bg-black/[0.03] rounded border-2 border-dashed border-border flex items-center justify-center">
                    <p className="text-muted text-xs italic">Response area 2</p>
                  </div>
                </div>
                {/* Confidential watermark */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <p className="text-5xl font-bold text-black/[0.04] -rotate-45 uppercase tracking-widest select-none">
                    Confidential
                  </p>
                </div>
              </div>
            </div>

            {/* Page navigation */}
            <div className="px-4 py-2.5 bg-white border-t border-border flex items-center justify-center gap-3 shrink-0">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted hover:bg-black/[0.03] disabled:opacity-40 transition-colors"
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: copy.pages }, (_, i) => i + 1).map(
                  (p) => (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={cn(
                        "w-7 h-7 rounded-lg text-xs font-bold transition-all",
                        p === currentPage
                          ? "bg-primary-accent text-white"
                          : "text-muted hover:bg-black/[0.05]",
                      )}
                    >
                      {p}
                    </button>
                  ),
                )}
              </div>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(copy.pages, p + 1))
                }
                disabled={currentPage === copy.pages}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted hover:bg-black/[0.03] disabled:opacity-40 transition-colors"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Right panel */}
          <div className="w-[300px] shrink-0 border-l border-border flex flex-col overflow-y-auto bg-white">
            {/* Discrepancy banner */}
            <AnimatePresence>
              {hasDiscrepancy && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-50 border-b border-red-200 px-4 py-3"
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle
                      size={15}
                      className="text-red-500 shrink-0 mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-red-700">
                        Grade Discrepancy
                      </p>
                      <p className="text-[11px] text-red-600 mt-0.5">
                        Δ{" "}
                        {copy.grade1 !== null && copy.grade2 !== null
                          ? Math.abs(copy.grade1 - copy.grade2).toFixed(2)
                          : "—"}{" "}
                        pts — exceeds 3.00 threshold
                      </p>
                    </div>
                    <button
                      onClick={() => setShowThirdModal(true)}
                      className="shrink-0 text-[11px] font-bold text-red-700 underline"
                    >
                      Assign 3rd
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Locked banner */}
            {isLocked && (
              <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-3 flex items-center gap-2">
                <Lock size={14} className="text-emerald-600" />
                <p className="text-xs font-bold text-emerald-700">
                  Grades locked — final:{" "}
                  <span className="font-mono">
                    {copy.finalGrade?.toFixed(2)}
                  </span>
                </p>
              </div>
            )}

            <div className="p-4 space-y-4 flex-1">
              {/* Subject info */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5">
                  Subject
                </p>
                <div className="p-3 bg-gray-50 rounded-xl border border-border">
                  <p className="text-sm font-semibold">{copy.subject}</p>
                  <p className="text-[11px] text-muted mt-0.5">
                    Max: 20.00 · Threshold: 10.00 · Δ limit: 3.00
                  </p>
                </div>
              </div>

              {/* Existing grades (if any) */}
              {(copy.grade1 !== null || copy.grade2 !== null) && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5">
                    Grades so far
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {copy.grade1 !== null && (
                      <div className="bg-gray-50 border border-border rounded-xl p-3 text-center">
                        <p className="text-[10px] text-muted">Grade 1</p>
                        <p className="text-xl font-bold text-text-primary mt-0.5">
                          {copy.grade1.toFixed(2)}
                        </p>
                      </div>
                    )}
                    {copy.grade2 !== null && (
                      <div className="bg-gray-50 border border-border rounded-xl p-3 text-center">
                        <p className="text-[10px] text-muted">Grade 2</p>
                        <p className="text-xl font-bold text-text-primary mt-0.5">
                          {copy.grade2.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                  {copy.finalGrade !== null && (
                    <div className="mt-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                        Final Grade
                      </p>
                      <p className="text-2xl font-bold text-emerald-700 mt-0.5">
                        {copy.finalGrade.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Grade input */}
              {!isLocked && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5">
                    Your Grade (
                    {copy.correctionOrder === "FIRST"
                      ? "1st"
                      : copy.correctionOrder === "SECOND"
                        ? "2nd"
                        : "3rd"}{" "}
                    correction)
                  </p>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      max="20"
                      placeholder="0.00"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className={cn(
                        "w-full border rounded-xl text-2xl font-bold text-center h-14 focus:outline-none transition-colors pr-12",
                        gradeInvalid
                          ? "border-red-300 bg-red-50 focus:ring-2 focus:ring-red-200"
                          : "border-border bg-white focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent",
                      )}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted font-bold text-sm">
                      / 20
                    </span>
                  </div>
                  {gradeInvalid && (
                    <p className="text-xs text-red-500 mt-1">
                      Must be between 0 and 20
                    </p>
                  )}
                  <p className="text-[11px] text-muted mt-1 italic">
                    0.25 precision (e.g. 14.75)
                  </p>
                </div>
              )}

              {/* Comment */}
              {!isLocked && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5">
                    Comments
                  </p>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value.slice(0, 300))}
                    placeholder="Optional justification..."
                    className="w-full border border-border rounded-xl p-3 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent"
                    rows={3}
                  />
                  <p className="text-right text-[10px] text-muted">
                    {comment.length}/300
                  </p>
                </div>
              )}

              {/* Save button */}
              {!isLocked && (
                <button
                  onClick={handleSave}
                  disabled={!grade || gradeInvalid}
                  className={cn(
                    "w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all",
                    grade && !gradeInvalid
                      ? "bg-primary-accent text-white hover:opacity-90"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed",
                  )}
                >
                  <Save size={16} /> Save Grade
                </button>
              )}

              {/* Assign 3rd corrector button */}
              {hasDiscrepancy && !copy.thirdCorrector && (
                <button
                  onClick={() => setShowThirdModal(true)}
                  className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border-2 border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                >
                  <UserPlus size={16} /> Assign 3rd Corrector
                </button>
              )}

              {copy.thirdCorrector && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-amber-600" />
                  <p className="text-xs text-amber-700">
                    <span className="font-bold">3rd Corrector:</span>{" "}
                    {copy.thirdCorrector}
                  </p>
                </div>
              )}
            </div>

            {/* Grading guidance */}
            <div className="border-t border-border p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-2 flex items-center gap-1.5">
                <AlertCircle size={11} /> Grading Guidance
              </p>
              <ul className="space-y-1.5">
                {[
                  "Double-check the anonymous code matches the physical copy.",
                  "Ensure all pages are legible before submitting.",
                  "Δ > 3.00 pts triggers a 3rd correction automatically.",
                  "Grades are immutable once the Coordinator locks the subject.",
                ].map((tip, i) => (
                  <li key={i} className="text-[11px] text-muted flex gap-1.5">
                    <span className="text-primary-accent font-bold shrink-0">
                      ·
                    </span>{" "}
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
      {/* end h-full wrapper */}
    </AppShell>
  );
};
