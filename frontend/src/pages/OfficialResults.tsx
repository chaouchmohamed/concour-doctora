import React, { useState } from 'react';
import {
    Trophy,
    Download,
    Printer,
    Search,
    Filter,
    FileText,
    TrendingUp,
    Users,
    ChevronLeft,
    ChevronRight,
    Eye,
    Medal,
    BarChart3
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { Card, Badge, Button } from '../components/UI';
import { cn } from '../constants';
import { motion } from 'motion/react';

const mockResults = [
    { rank: 1, name: 'Amine Benali', code: 'DOCT-2026-042', avg: 17.45, status: 'ADMITTED', math: 18.5, english: 16.4, specialty: 17.5 },
    { rank: 2, name: 'Sarah Mansouri', code: 'DOCT-2026-118', avg: 16.82, status: 'ADMITTED', math: 15.0, english: 18.6, specialty: 16.9 },
    { rank: 3, name: 'Karim Zidi', code: 'DOCT-2026-009', avg: 16.10, status: 'ADMITTED', math: 17.2, english: 15.0, specialty: 16.1 },
    { rank: 4, name: 'Lina Khelifi', code: 'DOCT-2026-254', avg: 15.95, status: 'WAITLIST', math: 14.5, english: 17.4, specialty: 16.0 },
    { rank: 5, name: 'Yacine Brahimi', code: 'DOCT-2026-087', avg: 15.42, status: 'WAITLIST', math: 16.0, english: 14.8, specialty: 15.5 },
    { rank: 6, name: 'Fatima Zerrouki', code: 'DOCT-2026-156', avg: 14.20, status: 'REJECTED', math: 12.0, english: 16.4, specialty: 14.2 },
    { rank: 7, name: 'Omar Boudiaf', code: 'DOCT-2026-201', avg: 13.80, status: 'REJECTED', math: 11.5, english: 15.2, specialty: 14.7 },
    { rank: 8, name: 'Nadia Hamdi', code: 'DOCT-2026-089', avg: 13.20, status: 'REJECTED', math: 13.0, english: 12.8, specialty: 13.8 },
];

export const OfficialResultsPage = () => {
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

    const filtered = statusFilter === 'ALL' ? mockResults : mockResults.filter(r => r.status === statusFilter);

    return (
        <AppShell title="Official Results">
            <div className="space-y-8">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Candidates', value: '1,248', icon: Users, color: 'text-primary-accent', bg: 'bg-primary-accent/10' },
                        { label: 'Admitted', value: '45', icon: Trophy, color: 'text-success', bg: 'bg-success/10' },
                        { label: 'Waitlist', value: '15', icon: Medal, color: 'text-warning', bg: 'bg-warning/10' },
                        { label: 'General Average', value: '12.84', icon: BarChart3, color: 'text-primary-accent', bg: 'bg-primary-accent/10' },
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

                {/* Controls */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        {['ALL', 'ADMITTED', 'WAITLIST', 'REJECTED'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setStatusFilter(f)}
                                className={cn(
                                    "px-4 py-2 rounded-md text-small font-medium transition-all",
                                    statusFilter === f ? "bg-primary-accent text-white" : "bg-white border border-border text-muted hover:text-text-primary"
                                )}
                            >
                                {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                            <input type="text" placeholder="Search candidate..." className="input-field pl-10 w-56" />
                        </div>
                        <Button variant="secondary" size="sm" className="gap-2">
                            <Printer size={16} /> Print PV
                        </Button>
                        <Button size="sm" className="gap-2">
                            <Download size={16} /> Export PDF
                        </Button>
                    </div>
                </div>

                {/* Results Table */}
                <Card className="overflow-hidden">
                    <div className="p-6 border-b border-border flex items-center justify-between bg-black/[0.01]">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <TrendingUp size={20} className="text-primary-accent" /> Final Ranking
                        </h3>
                        <div className="flex items-center gap-2">
                            <Badge variant="success">Official</Badge>
                            <Badge variant="neutral">Session 2026</Badge>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-black/[0.02] border-b border-border">
                                    <th className="p-4 text-small font-bold text-muted uppercase tracking-wider w-16">Rank</th>
                                    <th className="p-4 text-small font-bold text-muted uppercase tracking-wider">Candidate</th>
                                    <th className="p-4 text-small font-bold text-muted uppercase tracking-wider">Math</th>
                                    <th className="p-4 text-small font-bold text-muted uppercase tracking-wider">English</th>
                                    <th className="p-4 text-small font-bold text-muted uppercase tracking-wider">Specialty</th>
                                    <th className="p-4 text-small font-bold text-muted uppercase tracking-wider">Average</th>
                                    <th className="p-4 text-small font-bold text-muted uppercase tracking-wider">Decision</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filtered.map((r) => (
                                    <tr key={r.code} className="hover:bg-black/[0.01] transition-colors">
                                        <td className="p-4">
                                            <div className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs",
                                                r.rank <= 3 ? "bg-primary-accent text-white" : "bg-surface/30 text-muted"
                                            )}>
                                                {r.rank}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <p className="text-small font-bold text-text-primary">{r.name}</p>
                                            <p className="text-[11px] text-muted font-mono">{r.code}</p>
                                        </td>
                                        <td className="p-4 text-small font-medium">{r.math.toFixed(1)}</td>
                                        <td className="p-4 text-small font-medium">{r.english.toFixed(1)}</td>
                                        <td className="p-4 text-small font-medium">{r.specialty.toFixed(1)}</td>
                                        <td className="p-4">
                                            <span className="text-lg font-bold text-text-primary">{r.avg.toFixed(2)}</span>
                                        </td>
                                        <td className="p-4">
                                            <Badge variant={r.status === 'ADMITTED' ? 'success' : r.status === 'WAITLIST' ? 'warning' : 'neutral'}>
                                                {r.status}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-4 border-t border-border flex items-center justify-between">
                        <p className="text-small text-muted">
                            Showing <span className="font-bold text-text-primary">{filtered.length}</span> of <span className="font-bold text-text-primary">1,248</span>
                        </p>
                        <div className="flex items-center gap-2">
                            <Button variant="secondary" size="sm" className="p-2 min-h-0" disabled><ChevronLeft size={18} /></Button>
                            <Button size="sm" className="min-h-0 w-8 h-8 p-0">1</Button>
                            <Button variant="ghost" size="sm" className="min-h-0 w-8 h-8 p-0">2</Button>
                            <Button variant="ghost" size="sm" className="min-h-0 w-8 h-8 p-0">3</Button>
                            <Button variant="secondary" size="sm" className="p-2 min-h-0"><ChevronRight size={18} /></Button>
                        </div>
                    </div>
                </Card>
            </div>
        </AppShell>
    );
};
