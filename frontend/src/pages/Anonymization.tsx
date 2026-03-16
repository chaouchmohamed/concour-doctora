import React, { useState, useRef } from "react";
import {
  ShieldCheck,
  Upload,
  Download,
  RefreshCw,
  Eye,
  EyeOff,
  FileText,
  Hash,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Camera,
  Loader2,
  QrCode,
  X,
  ChevronDown,
  FileBadge,
  ScanLine,
  Link2,
  Unlink2,
} from "lucide-react";
import { AppShell } from "../components/AppShell";
import { Card, Button } from "../components/UI";
import { cn } from "../constants";
import { motion, AnimatePresence } from "motion/react";

// ─── Types ────────────────────────────────────────────────────────────────────

type MappingStatus = "MAPPED" | "MISSING_SCAN" | "PENDING" | "ERROR";

interface Mapping {
  id: string;
  candidateId: string;
  anonymousCode: string | null;
  scanFile: string | null;
  status: MappingStatus;
  pages: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const initialMappings: Mapping[] = [
  {
    id: "1",
    candidateId: "DOCT-2026-001",
    anonymousCode: "ANO-7F3A92",
    scanFile: "scan_001.pdf",
    status: "MAPPED",
    pages: 4,
  },
  {
    id: "2",
    candidateId: "DOCT-2026-002",
    anonymousCode: "ANO-B1E4D8",
    scanFile: "scan_002.pdf",
    status: "MAPPED",
    pages: 4,
  },
  {
    id: "3",
    candidateId: "DOCT-2026-003",
    anonymousCode: "ANO-9C2F15",
    scanFile: null,
    status: "MISSING_SCAN",
    pages: 0,
  },
  {
    id: "4",
    candidateId: "DOCT-2026-004",
    anonymousCode: "ANO-4D8E71",
    scanFile: "scan_004.pdf",
    status: "MAPPED",
    pages: 3,
  },
  {
    id: "5",
    candidateId: "DOCT-2026-005",
    anonymousCode: null,
    scanFile: null,
    status: "PENDING",
    pages: 0,
  },
  {
    id: "6",
    candidateId: "DOCT-2026-006",
    anonymousCode: "ANO-F6A023",
    scanFile: "scan_006_err.pdf",
    status: "ERROR",
    pages: 2,
  },
  {
    id: "7",
    candidateId: "DOCT-2026-007",
    anonymousCode: "ANO-2B9D44",
    scanFile: "scan_007.pdf",
    status: "MAPPED",
    pages: 4,
  },
];

// ─── Status config ────────────────────────────────────────────────────────────

const statusConfig: Record<
  MappingStatus,
  {
    label: string;
    icon: React.ReactNode;
    pill: string;
  }
> = {
  MAPPED: {
    label: "Mapped",
    icon: <CheckCircle2 size={12} />,
    pill: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200",
  },
  MISSING_SCAN: {
    label: "Missing Scan",
    icon: <Camera size={12} />,
    pill: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200",
  },
  PENDING: {
    label: "Pending",
    icon: <Loader2 size={12} />,
    pill: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200",
  },
  ERROR: {
    label: "Error",
    icon: <AlertCircle size={12} />,
    pill: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200",
  },
};

// ─── Upload Scan Modal ────────────────────────────────────────────────────────

const UploadScanModal = ({
  mapping,
  onClose,
  onSave,
}: {
  mapping: Mapping;
  onClose: () => void;
  onSave: (id: string, fileName: string) => void;
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [manualCode, setManualCode] = useState(mapping.anonymousCode ?? "");
  const [uploading, setUploading] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  const handleSave = () => {
    if (!file) return;
    setUploading(true);
    setTimeout(() => {
      onSave(mapping.id, file.name);
      setUploading(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-surface border border-border rounded-2xl w-full max-w-md shadow-2xl"
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-bold text-base flex items-center gap-2">
            <ScanLine size={18} className="text-primary-accent" />
            Upload Scan — {mapping.candidateId}
          </h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-text-primary transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {/* Anonymous Code */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted block mb-1.5">
              Anonymous Code
            </label>
            <input
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="ANO-XXXXXX or scan QR..."
              className="input-field w-full font-mono text-sm"
            />
            <p className="text-[11px] text-muted mt-1">
              Enter manually or use QR/barcode reader
            </p>
          </div>

          {/* File Drop Zone */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted block mb-1.5">
              Scan File (PDF / JPEG, max 20 MB)
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors",
                file
                  ? "border-success/50 bg-success/5"
                  : "border-border hover:border-primary-accent/50 hover:bg-primary-accent/5",
              )}
            >
              {file ? (
                <p className="text-sm font-medium text-success flex items-center justify-center gap-2">
                  <FileText size={16} /> {file.name}
                </p>
              ) : (
                <>
                  <Upload size={22} className="mx-auto mb-2 text-muted" />
                  <p className="text-sm text-muted">
                    Click to browse or drop file here
                  </p>
                </>
              )}
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.jpg,.jpeg"
                className="hidden"
                onChange={handleFile}
              />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 p-5 border-t border-border">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!file || uploading}
            className="gap-2"
          >
            {uploading ? (
              <>
                <RefreshCw size={14} className="animate-spin" /> Uploading...
              </>
            ) : (
              <>
                <Upload size={14} /> Upload & Map
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── PV Generation Modal ──────────────────────────────────────────────────────

const PVModal = ({ onClose }: { onClose: () => void }) => {
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);
  const members = [
    "Dr. Malki Mimoun",
    "Dr. Malki Abdelhamid",
    "Prof. Kechar Mohamed",
    "Dr. Belfaci Younes",
  ];

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setDone(true);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-surface border border-border rounded-2xl w-full max-w-md shadow-2xl"
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-bold text-base flex items-center gap-2">
            <FileBadge size={18} className="text-primary-accent" />
            Generate PV of Anonymization
          </h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-text-primary transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {done ? (
            <div className="text-center py-4 space-y-3">
              <CheckCircle2 size={40} className="mx-auto text-success" />
              <p className="font-semibold">PV Generated Successfully</p>
              <p className="text-sm text-muted">
                Signed by 4 Anonymity Commission members · 1,190 copies recorded
              </p>
              <Button className="gap-2 mx-auto" size="sm">
                <Download size={14} /> Download PDF
              </Button>
            </div>
          ) : (
            <>
              <div className="bg-black/[0.03] rounded-xl p-4 space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2">
                  Summary
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Copies coded</span>
                  <span className="font-semibold">1,190</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Missing scans</span>
                  <span className="font-semibold text-warning">38</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Errors</span>
                  <span className="font-semibold text-danger">8</span>
                </div>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2">
                  Anonymity Commission
                </p>
                <div className="space-y-1.5">
                  {members.map((m) => (
                    <div key={m} className="flex items-center gap-2 text-sm">
                      <CheckCircle2
                        size={14}
                        className="text-success shrink-0"
                      />
                      {m}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        {!done && (
          <div className="flex items-center justify-end gap-2 p-5 border-t border-border">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleGenerate}
              disabled={generating}
              className="gap-2"
            >
              {generating ? (
                <>
                  <RefreshCw size={14} className="animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <FileBadge size={14} /> Generate & Sign
                </>
              )}
            </Button>
          </div>
        )}
        {done && (
          <div className="flex justify-end p-5 border-t border-border">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

// ─── Filter Dropdown ──────────────────────────────────────────────────────────

const FilterDropdown = ({
  active,
  onChange,
}: {
  active: MappingStatus | "ALL";
  onChange: (v: MappingStatus | "ALL") => void;
}) => {
  const [open, setOpen] = useState(false);
  const options: Array<{ value: MappingStatus | "ALL"; label: string }> = [
    { value: "ALL", label: "All Statuses" },
    { value: "MAPPED", label: "Mapped" },
    { value: "MISSING_SCAN", label: "Missing Scan" },
    { value: "PENDING", label: "Pending" },
    { value: "ERROR", label: "Error" },
  ];
  return (
    <div className="relative">
      <Button
        variant="secondary"
        size="sm"
        className="gap-2"
        onClick={() => setOpen((o) => !o)}
      >
        <Filter size={15} />
        {options.find((o) => o.value === active)?.label}
        <ChevronDown
          size={13}
          className={cn("transition-transform", open && "rotate-180")}
        />
      </Button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="absolute right-0 top-full mt-1 z-30 bg-surface border border-border rounded-xl shadow-lg overflow-hidden min-w-[160px]"
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={cn(
                  "w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-black/[0.04]",
                  active === opt.value && "font-semibold text-primary-accent",
                )}
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const AnonymizationPage = () => {
  const [mappings, setMappings] = useState<Mapping[]>(initialMappings);
  const [showIdentities, setShowIdentities] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<MappingStatus | "ALL">(
    "ALL",
  );
  const [uploadTarget, setUploadTarget] = useState<Mapping | null>(null);
  const [showPV, setShowPV] = useState(false);
  const [generatedCount, setGeneratedCount] = useState(0);

  // Stats derived from live mappings
  const total = mappings.length + 1241; // simulating large dataset
  const mapped = mappings.filter((m) => m.status === "MAPPED").length + 1183;
  const missing =
    mappings.filter((m) => m.status === "MISSING_SCAN").length + 35;
  const pending = mappings.filter((m) => m.status === "PENDING").length + 11;
  const errors = mappings.filter((m) => m.status === "ERROR").length + 7;
  const mappedPercent = Math.round((mapped / total) * 100);

  // Generate codes for PENDING entries
  const handleGenerateCodes = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const count = mappings.filter((m) => m.status === "PENDING").length;
      setMappings((prev) =>
        prev.map((m) => {
          if (m.status !== "PENDING") return m;
          const code =
            "ANO-" + Math.random().toString(36).substring(2, 8).toUpperCase();
          return { ...m, anonymousCode: code, status: "MISSING_SCAN" };
        }),
      );
      setGeneratedCount(count);
      setIsGenerating(false);
    }, 2500);
  };

  // Save uploaded scan
  const handleSaveScan = (id: string, fileName: string) => {
    setMappings((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              scanFile: fileName,
              status: "MAPPED",
              pages: Math.floor(Math.random() * 3) + 3,
            }
          : m,
      ),
    );
  };

  // Filtered + searched rows
  const filtered = mappings.filter((m) => {
    const matchSearch =
      search === "" ||
      m.candidateId.toLowerCase().includes(search.toLowerCase()) ||
      (m.anonymousCode ?? "").toLowerCase().includes(search.toLowerCase());
    const matchFilter = filterStatus === "ALL" || m.status === filterStatus;
    return matchSearch && matchFilter;
  });

  return (
    <AppShell title="Anonymization & OMR">
      {/* Modals */}
      <AnimatePresence>
        {uploadTarget && (
          <UploadScanModal
            mapping={uploadTarget}
            onClose={() => setUploadTarget(null)}
            onSave={handleSaveScan}
          />
        )}
        {showPV && <PVModal onClose={() => setShowPV(false)} />}
      </AnimatePresence>

      {/* Generated codes toast */}
      <AnimatePresence>
        {generatedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onAnimationComplete={() =>
              setTimeout(() => setGeneratedCount(0), 3000)
            }
            className="fixed top-5 right-5 z-50 bg-success text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-semibold"
          >
            <CheckCircle2 size={16} /> {generatedCount} anonymous code
            {generatedCount > 1 ? "s" : ""} generated
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Layout: everything fits without page scroll ── */}
      <div className="flex flex-col gap-4 h-full" style={{ minHeight: 0 }}>
        {/* Top Stats Row */}
        <div className="grid grid-cols-5 gap-3 shrink-0">
          {[
            {
              label: "Total Copies",
              value: total.toLocaleString(),
              color: "accent",
            },
            {
              label: "Mapped",
              value: mapped.toLocaleString(),
              color: "success",
            },
            {
              label: "Missing Scans",
              value: missing.toString(),
              color: "warning",
            },
            {
              label: "Pending Codes",
              value: pending.toString(),
              color: "neutral",
            },
            { label: "Errors", value: errors.toString(), color: "danger" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Card className="p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1">
                  {stat.label}
                </p>
                <p
                  className={cn(
                    "text-2xl font-bold",
                    stat.color === "accent" && "text-primary-accent",
                    stat.color === "success" && "text-success",
                    stat.color === "warning" && "text-warning",
                    stat.color === "danger" && "text-danger",
                    stat.color === "neutral" && "text-text-primary",
                  )}
                >
                  {stat.value}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Progress Bar */}
        <Card className="p-4 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <ShieldCheck size={16} className="text-primary-accent" /> Mapping
              Progress
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 text-[11px] text-muted">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-success inline-block" />{" "}
                  Mapped
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-warning inline-block" />{" "}
                  Missing
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-danger inline-block" />{" "}
                  Error
                </span>
              </div>
              <span className="text-sm font-bold text-primary-accent">
                {mappedPercent}%
              </span>
            </div>
          </div>
          <div className="w-full h-2.5 bg-surface/30 rounded-full overflow-hidden border border-border">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${mappedPercent}%` }}
              transition={{ duration: 1.4, ease: "easeOut" }}
              className="h-full bg-primary-accent rounded-full"
            />
          </div>
          <p className="text-[11px] text-muted mt-1.5">
            {mapped} of {total} copies anonymized and scanned
          </p>
        </Card>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1 max-w-sm">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              size={16}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by candidate ID or code..."
              className="input-field pl-9 text-sm w-full"
            />
          </div>

          <div className="flex items-center gap-2">
            <FilterDropdown active={filterStatus} onChange={setFilterStatus} />

            <Button
              variant="secondary"
              size="sm"
              className="gap-2"
              onClick={() => setShowIdentities((v) => !v)}
            >
              {showIdentities ? <EyeOff size={15} /> : <Eye size={15} />}
              {showIdentities ? "Hide IDs" : "Show IDs"}
            </Button>

            <Button
              variant="secondary"
              size="sm"
              className="gap-2"
              onClick={() => {
                // open upload for first missing scan candidate
                const target = mappings.find(
                  (m) => m.status === "MISSING_SCAN" || m.status === "ERROR",
                );
                if (target) setUploadTarget(target);
              }}
            >
              <Upload size={15} /> Upload Scans
            </Button>

            <Button
              variant="secondary"
              size="sm"
              className="gap-2"
              onClick={() => setShowPV(true)}
            >
              <FileBadge size={15} /> Generate PV
            </Button>

            <Button
              size="sm"
              className="gap-2"
              onClick={handleGenerateCodes}
              disabled={
                isGenerating || !mappings.some((m) => m.status === "PENDING")
              }
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={14} className="animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <Hash size={14} /> Generate Codes
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Table — fills remaining height with its own scroll */}
        <Card className="overflow-hidden flex flex-col min-h-0 flex-1">
          <div className="p-4 border-b border-border flex items-center justify-between bg-black/[0.01] shrink-0">
            <h3 className="text-sm font-bold">Mapping Live View</h3>
            <div className="flex items-center gap-4">
              <span className="text-[11px] text-muted">
                {filtered.length} entries shown
              </span>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-[11px] text-muted font-medium">Live</span>
              </div>
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-surface border-b border-border">
                  {[
                    "Candidate ID",
                    "Anonymous Code",
                    "Scan File",
                    "Pages",
                    "Status",
                    "Actions",
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
                <AnimatePresence mode="popLayout">
                  {filtered.map((mapping, i) => {
                    const cfg = statusConfig[mapping.status];
                    return (
                      <motion.tr
                        key={mapping.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                        transition={{ delay: i * 0.04 }}
                        className="hover:bg-black/[0.015] transition-colors group"
                      >
                        {/* Candidate ID */}
                        <td className="p-3 text-sm font-mono font-medium">
                          {showIdentities ? (
                            <span className="text-text-primary">
                              {mapping.candidateId}
                            </span>
                          ) : (
                            <span className="text-muted tracking-widest">
                              ••••••••••
                            </span>
                          )}
                        </td>

                        {/* Anonymous Code */}
                        <td className="p-3">
                          {mapping.anonymousCode ? (
                            <span className="text-sm font-mono font-bold text-primary-accent bg-primary-accent/5 px-2 py-0.5 rounded">
                              {mapping.anonymousCode}
                            </span>
                          ) : (
                            <span className="text-sm text-muted italic">
                              Not generated
                            </span>
                          )}
                        </td>

                        {/* Scan File */}
                        <td className="p-3">
                          {mapping.scanFile ? (
                            <span className="text-sm text-muted flex items-center gap-1.5">
                              <FileText size={13} className="shrink-0" />
                              {mapping.scanFile}
                            </span>
                          ) : (
                            <span className="text-sm text-muted italic">
                              No scan
                            </span>
                          )}
                        </td>

                        {/* Pages */}
                        <td className="p-3 text-sm text-muted">
                          {mapping.pages || "—"}
                        </td>

                        {/* Status */}
                        <td className="p-3">
                          <span className={cfg.pill}>
                            {cfg.icon}
                            {cfg.label}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="p-3">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {/* View scan */}
                            {mapping.scanFile && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-1.5 min-h-0 text-muted hover:text-primary-accent"
                                title="View scan"
                                onClick={() => window.open("#", "_blank")}
                              >
                                <Eye size={15} />
                              </Button>
                            )}
                            {/* Upload / re-upload scan */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1.5 min-h-0 text-muted hover:text-primary-accent"
                              title="Upload scan"
                              onClick={() => setUploadTarget(mapping)}
                            >
                              <Upload size={15} />
                            </Button>
                            {/* Unlink (for MAPPED) */}
                            {mapping.status === "MAPPED" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-1.5 min-h-0 text-muted hover:text-danger"
                                title="Unlink mapping"
                                onClick={() =>
                                  setMappings((prev) =>
                                    prev.map((m) =>
                                      m.id === mapping.id
                                        ? {
                                            ...m,
                                            scanFile: null,
                                            status: "MISSING_SCAN",
                                            pages: 0,
                                          }
                                        : m,
                                    ),
                                  )
                                }
                              >
                                <Unlink2 size={15} />
                              </Button>
                            )}
                            {/* Re-link for ERROR */}
                            {mapping.status === "ERROR" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-1.5 min-h-0 text-muted hover:text-success"
                                title="Re-link"
                                onClick={() => setUploadTarget(mapping)}
                              >
                                <Link2 size={15} />
                              </Button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>

                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-10 text-center text-muted text-sm"
                    >
                      No entries match your search / filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppShell>
  );
};
