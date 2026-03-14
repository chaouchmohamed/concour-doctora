import React, { useState } from 'react';
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
    Loader2
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { Card, Badge, Button, Input } from '../components/UI';
import { cn } from '../constants';
import { motion } from 'motion/react';

const mockMappings = [
    { id: '1', candidateId: 'DOCT-2026-001', anonymousCode: 'ANO-7F3A92', scanFile: 'scan_001.pdf', status: 'MAPPED', pages: 4 },
    { id: '2', candidateId: 'DOCT-2026-002', anonymousCode: 'ANO-B1E4D8', scanFile: 'scan_002.pdf', status: 'MAPPED', pages: 4 },
    { id: '3', candidateId: 'DOCT-2026-003', anonymousCode: 'ANO-9C2F15', scanFile: null, status: 'MISSING_SCAN', pages: 0 },
    { id: '4', candidateId: 'DOCT-2026-004', anonymousCode: 'ANO-4D8E71', scanFile: 'scan_004.pdf', status: 'MAPPED', pages: 3 },
    { id: '5', candidateId: 'DOCT-2026-005', anonymousCode: null, status: 'PENDING', scanFile: null, pages: 0 },
    { id: '6', candidateId: 'DOCT-2026-006', anonymousCode: 'ANO-F6A023', scanFile: 'scan_006_err.pdf', status: 'ERROR', pages: 2 },
    { id: '7', candidateId: 'DOCT-2026-007', anonymousCode: 'ANO-2B9D44', scanFile: 'scan_007.pdf', status: 'MAPPED', pages: 4 },
];

const stats = {
    total: 1248,
    mapped: 1190,
    missingScan: 38,
    pending: 12,
    errors: 8,
};

