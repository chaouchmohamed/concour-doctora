import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  Search, Filter, Download, Upload, Mail, Eye, Edit2, UserX,
  ChevronLeft, ChevronRight, Plus, X, Check, AlertTriangle,
  User, Phone, AtSign, Hash, BookOpen, Calendar, CheckCircle2,
  Sparkles, FileSpreadsheet, Loader2, FileCheck, FileX,
} from "lucide-react";
import { AppShell } from "../components/AppShell";
import { Card } from "../components/UI";
import { CandidateStatus } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../constants";
import { api, Candidate as ApiCandidate, ExamSession } from "../lib/api";
import * as XLSX from "xlsx";
import defaultCandidateWorkbookUrl from "../../List-Candidat_Progres.xlsx?url";

// ─── Local type ───────────────────────────────────────────────────────────────
type Candidate = {
  id: string; appNum: string; name: string; nid: string;
  email: string; phone: string; status: CandidateStatus;
  session: string; sessionId: number; specialty: string;
  dateOfBirth: string; placeOfBirth: string; address: string;
};

const SPECIALTIES = ["Cardiology","Neurology","Pediatrics","Surgery","Radiology","Oncology","Psychiatry"];
const PAGE_SIZE = 7;
const CANDIDATE_STATUSES = [
  CandidateStatus.REGISTERED,
  CandidateStatus.PRESENT,
  CandidateStatus.ELIMINATED,
] as const;
type EditableCandidateStatus = (typeof CANDIDATE_STATUSES)[number];

const statusCfg = {
  [CandidateStatus.REGISTERED]: { label: "REGISTERED", cls: "bg-[#F0EDE7] text-[#8B7355]" },
  [CandidateStatus.PRESENT]:    { label: "PRESENT",    cls: "bg-emerald-50 text-emerald-600" },
  [CandidateStatus.ELIMINATED]: { label: "ELIMINATED", cls: "bg-red-50 text-red-500" },
};

// ─── Import-row types ─────────────────────────────────────────────────────────
type ImportRow = {
  first_name: string; last_name: string; name: string;
  email: string; phone: string; national_id: string;
  date_of_birth: string; place_of_birth: string; address: string; specialty: string;
};
type RowStatus = { row: ImportRow; status: "pending" | "ok" | "error"; error?: string };

const normalizeHeader = (value: unknown) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const cleanCell = (value: unknown) => String(value ?? "").trim().replace(/\s+/g, " ");

const toIsoDate = (value: unknown) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().split("T")[0];
  }
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      return `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`;
    }
  }
  const raw = cleanCell(value);
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parts = raw.split(/[/-]/);
  if (parts.length === 3) {
    const [a, b, c] = parts;
    return a.length === 4
      ? `${a}-${b.padStart(2, "0")}-${c.padStart(2, "0")}`
      : `${c}-${b.padStart(2, "0")}-${a.padStart(2, "0")}`;
  }
  return "";
};

const parseCandidateWorkbook = (data: ArrayBuffer): RowStatus[] => {
  const wb = XLSX.read(data, { type: "array", cellDates: true });
  const rows: RowStatus[] = [];
  const seen = new Set<string>();

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const raw = XLSX.utils.sheet_to_json<unknown[]>(ws, {
      header: 1,
      defval: null,
      blankrows: false,
    }) as unknown[][];

    let headerIndex = -1;
    for (let i = 0; i < raw.length; i++) {
      const haystack = raw[i].map(normalizeHeader).join(" ");
      if (haystack.includes("mail") && haystack.includes("nom")) {
        headerIndex = i;
        break;
      }
    }
    if (headerIndex === -1) continue;

    const headers = raw[headerIndex].map(normalizeHeader);
    const col = (...keys: string[]) => {
      const normalizedKeys = keys.map(normalizeHeader);
      for (const key of normalizedKeys) {
        const index = headers.findIndex((header) => header.includes(key));
        if (index !== -1) return index;
      }
      return -1;
    };

    const iCandidateNumber = col("matricule candidat", "matricule can");
    const iBacNumber = col("matricule_bac", "matricule bac");
    const iLastName = col("nom fr");
    const iFirstName = col("prenom fr", "prenom f");
    const iDob = col("date de naissance", "date nais");
    const iPob = col("lieu naissance", "lieu de nais");
    const iPhone = col("telephone", "tel");
    const iEmail = col("mail", "email");
    const iAddress = col("adresse");
    const iField = col("filiere");
    const iSpecialty = col("specialite diplome", "specialite");

    for (let r = headerIndex + 1; r < raw.length; r++) {
      const row = raw[r];
      const email = cleanCell(row[iEmail]).toLowerCase();
      if (!email || !email.includes("@")) continue;

      const nationalIdSource = cleanCell(row[iBacNumber]) || cleanCell(row[iCandidateNumber]);
      const national_id = nationalIdSource.replace(/\D/g, "").padStart(18, "0").slice(-18);
      if (!national_id || national_id === "000000000000000000") continue;

      const first_name = cleanCell(row[iFirstName]);
      const last_name = cleanCell(row[iLastName]);
      if (!first_name && !last_name) continue;

      const duplicateKey = `${email}:${national_id}`;
      if (seen.has(duplicateKey)) continue;
      seen.add(duplicateKey);

      const specialty = cleanCell(row[iSpecialty]) || cleanCell(row[iField]) || "Informatique";
      rows.push({
        row: {
          first_name,
          last_name,
          name: `${first_name} ${last_name}`.trim(),
          email,
          phone: cleanCell(row[iPhone]).replace(/[^\d+]/g, ""),
          national_id,
          date_of_birth: toIsoDate(row[iDob]) || "1990-01-01",
          place_of_birth: cleanCell(row[iPob]) || "Algeria",
          address: cleanCell(row[iAddress]) || "Algeria",
          specialty,
        },
        status: "pending",
      });
    }
  }

  return rows;
};

