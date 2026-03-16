import React from "react";
import {
  Users,
  Calendar,
  ShieldCheck,
  ClipboardList,
  ArrowUpRight,
  ArrowDownRight,
  Lightbulb,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Eye,
  Gavel,
  Trophy,
  BookOpen,
  Clock,
  MapPin,
  TrendingUp,
  Shield,
} from "lucide-react";
import { AppShell } from "../components/AppShell";
import { Card } from "../components/UI";
import { motion } from "motion/react";
import { cn } from "../constants";
import { useAuth } from "../context/AuthContext";
import { UserRole } from "../types";

// ─── Shared primitives ────────────────────────────────────────────────────────

const KpiCard = ({
  label,
  value,
  icon: Icon,
  iconBg,
  trend,
  trendUp,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  iconBg: string;
  trend?: string;
  trendUp?: boolean | null;
}) => (
  <Card className="p-5">
    <div className="flex items-center justify-between mb-3">
      <div
        className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center",
          iconBg,
        )}
      >
        <Icon size={20} />
      </div>
      {trend && (
        <span
          className={cn(
            "flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full",
            trendUp === true && "text-emerald-600 bg-emerald-50",
            trendUp === false && "text-red-500 bg-red-50",
            trendUp === null && "text-gray-500 bg-gray-100",
          )}
        >
          {trendUp === true && <ArrowUpRight size={12} />}
          {trendUp === false && <ArrowDownRight size={12} />}
          {trend}
        </span>
      )}
    </div>
    <p className="text-[11px] text-[#9B9B9B] font-medium uppercase tracking-widest mb-1">
      {label}
    </p>
    <h3 className="text-[26px] font-bold text-[#1A1A1A] leading-tight">
      {value}
    </h3>
  </Card>
);

const TipCard = ({ tip }: { tip: string }) => (
  <Card className="p-5 bg-[#FFFBF5] border border-[#F0EDE7] shrink-0">
    <div className="flex items-center gap-2 mb-2">
      <div className="w-7 h-7 rounded-lg bg-[#8B7355]/10 flex items-center justify-center text-[#8B7355]">
        <Lightbulb size={15} />
      </div>
      <h4 className="text-[13px] font-bold text-[#8B7355]">Quick Tip</h4>
    </div>
    <p className="text-[12px] text-[#6B6B6B] leading-relaxed">{tip}</p>
  </Card>
);

const DeadlinesCard = ({
  items,
}: {
  items: { label: string; detail: string; color: string }[];
}) => (
  <Card className="p-5 flex flex-col flex-1 min-h-0">
    <h3 className="font-bold text-[15px] text-[#1A1A1A] mb-4 shrink-0">
      Upcoming Deadlines
    </h3>
    <div className="space-y-4 flex-1 overflow-y-auto">
      {items.map((d, i) => (
        <div key={i} className="flex items-start gap-3">
          <span
            className={cn("w-2.5 h-2.5 rounded-full mt-1 shrink-0", d.color)}
          />
          <div>
            <p className="text-[13px] font-semibold text-[#1A1A1A] leading-tight">
              {d.label}
            </p>
            <p className="text-[11px] text-[#9B9B9B] mt-0.5">{d.detail}</p>
          </div>
        </div>
      ))}
    </div>
  </Card>
);

const ChecklistCard = ({
  title,
  items,
}: {
  title: string;
  items: { label: string; done: boolean }[];
}) => (
  <Card className="p-5 flex flex-col flex-1 min-h-0">
    <h3 className="font-bold text-[15px] text-[#1A1A1A] mb-4 shrink-0">
      {title}
    </h3>
    <div className="space-y-3 flex-1 overflow-y-auto">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <div
            className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center shrink-0",
              item.done
                ? "bg-emerald-100 text-emerald-600"
                : "bg-gray-100 text-gray-400",
            )}
          >
            {item.done ? <CheckCircle2 size={13} /> : <Clock size={13} />}
          </div>
          <span
            className={cn(
              "text-[13px]",
              item.done
                ? "text-[#9B9B9B] line-through"
                : "text-[#1A1A1A] font-medium",
            )}
          >
            {item.label}
          </span>
        </div>
      ))}
    </div>
  </Card>
);

