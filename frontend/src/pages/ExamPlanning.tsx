import React, { useState } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Shuffle,
  Lock,
  Unlock,
  X,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Check,
  Hash,
  Users,
  BookOpen,
  Timer,
  Building2,
} from "lucide-react";
import { AppShell } from "../components/AppShell";
import { Card } from "../components/UI";
import { cn } from "../constants";
import { motion, AnimatePresence } from "motion/react";

type Exam = {
  id: string;
  subject: string;
  date: string;
  time: string;
  duration: string;
  rooms: string[];
  status: string;
  coefficient: number;
};
type Room = { id: string; name: string; capacity: number; building: string };

const INIT_EXAMS: Exam[] = [
  {
    id: "1",
    subject: "Mathematics & Logic",
    date: "2026-03-10",
    time: "09:00",
    duration: "3h",
    rooms: ["A101", "A102"],
    status: "SCHEDULED",
    coefficient: 3,
  },
  {
    id: "2",
    subject: "English Proficiency",
    date: "2026-03-10",
    time: "14:00",
    duration: "2h",
    rooms: ["B204"],
    status: "ACTIVE",
    coefficient: 2,
  },
  {
    id: "3",
    subject: "Specialty: Computer Science",
    date: "2026-03-11",
    time: "09:00",
    duration: "3h",
    rooms: ["C301", "C302"],
    status: "DRAFT",
    coefficient: 4,
  },
  {
    id: "4",
    subject: "General Knowledge",
    date: "2026-03-12",
    time: "09:00",
    duration: "2h",
    rooms: ["A101"],
    status: "LOCKED",
    coefficient: 1,
  },
];
const INIT_ROOMS: Room[] = [
  { id: "r1", name: "A101", capacity: 53, building: "Block A" },
  { id: "r2", name: "A102", capacity: 75, building: "Block A" },
  { id: "r3", name: "B204", capacity: 76, building: "Block B" },
  { id: "r4", name: "C301", capacity: 56, building: "Block C" },
  { id: "r5", name: "C302", capacity: 49, building: "Block C" },
];
const SUBJECTS = [
  "Mathematics & Logic",
  "English Proficiency",
  "Specialty: Computer Science",
  "General Knowledge",
  "Physics",
  "Chemistry",
  "Biology",
];
const DURATIONS = ["1h", "1h30", "2h", "2h30", "3h", "3h30", "4h"];
const BUILDINGS = ["Block A", "Block B", "Block C", "Block D"];
const STATUS_KEYS = ["SCHEDULED", "ACTIVE", "DRAFT", "LOCKED"];

const statusStyle: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-600",
  SCHEDULED: "bg-[#F0EDE7] text-[#8B7355]",
  DRAFT: "bg-gray-100 text-gray-500",
  LOCKED: "bg-amber-50 text-amber-600",
};
const statusLabel: Record<string, string> = {
  ACTIVE: "Active",
  SCHEDULED: "Scheduled",
  DRAFT: "Draft",
  LOCKED: "Locked",
};
const blankExam = {
  subject: SUBJECTS[0],
  date: "",
  time: "09:00",
  duration: "2h",
  rooms: [] as string[],
  status: "SCHEDULED",
  coefficient: 1,
};
const blankRoom = { name: "", capacity: 30, building: BUILDINGS[0] };