// ═════════════════════════════════════════════════════════════════════════════
export const CandidatesPage = () => {
  // map API → local
  const mapC = (c: ApiCandidate): Candidate => ({
    id: String(c.id), appNum: c.application_number,
    name: `${c.first_name} ${c.last_name}`.trim() || c.full_name, nid: c.national_id,
    email: c.email, phone: c.phone,
    status: c.status as CandidateStatus,
    session: c.exam_session_name ?? "", sessionId: c.exam_session,
    specialty: "", dateOfBirth: c.date_of_birth,
    placeOfBirth: c.place_of_birth, address: c.address,
  });
  const splitName = (v: string) => {
    const [first, ...rest] = v.trim().split(/\s+/);
    return { first_name: first ?? "", last_name: rest.join(" ") };
  };

  // ── state ──────────────────────────────────────────────────────────────────
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [sessions, setSessions]     = useState<ExamSession[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatusFilter] = useState<CandidateStatus | "ALL">("ALL");
  const [showFilters, setShowFilters]   = useState(false);
  const [page, setPage]             = useState(1);
  const [selectedIds, setSelectedIds]   = useState<string[]>([]);
  const [viewC, setViewC]           = useState<Candidate | null>(null);
  const [editC, setEditC]           = useState<Candidate | null>(null);
  const [editForm, setEditForm]     = useState<Partial<Candidate>>({});
  const [deactivateId, setDeactivateId] = useState<string | null>(null);
  const [showConvoc, setShowConvoc] = useState(false);

  // create modal
  const blankCreate = { name:"",nid:"",email:"",phone:"",dateOfBirth:"",placeOfBirth:"",address:"",specialty:SPECIALTIES[0],session:"" };
  const [showCreate, setShowCreate] = useState(false);
  const [createStep, setCreateStep] = useState<1|2>(1);
  const [createDone, setCreateDone] = useState(false);
  const [createForm, setCreateForm] = useState(blankCreate);

  // xlsx import modal
  const [importRows, setImportRows]       = useState<RowStatus[]>([]);
  const [importSession, setImportSession] = useState<number | null>(null);
  const [importRunning, setImportRunning] = useState(false);
  const [importDone, setImportDone]       = useState(false);
  const [showImport, setShowImport]       = useState(false);

  const csvRef  = useRef<HTMLInputElement>(null);
  const xlsxRef = useRef<HTMLInputElement>(null);

  // ── data loading ────────────────────────────────────────────────────────────
  const refresh = useCallback(() => {
    setLoading(true);
    Promise.all([api.candidates.listAll(), api.sessions.list()])
      .then(([candidateResults, sr]) => {
        setCandidates(candidateResults.map(mapC));
        setSessions(sr.results);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  // ── filtering / pagination ──────────────────────────────────────────────────
  const filtered = useMemo(() => candidates.filter(c => {
    const q = search.toLowerCase();
    return (!q || c.name.toLowerCase().includes(q) || c.appNum.toLowerCase().includes(q) || c.nid.includes(q))
      && (statusFilter === "ALL" || c.status === statusFilter);
  }), [candidates, search, statusFilter]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData   = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  // ── select ──────────────────────────────────────────────────────────────────
  const toggleSel = (id: string) => setSelectedIds(p => p.includes(id) ? p.filter(i=>i!==id) : [...p,id]);
  const toggleAll = () => setSelectedIds(p => p.length===pageData.length ? [] : pageData.map(c=>c.id));

  // ── export CSV ──────────────────────────────────────────────────────────────
  const handleExport = () => {
    const data = selectedIds.length ? candidates.filter(c => selectedIds.includes(c.id)) : candidates;
    const rows = [["App #","Name","NID","Email","Phone","Status","Session"],
      ...data.map(c => [c.appNum,c.name,c.nid,c.email,c.phone,c.status,c.session])];
    const blob = new Blob([rows.map(r=>r.join(",")).join("\n")],{type:"text/csv"});
    const a = document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="candidates.csv"; a.click();
  };

  // ── import CSV (legacy backend endpoint) ────────────────────────────────────
  const handleCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    e.target.value = "";
    const target = sessions.find(s=>s.status==="ACTIVE") ?? sessions.find(s=>s.status==="DRAFT") ?? sessions[0];
    if (!target) return;
    void api.candidates.importCsv(file, target.id).then(refresh).catch(console.error);
  };

  const openImportReview = (rows: RowStatus[]) => {
    if (rows.length === 0) {
      alert("No valid candidate rows found.");
      return;
    }
    const def = sessions.find(s=>s.status==="ACTIVE") ?? sessions.find(s=>s.status==="DRAFT") ?? sessions[0];
    setImportRows(rows);
    setImportSession(def?.id ?? null);
    setImportDone(false);
    setImportRunning(false);
    setShowImport(true);
  };

  // ── parse XLSX client-side ──────────────────────────────────────────────────
  const handleXlsx = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    e.target.value = "";
    try {
      openImportReview(parseCandidateWorkbook(await file.arrayBuffer()));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not read Excel file.");
    }
  };

  const handleBundledXlsx = async () => {
    try {
      const res = await fetch(defaultCandidateWorkbookUrl);
      if (!res.ok) throw new Error("Could not load List-Candidat_Progres.xlsx from the frontend bundle.");
      openImportReview(parseCandidateWorkbook(await res.arrayBuffer()));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not load bundled Excel file.");
    }
  };

  const runImport = async () => {
    if (!importSession) return;
    setImportRunning(true);
    const upd = [...importRows];
    for (let i=0; i<upd.length; i++) {
      if (upd[i].status==="ok") continue;
      const { first_name, last_name, email, phone, national_id, date_of_birth, place_of_birth, address } = upd[i].row;
      try {
        await api.candidates.create({ first_name, last_name, email, phone, national_id, date_of_birth, place_of_birth, address, exam_session:importSession });
        upd[i] = {...upd[i], status:"ok"};
      } catch(err:unknown) {
        upd[i] = {...upd[i], status:"error", error:err instanceof Error ? err.message : String(err)};
      }
      setImportRows([...upd]);
    }
    setImportRunning(false);
    setImportDone(true);
    refresh();
  };

  // ── deactivate ──────────────────────────────────────────────────────────────
  const confirmDeactivate = () => {
    const ids = deactivateId && deactivateId!=="__bulk__" ? [deactivateId] : selectedIds;
    void Promise.all(ids.map(id => api.candidates.update(Number(id),{status:CandidateStatus.ELIMINATED})))
      .then(()=>{setDeactivateId(null);setSelectedIds([]);refresh();}).catch(console.error);
  };

  // ── edit ────────────────────────────────────────────────────────────────────
  const saveEdit = () => {
    if (!editC) return;
    const {first_name,last_name} = splitName(editForm.name || editC.name);
    void api.candidates.update(Number(editC.id),{first_name,last_name,email:editForm.email,phone:editForm.phone,status:editForm.status as EditableCandidateStatus,date_of_birth:editForm.dateOfBirth||editC.dateOfBirth,place_of_birth:editForm.placeOfBirth||editC.placeOfBirth,address:editForm.address||editC.address,exam_session:editC.sessionId})
      .then(()=>{setEditC(null);refresh();}).catch(console.error);
  };

  // ── create ──────────────────────────────────────────────────────────────────
  const openCreate = () => {
    const def = sessions.find(s=>s.status==="ACTIVE") ?? sessions.find(s=>s.status==="DRAFT") ?? sessions[0];
    setCreateForm({...blankCreate, session:def?.name??""});
    setCreateStep(1); setCreateDone(false); setShowCreate(true);
  };
  const submitCreate = () => {
    if (createStep===1) { setCreateStep(2); return; }
    const target = sessions.find(s=>s.name===createForm.session); if (!target) return;
    const {first_name,last_name} = splitName(createForm.name);
    void api.candidates.create({first_name,last_name,national_id:createForm.nid.replace(/\D/g,""),email:createForm.email,phone:createForm.phone,date_of_birth:createForm.dateOfBirth,place_of_birth:createForm.placeOfBirth,address:createForm.address,exam_session:target.id})
      .then(()=>{setCreateDone(true);refresh();}).catch(console.error);
  };

  // ── pagination ──────────────────────────────────────────────────────────────
  const pagesArr = () => {
    if (totalPages<=5) return Array.from({length:totalPages},(_,i)=>i+1);
    if (page<=3) return [1,2,3,"...",totalPages];
    if (page>=totalPages-2) return [1,"...",totalPages-2,totalPages-1,totalPages];
    return [1,"...",page-1,page,page+1,"...",totalPages];
  };

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <AppShell title="Candidate Management">
      <div className="h-full flex flex-col gap-3">

        {/* ── Toolbar ── */}
        <div className="flex flex-col gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9B9B9B]" size={16}/>
              <input type="text" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}
                placeholder="Search by name, application #, or ID..."
                className="w-full pl-9 pr-4 py-2.5 text-[13px] border border-[#EBEBEB] rounded-lg bg-white outline-none focus:ring-2 focus:ring-[#8B7355]/20 focus:border-[#8B7355] transition-all"/>
            </div>
            <button onClick={()=>setShowFilters(p=>!p)}
              className={cn("flex items-center gap-2 px-4 py-2.5 rounded-lg border text-[13px] font-semibold transition-all",
                showFilters?"bg-[#8B7355] text-white border-[#8B7355]":"bg-white border-[#EBEBEB] text-[#555] hover:border-[#8B7355] hover:text-[#8B7355]")}>
              <Filter size={15}/> Filters
            </button>
            <div className="flex-1"/>
            <button onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#EBEBEB] bg-white text-[13px] font-semibold text-[#555] hover:border-[#8B7355] hover:text-[#8B7355] transition-all">
              <Download size={15}/> Export{selectedIds.length>0&&` (${selectedIds.length})`}
            </button>
            {/* Import Excel */}
            <button onClick={handleBundledXlsx}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-emerald-200 bg-white text-[13px] font-semibold text-emerald-700 hover:bg-emerald-50 transition-all">
              <FileSpreadsheet size={15}/> Load Progress List
            </button>
            <label className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-emerald-200 bg-emerald-50 text-[13px] font-semibold text-emerald-700 hover:bg-emerald-100 transition-all cursor-pointer">
              <FileSpreadsheet size={15}/> Import Excel
              <input ref={xlsxRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleXlsx}/>
            </label>
            {/* Import CSV */}
            <label className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#EBEBEB] bg-white text-[13px] font-semibold text-[#555] hover:border-[#8B7355] hover:text-[#8B7355] transition-all cursor-pointer">
              <Upload size={15}/> Import CSV
              <input ref={csvRef} type="file" accept=".csv" className="hidden" onChange={handleCsv}/>
            </label>
            <button onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#8B7355] text-white text-[13px] font-bold hover:bg-[#7a6348] transition-all shadow-sm">
              <Plus size={15}/> Add Candidate
            </button>
          </div>

          {/* Filter bar */}
          <AnimatePresence>
            {showFilters&&(
              <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}} className="overflow-hidden">
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[12px] text-[#9B9B9B] font-semibold uppercase tracking-wider">Status:</span>
                  {(["ALL",CandidateStatus.REGISTERED,CandidateStatus.PRESENT,CandidateStatus.ELIMINATED] as const).map(s=>(
                    <button key={s} onClick={()=>{setStatusFilter(s);setPage(1);}}
                      className={cn("px-3 py-1 rounded-full text-[12px] font-bold border transition-all",
                        statusFilter===s?"bg-[#8B7355] text-white border-[#8B7355]":"bg-white border-[#EBEBEB] text-[#555] hover:border-[#8B7355]")}>
                      {s==="ALL"?"All":s}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bulk actions */}
          <AnimatePresence>
            {selectedIds.length>0&&(
              <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}
                className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-[#F0EDE7] border border-[#8B7355]/20">
                <span className="text-[13px] font-semibold text-[#8B7355]">{selectedIds.length} candidate{selectedIds.length>1?"s":""} selected</span>
                <div className="flex items-center gap-2">
                  <button onClick={()=>setShowConvoc(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-semibold text-[#8B7355] hover:bg-[#8B7355]/10 transition-colors">
                    <Mail size={14}/> Send Convocation
                  </button>
                  <button onClick={()=>setDeactivateId("__bulk__")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-semibold text-red-500 hover:bg-red-50 transition-colors">
                    <UserX size={14}/> Deactivate
                  </button>
                  <button onClick={()=>setSelectedIds([])} className="p-1.5 rounded-md text-[#9B9B9B] hover:text-[#555] transition-colors"><X size={14}/></button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Table ── */}
        <Card className="p-0 flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="grid grid-cols-[40px_1.4fr_2fr_1.5fr_1.2fr_1.2fr_120px] px-5 py-3 bg-[#FAFAFA] border-b border-[#F0F0F0] shrink-0">
            <div className="flex items-center">
              <input type="checkbox" className="rounded border-[#CACACA] accent-[#8B7355]"
                checked={pageData.length>0&&selectedIds.length===pageData.length} onChange={toggleAll}/>
            </div>
            {["App #","Full Name","National ID","Status","Session","Actions"].map(col=>(
              <span key={col} className="text-[11px] font-semibold uppercase tracking-wider text-[#9B9B9B]">{col}</span>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#F5F5F5]">
            {loading&&<div className="flex items-center justify-center h-40"><Loader2 size={24} className="animate-spin text-[#8B7355]"/></div>}
            {!loading&&pageData.length===0&&(
              <div className="flex flex-col items-center justify-center h-full text-[#9B9B9B] gap-2 py-16">
                <Search size={32} className="opacity-30"/><p className="text-[13px]">No candidates match your search.</p>
              </div>
            )}
            {pageData.map(c=>(
              <div key={c.id} className={cn("grid grid-cols-[40px_1.4fr_2fr_1.5fr_1.2fr_1.2fr_120px] items-center px-5 py-3.5 hover:bg-[#FAFAFA] transition-colors group",selectedIds.includes(c.id)&&"bg-[#F0EDE7]/30")}>
                <input type="checkbox" className="rounded border-[#CACACA] accent-[#8B7355]" checked={selectedIds.includes(c.id)} onChange={()=>toggleSel(c.id)}/>
                <span className="text-[12px] font-mono font-semibold text-[#555]">{c.appNum}</span>
                <div><p className="text-[13px] font-bold text-[#1A1A1A]">{c.name}</p><p className="text-[11px] text-[#9B9B9B]">{c.email}</p></div>
                <span className="text-[12px] text-[#555] font-mono">{c.nid}</span>
                <span className={cn("text-[11px] font-bold px-2.5 py-1 rounded-md w-fit",statusCfg[c.status]?.cls)}>{statusCfg[c.status]?.label}</span>
                <span className="text-[12px] text-[#9B9B9B]">{c.session}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={()=>setViewC(c)} className="p-1.5 rounded hover:bg-[#F0EDE7] text-[#9B9B9B] hover:text-[#8B7355] transition-colors" title="View"><Eye size={14}/></button>
                  <button onClick={()=>{setEditC(c);setEditForm({name:c.name,email:c.email,phone:c.phone,dateOfBirth:c.dateOfBirth,placeOfBirth:c.placeOfBirth,address:c.address,status:c.status});}}
                    className="p-1.5 rounded hover:bg-[#F0EDE7] text-[#9B9B9B] hover:text-[#8B7355] transition-colors" title="Edit"><Edit2 size={14}/></button>
                  <button onClick={()=>setDeactivateId(c.id)} className="p-1.5 rounded hover:bg-red-50 text-[#9B9B9B] hover:text-red-500 transition-colors" title="Deactivate"><UserX size={14}/></button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#F0F0F0] shrink-0">
            <p className="text-[12px] text-[#9B9B9B]">
              Showing <span className="font-bold text-[#1A1A1A]">{filtered.length===0?0:(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE,filtered.length)}</span> of <span className="font-bold text-[#1A1A1A]">{filtered.length}</span>
            </p>
            <div className="flex items-center gap-1.5">
              <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
                className="p-1.5 rounded-lg border border-[#EBEBEB] text-[#9B9B9B] hover:border-[#8B7355] hover:text-[#8B7355] disabled:opacity-30 disabled:pointer-events-none transition-all">
                <ChevronLeft size={16}/>
              </button>
              {pagesArr().map((p,i)=>p==="..."
                ?<span key={`d${i}`} className="w-8 text-center text-[#9B9B9B] text-[13px]">…</span>
                :<button key={p} onClick={()=>setPage(Number(p))}
                  className={cn("w-8 h-8 rounded-lg text-[13px] font-bold border transition-all",
                    page===p?"bg-[#8B7355] text-white border-[#8B7355]":"border-[#EBEBEB] text-[#555] hover:border-[#8B7355] hover:text-[#8B7355]")}>{p}</button>
              )}
              <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
                className="p-1.5 rounded-lg border border-[#EBEBEB] text-[#9B9B9B] hover:border-[#8B7355] hover:text-[#8B7355] disabled:opacity-30 disabled:pointer-events-none transition-all">
                <ChevronRight size={16}/>
              </button>
            </div>
          </div>
        </Card>
      </div>

      {/* ══ VIEW MODAL ══ */}
      <AnimatePresence>
        {viewC&&(
          <Modal onClose={()=>setViewC(null)} title="Candidate Profile" icon={<User size={20} className="text-[#8B7355]"/>}>
            <div className="space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b border-[#F0F0F0]">
                <div className="w-14 h-14 rounded-2xl bg-[#F0EDE7] flex items-center justify-center text-[#8B7355] font-black text-xl">
                  {viewC.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
                </div>
                <div>
                  <h3 className="text-[17px] font-bold text-[#1A1A1A]">{viewC.name}</h3>
                  <p className="text-[12px] text-[#9B9B9B]">{viewC.appNum}</p>
                </div>
                <span className={cn("ml-auto text-[11px] font-bold px-3 py-1 rounded-full",statusCfg[viewC.status]?.cls)}>{statusCfg[viewC.status]?.label}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[{icon:Hash,label:"National ID",val:viewC.nid},{icon:AtSign,label:"Email",val:viewC.email},{icon:Phone,label:"Phone",val:viewC.phone},{icon:Calendar,label:"Session",val:viewC.session}].map(row=>(
                  <div key={row.label} className="p-3 rounded-xl bg-[#FAFAFA] border border-[#F0F0F0]">
                    <div className="flex items-center gap-2 mb-1"><row.icon size={13} className="text-[#8B7355]"/><span className="text-[10px] font-semibold uppercase tracking-wider text-[#9B9B9B]">{row.label}</span></div>
                    <p className="text-[13px] font-semibold text-[#1A1A1A]">{row.val}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={()=>{setViewC(null);setEditC(viewC);setEditForm({name:viewC.name,email:viewC.email,phone:viewC.phone,dateOfBirth:viewC.dateOfBirth,placeOfBirth:viewC.placeOfBirth,address:viewC.address,status:viewC.status});}}
                  className="flex-1 py-2.5 rounded-lg bg-[#F0EDE7] text-[#8B7355] text-[13px] font-bold hover:bg-[#8B7355] hover:text-white transition-all flex items-center justify-center gap-2">
                  <Edit2 size={14}/> Edit
                </button>
                <button onClick={()=>setViewC(null)} className="flex-1 py-2.5 rounded-lg border border-[#EBEBEB] text-[#555] text-[13px] font-semibold hover:bg-[#F5F5F5] transition-all">Close</button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* ══ EDIT MODAL ══ */}
      <AnimatePresence>
        {editC&&(
          <Modal onClose={()=>setEditC(null)} title="Edit Candidate" icon={<Edit2 size={18} className="text-[#8B7355]"/>}>
            <div className="space-y-3">
              {[{k:"name",label:"Full Name",icon:<User size={13}/>,type:"text"},{k:"email",label:"Email",icon:<AtSign size={13}/>,type:"email"},{k:"phone",label:"Phone",icon:<Phone size={13}/>,type:"text"},{k:"dateOfBirth",label:"Date of Birth",icon:<Calendar size={13}/>,type:"date"}].map(({k,label,icon,type})=>(
                <Field key={k} label={label} icon={icon}>
                  <input value={(editForm as Record<string,string>)[k]||""} onChange={e=>setEditForm(p=>({...p,[k]:e.target.value}))} className="field-input" type={type}/>
                </Field>
              ))}
              <Field label="Status" icon={<CheckCircle2 size={13}/>}>
                <select value={editForm.status||""} onChange={e=>setEditForm(p=>({...p,status:e.target.value as EditableCandidateStatus}))} className="field-input">
                  {CANDIDATE_STATUSES.map(s=><option key={s}>{s}</option>)}
                </select>
              </Field>
              <div className="flex gap-2 pt-2">
                <button onClick={saveEdit} className="flex-1 py-2.5 rounded-lg bg-[#8B7355] text-white text-[13px] font-bold hover:bg-[#7a6348] transition-all flex items-center justify-center gap-2"><Check size={14}/> Save</button>
                <button onClick={()=>setEditC(null)} className="flex-1 py-2.5 rounded-lg border border-[#EBEBEB] text-[#555] text-[13px] font-semibold hover:bg-[#F5F5F5] transition-all">Cancel</button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* ══ DEACTIVATE MODAL ══ */}
      <AnimatePresence>
        {deactivateId!==null&&(
          <Modal onClose={()=>setDeactivateId(null)} title="Confirm Deactivation" icon={<AlertTriangle size={18} className="text-red-500"/>} danger>
            <div className="space-y-4">
              <p className="text-[13px] text-[#555]">{deactivateId==="__bulk__"?`Deactivate ${selectedIds.length} candidate(s)?`:`Deactivate "${candidates.find(c=>c.id===deactivateId)?.name}"?`} They will be marked as ELIMINATED.</p>
              <div className="flex gap-2">
                <button onClick={confirmDeactivate} className="flex-1 py-2.5 rounded-lg bg-red-500 text-white text-[13px] font-bold hover:bg-red-600 transition-all flex items-center justify-center gap-2"><UserX size={14}/> Deactivate</button>
                <button onClick={()=>setDeactivateId(null)} className="flex-1 py-2.5 rounded-lg border border-[#EBEBEB] text-[#555] text-[13px] font-semibold hover:bg-[#F5F5F5] transition-all">Cancel</button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* ══ CONVOCATION MODAL ══ */}
      <AnimatePresence>
        {showConvoc&&(
          <Modal onClose={()=>setShowConvoc(false)} title="Send Convocation" icon={<Mail size={18} className="text-[#8B7355]"/>}>
            <div className="space-y-4">
              <p className="text-[13px] text-[#555]">Send convocation to <span className="font-bold">{selectedIds.length}</span> candidate(s).</p>
              <div className="flex gap-2">
                <button onClick={()=>{
                  api.notifications.dispatchConvocations(selectedIds.map(Number)).catch(console.error);
                  setShowConvoc(false);
                  setSelectedIds([]);
                }} className="flex-1 py-2.5 rounded-lg bg-[#8B7355] text-white text-[13px] font-bold hover:bg-[#7a6348] transition-all flex items-center justify-center gap-2"><Mail size={14}/> Send Now</button>
                <button onClick={()=>setShowConvoc(false)} className="flex-1 py-2.5 rounded-lg border border-[#EBEBEB] text-[#555] text-[13px] font-semibold hover:bg-[#F5F5F5] transition-all">Cancel</button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* ══ ADD CANDIDATE MODAL ══ */}
      <AnimatePresence>
        {showCreate&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={e=>{if(e.target===e.currentTarget&&!createDone) setShowCreate(false);}}>
            <motion.div initial={{opacity:0,scale:0.93,y:18}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.93,y:18}}
              transition={{type:"spring",damping:22,stiffness:260}}
              className="bg-white rounded-2xl shadow-2xl w-[500px] max-w-[92vw] overflow-hidden">
              <div className="px-7 pt-7 pb-5 border-b border-[#F0F0F0] flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F0EDE7] flex items-center justify-center text-[#8B7355]">
                  {createDone?<CheckCircle2 size={20}/>:<Sparkles size={20}/>}
                </div>
                <div className="flex-1">
                  <h3 className="text-[16px] font-bold text-[#1A1A1A]">{createDone?"Candidate Added":createStep===1?"New Candidate":"Review & Confirm"}</h3>
                  <p className="text-[11px] text-[#9B9B9B]">{createDone?"Saved.": `Step ${createStep} of 2`}</p>
                </div>
                {!createDone&&<button onClick={()=>setShowCreate(false)} className="p-1.5 rounded-full hover:bg-[#F5F5F5] text-[#9B9B9B] transition-colors"><X size={16}/></button>}
              </div>
              <div className="px-7 py-6">
                <AnimatePresence mode="wait">
                  {!createDone&&createStep===1&&(
                    <motion.div key="s1" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Full Name" icon={<User size={12}/>}><input value={createForm.name} onChange={e=>setCreateForm(p=>({...p,name:e.target.value}))} placeholder="Amine Benali" className="field-input"/></Field>
                        <Field label="National ID (18 digits)" icon={<Hash size={12}/>}><input value={createForm.nid} onChange={e=>setCreateForm(p=>({...p,nid:e.target.value}))} placeholder="199201020304..." className="field-input"/></Field>
                        <Field label="Email" icon={<AtSign size={12}/>}><input value={createForm.email} onChange={e=>setCreateForm(p=>({...p,email:e.target.value}))} type="email" className="field-input"/></Field>
                        <Field label="Phone" icon={<Phone size={12}/>}><input value={createForm.phone} onChange={e=>setCreateForm(p=>({...p,phone:e.target.value}))} className="field-input"/></Field>
                        <Field label="Date of Birth" icon={<Calendar size={12}/>}><input value={createForm.dateOfBirth} onChange={e=>setCreateForm(p=>({...p,dateOfBirth:e.target.value}))} type="date" className="field-input"/></Field>
                        <Field label="Place of Birth" icon={<Hash size={12}/>}><input value={createForm.placeOfBirth} onChange={e=>setCreateForm(p=>({...p,placeOfBirth:e.target.value}))} className="field-input"/></Field>
                        <Field label="Address" icon={<BookOpen size={12}/>}><input value={createForm.address} onChange={e=>setCreateForm(p=>({...p,address:e.target.value}))} className="field-input"/></Field>
                        <Field label="Session" icon={<Calendar size={12}/>}>
                          <select value={createForm.session} onChange={e=>setCreateForm(p=>({...p,session:e.target.value}))} className="field-input">
                            {sessions.map(s=><option key={s.id}>{s.name}</option>)}
                          </select>
                        </Field>
                      </div>
                      <button onClick={submitCreate} disabled={!createForm.name||!createForm.nid||!createForm.email||!createForm.dateOfBirth}
                        className="w-full mt-2 py-2.5 rounded-lg bg-[#8B7355] text-white text-[13px] font-bold hover:bg-[#7a6348] disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center gap-2">
                        Review <ChevronRight size={14}/>
                      </button>
                    </motion.div>
                  )}
                  {!createDone&&createStep===2&&(
                    <motion.div key="s2" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} className="space-y-4">
                      <div className="p-4 bg-[#FAFAFA] rounded-xl border border-[#F0F0F0] space-y-2">
                        {[["Name",createForm.name],["NID",createForm.nid],["Email",createForm.email],["Phone",createForm.phone],["Session",createForm.session]].map(([l,v])=>(
                          <div key={l} className="flex justify-between"><span className="text-[11px] font-semibold uppercase text-[#9B9B9B]">{l}</span><span className="text-[13px] font-semibold">{v||"—"}</span></div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={()=>setCreateStep(1)} className="flex-1 py-2.5 rounded-lg border border-[#EBEBEB] text-[#555] text-[13px] font-semibold hover:bg-[#F5F5F5] transition-all flex items-center justify-center gap-1.5"><ChevronLeft size={13}/> Back</button>
                        <button onClick={submitCreate} className="flex-1 py-2.5 rounded-lg bg-[#8B7355] text-white text-[13px] font-bold hover:bg-[#7a6348] transition-all flex items-center justify-center gap-2"><Check size={14}/> Confirm</button>
                      </div>
                    </motion.div>
                  )}
                  {createDone&&(
                    <motion.div key="done" initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} className="flex flex-col items-center text-center py-4 gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center"><CheckCircle2 size={32} className="text-emerald-500"/></div>
                      <div><h4 className="text-[16px] font-bold mb-1">{createForm.name} added!</h4><p className="text-[12px] text-[#9B9B9B]">Candidate saved successfully.</p></div>
                      <div className="flex gap-2 w-full">
                        <button onClick={()=>{setCreateForm(blankCreate);setCreateStep(1);setCreateDone(false);}} className="flex-1 py-2.5 rounded-lg bg-[#F0EDE7] text-[#8B7355] text-[13px] font-bold hover:bg-[#8B7355] hover:text-white transition-all">Add Another</button>
                        <button onClick={()=>setShowCreate(false)} className="flex-1 py-2.5 rounded-lg border border-[#EBEBEB] text-[#555] text-[13px] font-semibold hover:bg-[#F5F5F5] transition-all">Done</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ EXCEL IMPORT MODAL ══ */}
      <AnimatePresence>
        {showImport&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div initial={{opacity:0,scale:0.93,y:18}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.93,y:18}}
              transition={{type:"spring",damping:22,stiffness:260}}
              className="bg-white rounded-2xl shadow-2xl w-[640px] max-w-[95vw] overflow-hidden flex flex-col max-h-[88vh]">
              {/* Header */}
              <div className="px-7 pt-6 pb-4 border-b border-[#F0F0F0] flex items-center gap-3 shrink-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600"><FileSpreadsheet size={20}/></div>
                <div className="flex-1">
                  <h3 className="text-[16px] font-bold text-[#1A1A1A]">{importDone?"Import Complete":"Import from Excel"}</h3>
                  <p className="text-[11px] text-[#9B9B9B]">
                    {importDone?`${importRows.filter(r=>r.status==="ok").length} imported · ${importRows.filter(r=>r.status==="error").length} errors`:`${importRows.length} candidates detected`}
                  </p>
                </div>
                {!importRunning&&<button onClick={()=>{setShowImport(false);setImportRows([]);}} className="p-1.5 rounded-full hover:bg-[#F5F5F5] text-[#9B9B9B] transition-colors"><X size={16}/></button>}
              </div>

              {/* Session picker */}
              {!importDone&&(
                <div className="px-7 pt-4 pb-2 shrink-0">
                  <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#9B9B9B] mb-1.5"><Calendar size={11} className="text-[#8B7355]"/> Target Session</label>
                  <select value={importSession??""} onChange={e=>setImportSession(Number(e.target.value))} disabled={importRunning}
                    className="w-full px-3 py-2 text-[13px] border border-[#EBEBEB] rounded-lg outline-none focus:ring-2 focus:ring-[#8B7355]/20 focus:border-[#8B7355]">
                    {sessions.map(s=><option key={s.id} value={s.id}>{s.name} ({s.status})</option>)}
                  </select>
                </div>
              )}

              {/* Progress bar */}
              {importRunning&&(
                <div className="px-7 pt-2 pb-1 shrink-0">
                  <div className="w-full bg-[#F0F0F0] rounded-full h-1.5 overflow-hidden">
                    <motion.div className="h-full bg-[#8B7355] rounded-full"
                      animate={{width:`${Math.round((importRows.filter(r=>r.status!=="pending").length/importRows.length)*100)}%`}}
                      transition={{duration:0.3}}/>
                  </div>
                  <p className="text-[11px] text-[#9B9B9B] mt-1 text-right">{importRows.filter(r=>r.status!=="pending").length} / {importRows.length}</p>
                </div>
              )}

              {/* Rows */}
              <div className="flex-1 overflow-y-auto px-7 py-3 space-y-1.5">
                {importRows.map((item,i)=>(
                  <div key={i} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl border text-[12px] transition-all",
                    item.status==="ok"?"bg-emerald-50 border-emerald-100":item.status==="error"?"bg-red-50 border-red-100":"bg-[#FAFAFA] border-[#F0F0F0]")}>
                    <div className="shrink-0">
                      {item.status==="pending"?(importRunning?<Loader2 size={14} className="text-[#8B7355] animate-spin"/>:<div className="w-3.5 h-3.5 rounded-full border-2 border-[#CACACA]"/>)
                        :item.status==="ok"?<FileCheck size={14} className="text-emerald-500"/>:<FileX size={14} className="text-red-400"/>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#1A1A1A] truncate">{item.row.name}</p>
                      <p className="text-[#9B9B9B] truncate">{item.row.email}</p>
                    </div>
                    {item.status==="error"&&<span className="text-[10px] text-red-400 shrink-0 max-w-[180px] text-right leading-tight">{item.error}</span>}
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-7 pb-6 pt-3 shrink-0 flex gap-2">
                {!importDone?(
                  <>
                    <button onClick={runImport} disabled={importRunning||!importSession||importRows.length===0}
                      className="flex-1 py-2.5 rounded-lg bg-[#8B7355] text-white text-[13px] font-bold hover:bg-[#7a6348] disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center gap-2">
                      {importRunning?<><Loader2 size={14} className="animate-spin"/> Importing…</>:<><Check size={14}/> Start Import ({importRows.length})</>}
                    </button>
                    <button onClick={()=>{setShowImport(false);setImportRows([]);}} disabled={importRunning}
                      className="px-5 py-2.5 rounded-lg border border-[#EBEBEB] text-[#555] text-[13px] font-semibold hover:bg-[#F5F5F5] disabled:opacity-40 transition-all">Cancel</button>
                  </>
                ):(
                  <>
                    <div className={cn("flex-1 py-2.5 rounded-lg text-[13px] font-bold flex items-center justify-center gap-2",importRows.some(r=>r.status==="error")?"bg-amber-50 text-amber-700":"bg-emerald-50 text-emerald-700")}>
                      <CheckCircle2 size={14}/>
                      {importRows.filter(r=>r.status==="ok").length} imported
                      {importRows.filter(r=>r.status==="error").length>0&&` · ${importRows.filter(r=>r.status==="error").length} failed`}
                    </div>
                    <button onClick={()=>{setShowImport(false);setImportRows([]);}} className="px-5 py-2.5 rounded-lg border border-[#EBEBEB] text-[#555] text-[13px] font-semibold hover:bg-[#F5F5F5] transition-all">Close</button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
};

// ─── Modal wrapper ────────────────────────────────────────────────────────────
const Modal = ({children,onClose,title,icon,danger=false}:{children:React.ReactNode;onClose:()=>void;title:string;icon?:React.ReactNode;danger?:boolean})=>(
  <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
    onClick={e=>{if(e.target===e.currentTarget) onClose();}}>
    <motion.div initial={{opacity:0,scale:0.93,y:16}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.93,y:16}}
      transition={{type:"spring",damping:22,stiffness:260}}
      className="bg-white rounded-2xl shadow-2xl w-[440px] max-w-[92vw] overflow-hidden">
      <div className={cn("px-6 pt-6 pb-4 border-b flex items-center gap-3",danger?"border-red-100":"border-[#F0F0F0]")}>
        {icon&&<div className={cn("w-9 h-9 rounded-xl flex items-center justify-center",danger?"bg-red-50":"bg-[#F0EDE7]")}>{icon}</div>}
        <h3 className="text-[15px] font-bold text-[#1A1A1A] flex-1">{title}</h3>
        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[#F5F5F5] text-[#9B9B9B] transition-colors"><X size={16}/></button>
      </div>
      <div className="px-6 py-5">{children}</div>
    </motion.div>
  </motion.div>
);

// ─── Field helper ─────────────────────────────────────────────────────────────
const Field = ({label,icon,children}:{label:string;icon?:React.ReactNode;children:React.ReactNode})=>(
  <div>
    <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#9B9B9B] mb-1.5">
      {icon&&<span className="text-[#8B7355]">{icon}</span>} {label}
    </label>
    <style>{`.field-input{width:100%;padding:8px 12px;font-size:13px;border:1px solid #EBEBEB;border-radius:8px;outline:none;background:white;transition:all .15s}.field-input:focus{border-color:#8B7355;box-shadow:0 0 0 3px rgba(139,115,85,.12)}`}</style>
    {children}
  </div>
);
