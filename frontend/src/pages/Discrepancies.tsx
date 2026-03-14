import React, { useState } from 'react';
import {
    AlertTriangle,
    UserPlus,
    Eye,
    CheckCircle2,
    XCircle,
    Filter,
    Search,
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
    Settings,
    TrendingUp
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { Card, Badge, Button } from '../components/UI';
import { cn } from '../constants';
import { motion } from 'motion/react';

const mockDiscrepancies = [
    { id: '1', copyCode: 'ANO-7F3A92', subject: 'Mathematics', c1Grade: 16.50, c2Grade: 12.00, delta: 4.50, status: 'PENDING', severity: 'HIGH' },
    { id: '2', copyCode: 'ANO-B1E4D8', subject: 'Mathematics', c1Grade: 14.25, c2Grade: 11.00, delta: 3.25, status: 'ASSIGNED', severity: 'MEDIUM', thirdCorrector: 'Dr. Ahmed' },
    { id: '3', copyCode: 'ANO-9C2F15', subject: 'English', c1Grade: 15.00, c2Grade: 8.50, delta: 6.50, status: 'PENDING', severity: 'CRITICAL' },
    { id: '4', copyCode: 'ANO-4D8E71', subject: 'Computer Science', c1Grade: 17.00, c2Grade: 13.75, delta: 3.25, status: 'RESOLVED', severity: 'MEDIUM', finalGrade: 15.50 },
    { id: '5', copyCode: 'ANO-F6A023', subject: 'Mathematics', c1Grade: 12.00, c2Grade: 8.75, delta: 3.25, status: 'RESOLVED', severity: 'MEDIUM', finalGrade: 10.25 },
    { id: '6', copyCode: 'ANO-2B9D44', subject: 'English', c1Grade: 18.00, c2Grade: 13.00, delta: 5.00, status: 'PENDING', severity: 'HIGH' },
];

const stats = { total: 42, pending: 18, assigned: 10, resolved: 14 };

export const DiscrepanciesPage = () => {
    const [filter, setFilter] = useState<string>('ALL');

    const severityConfig: Record<string, { variant: 'success' | 'warning' | 'danger' | 'neutral' | 'accent'; label: string }> = {
        CRITICAL: { variant: 'danger', label: 'Critical' },
        HIGH: { variant: 'warning', label: 'High' },
        MEDIUM: { variant: 'accent', label: 'Medium' },
    };

    const statusConfig: Record<string, { variant: 'success' | 'warning' | 'danger' | 'neutral' | 'accent'; label: string }> = {
        PENDING: { variant: 'warning', label: 'Pending' },
        ASSIGNED: { variant: 'accent', label: '3rd Assigned' },
        RESOLVED: { variant: 'success', label: 'Resolved' },
    };

    const filtered = filter === 'ALL' ? mockDiscrepancies : mockDiscrepancies.filter(d => d.status === filter);

    return (
        <AppShell title="Discrepancy Management">
            <div className="space-y-8">
                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Discrepancies', value: stats.total, icon: AlertTriangle, color: 'text-primary-accent', bg: 'bg-primary-accent/10' },
                        { label: 'Pending Review', value: stats.pending, icon: XCircle, color: 'text-warning', bg: 'bg-warning/10' },
                        { label: '3rd Corrector Assigned', value: stats.assigned, icon: UserPlus, color: 'text-primary-accent', bg: 'bg-primary-accent/10' },
                        { label: 'Resolved', value: stats.resolved, icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' },
                    ].map((stat, i) => (
                        <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                            <Card className="p-5">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", stat.bg, stat.color)}>
                                        <stat.icon size={20} />
                                    </div>
                                </div>
                                <p className="text-[11px] font-bold uppercase tracking-wider text-muted">{stat.label}</p>
                                <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Table */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Filters */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                {['ALL', 'PENDING', 'ASSIGNED', 'RESOLVED'].map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f)}
                                        className={cn(
                                            "px-4 py-2 rounded-md text-small font-medium transition-all",
                                            filter === f ? "bg-primary-accent text-white" : "bg-white border border-border text-muted hover:text-text-primary"
                                        )}
                                    >
                                        {f === 'ALL' ? 'All' : statusConfig[f]?.label || f}
                                    </button>
                                ))}
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                                <input type="text" placeholder="Search copy code..." className="input-field pl-10 w-64" />
                            </div>
                        </div>

                        {/* Table */}
                        <Card className="overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-black/[0.02] border-b border-border">
                                            <th className="p-4 text-small font-bold text-muted uppercase tracking-wider">Copy Code</th>
                                            <th className="p-4 text-small font-bold text-muted uppercase tracking-wider">Subject</th>
                                            <th className="p-4 text-small font-bold text-muted uppercase tracking-wider">
                                                <span className="flex items-center gap-1">C1 <ArrowUpDown size={12} /></span>
                                            </th>
                                            <th className="p-4 text-small font-bold text-muted uppercase tracking-wider">C2</th>
                                            <th className="p-4 text-small font-bold text-muted uppercase tracking-wider">Delta</th>
                                            <th className="p-4 text-small font-bold text-muted uppercase tracking-wider">Severity</th>
                                            <th className="p-4 text-small font-bold text-muted uppercase tracking-wider">Status</th>
                                            <th className="p-4 text-small font-bold text-muted uppercase tracking-wider text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filtered.map((d) => (
                                            <tr key={d.id} className="hover:bg-black/[0.01] transition-colors group">
                                                <td className="p-4 text-small font-mono font-bold text-primary-accent">{d.copyCode}</td>
                                                <td className="p-4 text-small text-muted">{d.subject}</td>
                                                <td className="p-4 text-small font-bold">{d.c1Grade.toFixed(2)}</td>
                                                <td className="p-4 text-small font-bold">{d.c2Grade.toFixed(2)}</td>
                                                <td className="p-4">
                                                    <span className={cn(
                                                        "text-small font-bold",
                                                        d.delta >= 5 ? "text-danger" : d.delta >= 3 ? "text-warning" : "text-muted"
                                                    )}>
                                                        {d.delta.toFixed(2)}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <Badge variant={severityConfig[d.severity]?.variant || 'neutral'}>
                                                        {severityConfig[d.severity]?.label || d.severity}
                                                    </Badge>
                                                </td>
                                                <td className="p-4">
                                                    <Badge variant={statusConfig[d.status]?.variant || 'neutral'}>
                                                        {statusConfig[d.status]?.label || d.status}
                                                    </Badge>
                                                </td>
                                                <td className="p-4 text-right">
                                                    {d.status === 'PENDING' ? (
                                                        <Button size="sm" className="gap-1.5">
                                                            <UserPlus size={14} /> Assign 3rd
                                                        </Button>
                                                    ) : d.status === 'RESOLVED' ? (
                                                        <span className="text-small text-success font-bold">{d.finalGrade?.toFixed(2)}</span>
                                                    ) : (
                                                        <Button variant="ghost" size="sm" className="gap-1.5 text-muted">
                                                            <Eye size={14} /> View
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="p-4 border-t border-border flex items-center justify-between">
                                <p className="text-small text-muted">
                                    Showing <span className="font-bold text-text-primary">{filtered.length}</span> of <span className="font-bold text-text-primary">{stats.total}</span>
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button variant="secondary" size="sm" className="p-2 min-h-0" disabled><ChevronLeft size={18} /></Button>
                                    <Button size="sm" className="min-h-0 w-8 h-8 p-0">1</Button>
                                    <Button variant="ghost" size="sm" className="min-h-0 w-8 h-8 p-0">2</Button>
                                    <Button variant="secondary" size="sm" className="p-2 min-h-0"><ChevronRight size={18} /></Button>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Side Panel */}
                    <div className="space-y-6">
                        <Card className="p-6">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                <Settings size={20} className="text-muted" /> Threshold Config
                            </h3>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-small font-bold text-text-primary block">Discrepancy Threshold</label>
                                    <div className="flex items-center gap-3">
                                        <input type="range" className="flex-1 accent-primary-accent" min="1" max="6" step="0.25" defaultValue="3" />
                                        <span className="w-14 text-center font-bold text-primary-accent bg-primary-accent/5 rounded px-2 py-1">3.00</span>
                                    </div>
                                    <p className="text-[11px] text-muted">Grade differences above this value trigger a 3rd correction.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-small font-bold text-text-primary block">Final Grade Rule</label>
                                    <select className="input-field appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat">
                                        <option value="AVERAGE">Average of all correctors</option>
                                        <option value="MEDIAN">Median score</option>
                                        <option value="THIRD_CORRECTOR">3rd corrector only</option>
                                    </select>
                                </div>

                                <Button variant="secondary" className="w-full">Save Configuration</Button>
                            </div>
                        </Card>

                        <Card className="p-6">
                            <h4 className="text-small font-bold mb-4 flex items-center gap-2">
                                <TrendingUp size={16} className="text-primary-accent" /> Distribution
                            </h4>
                            <div className="space-y-3">
                                {[
                                    { label: 'Critical (Δ ≥ 5.0)', count: 5, color: 'bg-danger', pct: 12 },
                                    { label: 'High (Δ ≥ 4.0)', count: 12, color: 'bg-warning', pct: 29 },
                                    { label: 'Medium (Δ ≥ 3.0)', count: 25, color: 'bg-primary-accent', pct: 59 },
                                ].map((item) => (
                                    <div key={item.label}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[12px] text-muted">{item.label}</span>
                                            <span className="text-[12px] font-bold text-text-primary">{item.count}</span>
                                        </div>
                                        <div className="w-full h-2 bg-surface/30 rounded-full overflow-hidden">
                                            <div className={cn("h-full rounded-full", item.color)} style={{ width: `${item.pct}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </AppShell>
    );
};