export const ExamPlanningPage = () => {
  const [exams, setExams] = useState<Exam[]>(INIT_EXAMS);
  const [rooms, setRooms] = useState<Room[]>(INIT_ROOMS);

  const [showLottery, setShowLottery] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [lotterySpinning, setLotterySpinning] = useState(false);
  const [progress, setProgress] = useState(0);

  const [showCreateExam, setShowCreateExam] = useState(false);
  const [examStep, setExamStep] = useState<1 | 2>(1);
  const [examDone, setExamDone] = useState(false);
  const [examForm, setExamForm] = useState({ ...blankExam });

  const [showAddRoom, setShowAddRoom] = useState(false);
  const [roomStep, setRoomStep] = useState<1 | 2>(1);
  const [roomDone, setRoomDone] = useState(false);
  const [roomForm, setRoomForm] = useState({ ...blankRoom });

  const [editExam, setEditExam] = useState<Exam | null>(null);
  const [editForm, setEditForm] = useState<Partial<Exam>>({});
  const [deleteExam, setDeleteExam] = useState<Exam | null>(null);

  // ── Lottery ──────────────────────────────────────────────────────────────
  const handleLottery = () => {
    setLotterySpinning(true);
    setSelectedVersion(null);
    setProgress(0);
    const start = Date.now(),
      dur = 2200;
    const tick = () => {
      const e = Date.now() - start;
      setProgress(Math.min((e / dur) * 100, 100));
      if (e < dur) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    setTimeout(() => {
      setSelectedVersion(["A", "B", "C"][Math.floor(Math.random() * 3)]);
      setLotterySpinning(false);
      setProgress(100);
    }, dur);
  };

  // ── Create Exam ───────────────────────────────────────────────────────────
  const openCreateExam = () => {
    setExamForm({ ...blankExam });
    setExamStep(1);
    setExamDone(false);
    setShowCreateExam(true);
  };
  const toggleRoomInForm = (r: string) =>
    setExamForm((p) => ({
      ...p,
      rooms: p.rooms.includes(r)
        ? p.rooms.filter((x) => x !== r)
        : [...p.rooms, r],
    }));
  const submitExam = () => {
    if (examStep === 1) {
      setExamStep(2);
      return;
    }
    setExams((p) => [
      ...p,
      {
        id: String(p.length + 1),
        subject: examForm.subject,
        date: examForm.date,
        time: examForm.time,
        duration: examForm.duration,
        rooms: examForm.rooms,
        status: examForm.status,
        coefficient: examForm.coefficient,
      },
    ]);
    setExamDone(true);
  };

  // ── Add Room ──────────────────────────────────────────────────────────────
  const openAddRoom = () => {
    setRoomForm({ ...blankRoom });
    setRoomStep(1);
    setRoomDone(false);
    setShowAddRoom(true);
  };
  const submitRoom = () => {
    if (roomStep === 1) {
      setRoomStep(2);
      return;
    }
    setRooms((p) => [
      ...p,
      {
        id: `r${p.length + 1}`,
        name: roomForm.name.toUpperCase(),
        capacity: roomForm.capacity,
        building: roomForm.building,
      },
    ]);
    setRoomDone(true);
  };

  // ── Edit / Lock / Delete ──────────────────────────────────────────────────
  const saveEditExam = () => {
    if (!editExam) return;
    setExams((p) =>
      p.map((e) => (e.id === editExam.id ? { ...e, ...editForm } : e)),
    );
    setEditExam(null);
  };
  const toggleLock = (id: string) =>
    setExams((p) =>
      p.map((e) =>
        e.id === id
          ? { ...e, status: e.status === "LOCKED" ? "SCHEDULED" : "LOCKED" }
          : e,
      ),
    );
  const confirmDelete = () => {
    if (deleteExam) setExams((p) => p.filter((e) => e.id !== deleteExam.id));
    setDeleteExam(null);
  };

  return (
    <AppShell title="Exam Planning">
      {/* ── HEIGHT CHAIN ── */}
      <div className="h-full flex flex-col gap-4">
        {/* Top bar — shrink-0 */}
        <div className="flex items-center justify-between shrink-0">
          <p className="text-sm text-[#6B6B6B]">
            Manage exam schedules, assign rooms, and configure subjects for the
            current session.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setShowLottery(true);
                setSelectedVersion(null);
                setProgress(0);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#EBEBEB] bg-white text-[13px] font-semibold text-[#555] hover:border-[#8B7355] hover:text-[#8B7355] transition-all"
            >
              <Shuffle size={15} /> Subject Lottery
            </button>
            <button
              onClick={openCreateExam}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#8B7355] text-white text-[13px] font-bold hover:bg-[#7a6348] transition-all shadow-sm"
            >
              <Plus size={15} /> Create Exam
            </button>
          </div>
        </div>

        {/* Main grid — flex-1 min-h-0 fills all remaining space */}
        <div className="grid grid-cols-3 gap-5 flex-1 min-h-0">
          {/* Exam table */}
          <div className="col-span-2 flex flex-col min-h-0">
            <Card className="p-0 flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F0F0] shrink-0 bg-black/[0.01]">
                <h3 className="font-bold text-[15px] text-[#1A1A1A] flex items-center gap-2">
                  <Calendar size={18} className="text-[#8B7355]" /> Exam
                  Schedule
                </h3>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#F0EDE7] text-[#8B7355]">
                  {exams.length} Exams
                </span>
              </div>
              <div className="grid grid-cols-[2fr_2fr_1fr_1.5fr_1fr_1fr] px-6 py-2.5 bg-[#FAFAFA] border-b border-[#F0F0F0] shrink-0">
                {[
                  "Subject",
                  "Date & Time",
                  "Duration",
                  "Rooms",
                  "Status",
                  "Actions",
                ].map((col) => (
                  <span
                    key={col}
                    className="text-[11px] font-semibold uppercase tracking-wider text-[#9B9B9B]"
                  >
                    {col}
                  </span>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-[#F5F5F5]">
                {exams.map((exam) => (
                  <div
                    key={exam.id}
                    className="grid grid-cols-[2fr_2fr_1fr_1.5fr_1fr_1fr] items-center px-6 py-3.5 hover:bg-[#FAFAFA] transition-colors group"
                  >
                    <div>
                      <p className="text-[13px] font-bold text-[#1A1A1A] leading-tight">
                        {exam.subject}
                      </p>
                      <p className="text-[11px] text-[#9B9B9B] mt-0.5">
                        Coefficient: {exam.coefficient}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[12px] text-[#555] flex items-center gap-1.5">
                        <Calendar size={12} className="text-[#9B9B9B]" />
                        {exam.date}
                      </span>
                      <span className="text-[12px] text-[#555] flex items-center gap-1.5">
                        <Clock size={12} className="text-[#9B9B9B]" />
                        {exam.time}
                      </span>
                    </div>
                    <span className="text-[13px] text-[#555]">
                      {exam.duration}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {exam.rooms.map((r) => (
                        <span
                          key={r}
                          className="px-2 py-0.5 bg-[#F5F5F5] rounded text-[11px] font-semibold border border-[#EBEBEB] text-[#555]"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                    <span
                      className={cn(
                        "text-[11px] font-bold px-2.5 py-1 rounded-md w-fit",
                        statusStyle[exam.status],
                      )}
                    >
                      {statusLabel[exam.status]}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setEditExam(exam);
                          setEditForm({
                            subject: exam.subject,
                            date: exam.date,
                            time: exam.time,
                            duration: exam.duration,
                            coefficient: exam.coefficient,
                            status: exam.status,
                          });
                        }}
                        className="p-1.5 rounded hover:bg-[#F0EDE7] text-[#9B9B9B] hover:text-[#8B7355] transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => toggleLock(exam.id)}
                        className="p-1.5 rounded hover:bg-[#F0EDE7] text-[#9B9B9B] hover:text-[#8B7355] transition-colors"
                      >
                        {exam.status === "LOCKED" ? (
                          <Unlock size={14} />
                        ) : (
                          <Lock size={14} />
                        )}
                      </button>
                      <button
                        onClick={() => setDeleteExam(exam)}
                        className="p-1.5 rounded hover:bg-red-50 text-[#9B9B9B] hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-5 min-h-0">
            <Card className="p-5 flex flex-col flex-1 min-h-0 overflow-hidden">
              <h3 className="font-bold text-[15px] text-[#1A1A1A] flex items-center gap-2 mb-4 shrink-0">
                <MapPin size={16} className="text-[#8B7355]" /> Room Assignment
              </h3>
              <div className="flex-1 overflow-y-auto space-y-2">
                {rooms.map((room) => {
                  const assigned = exams.some((e) =>
                    e.rooms.includes(room.name),
                  );
                  return (
                    <div
                      key={room.id}
                      className={cn(
                        "p-3 rounded-lg border flex items-center justify-between",
                        assigned
                          ? "bg-[#F0EDE7]/40 border-[#8B7355]/20"
                          : "bg-white border-[#EBEBEB]",
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={cn(
                            "w-7 h-7 rounded flex items-center justify-center",
                            assigned
                              ? "bg-[#8B7355]/10 text-[#8B7355]"
                              : "bg-[#F5F5F5] text-[#9B9B9B]",
                          )}
                        >
                          <MapPin size={14} />
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-[#1A1A1A]">
                            {room.name}
                          </p>
                          <p className="text-[11px] text-[#9B9B9B]">
                            Capacity: {room.capacity}
                          </p>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "text-[11px] font-bold px-2.5 py-1 rounded-md",
                          assigned
                            ? "bg-[#F0EDE7] text-[#8B7355]"
                            : "bg-gray-100 text-gray-500",
                        )}
                      >
                        {assigned ? "Assigned" : "Available"}
                      </span>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={openAddRoom}
                className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-[#CACACA] text-[13px] text-[#9B9B9B] hover:border-[#8B7355] hover:text-[#8B7355] transition-colors shrink-0"
              >
                <Plus size={14} /> Add Room
              </button>
            </Card>

            <Card className="p-5 bg-[#FAFAFA] shrink-0">
              <h4 className="text-[13px] font-bold text-[#1A1A1A] flex items-center gap-2 mb-3">
                <AlertCircle size={14} className="text-[#8B7355]" /> Planning
                Notes
              </h4>
              <ul className="space-y-2">
                {[
                  "Ensure no room conflicts across concurrent exams.",
                  "Lock subjects once supervisors are assigned.",
                  "Subject lottery results are immutable and audited.",
                ].map((note, i) => (
                  <li key={i} className="text-[12px] text-[#6B6B6B] flex gap-2">
                    <span className="text-[#8B7355] font-bold">•</span>
                    {note}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </div>

      {/* ── LOTTERY MODAL ── */}
      <AnimatePresence>
        {showLottery && (
          <Overlay onClose={() => !lotterySpinning && setShowLottery(false)}>
            <ModalBox width={520}>
              {!lotterySpinning && (
                <button
                  onClick={() => setShowLottery(false)}
                  className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[#F5F5F5] text-[#9B9B9B] transition-colors"
                >
                  <X size={18} />
                </button>
              )}
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-2xl bg-[#F0EDE7] flex items-center justify-center">
                  <Sparkles size={28} className="text-[#8B7355]" />
                </div>
              </div>
              <h3 className="text-[20px] font-bold text-center text-[#1A1A1A] mb-2">
                Subject Selection Lottery
              </h3>
              <p className="text-[13px] text-[#6B6B6B] text-center mb-8 leading-relaxed">
                The system is randomly selecting the official exam version from
                the validated bank. This action is{" "}
                <span className="font-semibold text-[#1A1A1A]">
                  audited and final.
                </span>
              </p>
              <div className="flex items-center justify-center gap-4 mb-8">
                {["A", "B", "C"].map((version) => {
                  const isSelected = selectedVersion === version,
                    isOther = selectedVersion !== null && !isSelected;
                  return (
                    <motion.div
                      key={version}
                      animate={
                        lotterySpinning
                          ? { scale: [1, 1.08, 1], opacity: [0.4, 1, 0.4] }
                          : {}
                      }
                      transition={{
                        repeat: lotterySpinning ? Infinity : 0,
                        duration: 0.7,
                        delay: ["A", "B", "C"].indexOf(version) * 0.18,
                      }}
                      className={cn(
                        "relative flex flex-col items-center justify-center w-[130px] h-[120px] rounded-xl border-2 transition-all duration-300",
                        isSelected &&
                          "bg-[#8B7355] border-[#8B7355] scale-110 shadow-xl",
                        isOther && "bg-[#FAFAFA] border-[#EBEBEB] opacity-50",
                        !isSelected && !isOther && "bg-white border-[#EBEBEB]",
                      )}
                    >
                      {isSelected && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#8B7355] text-white text-[9px] font-bold tracking-widest px-2.5 py-0.5 rounded-full whitespace-nowrap border-2 border-white"
                        >
                          OFFICIAL PICK
                        </motion.div>
                      )}
                      {isSelected ? (
                        <CheckCircle2 size={28} className="text-white mb-1" />
                      ) : (
                        <span
                          className={cn(
                            "text-[32px] font-black mb-1",
                            isOther ? "text-[#CACACA]" : "text-[#1A1A1A]",
                          )}
                        >
                          {version}
                        </span>
                      )}
                      <span
                        className={cn(
                          "text-[11px] font-bold",
                          isSelected ? "text-white" : "text-[#9B9B9B]",
                        )}
                      >
                        Version {version}
                      </span>
                      {!lotterySpinning && (
                        <span
                          className={cn(
                            "text-[10px] mt-0.5",
                            isSelected ? "text-white/70" : "text-[#CACACA]",
                          )}
                        >
                          VALIDATED 06/12
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
              <div className="h-1 w-full bg-[#F0F0F0] rounded-full mb-3 overflow-hidden">
                <motion.div
                  className="h-full bg-[#8B7355] rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {lotterySpinning && (
                <p className="text-center text-[11px] font-semibold tracking-widest text-[#9B9B9B] uppercase mb-4">
                  Generating cryptographic proof…
                </p>
              )}
              {selectedVersion && !lotterySpinning && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-[12px] font-semibold text-emerald-600 mb-4"
                >
                  ✓ Version {selectedVersion} has been selected and recorded in
                  the audit trail.
                </motion.p>
              )}
              <button
                onClick={handleLottery}
                disabled={lotterySpinning}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#8B7355] text-white text-[13px] font-bold hover:bg-[#7a6348] disabled:opacity-60 transition-all"
              >
                <Shuffle
                  size={15}
                  className={lotterySpinning ? "animate-spin" : ""}
                />
                {lotterySpinning
                  ? "Drawing…"
                  : selectedVersion
                    ? "Draw Again"
                    : "Draw Version"}
              </button>
            </ModalBox>
          </Overlay>
        )}
      </AnimatePresence>

      {/* ── CREATE EXAM MODAL ── */}
      <AnimatePresence>
        {showCreateExam && (
          <Overlay onClose={() => !examDone && setShowCreateExam(false)}>
            <ModalBox width={520}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-xl bg-[#F0EDE7] flex items-center justify-center text-[#8B7355]">
                  {examDone ? (
                    <CheckCircle2 size={22} />
                  ) : (
                    <BookOpen size={22} />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-[16px] font-bold text-[#1A1A1A]">
                    {examDone
                      ? "Exam Created!"
                      : examStep === 1
                        ? "New Exam"
                        : "Review & Confirm"}
                  </h3>
                  <p className="text-[11px] text-[#9B9B9B]">
                    {examDone ? "Added to schedule." : `Step ${examStep} of 2`}
                  </p>
                </div>
                {!examDone && (
                  <>
                    <div className="flex items-center gap-1.5">
                      {[1, 2].map((s) => (
                        <div
                          key={s}
                          className={cn(
                            "h-2 rounded-full transition-all",
                            examStep === s
                              ? "bg-[#8B7355] w-5"
                              : "bg-[#EBEBEB] w-2",
                          )}
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => setShowCreateExam(false)}
                      className="p-1.5 rounded-full hover:bg-[#F5F5F5] text-[#9B9B9B] transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </>
                )}
              </div>
              <AnimatePresence mode="wait">
                {!examDone && examStep === 1 && (
                  <motion.div
                    key="ex1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <MField label="Subject" icon={<BookOpen size={12} />}>
                      <select
                        value={examForm.subject}
                        onChange={(e) =>
                          setExamForm((p) => ({
                            ...p,
                            subject: e.target.value,
                          }))
                        }
                        className="fi"
                      >
                        {SUBJECTS.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </MField>
                    <div className="grid grid-cols-2 gap-3">
                      <MField label="Date" icon={<Calendar size={12} />}>
                        <input
                          type="date"
                          value={examForm.date}
                          onChange={(e) =>
                            setExamForm((p) => ({ ...p, date: e.target.value }))
                          }
                          className="fi"
                        />
                      </MField>
                      <MField label="Time" icon={<Clock size={12} />}>
                        <input
                          type="time"
                          value={examForm.time}
                          onChange={(e) =>
                            setExamForm((p) => ({ ...p, time: e.target.value }))
                          }
                          className="fi"
                        />
                      </MField>
                      <MField label="Duration" icon={<Timer size={12} />}>
                        <select
                          value={examForm.duration}
                          onChange={(e) =>
                            setExamForm((p) => ({
                              ...p,
                              duration: e.target.value,
                            }))
                          }
                          className="fi"
                        >
                          {DURATIONS.map((d) => (
                            <option key={d}>{d}</option>
                          ))}
                        </select>
                      </MField>
                      <MField label="Coefficient" icon={<Hash size={12} />}>
                        <input
                          type="number"
                          value={examForm.coefficient}
                          onChange={(e) =>
                            setExamForm((p) => ({
                              ...p,
                              coefficient: Number(e.target.value),
                            }))
                          }
                          min={1}
                          max={10}
                          className="fi"
                        />
                      </MField>
                    </div>
                    <MField label="Assign Rooms" icon={<MapPin size={12} />}>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {rooms.map((r) => (
                          <button
                            key={r.id}
                            onClick={() => toggleRoomInForm(r.name)}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-[12px] font-bold border transition-all",
                              examForm.rooms.includes(r.name)
                                ? "bg-[#8B7355] text-white border-[#8B7355]"
                                : "bg-white border-[#EBEBEB] text-[#555] hover:border-[#8B7355]",
                            )}
                          >
                            {r.name}{" "}
                            <span className="opacity-60 font-normal">
                              ({r.capacity})
                            </span>
                          </button>
                        ))}
                      </div>
                    </MField>
                    <button
                      onClick={submitExam}
                      disabled={!examForm.date || examForm.rooms.length === 0}
                      className="w-full py-2.5 rounded-lg bg-[#8B7355] text-white text-[13px] font-bold hover:bg-[#7a6348] disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center gap-2 mt-2"
                    >
                      Review <ChevronRight size={14} />
                    </button>
                  </motion.div>
                )}
                {!examDone && examStep === 2 && (
                  <motion.div
                    key="ex2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="p-4 bg-[#FAFAFA] rounded-xl border border-[#F0F0F0] space-y-3">
                      {[
                        ["Subject", examForm.subject],
                        ["Date", examForm.date],
                        ["Time", examForm.time],
                        ["Duration", examForm.duration],
                        ["Coefficient", String(examForm.coefficient)],
                        ["Rooms", examForm.rooms.join(", ") || "—"],
                      ].map(([label, val]) => (
                        <div
                          key={label}
                          className="flex items-center justify-between"
                        >
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9B9B9B]">
                            {label}
                          </span>
                          <span className="text-[13px] font-semibold text-[#1A1A1A]">
                            {val}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setExamStep(1)}
                        className="flex-1 py-2.5 rounded-lg border border-[#EBEBEB] text-[#555] text-[13px] font-semibold hover:bg-[#F5F5F5] transition-all flex items-center justify-center gap-1.5"
                      >
                        <ChevronLeft size={13} />
                        Back
                      </button>
                      <button
                        onClick={submitExam}
                        className="flex-1 py-2.5 rounded-lg bg-[#8B7355] text-white text-[13px] font-bold hover:bg-[#7a6348] transition-all flex items-center justify-center gap-2"
                      >
                        <Check size={14} />
                        Confirm & Create
                      </button>
                    </div>
                  </motion.div>
                )}
                {examDone && (
                  <motion.div
                    key="exdone"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center text-center py-2 gap-4"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
                      <CheckCircle2 size={32} className="text-emerald-500" />
                    </div>
                    <div>
                      <h4 className="text-[16px] font-bold text-[#1A1A1A] mb-1">
                        "{examForm.subject}" added!
                      </h4>
                      <p className="text-[12px] text-[#9B9B9B]">
                        Connect backend to persist.
                      </p>
                    </div>
                    <div className="flex gap-2 w-full">
                      <button
                        onClick={() => {
                          setExamForm({ ...blankExam });
                          setExamStep(1);
                          setExamDone(false);
                        }}
                        className="flex-1 py-2.5 rounded-lg bg-[#F0EDE7] text-[#8B7355] text-[13px] font-bold hover:bg-[#8B7355] hover:text-white transition-all"
                      >
                        Add Another
                      </button>
                      <button
                        onClick={() => setShowCreateExam(false)}
                        className="flex-1 py-2.5 rounded-lg border border-[#EBEBEB] text-[#555] text-[13px] font-semibold hover:bg-[#F5F5F5] transition-all"
                      >
                        Done
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </ModalBox>
          </Overlay>
        )}
      </AnimatePresence>

      {/* ── ADD ROOM MODAL ── */}
      <AnimatePresence>
        {showAddRoom && (
          <Overlay onClose={() => !roomDone && setShowAddRoom(false)}>
            <ModalBox width={420}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-xl bg-[#F0EDE7] flex items-center justify-center text-[#8B7355]">
                  {roomDone ? (
                    <CheckCircle2 size={22} />
                  ) : (
                    <Building2 size={22} />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-[16px] font-bold text-[#1A1A1A]">
                    {roomDone
                      ? "Room Added!"
                      : roomStep === 1
                        ? "Add New Room"
                        : "Review Room"}
                  </h3>
                  <p className="text-[11px] text-[#9B9B9B]">
                    {roomDone
                      ? "Now available for assignment."
                      : `Step ${roomStep} of 2`}
                  </p>
                </div>
                {!roomDone && (
                  <>
                    <div className="flex items-center gap-1.5">
                      {[1, 2].map((s) => (
                        <div
                          key={s}
                          className={cn(
                            "h-2 rounded-full transition-all",
                            roomStep === s
                              ? "bg-[#8B7355] w-5"
                              : "bg-[#EBEBEB] w-2",
                          )}
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => setShowAddRoom(false)}
                      className="p-1.5 rounded-full hover:bg-[#F5F5F5] text-[#9B9B9B] transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </>
                )}
              </div>
              <AnimatePresence mode="wait">
                {!roomDone && roomStep === 1 && (
                  <motion.div
                    key="rm1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-3"
                  >
                    <MField label="Room Code" icon={<Hash size={12} />}>
                      <input
                        value={roomForm.name}
                        onChange={(e) =>
                          setRoomForm((p) => ({ ...p, name: e.target.value }))
                        }
                        placeholder="e.g. D201"
                        className="fi"
                      />
                    </MField>
                    <MField label="Capacity" icon={<Users size={12} />}>
                      <input
                        type="number"
                        min={1}
                        value={roomForm.capacity}
                        onChange={(e) =>
                          setRoomForm((p) => ({
                            ...p,
                            capacity: Number(e.target.value),
                          }))
                        }
                        className="fi"
                      />
                    </MField>
                    <MField label="Building" icon={<Building2 size={12} />}>
                      <select
                        value={roomForm.building}
                        onChange={(e) =>
                          setRoomForm((p) => ({
                            ...p,
                            building: e.target.value,
                          }))
                        }
                        className="fi"
                      >
                        {BUILDINGS.map((b) => (
                          <option key={b}>{b}</option>
                        ))}
                      </select>
                    </MField>
                    <button
                      onClick={submitRoom}
                      disabled={!roomForm.name}
                      className="w-full py-2.5 rounded-lg bg-[#8B7355] text-white text-[13px] font-bold hover:bg-[#7a6348] disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center gap-2 mt-2"
                    >
                      Review <ChevronRight size={14} />
                    </button>
                  </motion.div>
                )}
                {!roomDone && roomStep === 2 && (
                  <motion.div
                    key="rm2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="p-4 bg-[#FAFAFA] rounded-xl border border-[#F0F0F0] space-y-3">
                      {[
                        ["Room Code", roomForm.name.toUpperCase()],
                        ["Capacity", String(roomForm.capacity)],
                        ["Building", roomForm.building],
                      ].map(([label, val]) => (
                        <div
                          key={label}
                          className="flex items-center justify-between"
                        >
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9B9B9B]">
                            {label}
                          </span>
                          <span className="text-[13px] font-semibold text-[#1A1A1A]">
                            {val}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setRoomStep(1)}
                        className="flex-1 py-2.5 rounded-lg border border-[#EBEBEB] text-[#555] text-[13px] font-semibold hover:bg-[#F5F5F5] transition-all flex items-center justify-center gap-1.5"
                      >
                        <ChevronLeft size={13} />
                        Back
                      </button>
                      <button
                        onClick={submitRoom}
                        className="flex-1 py-2.5 rounded-lg bg-[#8B7355] text-white text-[13px] font-bold hover:bg-[#7a6348] transition-all flex items-center justify-center gap-2"
                      >
                        <Check size={14} />
                        Add Room
                      </button>
                    </div>
                  </motion.div>
                )}
                {roomDone && (
                  <motion.div
                    key="rmdone"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center text-center py-2 gap-4"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
                      <CheckCircle2 size={32} className="text-emerald-500" />
                    </div>
                    <div>
                      <h4 className="text-[16px] font-bold text-[#1A1A1A] mb-1">
                        Room "{roomForm.name.toUpperCase()}" added!
                      </h4>
                      <p className="text-[12px] text-[#9B9B9B]">
                        Now available for exam assignment.
                      </p>
                    </div>
                    <div className="flex gap-2 w-full">
                      <button
                        onClick={() => {
                          setRoomForm({ ...blankRoom });
                          setRoomStep(1);
                          setRoomDone(false);
                        }}
                        className="flex-1 py-2.5 rounded-lg bg-[#F0EDE7] text-[#8B7355] text-[13px] font-bold hover:bg-[#8B7355] hover:text-white transition-all"
                      >
                        Add Another
                      </button>
                      <button
                        onClick={() => setShowAddRoom(false)}
                        className="flex-1 py-2.5 rounded-lg border border-[#EBEBEB] text-[#555] text-[13px] font-semibold hover:bg-[#F5F5F5] transition-all"
                      >
                        Done
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </ModalBox>
          </Overlay>
        )}
      </AnimatePresence>

      {/* ── EDIT EXAM MODAL ── */}
      <AnimatePresence>
        {editExam && (
          <Overlay onClose={() => setEditExam(null)}>
            <ModalBox width={460}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-[#F0EDE7] flex items-center justify-center text-[#8B7355]">
                  <Edit2 size={18} />
                </div>
                <h3 className="text-[15px] font-bold text-[#1A1A1A] flex-1">
                  Edit Exam
                </h3>
                <button
                  onClick={() => setEditExam(null)}
                  className="p-1.5 rounded-full hover:bg-[#F5F5F5] text-[#9B9B9B] transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-3">
                <MField label="Subject" icon={<BookOpen size={12} />}>
                  <select
                    value={editForm.subject || ""}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, subject: e.target.value }))
                    }
                    className="fi"
                  >
                    {SUBJECTS.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </MField>
                <div className="grid grid-cols-2 gap-3">
                  <MField label="Date" icon={<Calendar size={12} />}>
                    <input
                      type="date"
                      value={editForm.date || ""}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, date: e.target.value }))
                      }
                      className="fi"
                    />
                  </MField>
                  <MField label="Time" icon={<Clock size={12} />}>
                    <input
                      type="time"
                      value={editForm.time || ""}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, time: e.target.value }))
                      }
                      className="fi"
                    />
                  </MField>
                  <MField label="Duration" icon={<Timer size={12} />}>
                    <select
                      value={editForm.duration || ""}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, duration: e.target.value }))
                      }
                      className="fi"
                    >
                      {DURATIONS.map((d) => (
                        <option key={d}>{d}</option>
                      ))}
                    </select>
                  </MField>
                  <MField label="Coefficient" icon={<Hash size={12} />}>
                    <input
                      type="number"
                      value={editForm.coefficient || 1}
                      onChange={(e) =>
                        setEditForm((p) => ({
                          ...p,
                          coefficient: Number(e.target.value),
                        }))
                      }
                      min={1}
                      max={10}
                      className="fi"
                    />
                  </MField>
                </div>
                <MField label="Status" icon={<CheckCircle2 size={12} />}>
                  <select
                    value={editForm.status || ""}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, status: e.target.value }))
                    }
                    className="fi"
                  >
                    {STATUS_KEYS.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </MField>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={saveEditExam}
                    className="flex-1 py-2.5 rounded-lg bg-[#8B7355] text-white text-[13px] font-bold hover:bg-[#7a6348] transition-all flex items-center justify-center gap-2"
                  >
                    <Check size={14} />
                    Save Changes
                  </button>
                  <button
                    onClick={() => setEditExam(null)}
                    className="flex-1 py-2.5 rounded-lg border border-[#EBEBEB] text-[#555] text-[13px] font-semibold hover:bg-[#F5F5F5] transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </ModalBox>
          </Overlay>
        )}
      </AnimatePresence>

      {/* ── DELETE CONFIRM ── */}
      <AnimatePresence>
        {deleteExam && (
          <Overlay onClose={() => setDeleteExam(null)}>
            <ModalBox width={400}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
                  <Trash2 size={18} />
                </div>
                <h3 className="text-[15px] font-bold text-[#1A1A1A] flex-1">
                  Delete Exam
                </h3>
                <button
                  onClick={() => setDeleteExam(null)}
                  className="p-1.5 rounded-full hover:bg-[#F5F5F5] text-[#9B9B9B] transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              <p className="text-[13px] text-[#555] mb-3">
                Delete{" "}
                <span className="font-bold text-[#1A1A1A]">
                  "{deleteExam.subject}"
                </span>
                ? This cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-2.5 rounded-lg bg-red-500 text-white text-[13px] font-bold hover:bg-red-600 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
                <button
                  onClick={() => setDeleteExam(null)}
                  className="flex-1 py-2.5 rounded-lg border border-[#EBEBEB] text-[#555] text-[13px] font-semibold hover:bg-[#F5F5F5] transition-all"
                >
                  Cancel
                </button>
              </div>
            </ModalBox>
          </Overlay>
        )}
      </AnimatePresence>

      <style>{`.fi{width:100%;padding:8px 12px;font-size:13px;border:1px solid #EBEBEB;border-radius:8px;outline:none;background:white;transition:all .15s}.fi:focus{border-color:#8B7355;box-shadow:0 0 0 3px rgba(139,115,85,.12)}`}</style>
    </AppShell>
  );
};

// ── Shared primitives ─────────────────────────────────────────────────────────
const Overlay = ({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
    onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}
  >
    {children}
  </motion.div>
);

const ModalBox = ({
  children,
  width = 480,
}: {
  children: React.ReactNode;
  width?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.93, y: 18 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.93, y: 18 }}
    transition={{ type: "spring", damping: 22, stiffness: 260 }}
    style={{ width, maxWidth: "92vw" }}
    className="relative bg-white rounded-2xl shadow-2xl p-7 overflow-hidden"
  >
    {children}
  </motion.div>
);

const MField = ({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div>
    <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#9B9B9B] mb-1.5">
      {icon && <span className="text-[#8B7355]">{icon}</span>}
      {label}
    </label>
    {children}
  </div>
);
