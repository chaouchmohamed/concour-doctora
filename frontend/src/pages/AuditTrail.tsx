import React, { useState } from 'react';
import {
    History,
    Search,
    Filter,
    Download,
    Calendar,
    User,
    Shield,
    FileText,
    Settings,
    Lock,
    Unlock,
    Upload,
    ChevronLeft,
    ChevronRight,
    Clock
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { Card, Badge, Button } from '../components/UI';
import { cn } from '../constants';

const mockLogs = [
    { id: '1', timestamp: '2026-03-09 14:22:05', user: 'Jean Dupont', role: 'ADMIN', action: 'CLOSE_DELIBERATION', target: 'Session 2026', ip: '192.168.1.10', detail: 'Closed deliberation and lifted anonymity' },
    { id: '2', timestamp: '2026-03-09 14:20:30', user: 'Jean Dupont', role: 'ADMIN', action: 'EXPORT_RESULTS', target: 'PV Final 2026', ip: '192.168.1.10', detail: 'Exported final PV as PDF' },
    { id: '3', timestamp: '2026-03-09 10:15:42', user: 'Amina Saidi', role: 'COORDINATOR', action: 'ASSIGN_CORRECTOR', target: 'ANO-7F3A92', ip: '192.168.1.22', detail: 'Assigned 3rd corrector Dr. Ahmed for discrepancy' },
    { id: '4', timestamp: '2026-03-08 16:45:10', user: 'Rachid Kermiche', role: 'CORRECTOR', action: 'SUBMIT_GRADE', target: 'ANO-B1E4D8', ip: '192.168.1.35', detail: 'Submitted grade 14.25/20 for Mathematics' },
    { id: '5', timestamp: '2026-03-08 14:30:00', user: 'Jean Dupont', role: 'ADMIN', action: 'LOCK_SUBJECT', target: 'Mathematics & Logic', ip: '192.168.1.10', detail: 'Locked subject for correction phase' },
    { id: '6', timestamp: '2026-03-08 09:00:15', user: 'Amina Saidi', role: 'COORDINATOR', action: 'GENERATE_CODES', target: 'Session 2026', ip: '192.168.1.22', detail: 'Generated 1,248 anonymous codes' },
    { id: '7', timestamp: '2026-03-07 11:20:00', user: 'Jean Dupont', role: 'ADMIN', action: 'IMPORT_CANDIDATES', target: 'candidates_2026.csv', ip: '192.168.1.10', detail: 'Imported 450 new candidates from CSV' },
    { id: '8', timestamp: '2026-03-07 09:30:45', user: 'Fatima Belhadj', role: 'CFD_HEAD', action: 'SUBJECT_LOTTERY', target: 'Mathematics & Logic', ip: '192.168.1.18', detail: 'Subject lottery drawn: Version B selected' },
];

const actionIcons: Record<string, React.ReactNode> = {
    CLOSE_DELIBERATION: <Lock size={16} />,
    EXPORT_RESULTS: <Download size={16} />,
    ASSIGN_CORRECTOR: <User size={16} />,
    SUBMIT_GRADE: <FileText size={16} />,
    LOCK_SUBJECT: <Lock size={16} />,
    GENERATE_CODES: <Shield size={16} />,
    IMPORT_CANDIDATES: <Upload size={16} />,
    SUBJECT_LOTTERY: <Settings size={16} />,
};

const actionColors: Record<string, string> = {
    CLOSE_DELIBERATION: 'bg-danger/10 text-danger',
    EXPORT_RESULTS: 'bg-primary-accent/10 text-primary-accent',
    ASSIGN_CORRECTOR: 'bg-warning/10 text-warning',
    SUBMIT_GRADE: 'bg-success/10 text-success',
    LOCK_SUBJECT: 'bg-warning/10 text-warning',
    GENERATE_CODES: 'bg-primary-accent/10 text-primary-accent',
    IMPORT_CANDIDATES: 'bg-success/10 text-success',
    SUBJECT_LOTTERY: 'bg-primary-accent/10 text-primary-accent',
};

export const AuditTrailPage = () => {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    return (
        <AppShell title="Audit Trail">
            <div className="space-y-6">
                {/* Controls */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex flex-1 items-center gap-3 max-w-2xl">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                            <input type="text" placeholder="Search by user, action, or target..." className="input-field pl-10" />
                        </div>
                        <Button variant="secondary" className="gap-2 shrink-0">
                            <Filter size={18} /> Filter
                        </Button>
                        <Button variant="secondary" className="gap-2 shrink-0">
                            <Calendar size={18} /> Date Range
                        </Button>
                    </div>

                    <Button variant="secondary" size="sm" className="gap-2">
                        <Download size={16} /> Export Log
                    </Button>
                </div>

                {/* Info Banner */}
                <div className="p-3 bg-primary-accent/5 border border-primary-accent/20 rounded-md flex items-center gap-3">
                    <Shield size={18} className="text-primary-accent shrink-0" />
                    <p className="text-[12px] text-muted">
                        All entries are <span className="font-bold text-text-primary">immutable</span> and cryptographically signed. Audit logs cannot be modified or deleted.
                    </p>
                </div>

                {/* Audit Log Table */}
                <Card className="overflow-hidden">
                    <div className="p-6 border-b border-border flex items-center justify-between bg-black/[0.01]">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <History size={20} className="text-primary-accent" /> Activity Log
                        </h3>
                        <Badge variant="accent">{mockLogs.length} entries shown</Badge>
                    </div>

                    <div className="divide-y divide-border">
                        {mockLogs.map((log) => (
                            <div key={log.id}>
                                <button
                                    onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                                    className="w-full p-4 flex items-center gap-4 hover:bg-black/[0.01] transition-colors text-left"
                                >
                                    <div className={cn("w-9 h-9 rounded-full flex items-center justify-center shrink-0", actionColors[log.action] || 'bg-surface/30 text-muted')}>
                                        {actionIcons[log.action] || <FileText size={16} />}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="text-small text-text-primary">
                                            <span className="font-bold">{log.user}</span>
                                            <span className="text-muted"> ({log.role})</span>
                                            <span className="text-muted"> — </span>
                                            <span className="font-medium">{log.action.replace(/_/g, ' ')}</span>
                                        </p>
                                        <p className="text-[11px] text-muted flex items-center gap-3">
                                            <span className="flex items-center gap-1"><Clock size={12} /> {log.timestamp}</span>
                                            <span>Target: {log.target}</span>
                                        </p>
                                    </div>

                                    <Badge variant={
                                        log.action.includes('CLOSE') || log.action.includes('LOCK') ? 'warning' :
                                            log.action.includes('SUBMIT') || log.action.includes('IMPORT') ? 'success' : 'accent'
                                    }>
                                        {log.action.replace(/_/g, ' ')}
                                    </Badge>
                                </button>

                                {expandedId === log.id && (
                                    <div className="px-4 pb-4 ml-[52px]">
                                        <div className="p-4 bg-surface/10 rounded-md border border-border space-y-2">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1">Detail</p>
                                                    <p className="text-small text-text-primary">{log.detail}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1">IP Address</p>
                                                    <p className="text-small text-text-primary font-mono">{log.ip}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="p-4 border-t border-border flex items-center justify-between">
                        <p className="text-small text-muted">
                            Showing <span className="font-bold text-text-primary">1-8</span> of <span className="font-bold text-text-primary">156</span>
                        </p>
                        <div className="flex items-center gap-2">
                            <Button variant="secondary" size="sm" className="p-2 min-h-0" disabled><ChevronLeft size={18} /></Button>
                            <Button size="sm" className="min-h-0 w-8 h-8 p-0">1</Button>
                            <Button variant="ghost" size="sm" className="min-h-0 w-8 h-8 p-0">2</Button>
                            <Button variant="ghost" size="sm" className="min-h-0 w-8 h-8 p-0">3</Button>
                            <span className="text-muted px-1">...</span>
                            <Button variant="ghost" size="sm" className="min-h-0 w-8 h-8 p-0">20</Button>
                            <Button variant="secondary" size="sm" className="p-2 min-h-0"><ChevronRight size={18} /></Button>
                        </div>
                    </div>
                </Card>
            </div>
        </AppShell>
    );
};