// ─── ADMIN ────────────────────────────────────────────────────────────────────
const AdminDashboard = ({ name }: { name: string }) => (
  <div className="h-full flex flex-col gap-4">
    <p className="text-sm text-[#6B6B6B] shrink-0">
      Welcome back, <span className="font-semibold text-[#1A1A1A]">{name}</span>
      . Here's your system overview.
    </p>
    <div className="grid grid-cols-4 gap-4 shrink-0">
      {[
        {
          label: "Total Candidates",
          value: "1,284",
          icon: Users,
          iconBg: "bg-blue-50 text-blue-500",
          trend: "+12%",
          trendUp: true,
        },
        {
          label: "Exams Scheduled",
          value: "12",
          icon: Calendar,
          iconBg: "bg-orange-50 text-orange-500",
          trend: "0%",
          trendUp: null,
        },
        {
          label: "Active Supervisors",
          value: "45",
          icon: ShieldCheck,
          iconBg: "bg-purple-50 text-purple-500",
          trend: "+5%",
          trendUp: true,
        },
        {
          label: "Pending Corrections",
          value: "89",
          icon: ClipboardList,
          iconBg: "bg-red-50 text-red-500",
          trend: "-2%",
          trendUp: false,
        },
      ].map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
        >
          <KpiCard {...s} />
        </motion.div>
      ))}
    </div>
    <div className="grid grid-cols-3 gap-5 flex-1 min-h-0 pb-2">
      <div className="col-span-2 flex flex-col min-h-0">
        <Card className="p-0 flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F0F0] shrink-0">
            <h3 className="font-bold text-[15px] text-[#1A1A1A]">
              Recent Registrations
            </h3>
            <button className="text-[13px] text-[#8B7355] font-semibold hover:underline flex items-center gap-1">
              View All <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="grid grid-cols-4 px-6 py-2 bg-[#FAFAFA] border-b border-[#F0F0F0] shrink-0">
            {["Candidate", "Specialty", "Status", "Date"].map((col) => (
              <span
                key={col}
                className="text-[11px] font-semibold uppercase tracking-wider text-[#9B9B9B]"
              >
                {col}
              </span>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-[#F5F5F5]">
            {[
              {
                av: "SM",
                bg: "bg-pink-100 text-pink-600",
                name: "Sarah Miller",
                sp: "Cardiology",
                st: "VERIFIED",
                v: "success",
                dt: "2 mins ago",
              },
              {
                av: "AC",
                bg: "bg-blue-100 text-blue-600",
                name: "Ahmed Chen",
                sp: "Neurology",
                st: "PENDING",
                v: "warning",
                dt: "1 hour ago",
              },
              {
                av: "ER",
                bg: "bg-green-100 text-green-600",
                name: "Elena Rodriguez",
                sp: "Pediatrics",
                st: "VERIFIED",
                v: "success",
                dt: "3 hours ago",
              },
            ].map((r, i) => (
              <div
                key={i}
                className="grid grid-cols-4 items-center px-6 py-4 hover:bg-[#FAFAFA] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                      r.bg,
                    )}
                  >
                    {r.av}
                  </div>
                  <span className="text-[13px] font-semibold text-[#1A1A1A]">
                    {r.name}
                  </span>
                </div>
                <span className="text-[13px] text-[#555]">{r.sp}</span>
                <span
                  className={cn(
                    "text-[11px] font-bold px-2.5 py-1 rounded-md w-fit",
                    r.v === "success"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-amber-50 text-amber-600",
                  )}
                >
                  {r.st}
                </span>
                <span className="text-[12px] text-[#9B9B9B]">{r.dt}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <div className="flex flex-col gap-5 min-h-0">
        <TipCard tip='Use "G then D" to return to dashboard instantly. Press "/" to search.' />
        <DeadlinesCard
          items={[
            {
              label: "Anonymization Batch #42",
              detail: "Due in 4 hours",
              color: "bg-red-500",
            },
            {
              label: "Correction Verification",
              detail: "Due tomorrow at 09:00",
              color: "bg-yellow-400",
            },
            {
              label: "Final PV Publication",
              detail: "Due in 3 days",
              color: "bg-blue-400",
            },
          ]}
        />
      </div>
    </div>
  </div>
);

// ─── CFD HEAD ─────────────────────────────────────────────────────────────────
const CfdHeadDashboard = ({ name }: { name: string }) => (
  <div className="h-full flex flex-col gap-4">
    <p className="text-sm text-[#6B6B6B] shrink-0">
      Welcome, <span className="font-semibold text-[#1A1A1A]">{name}</span>.
      Manage exam planning and subject lottery.
    </p>
    <div className="grid grid-cols-3 gap-4 shrink-0">
      {[
        {
          label: "Exams Planned",
          value: "3",
          icon: Calendar,
          iconBg: "bg-orange-50 text-orange-500",
        },
        {
          label: "Subjects Ready",
          value: "3",
          icon: BookOpen,
          iconBg: "bg-blue-50 text-blue-500",
        },
        {
          label: "Rooms Assigned",
          value: "5",
          icon: MapPin,
          iconBg: "bg-purple-50 text-purple-500",
        },
      ].map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
        >
          <KpiCard {...s} />
        </motion.div>
      ))}
    </div>
    <div className="grid grid-cols-3 gap-5 flex-1 min-h-0 pb-2">
      <div className="col-span-2">
        <ChecklistCard
          title="Session Preparation Checklist"
          items={[
            { label: "Import candidate list", done: true },
            { label: "Define exam subjects (×3)", done: true },
            { label: "Schedule exam dates & rooms", done: true },
            { label: "Assign supervisors to rooms", done: false },
            { label: "Run subject lottery", done: false },
            { label: "Generate convocation emails", done: false },
          ]}
        />
      </div>
      <div className="flex flex-col gap-5 min-h-0">
        <TipCard tip="The subject lottery is irreversible and recorded in the audit trail. Ensure all 3 subjects are validated before drawing." />
        <DeadlinesCard
          items={[
            {
              label: "Supervisor assignment deadline",
              detail: "Tomorrow 09:00",
              color: "bg-red-500",
            },
            {
              label: "Subject lottery ceremony",
              detail: "In 2 days",
              color: "bg-yellow-400",
            },
            {
              label: "Exam day — Session 2026",
              detail: "In 5 days",
              color: "bg-blue-400",
            },
          ]}
        />
      </div>
    </div>
  </div>
);

// ─── COORDINATOR ──────────────────────────────────────────────────────────────
const CoordinatorDashboard = ({ name }: { name: string }) => (
  <div className="h-full flex flex-col gap-4">
    <p className="text-sm text-[#6B6B6B] shrink-0">
      Welcome, <span className="font-semibold text-[#1A1A1A]">{name}</span>.
      Monitor correction progress and resolve discrepancies.
    </p>
    <div className="grid grid-cols-4 gap-4 shrink-0">
      {[
        {
          label: "Copies Assigned",
          value: "1,190",
          icon: FileText,
          iconBg: "bg-blue-50 text-blue-500",
        },
        {
          label: "Graded Both",
          value: "1,148",
          icon: CheckCircle2,
          iconBg: "bg-emerald-50 text-emerald-600",
        },
        {
          label: "Discrepancies",
          value: "42",
          icon: AlertTriangle,
          iconBg: "bg-red-50 text-red-500",
          trend: "High",
          trendUp: false,
        },
        {
          label: "Locked Subjects",
          value: "1/3",
          icon: Lock,
          iconBg: "bg-amber-50 text-amber-600",
        },
      ].map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
        >
          <KpiCard {...s} />
        </motion.div>
      ))}
    </div>
    <div className="grid grid-cols-3 gap-5 flex-1 min-h-0 pb-2">
      <div className="col-span-2 flex flex-col min-h-0">
        <Card className="p-5 flex flex-col flex-1 min-h-0 overflow-hidden">
          <h3 className="font-bold text-[15px] text-[#1A1A1A] mb-4 shrink-0 flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-500" /> Pending
            Discrepancies
          </h3>
          <div className="flex-1 overflow-y-auto space-y-2">
            {[
              {
                code: "ANO-9C2F15",
                subject: "English",
                delta: "6.50",
                sev: "Critical",
                cls: "bg-red-50 text-red-700 border-red-200",
              },
              {
                code: "ANO-2B9D44",
                subject: "English",
                delta: "5.00",
                sev: "High",
                cls: "bg-amber-50 text-amber-700 border-amber-200",
              },
              {
                code: "ANO-7F3A92",
                subject: "Mathematics",
                delta: "4.50",
                sev: "High",
                cls: "bg-amber-50 text-amber-700 border-amber-200",
              },
            ].map((d, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-[#FAFAFA] rounded-xl border border-[#F0F0F0]"
              >
                <div>
                  <p className="text-[13px] font-bold font-mono text-[#1A1A1A]">
                    {d.code}
                  </p>
                  <p className="text-[11px] text-[#9B9B9B]">{d.subject}</p>
                </div>
                <div className="text-right">
                  <p className="text-[13px] font-bold text-red-500">
                    Δ {d.delta} pts
                  </p>
                  <span
                    className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                      d.cls,
                    )}
                  >
                    {d.sev}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <div className="flex flex-col gap-5 min-h-0">
        <TipCard tip="Assign a 3rd corrector for discrepancies above threshold. Final grade rule (Average/Median/3rd) is configurable per subject." />
        <DeadlinesCard
          items={[
            {
              label: "Resolve 42 discrepancies",
              detail: "Before deliberation",
              color: "bg-red-500",
            },
            {
              label: "Lock Mathematics grades",
              detail: "Due tomorrow",
              color: "bg-yellow-400",
            },
            {
              label: "Deliberation session",
              detail: "In 3 days",
              color: "bg-blue-400",
            },
          ]}
        />
      </div>
    </div>
  </div>
);

// ─── CORRECTOR ────────────────────────────────────────────────────────────────
const CorrectorDashboard = ({ name }: { name: string }) => (
  <div className="h-full flex flex-col gap-4">
    <p className="text-sm text-[#6B6B6B] shrink-0">
      Welcome, <span className="font-semibold text-[#1A1A1A]">{name}</span>.
      Here are your assigned anonymous copies.
    </p>
    <div className="grid grid-cols-3 gap-4 shrink-0">
      {[
        {
          label: "Assigned Copies",
          value: "28",
          icon: FileText,
          iconBg: "bg-blue-50 text-blue-500",
        },
        {
          label: "Graded",
          value: "21",
          icon: CheckCircle2,
          iconBg: "bg-emerald-50 text-emerald-600",
          trend: "75%",
          trendUp: true,
        },
        {
          label: "Remaining",
          value: "7",
          icon: Clock,
          iconBg: "bg-amber-50 text-amber-600",
        },
      ].map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
        >
          <KpiCard {...s} />
        </motion.div>
      ))}
    </div>
    <div className="grid grid-cols-3 gap-5 flex-1 min-h-0 pb-2">
      <div className="col-span-2 flex flex-col min-h-0">
        <Card className="p-5 flex flex-col flex-1 min-h-0 overflow-hidden">
          <h3 className="font-bold text-[15px] text-[#1A1A1A] mb-4 shrink-0">
            My Assigned Copies
          </h3>
          <div className="flex-1 overflow-y-auto space-y-2">
            {[
              {
                code: "DOCT-2026-042",
                subject: "Mathematics & Logic",
                status: "Pending",
                cls: "bg-gray-100 text-gray-500 border-gray-200",
              },
              {
                code: "DOCT-2026-051",
                subject: "Mathematics & Logic",
                status: "1 Grade",
                cls: "bg-blue-50 text-blue-600 border-blue-200",
              },
              {
                code: "DOCT-2026-063",
                subject: "Research Methodology",
                status: "Discrepancy",
                cls: "bg-red-50 text-red-600 border-red-200",
              },
              {
                code: "DOCT-2026-077",
                subject: "Mathematics & Logic",
                status: "Locked",
                cls: "bg-emerald-50 text-emerald-600 border-emerald-200",
              },
            ].map((c, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-[#FAFAFA] rounded-xl border border-[#F0F0F0]"
              >
                <div>
                  <p className="text-[13px] font-bold font-mono text-[#1A1A1A]">
                    {c.code}
                  </p>
                  <p className="text-[11px] text-[#9B9B9B]">{c.subject}</p>
                </div>
                <span
                  className={cn(
                    "text-[11px] font-bold px-2.5 py-0.5 rounded-full border",
                    c.cls,
                  )}
                >
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <div className="flex flex-col gap-5 min-h-0">
        <TipCard tip="Only anonymous codes are visible — candidate identity is hidden. Enter grades with 0.25 precision (e.g. 14.75)." />
        <DeadlinesCard
          items={[
            {
              label: "Grade 7 remaining copies",
              detail: "Due today at 18:00",
              color: "bg-red-500",
            },
            {
              label: "Grades locked after validation",
              detail: "No edits after lock",
              color: "bg-yellow-400",
            },
          ]}
        />
      </div>
    </div>
  </div>
);

// ─── SUPERVISOR ───────────────────────────────────────────────────────────────
const SupervisorDashboard = ({ name }: { name: string }) => (
  <div className="h-full flex flex-col gap-4">
    <p className="text-sm text-[#6B6B6B] shrink-0">
      Welcome, <span className="font-semibold text-[#1A1A1A]">{name}</span>.
      Your exam room assignment for today.
    </p>
    <div className="grid grid-cols-3 gap-4 shrink-0">
      {[
        {
          label: "Your Room",
          value: "A101",
          icon: MapPin,
          iconBg: "bg-purple-50 text-purple-500",
        },
        {
          label: "Candidates",
          value: "53",
          icon: Users,
          iconBg: "bg-blue-50 text-blue-500",
        },
        {
          label: "Exam Starts In",
          value: "2h 15m",
          icon: Clock,
          iconBg: "bg-orange-50 text-orange-500",
        },
      ].map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
        >
          <KpiCard {...s} />
        </motion.div>
      ))}
    </div>
    <div className="grid grid-cols-3 gap-5 flex-1 min-h-0 pb-2">
      <div className="col-span-2 flex flex-col min-h-0">
        <Card className="p-5 flex flex-col flex-1 min-h-0 overflow-hidden">
          <h3 className="font-bold text-[15px] text-[#1A1A1A] mb-4 shrink-0 flex items-center gap-2">
            <Calendar size={16} className="text-[#8B7355]" /> Today's Exam
          </h3>
          <div className="space-y-3 flex-1 overflow-y-auto">
            {[
              ["Subject", "Mathematics & Logic"],
              ["Date", "2026-03-10"],
              ["Start Time", "09:00"],
              ["Duration", "3 hours"],
              ["Room", "A101 — Block A, Capacity 53"],
              ["Status", "Scheduled"],
            ].map(([label, val]) => (
              <div
                key={label}
                className="flex justify-between items-center p-3 bg-[#FAFAFA] rounded-xl border border-[#F0F0F0]"
              >
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#9B9B9B]">
                  {label}
                </span>
                <span className="text-[13px] font-semibold text-[#1A1A1A]">
                  {val}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <div className="flex flex-col gap-5 min-h-0">
        <TipCard tip="Use the PWA on your tablet to mark attendance. Works offline — data syncs automatically when reconnected." />
        <DeadlinesCard
          items={[
            {
              label: "Open PWA attendance app",
              detail: "30 min before exam",
              color: "bg-red-500",
            },
            {
              label: "Submit attendance report",
              detail: "Immediately after exam",
              color: "bg-yellow-400",
            },
            {
              label: "PV of Attendance signed",
              detail: "Same day",
              color: "bg-blue-400",
            },
          ]}
        />
      </div>
    </div>
  </div>
);

// ─── JURY PRESIDENT ───────────────────────────────────────────────────────────
const JuryPresidentDashboard = ({ name }: { name: string }) => (
  <div className="h-full flex flex-col gap-4">
    <p className="text-sm text-[#6B6B6B] shrink-0">
      Welcome, <span className="font-semibold text-[#1A1A1A]">{name}</span>.
      Review the ranking and close deliberation when ready.
    </p>
    <div className="grid grid-cols-4 gap-4 shrink-0">
      {[
        {
          label: "Total Ranked",
          value: "1,190",
          icon: Users,
          iconBg: "bg-blue-50 text-blue-500",
        },
        {
          label: "Admitted",
          value: "45",
          icon: Trophy,
          iconBg: "bg-emerald-50 text-emerald-600",
        },
        {
          label: "Waiting List",
          value: "15",
          icon: TrendingUp,
          iconBg: "bg-amber-50 text-amber-600",
        },
        {
          label: "Subjects Validated",
          value: "2/3",
          icon: CheckCircle2,
          iconBg: "bg-purple-50 text-purple-500",
        },
      ].map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
        >
          <KpiCard {...s} />
        </motion.div>
      ))}
    </div>
    <div className="grid grid-cols-3 gap-5 flex-1 min-h-0 pb-2">
      <div className="col-span-2">
        <ChecklistCard
          title="Pre-Deliberation Checklist"
          items={[
            { label: "All subjects validated by Coordinator", done: true },
            { label: "Attendance PVs signed", done: true },
            { label: "All discrepancies resolved", done: true },
            { label: "Jury signatures collected", done: false },
            { label: "Admissibility threshold confirmed", done: false },
          ]}
        />
      </div>
      <div className="flex flex-col gap-5 min-h-0">
        <TipCard tip="Closing deliberation is irreversible without Admin intervention. Anonymity lifts permanently and all grades are locked." />
        <DeadlinesCard
          items={[
            {
              label: "Collect jury signatures",
              detail: "Before closing",
              color: "bg-red-500",
            },
            {
              label: "Close deliberation",
              detail: "Session 2026",
              color: "bg-yellow-400",
            },
            {
              label: "Publish official results",
              detail: "After closure",
              color: "bg-blue-400",
            },
          ]}
        />
      </div>
    </div>
  </div>
);

// ─── JURY MEMBER ──────────────────────────────────────────────────────────────
const JuryMemberDashboard = ({ name }: { name: string }) => (
  <div className="h-full flex flex-col gap-4">
    <p className="text-sm text-[#6B6B6B] shrink-0">
      Welcome, <span className="font-semibold text-[#1A1A1A]">{name}</span>. You
      are invited to the deliberation session.
    </p>
    <div className="grid grid-cols-2 gap-4 shrink-0">
      {[
        {
          label: "Session",
          value: "2026",
          icon: Gavel,
          iconBg: "bg-purple-50 text-purple-500",
        },
        {
          label: "Candidates Ranked",
          value: "1,190",
          icon: TrendingUp,
          iconBg: "bg-blue-50 text-blue-500",
        },
      ].map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
        >
          <KpiCard {...s} />
        </motion.div>
      ))}
    </div>
    <div className="grid grid-cols-2 gap-5 flex-1 min-h-0 pb-2">
      <Card className="p-5 flex flex-col flex-1 min-h-0 overflow-hidden">
        <h3 className="font-bold text-[15px] text-[#1A1A1A] mb-4 shrink-0 flex items-center gap-2">
          <Gavel size={16} className="text-[#8B7355]" /> Deliberation Info
        </h3>
        <div className="space-y-3 flex-1 overflow-y-auto">
          {[
            ["Status", "Open — Awaiting jury signatures"],
            ["Subjects", "3 validated"],
            ["Admissibility", "Average ≥ 10.00 / 20"],
            ["Quota", "45 admitted"],
            ["Your Role", "Jury Member — review & sign PV"],
          ].map(([label, val]) => (
            <div
              key={label}
              className="flex justify-between items-center p-3 bg-[#FAFAFA] rounded-xl border border-[#F0F0F0]"
            >
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#9B9B9B]">
                {label}
              </span>
              <span className="text-[13px] font-semibold text-[#1A1A1A] text-right max-w-[200px]">
                {val}
              </span>
            </div>
          ))}
        </div>
      </Card>
      <div className="flex flex-col gap-5 min-h-0">
        <TipCard tip="Ranking shows anonymous codes until the Jury President closes deliberation. You can review but not modify grades." />
        <DeadlinesCard
          items={[
            {
              label: "Sign the PV of Deliberation",
              detail: "Required before publishing",
              color: "bg-red-500",
            },
            {
              label: "Results publication",
              detail: "After closure",
              color: "bg-blue-400",
            },
          ]}
        />
      </div>
    </div>
  </div>
);

// ─── ANONYMITY COMMISSION ─────────────────────────────────────────────────────
const AnonymityDashboard = ({ name }: { name: string }) => (
  <div className="h-full flex flex-col gap-4">
    <p className="text-sm text-[#6B6B6B] shrink-0">
      Welcome, <span className="font-semibold text-[#1A1A1A]">{name}</span>.
      Manage copy scanning and anonymous code assignment.
    </p>
    <div className="grid grid-cols-4 gap-4 shrink-0">
      {[
        {
          label: "Total Copies",
          value: "1,190",
          icon: FileText,
          iconBg: "bg-blue-50 text-blue-500",
        },
        {
          label: "Coded",
          value: "1,148",
          icon: Eye,
          iconBg: "bg-emerald-50 text-emerald-600",
          trend: "96%",
          trendUp: true,
        },
        {
          label: "Missing Scans",
          value: "38",
          icon: AlertTriangle,
          iconBg: "bg-amber-50 text-amber-600",
        },
        {
          label: "Errors",
          value: "4",
          icon: Shield,
          iconBg: "bg-red-50 text-red-500",
        },
      ].map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
        >
          <KpiCard {...s} />
        </motion.div>
      ))}
    </div>
    <div className="grid grid-cols-3 gap-5 flex-1 min-h-0 pb-2">
      <div className="col-span-2 flex flex-col min-h-0">
        <Card className="p-5 flex flex-col flex-1 min-h-0 overflow-hidden">
          <h3 className="font-bold text-[15px] text-[#1A1A1A] mb-3 shrink-0">
            Coding Progress
          </h3>
          <div className="mb-4 shrink-0">
            <div className="flex justify-between text-[12px] text-[#9B9B9B] mb-1.5">
              <span>1,148 of 1,190 copies coded</span>
              <span className="font-bold text-[#8B7355]">96%</span>
            </div>
            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#8B7355] rounded-full"
                style={{ width: "96%" }}
              />
            </div>
          </div>
          <ChecklistCard
            title="Commission Checklist"
            items={[
              { label: "Receive physical exam copies", done: true },
              { label: "Scan all copies (PDF/JPEG)", done: true },
              { label: "Assign anonymous codes to all copies", done: false },
              { label: "Resolve 38 missing scans", done: false },
              { label: "Sign PV of Anonymization (×4 members)", done: false },
            ]}
          />
        </Card>
      </div>
      <div className="flex flex-col gap-5 min-h-0">
        <TipCard tip="Use QR/barcode reader for faster code association. Each copy must be coded before correction begins." />
        <DeadlinesCard
          items={[
            {
              label: "Resolve 38 missing scans",
              detail: "Blocking correction",
              color: "bg-red-500",
            },
            {
              label: "Sign PV of Anonymization",
              detail: "All 4 members needed",
              color: "bg-yellow-400",
            },
            {
              label: "Hand over to Coordinator",
              detail: "After PV signed",
              color: "bg-blue-400",
            },
          ]}
        />
      </div>
    </div>
  </div>
);

// ─── Main export ──────────────────────────────────────────────────────────────
export const Dashboard = () => {
  const { user } = useAuth();
  const userRole = user?.profile?.role as UserRole | undefined;
  const fullName = user?.full_name || user?.username || "User";

  const renderDashboard = () => {
    switch (userRole) {
      case UserRole.ADMIN:
        return <AdminDashboard name={fullName} />;
      case UserRole.CFD_HEAD:
        return <CfdHeadDashboard name={fullName} />;
      case UserRole.COORDINATOR:
        return <CoordinatorDashboard name={fullName} />;
      case UserRole.CORRECTOR:
        return <CorrectorDashboard name={fullName} />;
      case UserRole.SUPERVISOR:
        return <SupervisorDashboard name={fullName} />;
      case UserRole.JURY_PRESIDENT:
        return <JuryPresidentDashboard name={fullName} />;
      case UserRole.JURY_MEMBER:
        return <JuryMemberDashboard name={fullName} />;
      case UserRole.ANONYMITY_COMMISSION:
        return <AnonymityDashboard name={fullName} />;
      default:
        return <AdminDashboard name={fullName} />;
    }
  };

  return <AppShell title="Overview">{renderDashboard()}</AppShell>;
};