export const AnonymizationPage = () => {
    const [showIdentities, setShowIdentities] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerateCodes = () => {
        setIsGenerating(true);
        setTimeout(() => setIsGenerating(false), 3000);
    };

    const statusConfig: Record<string, { variant: 'success' | 'warning' | 'danger' | 'neutral' | 'accent'; label: string; icon: React.ReactNode }> = {
        MAPPED: { variant: 'success', label: 'Mapped', icon: <CheckCircle2 size={14} /> },
        MISSING_SCAN: { variant: 'warning', label: 'Missing Scan', icon: <Camera size={14} /> },
        PENDING: { variant: 'neutral', label: 'Pending', icon: <Loader2 size={14} /> },
        ERROR: { variant: 'danger', label: 'Error', icon: <AlertCircle size={14} /> },
    };

    const mappedPercent = Math.round((stats.mapped / stats.total) * 100);

    return (
        <AppShell title="Anonymization & OMR">
            <div className="space-y-8">
                {/* Progress Overview */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    {[
                        { label: 'Total Copies', value: stats.total.toLocaleString(), color: 'accent' },
                        { label: 'Mapped', value: stats.mapped.toLocaleString(), color: 'success' },
                        { label: 'Missing Scans', value: stats.missingScan.toString(), color: 'warning' },
                        { label: 'Pending Codes', value: stats.pending.toString(), color: 'neutral' },
                        { label: 'Errors', value: stats.errors.toString(), color: 'danger' },
                    ].map((stat) => (
                        <Card key={stat.label} className="p-4">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1">{stat.label}</p>
                            <p className={cn(
                                "text-2xl font-bold",
                                stat.color === 'accent' && "text-primary-accent",
                                stat.color === 'success' && "text-success",
                                stat.color === 'warning' && "text-warning",
                                stat.color === 'danger' && "text-danger",
                                stat.color === 'neutral' && "text-text-primary",
                            )}>{stat.value}</p>
                        </Card>
                    ))}
                </div>

                {/* Progress Bar */}
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <ShieldCheck size={20} className="text-primary-accent" /> Mapping Progress
                        </h3>
                        <span className="text-small font-bold text-primary-accent">{mappedPercent}%</span>
                    </div>
                    <div className="w-full h-3 bg-surface/30 rounded-full overflow-hidden border border-border">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${mappedPercent}%` }}
                            transition={{ duration: 1.5, ease: 'easeOut' }}
                            className="h-full bg-primary-accent rounded-full"
                        />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                        <p className="text-[11px] text-muted">
                            {stats.mapped} of {stats.total} copies anonymized and scanned
                        </p>
                        <div className="flex items-center gap-4 text-[11px] text-muted">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success inline-block"></span> Mapped</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning inline-block"></span> Missing</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-danger inline-block"></span> Error</span>
                        </div>
                    </div>
                </Card>

                {/* Actions + Table */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex flex-1 items-center gap-3 max-w-xl">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                            <input
                                type="text"
                                placeholder="Search by candidate ID or anonymous code..."
                                className="input-field pl-10"
                            />
                        </div>
                        <Button variant="secondary" className="gap-2 shrink-0">
                            <Filter size={18} /> Filter
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="secondary" size="sm" className="gap-2" onClick={() => setShowIdentities(!showIdentities)}>
                            {showIdentities ? <EyeOff size={16} /> : <Eye size={16} />}
                            {showIdentities ? 'Hide IDs' : 'Show IDs'}
                        </Button>
                        <Button variant="secondary" size="sm" className="gap-2">
                            <Upload size={16} /> Upload Scans
                        </Button>
                        <Button size="sm" className="gap-2" onClick={handleGenerateCodes} disabled={isGenerating}>
                            {isGenerating ? <RefreshCw size={16} className="animate-spin" /> : <Hash size={16} />}
                            {isGenerating ? 'Generating...' : 'Generate Codes'}
                        </Button>
                    </div>
                </div>

                {/* Mapping Table */}
                <Card className="overflow-hidden">
                    <div className="p-6 border-b border-border flex items-center justify-between bg-black/[0.01]">
                        <h3 className="text-lg font-bold">Mapping Live View</h3>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                            <span className="text-small text-muted font-medium">Live</span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-black/[0.02] border-b border-border">
                                    <th className="p-4 text-small font-bold text-muted uppercase tracking-wider">Candidate ID</th>
                                    <th className="p-4 text-small font-bold text-muted uppercase tracking-wider">Anonymous Code</th>
                                    <th className="p-4 text-small font-bold text-muted uppercase tracking-wider">Scan File</th>
                                    <th className="p-4 text-small font-bold text-muted uppercase tracking-wider">Pages</th>
                                    <th className="p-4 text-small font-bold text-muted uppercase tracking-wider">Status</th>
                                    <th className="p-4 text-small font-bold text-muted uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {mockMappings.map((mapping) => {
                                    const config = statusConfig[mapping.status];
                                    return (
                                        <tr key={mapping.id} className="hover:bg-black/[0.01] transition-colors group">
                                            <td className="p-4 text-small font-mono font-medium">
                                                {showIdentities ? mapping.candidateId : '••••••••••'}
                                            </td>
                                            <td className="p-4">
                                                {mapping.anonymousCode ? (
                                                    <span className="text-small font-mono font-bold text-primary-accent bg-primary-accent/5 px-2 py-0.5 rounded">
                                                        {mapping.anonymousCode}
                                                    </span>
                                                ) : (
                                                    <span className="text-small text-muted italic">Not generated</span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                {mapping.scanFile ? (
                                                    <span className="text-small text-muted flex items-center gap-1.5">
                                                        <FileText size={14} /> {mapping.scanFile}
                                                    </span>
                                                ) : (
                                                    <span className="text-small text-muted italic">No scan</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-small text-muted">{mapping.pages || '—'}</td>
                                            <td className="p-4">
                                                <Badge variant={config.variant}>
                                                    <span className="flex items-center gap-1">{config.icon} {config.label}</span>
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="sm" className="p-2 min-h-0 text-muted hover:text-primary-accent">
                                                        <Eye size={16} />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="p-2 min-h-0 text-muted hover:text-primary-accent">
                                                        <Upload size={16} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </AppShell>
    );
};
