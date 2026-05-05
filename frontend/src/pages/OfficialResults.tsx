import React, { useState, useEffect } from "react";
import {
  Trophy,
  Download,
  Printer,
  Search,
  TrendingUp,
  Users,
  Medal,
  BarChart3,
  Lock,
  CheckCircle2,
  X,
  RefreshCw,
  FileSignature,
} from "lucide-react";
import { AppShell } from "../components/AppShell";
import { Card } from "../components/UI";
import { cn } from "../constants";
import { motion, AnimatePresence } from "motion/react";
import { api, OfficialResult as ApiResult, ExamSession } from "../lib/api";
import { authFetch } from "../context/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type ResultStatus = "ADMITTED" | "WAITING_LIST" | "REJECTED";

interface Result {
  rank: number;
  name: string;
  code: string;
  avg: number;
  status: ResultStatus;
  math: number;
  english: number;
  specialty: number;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockResults: Result[] = [
  {
    rank: 1,
    name: "Amine Benali",
    code: "DOCT-2026-042",
    avg: 17.45,
    status: "ADMITTED",
    math: 18.5,
    english: 16.4,
    specialty: 17.5,
  },
  {
    rank: 2,
    name: "Sarah Mansouri",
    code: "DOCT-2026-118",
    avg: 16.82,
    status: "ADMITTED",
    math: 15.0,
    english: 18.6,
    specialty: 16.9,
  },
  {
    rank: 3,
    name: "Karim Zidi",
    code: "DOCT-2026-009",
    avg: 16.1,
    status: "ADMITTED",
    math: 17.2,
    english: 15.0,
    specialty: 16.1,
  },
  {
    rank: 4,
    name: "Lina Khelifi",
    code: "DOCT-2026-254",
    avg: 15.95,
    status: "WAITING_LIST",
    math: 14.5,
    english: 17.4,
    specialty: 16.0,
  },
  {
    rank: 5,
    name: "Yacine Brahimi",
    code: "DOCT-2026-087",
    avg: 15.42,
    status: "WAITING_LIST",
    math: 16.0,
    english: 14.8,
    specialty: 15.5,
  },
  {
    rank: 6,
    name: "Fatima Zerrouki",
    code: "DOCT-2026-156",
    avg: 14.2,
    status: "REJECTED",
    math: 12.0,
    english: 16.4,
    specialty: 14.2,
  },
  {
    rank: 7,
    name: "Omar Boudiaf",
    code: "DOCT-2026-201",
    avg: 13.8,
    status: "REJECTED",
    math: 11.5,
    english: 15.2,
    specialty: 14.7,
  },
  {
    rank: 8,
    name: "Nadia Hamdi",
    code: "DOCT-2026-089",
    avg: 13.2,
    status: "REJECTED",
    math: 13.0,
    english: 12.8,
    specialty: 13.8,
  },
];

// ─── Pills ────────────────────────────────────────────────────────────────────

const statusPill: Record<ResultStatus, string> = {
  ADMITTED:
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap",
  WAITING_LIST:
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap",
  REJECTED:
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-500 border border-gray-200 whitespace-nowrap",
};

const statusLabel: Record<ResultStatus, string> = {
  ADMITTED: "Admitted",
  WAITING_LIST: "Waiting List",
  REJECTED: "Rejected",
};

// ─── PV Modal ─────────────────────────────────────────────────────────────────

const PVModal = ({
  onClose,
  mode,
  session,
  results,
}: {
  onClose: () => void;
  mode: "print" | "export";
  session: ExamSession | null;
  results: Result[];
}) => {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleAction = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const pv = await api.pv.generate(session.id, `PV of Deliberation - ${session.name}`);
      const res = await authFetch(api.pv.downloadUrl(pv.id));
      if (!res.ok) {
        throw new Error(`Failed to download PV (${res.status})`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      if (mode === "print") {
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        const a = document.createElement("a");
        a.href = url;
        a.download = `PV-${session.name}.pdf`;
        a.click();
      }
      setLoading(false);
      setDone(true);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        className="bg-white rounded-2xl w-full max-w-[380px] shadow-2xl overflow-hidden"
      >
        <div className="bg-gradient-to-r from-[#8B7355] to-[#6d5a42] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileSignature size={15} className="text-white/80" />
            <p className="font-bold text-white text-sm">
              {mode === "print" ? "Print Official PV" : "Export Results PDF"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5">
          {done ? (
            <div className="text-center py-6 space-y-3">
              <CheckCircle2 size={36} className="mx-auto text-emerald-500" />
              <p className="font-semibold text-sm text-gray-800">
                {mode === "print" ? "Sent to Printer" : "PDF Ready"}
              </p>
              <p className="text-xs text-gray-400">
                PV-DEL-2026 · {new Date().toLocaleDateString()} · Signed &
                Timestamped
              </p>
              {mode === "export" && (
                <button
                  type="button"
                  onClick={() => {
                    if (!downloadUrl) return;
                    const a = document.createElement("a");
                    a.href = downloadUrl;
                    a.download = `PV-${session?.name ?? "results"}.pdf`;
                    a.click();
                  }}
                  className="flex items-center gap-2 mx-auto px-4 py-2 rounded-xl bg-primary-accent text-white text-xs font-bold hover:opacity-90 transition-opacity"
                >
                  <Download size={13} /> Download PDF
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2 mb-4">
                {[
                  ["Document", `PV of Deliberation — ${session?.name ?? "No closed session"}`],
                  [
                    "Admitted",
                    `${results.filter((r) => r.status === "ADMITTED").length} candidates`,
                  ],
                  [
                    "Waiting List",
                    `${results.filter((r) => r.status === "WAITING_LIST").length} candidates`,
                  ],
                  [
                    "Rejected",
                    `${results.filter((r) => r.status === "REJECTED").length} candidates`,
                  ],
                  ["Status", "Official · Signed · Archived"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-xs">
                    <span className="text-muted">{k}</span>
                    <span className="font-semibold text-right">{v}</span>
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
                  onClick={handleAction}
                  disabled={loading || !session}
                  className="flex-1 py-2.5 rounded-xl bg-[#8B7355] text-white text-xs font-bold hover:bg-[#7a6449] transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={12} className="animate-spin" />{" "}
                      Processing...
                    </>
                  ) : mode === "print" ? (
                    <>
                      <Printer size={12} /> Print
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

export const OfficialResultsPage = () => {
  const [statusFilter, setStatusFilter] = useState<ResultStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [pvMode, setPvMode] = useState<"print" | "export" | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [selectedSession, setSelectedSession] = useState<ExamSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.sessions.list()
      .then(async (res) => {
        const closedSession =
          res.results.find((session) => session.status === "CLOSED") ??
          null;
        const fallbackSession =
          closedSession ??
          res.results.find((session) => session.status === "ACTIVE") ??
          res.results[0] ??
          null;
        setSelectedSession(fallbackSession);
        if (closedSession) {
          const apiResults = await api.deliberation.results(closedSession.id);
          const mapped = apiResults.map((r: ApiResult) => ({
            rank: r.rank,
            name: r.candidate_name,
            code: r.application_number,
            avg: parseFloat(r.final_score),
            status: (r.decision === "ADMITTED" ? "ADMITTED" : r.decision === "WAITLIST" ? "WAITING_LIST" : "REJECTED") as ResultStatus,
            math: 0,
            english: 0,
            specialty: 0,
          } as Result));
          setResults(mapped);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const allResults = results;
  const filtered = allResults
    .filter((r) => statusFilter === "ALL" || r.status === statusFilter)
    .filter(
      (r) =>
        search === "" ||
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.code.toLowerCase().includes(search.toLowerCase()),
    );

  const admitted = allResults.filter((r) => r.status === "ADMITTED").length;
  const waitlist = allResults.filter((r) => r.status === "WAITING_LIST").length;
  const generalAvg = allResults.length > 0
    ? (allResults.reduce((s, r) => s + r.avg, 0) / allResults.length).toFixed(2)
    : "—";

  const rankStyle = (rank: number) =>
    rank === 1
      ? "bg-amber-400 text-white"
      : rank === 2
        ? "bg-gray-400 text-white"
        : rank === 3
          ? "bg-amber-700 text-white"
          : "bg-gray-100 text-gray-600";

  return (
    <AppShell title="Official Results">
      <AnimatePresence>
        {pvMode && (
          <PVModal
            mode={pvMode}
            session={selectedSession?.status === "CLOSED" ? selectedSession : null}
            results={allResults}
            onClose={() => setPvMode(null)}
          />
        )}
      </AnimatePresence>

      {/* Full page layout — no overflow */}
      <div className="flex flex-col gap-4 h-full">
        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3 shrink-0">
          {[
            {
              label: "Total Candidates",
              value: allResults.length || "—",
              Icon: Users,
              cls: "text-primary-accent bg-primary-accent/10",
            },
            {
              label: "Admitted",
              value: admitted,
              Icon: Trophy,
              cls: "text-emerald-600 bg-emerald-50",
            },
            {
              label: "Waiting List",
              value: waitlist,
              Icon: Medal,
              cls: "text-amber-600 bg-amber-50",
            },
            {
              label: "General Average",
              value: generalAvg,
              Icon: BarChart3,
              cls: "text-primary-accent bg-primary-accent/10",
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

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 shrink-0 flex-wrap">
          {/* Filter tabs */}
          <div className="flex items-center gap-1 bg-white border border-border rounded-xl p-1">
            {(["ALL", "ADMITTED", "WAITING_LIST", "REJECTED"] as const).map(
              (f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setStatusFilter(f)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                    statusFilter === f
                      ? "bg-primary-accent text-white shadow-sm"
                      : "text-muted hover:text-text-primary hover:bg-black/[0.03]",
                  )}
                >
                  {f === "ALL"
                    ? "All"
                    : f === "WAITING_LIST"
                      ? "Waiting List"
                      : f.charAt(0) + f.slice(1).toLowerCase()}
                  {f !== "ALL" && (
                    <span
                      className={cn(
                        "ml-1.5 px-1.5 py-0.5 rounded-full text-[10px]",
                        statusFilter === f ? "bg-white/20" : "bg-black/[0.06]",
                      )}
                    >
                      {f === "ADMITTED"
                        ? admitted
                        : f === "WAITING_LIST"
                          ? waitlist
                          : allResults.filter((r) => r.status === "REJECTED").length}
                    </span>
                  )}
                </button>
              ),
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted"
                size={13}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search candidate..."
                className="input-field pl-8 text-xs h-9 w-48"
              />
            </div>
            <button
              type="button"
              onClick={() => setPvMode("print")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs font-semibold text-text-primary hover:bg-black/[0.03] transition-colors"
            >
              <Printer size={14} /> Print PV
            </button>
            <button
              type="button"
              onClick={() => setPvMode("export")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary-accent text-white text-xs font-bold hover:opacity-90 transition-opacity"
            >
              <Download size={14} /> Export PDF
            </button>
          </div>
        </div>

        {/* Table card — fills remaining height, scrolls internally */}
        <Card className="overflow-hidden flex flex-col flex-1 min-h-0">
          {/* Card header */}
          <div className="px-5 py-3.5 border-b border-border flex items-center justify-between shrink-0">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <TrendingUp size={15} className="text-primary-accent" /> Final
              Ranking
            </h3>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                <Lock size={9} /> Official
              </span>
              <span className="text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200 px-2.5 py-0.5 rounded-full">
                {selectedSession?.name ?? "No session"}
              </span>
            </div>
          </div>

          {/* Scrollable table */}
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-surface border-b border-border">
                  {[
                    "Rank",
                    "Candidate",
                    "Math",
                    "English",
                    "Specialty",
                    "Average",
                    "Decision",
                  ].map((h) => (
                    <th
                      key={h}
                      className="p-3 text-[10px] font-bold text-muted uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((r) => (
                  <tr
                    key={r.code}
                    className="hover:bg-black/[0.015] transition-colors"
                  >
                    <td className="p-3">
                      <div
                        className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px]",
                          rankStyle(r.rank),
                        )}
                      >
                        {r.rank}
                      </div>
                    </td>
                    <td className="p-3">
                      <p className="text-xs font-bold text-text-primary">
                        {r.name}
                      </p>
                      <p className="text-[10px] text-muted font-mono mt-0.5">
                        {r.code}
                      </p>
                    </td>
                    <td className="p-3 text-xs font-medium tabular-nums">
                      {r.math.toFixed(1)}
                    </td>
                    <td className="p-3 text-xs font-medium tabular-nums">
                      {r.english.toFixed(1)}
                    </td>
                    <td className="p-3 text-xs font-medium tabular-nums">
                      {r.specialty.toFixed(1)}
                    </td>
                    <td className="p-3">
                      <span className="text-base font-bold tabular-nums">
                        {r.avg.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-muted ml-1">/ 20</span>
                    </td>
                    <td className="p-3">
                      <span className={statusPill[r.status]}>
                        {statusLabel[r.status]}
                      </span>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-10 text-center text-muted text-xs"
                    >
                      {loading
                        ? "Loading results..."
                        : selectedSession?.status !== "CLOSED"
                          ? "Official results are available only after a session is closed."
                          : "No candidates match your filter."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-border flex items-center justify-between shrink-0">
            <p className="text-xs text-muted">
              Showing{" "}
              <span className="font-semibold text-text-primary">
                {filtered.length}
              </span>{" "}
              of <span className="font-semibold text-text-primary">{allResults.length || "—"}</span>{" "}
              candidates
            </p>
            <p className="text-xs text-muted flex items-center gap-1.5">
              <Lock size={10} className="text-emerald-500" /> Results immutable
              · Archived
            </p>
          </div>
        </Card>
      </div>
    </AppShell>
  );
};
