import React, { useState, useMemo, useRef } from "react";
import {
  Search,
  Filter,
  Download,
  Upload,
  Mail,
  Eye,
  Edit2,
  UserX,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Check,
  AlertTriangle,
  User,
  Phone,
  AtSign,
  Hash,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { AppShell } from "../components/AppShell";
import { Card } from "../components/UI";
import { CandidateStatus } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../constants";

// ─── Mock data ───────────────────────────────────────────────────────────────
type Candidate = {
  id: string;
  appNum: string;
  name: string;
  nid: string;
  email: string;
  phone: string;
  status: CandidateStatus;
  session: string;
  specialty: string;
};

const INITIAL_CANDIDATES: Candidate[] = [
  {
    id: "1",
    appNum: "DOCT-2026-001",
    name: "Amine Benali",
    nid: "199201020304",
    email: "a.benali@email.com",
    phone: "0550123456",
    status: CandidateStatus.REGISTERED,
    session: "Session 2026",
    specialty: "Cardiology",
  },
  {
    id: "2",
    appNum: "DOCT-2026-002",
    name: "Sarah Mansouri",
    nid: "199505060708",
    email: "s.mansouri@email.com",
    phone: "0661987654",
    status: CandidateStatus.PRESENT,
    session: "Session 2026",
    specialty: "Neurology",
  },
  {
    id: "3",
    appNum: "DOCT-2026-003",
    name: "Karim Zidi",
    nid: "199009101112",
    email: "k.zidi@email.com",
    phone: "0772345678",
    status: CandidateStatus.ELIMINATED,
    session: "Session 2026",
    specialty: "Pediatrics",
  },
  {
    id: "4",
    appNum: "DOCT-2026-004",
    name: "Lina Khelifi",
    nid: "199812131415",
    email: "l.khelifi@email.com",
    phone: "0555112233",
    status: CandidateStatus.REGISTERED,
    session: "Session 2026",
    specialty: "Surgery",
  },
  {
    id: "5",
    appNum: "DOCT-2026-005",
    name: "Yacine Brahimi",
    nid: "199316171819",
    email: "y.brahimi@email.com",
    phone: "0662445566",
    status: CandidateStatus.PRESENT,
    session: "Session 2026",
    specialty: "Radiology",
  },
  {
    id: "6",
    appNum: "DOCT-2026-006",
    name: "Nour Hamidi",
    nid: "199720212223",
    email: "n.hamidi@email.com",
    phone: "0773556677",
    status: CandidateStatus.REGISTERED,
    session: "Session 2026",
    specialty: "Cardiology",
  },
  {
    id: "7",
    appNum: "DOCT-2026-007",
    name: "Tarek Oussama",
    nid: "199424252627",
    email: "t.oussama@email.com",
    phone: "0554667788",
    status: CandidateStatus.PRESENT,
    session: "Session 2026",
    specialty: "Neurology",
  },
  {
    id: "8",
    appNum: "DOCT-2026-008",
    name: "Meriem Saadi",
    nid: "199628293031",
    email: "m.saadi@email.com",
    phone: "0665778899",
    status: CandidateStatus.ELIMINATED,
    session: "Session 2026",
    specialty: "Pediatrics",
  },
  {
    id: "9",
    appNum: "DOCT-2026-009",
    name: "Bilal Ferhat",
    nid: "199132333435",
    email: "b.ferhat@email.com",
    phone: "0776889900",
    status: CandidateStatus.REGISTERED,
    session: "Session 2026",
    specialty: "Surgery",
  },
  {
    id: "10",
    appNum: "DOCT-2026-010",
    name: "Rania Bouaziz",
    nid: "199836373839",
    email: "r.bouaziz@email.com",
    phone: "0557990011",
    status: CandidateStatus.PRESENT,
    session: "Session 2026",
    specialty: "Radiology",
  },
];

const SPECIALTIES = [
  "Cardiology",
  "Neurology",
  "Pediatrics",
  "Surgery",
  "Radiology",
  "Oncology",
  "Psychiatry",
];
const SESSIONS = ["Session 2026", "Session 2025", "Session 2024"];
const PAGE_SIZE = 7;

// ─── Status config ────────────────────────────────────────────────────────────
const statusCfg = {
  [CandidateStatus.REGISTERED]: {
    label: "REGISTERED",
    cls: "bg-[#F0EDE7] text-[#8B7355]",
  },
  [CandidateStatus.PRESENT]: {
    label: "PRESENT",
    cls: "bg-emerald-50 text-emerald-600",
  },
  [CandidateStatus.ELIMINATED]: {
    label: "ELIMINATED",
    cls: "bg-red-50 text-red-500",
  },
};

const nextApp = (list: Candidate[]) =>
  `DOCT-2026-${String(list.length + 1).padStart(3, "0")}`;

// ═════════════════════════════════════════════════════════════════════════════
export const CandidatesPage = () => {
  const [candidates, setCandidates] = useState<Candidate[]>(INITIAL_CANDIDATES);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CandidateStatus | "ALL">(
    "ALL",
  );
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewCandidate, setViewCandidate] = useState<Candidate | null>(null);
  const [editCandidate, setEditCandidate] = useState<Candidate | null>(null);
  const [deactivateId, setDeactivateId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showConvocation, setShowConvocation] = useState(false);
  const [createStep, setCreateStep] = useState<1 | 2>(1);
  const [createDone, setCreateDone] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Candidate>>({});

  const blankForm = {
    name: "",
    nid: "",
    email: "",
    phone: "",
    specialty: SPECIALTIES[0],
    session: SESSIONS[0],
  };
  const [createForm, setCreateForm] = useState(blankForm);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Filtering ─────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return candidates.filter((c) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.appNum.toLowerCase().includes(q) ||
        c.nid.includes(q);
      const matchStatus = statusFilter === "ALL" || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [candidates, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const resetPage = () => setPage(1);

  // ── Select ────────────────────────────────────────────────────────────────
  const toggleSelect = (id: string) =>
    setSelectedIds((p) =>
      p.includes(id) ? p.filter((i) => i !== id) : [...p, id],
    );
  const toggleSelectAll = () =>
    setSelectedIds((p) =>
      p.length === pageData.length ? [] : pageData.map((c) => c.id),
    );

  // ── Export ────────────────────────────────────────────────────────────────
  const handleExport = () => {
    const rows = [
      [
        "App #",
        "Name",
        "NID",
        "Email",
        "Phone",
        "Status",
        "Session",
        "Specialty",
      ],
    ];
    const data = selectedIds.length
      ? candidates.filter((c) => selectedIds.includes(c.id))
      : candidates;
    data.forEach((c) =>
      rows.push([
        c.appNum,
        c.name,
        c.nid,
        c.email,
        c.phone,
        c.status,
        c.session,
        c.specialty,
      ]),
    );
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "candidates.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Import CSV ────────────────────────────────────────────────────────────
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const lines = (ev.target?.result as string).trim().split("\n").slice(1);
      const imported: Candidate[] = lines.map((line, i) => {
        const [appNum, name, nid, email, phone, status, session, specialty] =
          line.split(",");
        return {
          id: String(candidates.length + i + 1),
          appNum: appNum?.trim() || nextApp(candidates),
          name: name?.trim() || "Unknown",
          nid: nid?.trim() || "",
          email: email?.trim() || "",
          phone: phone?.trim() || "",
          status:
            (status?.trim() as CandidateStatus) || CandidateStatus.REGISTERED,
          session: session?.trim() || SESSIONS[0],
          specialty: specialty?.trim() || SPECIALTIES[0],
        };
      });
      setCandidates((p) => [...p, ...imported]);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // ── Deactivate ────────────────────────────────────────────────────────────
  const confirmDeactivate = () => {
    if (deactivateId && deactivateId !== "__bulk__") {
      setCandidates((p) =>
        p.map((c) =>
          c.id === deactivateId
            ? { ...c, status: CandidateStatus.ELIMINATED }
            : c,
        ),
      );
    } else {
      setCandidates((p) =>
        p.map((c) =>
          selectedIds.includes(c.id)
            ? { ...c, status: CandidateStatus.ELIMINATED }
            : c,
        ),
      );
      setSelectedIds([]);
    }
    setDeactivateId(null);
  };

  // ── Edit ──────────────────────────────────────────────────────────────────
  const saveEdit = () => {
    if (!editCandidate) return;
    setCandidates((p) =>
      p.map((c) => (c.id === editCandidate.id ? { ...c, ...editForm } : c)),
    );
    setEditCandidate(null);
  };

  // ── Create ────────────────────────────────────────────────────────────────
  const openCreate = () => {
    setCreateForm(blankForm);
    setCreateStep(1);
    setCreateDone(false);
    setShowCreateModal(true);
  };
  const submitCreate = () => {
    if (createStep === 1) {
      setCreateStep(2);
      return;
    }
    setCandidates((p) => [
      ...p,
      {
        id: String(p.length + 1),
        appNum: nextApp(p),
        name: createForm.name,
        nid: createForm.nid,
        email: createForm.email,
        phone: createForm.phone,
        specialty: createForm.specialty,
        session: createForm.session,
        status: CandidateStatus.REGISTERED,
      },
    ]);
    setCreateDone(true);
  };

  // ── Pagination ────────────────────────────────────────────────────────────
  const pagesArr = () => {
    if (totalPages <= 5)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 3) return [1, 2, 3, "...", totalPages];
    if (page >= totalPages - 2)
      return [1, "...", totalPages - 2, totalPages - 1, totalPages];
    return [1, "...", page - 1, page, page + 1, "...", totalPages];
  };

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <AppShell title="Candidate Management">
      {/* ── HEIGHT CHAIN: h-full flex flex-col fills AppShell's passthrough div ── */}
      <div className="h-full flex flex-col gap-3">
        {/* ── Toolbar (shrink-0 = never grows, always fixed height) ── */}
        <div className="flex flex-col gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-lg">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9B9B9B]"
                size={16}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  resetPage();
                }}
                placeholder="Search by name, application #, or ID..."
                className="w-full pl-9 pr-4 py-2.5 text-[13px] border border-[#EBEBEB] rounded-lg bg-white outline-none focus:ring-2 focus:ring-[#8B7355]/20 focus:border-[#8B7355] transition-all"
              />
            </div>
            <button
              onClick={() => setShowFilters((p) => !p)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg border text-[13px] font-semibold transition-all",
                showFilters
                  ? "bg-[#8B7355] text-white border-[#8B7355]"
                  : "bg-white border-[#EBEBEB] text-[#555] hover:border-[#8B7355] hover:text-[#8B7355]",
              )}
            >
              <Filter size={15} /> Filters
            </button>
            <div className="flex-1" />
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#EBEBEB] bg-white text-[13px] font-semibold text-[#555] hover:border-[#8B7355] hover:text-[#8B7355] transition-all"
            >
              <Download size={15} /> Export{" "}
              {selectedIds.length > 0 && `(${selectedIds.length})`}
            </button>
            <label className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#EBEBEB] bg-white text-[13px] font-semibold text-[#555] hover:border-[#8B7355] hover:text-[#8B7355] transition-all cursor-pointer">
              <Upload size={15} /> Import CSV
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleImport}
              />
            </label>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#8B7355] text-white text-[13px] font-bold hover:bg-[#7a6348] transition-all shadow-sm"
            >
              <Plus size={15} /> Add Candidate
            </button>
          </div>

          {/* Filter bar */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[12px] text-[#9B9B9B] font-semibold uppercase tracking-wider">
                    Status:
                  </span>
                  {(
                    [
                      "ALL",
                      CandidateStatus.REGISTERED,
                      CandidateStatus.PRESENT,
                      CandidateStatus.ELIMINATED,
                    ] as const
                  ).map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setStatusFilter(s);
                        resetPage();
                      }}
                      className={cn(
                        "px-3 py-1 rounded-full text-[12px] font-bold border transition-all",
                        statusFilter === s
                          ? "bg-[#8B7355] text-white border-[#8B7355]"
                          : "bg-white border-[#EBEBEB] text-[#555] hover:border-[#8B7355]",
                      )}
                    >
                      {s === "ALL" ? "All" : s}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bulk actions bar */}
          <AnimatePresence>
            {selectedIds.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-[#F0EDE7] border border-[#8B7355]/20"
              >
                <span className="text-[13px] font-semibold text-[#8B7355]">
                  {selectedIds.length} candidate
                  {selectedIds.length > 1 ? "s" : ""} selected
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowConvocation(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-semibold text-[#8B7355] hover:bg-[#8B7355]/10 transition-colors"
                  >
                    <Mail size={14} /> Send Convocation
                  </button>
                  <button
                    onClick={() => setDeactivateId("__bulk__")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-semibold text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <UserX size={14} /> Deactivate
                  </button>
                  <button
                    onClick={() => setSelectedIds([])}
                    className="p-1.5 rounded-md text-[#9B9B9B] hover:text-[#555] transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Table Card — flex-1 min-h-0 fills ALL remaining height ── */}
        <Card className="p-0 flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[40px_1.4fr_2fr_1.5fr_1.2fr_1.2fr_120px] px-5 py-3 bg-[#FAFAFA] border-b border-[#F0F0F0] shrink-0">
            <div className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-[#CACACA] accent-[#8B7355]"
                checked={
                  pageData.length > 0 && selectedIds.length === pageData.length
                }
                onChange={toggleSelectAll}
              />
            </div>
            {[
              "App #",
              "Full Name",
              "National ID",
              "Status",
              "Session",
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

          {/* Rows — flex-1 overflow-y-auto = scrolls inside the card */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#F5F5F5]">
            {pageData.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-[#9B9B9B] gap-2 py-16">
                <Search size={32} className="opacity-30" />
                <p className="text-[13px]">No candidates match your search.</p>
              </div>
            )}
            {pageData.map((c) => (
              <div
                key={c.id}
                className={cn(
                  "grid grid-cols-[40px_1.4fr_2fr_1.5fr_1.2fr_1.2fr_120px] items-center px-5 py-3.5 hover:bg-[#FAFAFA] transition-colors group",
                  selectedIds.includes(c.id) && "bg-[#F0EDE7]/30",
                )}
              >
                <input
                  type="checkbox"
                  className="rounded border-[#CACACA] accent-[#8B7355]"
                  checked={selectedIds.includes(c.id)}
                  onChange={() => toggleSelect(c.id)}
                />
                <span className="text-[12px] font-mono font-semibold text-[#555]">
                  {c.appNum}
                </span>
                <div>
                  <p className="text-[13px] font-bold text-[#1A1A1A]">
                    {c.name}
                  </p>
                  <p className="text-[11px] text-[#9B9B9B]">{c.email}</p>
                </div>
                <span className="text-[12px] text-[#555] font-mono">
                  {c.nid}
                </span>
                <span
                  className={cn(
                    "text-[11px] font-bold px-2.5 py-1 rounded-md w-fit",
                    statusCfg[c.status]?.cls,
                  )}
                >
                  {statusCfg[c.status]?.label}
                </span>
                <span className="text-[12px] text-[#9B9B9B]">{c.session}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setViewCandidate(c)}
                    className="p-1.5 rounded hover:bg-[#F0EDE7] text-[#9B9B9B] hover:text-[#8B7355] transition-colors"
                    title="View"
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    onClick={() => {
                      setEditCandidate(c);
                      setEditForm({
                        name: c.name,
                        email: c.email,
                        phone: c.phone,
                        specialty: c.specialty,
                        status: c.status,
                      });
                    }}
                    className="p-1.5 rounded hover:bg-[#F0EDE7] text-[#9B9B9B] hover:text-[#8B7355] transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => setDeactivateId(c.id)}
                    className="p-1.5 rounded hover:bg-red-50 text-[#9B9B9B] hover:text-red-500 transition-colors"
                    title="Deactivate"
                  >
                    <UserX size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination — shrink-0 always visible at bottom */}
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#F0F0F0] shrink-0">
            <p className="text-[12px] text-[#9B9B9B]">
              Showing{" "}
              <span className="font-bold text-[#1A1A1A]">
                {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, filtered.length)}
              </span>{" "}
              of{" "}
              <span className="font-bold text-[#1A1A1A]">
                {filtered.length}
              </span>
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-[#EBEBEB] text-[#9B9B9B] hover:border-[#8B7355] hover:text-[#8B7355] disabled:opacity-30 disabled:pointer-events-none transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              {pagesArr().map((p, i) =>
                p === "..." ? (
                  <span
                    key={`dots-${i}`}
                    className="w-8 text-center text-[#9B9B9B] text-[13px]"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(Number(p))}
                    className={cn(
                      "w-8 h-8 rounded-lg text-[13px] font-bold border transition-all",
                      page === p
                        ? "bg-[#8B7355] text-white border-[#8B7355]"
                        : "border-[#EBEBEB] text-[#555] hover:border-[#8B7355] hover:text-[#8B7355]",
                    )}
                  >
                    {p}
                  </button>
                ),
              )}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-[#EBEBEB] text-[#9B9B9B] hover:border-[#8B7355] hover:text-[#8B7355] disabled:opacity-30 disabled:pointer-events-none transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </Card>
      </div>
      {/* end h-full wrapper */}

      {/* ══ VIEW MODAL ══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {viewCandidate && (
          <Modal
            onClose={() => setViewCandidate(null)}
            title="Candidate Profile"
            icon={<User size={20} className="text-[#8B7355]" />}
          >
            <div className="space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b border-[#F0F0F0]">
                <div className="w-14 h-14 rounded-2xl bg-[#F0EDE7] flex items-center justify-center text-[#8B7355] font-black text-xl">
                  {viewCandidate.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div>
                  <h3 className="text-[17px] font-bold text-[#1A1A1A]">
                    {viewCandidate.name}
                  </h3>
                  <p className="text-[12px] text-[#9B9B9B]">
                    {viewCandidate.appNum}
                  </p>
                </div>
                <span
                  className={cn(
                    "ml-auto text-[11px] font-bold px-3 py-1 rounded-full",
                    statusCfg[viewCandidate.status]?.cls,
                  )}
                >
                  {statusCfg[viewCandidate.status]?.label}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Hash, label: "National ID", val: viewCandidate.nid },
                  { icon: AtSign, label: "Email", val: viewCandidate.email },
                  { icon: Phone, label: "Phone", val: viewCandidate.phone },
                  {
                    icon: BookOpen,
                    label: "Specialty",
                    val: viewCandidate.specialty,
                  },
                  {
                    icon: Calendar,
                    label: "Session",
                    val: viewCandidate.session,
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="p-3 rounded-xl bg-[#FAFAFA] border border-[#F0F0F0]"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <row.icon size={13} className="text-[#8B7355]" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9B9B9B]">
                        {row.label}
                      </span>
                    </div>
                    <p className="text-[13px] font-semibold text-[#1A1A1A]">
                      {row.val}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setViewCandidate(null);
                    setEditCandidate(viewCandidate);
                    setEditForm({
                      name: viewCandidate.name,
                      email: viewCandidate.email,
                      phone: viewCandidate.phone,
                      specialty: viewCandidate.specialty,
                      status: viewCandidate.status,
                    });
                  }}
                  className="flex-1 py-2.5 rounded-lg bg-[#F0EDE7] text-[#8B7355] text-[13px] font-bold hover:bg-[#8B7355] hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  <Edit2 size={14} /> Edit
                </button>
                <button
                  onClick={() => setViewCandidate(null)}
                  className="flex-1 py-2.5 rounded-lg border border-[#EBEBEB] text-[#555] text-[13px] font-semibold hover:bg-[#F5F5F5] transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* ══ EDIT MODAL ══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {editCandidate && (
          <Modal
            onClose={() => setEditCandidate(null)}
            title="Edit Candidate"
            icon={<Edit2 size={18} className="text-[#8B7355]" />}
          >
            <div className="space-y-3">
              <Field label="Full Name" icon={<User size={13} />}>
                <input
                  value={editForm.name || ""}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, name: e.target.value }))
                  }
                  className="field-input"
                />
              </Field>
              <Field label="Email" icon={<AtSign size={13} />}>
                <input
                  value={editForm.email || ""}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, email: e.target.value }))
                  }
                  className="field-input"
                  type="email"
                />
              </Field>
              <Field label="Phone" icon={<Phone size={13} />}>
                <input
                  value={editForm.phone || ""}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, phone: e.target.value }))
                  }
                  className="field-input"
                />
              </Field>
              <Field label="Specialty" icon={<BookOpen size={13} />}>
                <select
                  value={editForm.specialty || ""}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, specialty: e.target.value }))
                  }
                  className="field-input"
                >
                  {SPECIALTIES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
              <Field label="Status" icon={<CheckCircle2 size={13} />}>
                <select
                  value={editForm.status || ""}
                  onChange={(e) =>
                    setEditForm((p) => ({
                      ...p,
                      status: e.target.value as CandidateStatus,
                    }))
                  }
                  className="field-input"
                >
                  {Object.values(CandidateStatus).map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={saveEdit}
                  className="flex-1 py-2.5 rounded-lg bg-[#8B7355] text-white text-[13px] font-bold hover:bg-[#7a6348] transition-all flex items-center justify-center gap-2"
                >
                  <Check size={14} /> Save Changes
                </button>
                <button
                  onClick={() => setEditCandidate(null)}
                  className="flex-1 py-2.5 rounded-lg border border-[#EBEBEB] text-[#555] text-[13px] font-semibold hover:bg-[#F5F5F5] transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* ══ DEACTIVATE MODAL ════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {deactivateId !== null && (
          <Modal
            onClose={() => setDeactivateId(null)}
            title="Confirm Deactivation"
            icon={<AlertTriangle size={18} className="text-red-500" />}
            danger
          >
            <div className="space-y-4">
              <p className="text-[13px] text-[#555] leading-relaxed">
                {deactivateId === "__bulk__"
                  ? `You're about to deactivate ${selectedIds.length} candidate(s). They will be marked as ELIMINATED.`
                  : `You're about to deactivate "${candidates.find((c) => c.id === deactivateId)?.name}". They will be marked as ELIMINATED.`}
              </p>
              <p className="text-[12px] text-red-400 bg-red-50 rounded-lg p-3 border border-red-100">
                This action can be reversed later by editing the candidate's
                status.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={confirmDeactivate}
                  className="flex-1 py-2.5 rounded-lg bg-red-500 text-white text-[13px] font-bold hover:bg-red-600 transition-all flex items-center justify-center gap-2"
                >
                  <UserX size={14} /> Deactivate
                </button>
                <button
                  onClick={() => setDeactivateId(null)}
                  className="flex-1 py-2.5 rounded-lg border border-[#EBEBEB] text-[#555] text-[13px] font-semibold hover:bg-[#F5F5F5] transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* ══ CONVOCATION MODAL ═══════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showConvocation && (
          <Modal
            onClose={() => setShowConvocation(false)}
            title="Send Convocation"
            icon={<Mail size={18} className="text-[#8B7355]" />}
          >
            <div className="space-y-4">
              <p className="text-[13px] text-[#555]">
                Send convocation emails to{" "}
                <span className="font-bold text-[#1A1A1A]">
                  {selectedIds.length} candidate(s)
                </span>
                . They will receive their exam schedule and room assignment.
              </p>
              <div className="p-3 bg-[#FAFAFA] rounded-xl border border-[#F0F0F0] space-y-1 max-h-36 overflow-auto">
                {candidates
                  .filter((c) => selectedIds.includes(c.id))
                  .map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-2 text-[12px] text-[#555]"
                    >
                      <AtSign size={11} className="text-[#8B7355]" /> {c.name} —{" "}
                      {c.email}
                    </div>
                  ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowConvocation(false);
                    setSelectedIds([]);
                  }}
                  className="flex-1 py-2.5 rounded-lg bg-[#8B7355] text-white text-[13px] font-bold hover:bg-[#7a6348] transition-all flex items-center justify-center gap-2"
                >
                  <Mail size={14} /> Send Now
                </button>
                <button
                  onClick={() => setShowConvocation(false)}
                  className="flex-1 py-2.5 rounded-lg border border-[#EBEBEB] text-[#555] text-[13px] font-semibold hover:bg-[#F5F5F5] transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* ══ ADD CANDIDATE MODAL ═════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget && !createDone)
                setShowCreateModal(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 18 }}
              transition={{ type: "spring", damping: 22, stiffness: 260 }}
              className="bg-white rounded-2xl shadow-2xl w-[500px] max-w-[92vw] overflow-hidden"
            >
              <div className="px-7 pt-7 pb-5 border-b border-[#F0F0F0] flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F0EDE7] flex items-center justify-center text-[#8B7355]">
                  {createDone ? (
                    <CheckCircle2 size={20} />
                  ) : (
                    <Sparkles size={20} />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-[16px] font-bold text-[#1A1A1A]">
                    {createDone
                      ? "Candidate Added"
                      : createStep === 1
                        ? "New Candidate"
                        : "Review & Confirm"}
                  </h3>
                  <p className="text-[11px] text-[#9B9B9B]">
                    {createDone ? "Saved locally." : `Step ${createStep} of 2`}
                  </p>
                </div>
                {!createDone && (
                  <div className="flex items-center gap-1.5">
                    {[1, 2].map((s) => (
                      <div
                        key={s}
                        className={cn(
                          "w-2 h-2 rounded-full transition-all",
                          createStep === s
                            ? "bg-[#8B7355] w-4"
                            : "bg-[#EBEBEB]",
                        )}
                      />
                    ))}
                  </div>
                )}
                {!createDone && (
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-1.5 rounded-full hover:bg-[#F5F5F5] text-[#9B9B9B] transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="px-7 py-6">
                <AnimatePresence mode="wait">
                  {!createDone && createStep === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-3"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Full Name" icon={<User size={12} />}>
                          <input
                            value={createForm.name}
                            onChange={(e) =>
                              setCreateForm((p) => ({
                                ...p,
                                name: e.target.value,
                              }))
                            }
                            placeholder="Amine Benali"
                            className="field-input"
                          />
                        </Field>
                        <Field label="National ID" icon={<Hash size={12} />}>
                          <input
                            value={createForm.nid}
                            onChange={(e) =>
                              setCreateForm((p) => ({
                                ...p,
                                nid: e.target.value,
                              }))
                            }
                            placeholder="199201020304"
                            className="field-input"
                          />
                        </Field>
                        <Field label="Email" icon={<AtSign size={12} />}>
                          <input
                            value={createForm.email}
                            onChange={(e) =>
                              setCreateForm((p) => ({
                                ...p,
                                email: e.target.value,
                              }))
                            }
                            placeholder="a.benali@email.com"
                            className="field-input"
                            type="email"
                          />
                        </Field>
                        <Field label="Phone" icon={<Phone size={12} />}>
                          <input
                            value={createForm.phone}
                            onChange={(e) =>
                              setCreateForm((p) => ({
                                ...p,
                                phone: e.target.value,
                              }))
                            }
                            placeholder="0550123456"
                            className="field-input"
                          />
                        </Field>
                        <Field label="Specialty" icon={<BookOpen size={12} />}>
                          <select
                            value={createForm.specialty}
                            onChange={(e) =>
                              setCreateForm((p) => ({
                                ...p,
                                specialty: e.target.value,
                              }))
                            }
                            className="field-input"
                          >
                            {SPECIALTIES.map((s) => (
                              <option key={s}>{s}</option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Session" icon={<Calendar size={12} />}>
                          <select
                            value={createForm.session}
                            onChange={(e) =>
                              setCreateForm((p) => ({
                                ...p,
                                session: e.target.value,
                              }))
                            }
                            className="field-input"
                          >
                            {SESSIONS.map((s) => (
                              <option key={s}>{s}</option>
                            ))}
                          </select>
                        </Field>
                      </div>
                      <button
                        onClick={submitCreate}
                        disabled={
                          !createForm.name ||
                          !createForm.nid ||
                          !createForm.email
                        }
                        className="w-full mt-2 py-2.5 rounded-lg bg-[#8B7355] text-white text-[13px] font-bold hover:bg-[#7a6348] disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center gap-2"
                      >
                        Review <ChevronRight size={14} />
                      </button>
                    </motion.div>
                  )}
                  {!createDone && createStep === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <div className="p-4 bg-[#FAFAFA] rounded-xl border border-[#F0F0F0] space-y-3">
                        {[
                          ["Name", createForm.name],
                          ["NID", createForm.nid],
                          ["Email", createForm.email],
                          ["Phone", createForm.phone],
                          ["Specialty", createForm.specialty],
                          ["Session", createForm.session],
                        ].map(([label, val]) => (
                          <div
                            key={label}
                            className="flex items-center justify-between"
                          >
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9B9B9B]">
                              {label}
                            </span>
                            <span className="text-[13px] font-semibold text-[#1A1A1A]">
                              {val || "—"}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCreateStep(1)}
                          className="flex-1 py-2.5 rounded-lg border border-[#EBEBEB] text-[#555] text-[13px] font-semibold hover:bg-[#F5F5F5] transition-all flex items-center justify-center gap-1.5"
                        >
                          <ChevronLeft size={13} /> Back
                        </button>
                        <button
                          onClick={submitCreate}
                          className="flex-1 py-2.5 rounded-lg bg-[#8B7355] text-white text-[13px] font-bold hover:bg-[#7a6348] transition-all flex items-center justify-center gap-2"
                        >
                          <Check size={14} /> Confirm
                        </button>
                      </div>
                    </motion.div>
                  )}
                  {createDone && (
                    <motion.div
                      key="done"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center text-center py-4 gap-4"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
                        <CheckCircle2 size={32} className="text-emerald-500" />
                      </div>
                      <div>
                        <h4 className="text-[16px] font-bold text-[#1A1A1A] mb-1">
                          {createForm.name} added!
                        </h4>
                        <p className="text-[12px] text-[#9B9B9B]">
                          Candidate saved to the list.
                        </p>
                      </div>
                      <div className="flex gap-2 w-full">
                        <button
                          onClick={() => {
                            setCreateForm(blankForm);
                            setCreateStep(1);
                            setCreateDone(false);
                          }}
                          className="flex-1 py-2.5 rounded-lg bg-[#F0EDE7] text-[#8B7355] text-[13px] font-bold hover:bg-[#8B7355] hover:text-white transition-all"
                        >
                          Add Another
                        </button>
                        <button
                          onClick={() => setShowCreateModal(false)}
                          className="flex-1 py-2.5 rounded-lg border border-[#EBEBEB] text-[#555] text-[13px] font-semibold hover:bg-[#F5F5F5] transition-all"
                        >
                          Done
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
};

// ─── Reusable Modal ───────────────────────────────────────────────────────────
const Modal = ({
  children,
  onClose,
  title,
  icon,
  danger = false,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  danger?: boolean;
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
    <motion.div
      initial={{ opacity: 0, scale: 0.93, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.93, y: 16 }}
      transition={{ type: "spring", damping: 22, stiffness: 260 }}
      className="bg-white rounded-2xl shadow-2xl w-[440px] max-w-[92vw] overflow-hidden"
    >
      <div
        className={cn(
          "px-6 pt-6 pb-4 border-b flex items-center gap-3",
          danger ? "border-red-100" : "border-[#F0F0F0]",
        )}
      >
        {icon && (
          <div
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center",
              danger ? "bg-red-50" : "bg-[#F0EDE7]",
            )}
          >
            {icon}
          </div>
        )}
        <h3 className="text-[15px] font-bold text-[#1A1A1A] flex-1">{title}</h3>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-[#F5F5F5] text-[#9B9B9B] transition-colors"
        >
          <X size={16} />
        </button>
      </div>
      <div className="px-6 py-5">{children}</div>
    </motion.div>
  </motion.div>
);

// ─── Field helper ─────────────────────────────────────────────────────────────
const Field = ({
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
      {icon && <span className="text-[#8B7355]">{icon}</span>} {label}
    </label>
    <style>{`.field-input{width:100%;padding:8px 12px;font-size:13px;border:1px solid #EBEBEB;border-radius:8px;outline:none;background:white;transition:all .15s}.field-input:focus{border-color:#8B7355;box-shadow:0 0 0 3px rgba(139,115,85,.12)}`}</style>
    {children}
  </div>
);
