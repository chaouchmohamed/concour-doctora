import React, { useState } from 'react';
import {
    Users,
    UserPlus,
    Shield,
    Mail,
    MoreVertical,
    Edit2,
    Trash2,
    Search,
    Filter,
    CheckCircle2,
    XCircle,
    Clock,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { Card, Badge, Button, Input } from '../components/UI';
import { cn } from '../constants';

const mockUsers = [
    { id: '1', name: 'Jean Dupont', email: 'j.dupont@univ-alger.dz', role: 'ADMIN', status: 'ACTIVE', lastLogin: '2026-03-09 14:22' },
    { id: '2', name: 'Amina Saidi', email: 'a.saidi@univ-alger.dz', role: 'COORDINATOR', status: 'ACTIVE', lastLogin: '2026-03-09 10:15' },
    { id: '3', name: 'Rachid Kermiche', email: 'r.kermiche@univ-alger.dz', role: 'CORRECTOR', status: 'ACTIVE', lastLogin: '2026-03-08 16:45' },
    { id: '4', name: 'Fatima Belhadj', email: 'f.belhadj@univ-alger.dz', role: 'CFD_HEAD', status: 'ACTIVE', lastLogin: '2026-03-07 09:30' },
    { id: '5', name: 'Mourad Larbi', email: 'm.larbi@univ-alger.dz', role: 'SUPERVISOR', status: 'INACTIVE', lastLogin: '2026-02-15 11:00' },
    { id: '6', name: 'Leila Bouazza', email: 'l.bouazza@univ-alger.dz', role: 'CORRECTOR', status: 'ACTIVE', lastLogin: '2026-03-09 08:12' },
    { id: '7', name: 'Hassan Medjdoub', email: 'h.medjdoub@univ-alger.dz', role: 'JURY_MEMBER', status: 'PENDING', lastLogin: 'Never' },
];

const roleLabels: Record<string, string> = {
    ADMIN: 'Administrator',
    COORDINATOR: 'Coordinator',
    CORRECTOR: 'Corrector',
    CFD_HEAD: 'CFD Head',
    SUPERVISOR: 'Supervisor',
    JURY_MEMBER: 'Jury Member',
};

const roleColors: Record<string, string> = {
    ADMIN: 'bg-danger/10 text-danger border-danger/20',
    COORDINATOR: 'bg-primary-accent/10 text-primary-accent border-primary-accent/20',
    CORRECTOR: 'bg-success/10 text-success border-success/20',
    CFD_HEAD: 'bg-warning/10 text-warning border-warning/20',
    SUPERVISOR: 'bg-primary-accent/10 text-primary-accent border-primary-accent/20',
    JURY_MEMBER: 'bg-muted/10 text-muted border-muted/20',
};

export const UserManagementPage = () => {
    const [showInvite, setShowInvite] = useState(false);

    return (
        <AppShell title="User Management">
            <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Users', value: '24', icon: Users },
                        { label: 'Active', value: '21', icon: CheckCircle2, color: 'text-success' },
                        { label: 'Inactive', value: '2', icon: XCircle, color: 'text-muted' },
                        { label: 'Pending', value: '1', icon: Clock, color: 'text-warning' },
                    ].map((stat) => (
                        <Card key={stat.label} className="p-4 flex items-center gap-3">
                            <div className={cn("w-10 h-10 rounded-full bg-surface/30 flex items-center justify-center", stat.color || 'text-primary-accent')}>
                                <stat.icon size={20} />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-wider text-muted">{stat.label}</p>
                                <p className="text-xl font-bold text-text-primary">{stat.value}</p>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Controls */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex flex-1 items-center gap-3 max-w-xl">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                            <input type="text" placeholder="Search users..." className="input-field pl-10" />
                        </div>
                        <Button variant="secondary" className="gap-2 shrink-0">
                            <Filter size={18} /> Role filter
                        </Button>
                    </div>

                    <Button className="gap-2" onClick={() => setShowInvite(!showInvite)}>
                        <UserPlus size={18} /> Invite User
                    </Button>
                </div>

                {/* Invite Form */}
                {showInvite && (
                    <Card className="p-6 border-primary-accent/20 bg-primary-accent/[0.02]">
                        <h3 className="text-lg font-bold mb-4">Invite New User</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input label="Full Name" placeholder="Enter name" required />
                            <Input label="Email" placeholder="user@institution.edu" type="email" required />
                            <div className="space-y-1.5">
                                <label className="text-small font-medium text-text-primary block">Role</label>
                                <select className="input-field appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat">
                                    {Object.entries(roleLabels).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 mt-4">
                            <Button className="gap-2"><Mail size={16} /> Send Invitation</Button>
                            <Button variant="ghost" onClick={() => setShowInvite(false)}>Cancel</Button>
                        </div>
                    </Card>
                )}

                {/* Users Table */}
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-black/[0.02] border-b border-border">
                                    <th className="p-4 text-small font-bold text-muted uppercase tracking-wider">User</th>
                                    <th className="p-4 text-small font-bold text-muted uppercase tracking-wider">Role</th>
                                    <th className="p-4 text-small font-bold text-muted uppercase tracking-wider">Status</th>
                                    <th className="p-4 text-small font-bold text-muted uppercase tracking-wider">Last Login</th>
                                    <th className="p-4 text-small font-bold text-muted uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {mockUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-black/[0.01] transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-surface flex items-center justify-center text-primary-accent font-bold text-sm border border-primary-accent/20">
                                                    {user.name.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <div>
                                                    <p className="text-small font-bold text-text-primary">{user.name}</p>
                                                    <p className="text-[11px] text-muted">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={cn("px-2.5 py-0.5 rounded-full text-[12px] font-semibold border", roleColors[user.role])}>
                                                {roleLabels[user.role] || user.role}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <Badge variant={user.status === 'ACTIVE' ? 'success' : user.status === 'PENDING' ? 'warning' : 'neutral'}>
                                                {user.status}
                                            </Badge>
                                        </td>
                                        <td className="p-4 text-small text-muted">{user.lastLogin}</td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="sm" className="p-2 min-h-0 text-muted hover:text-primary-accent">
                                                    <Edit2 size={16} />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="p-2 min-h-0 text-muted hover:text-primary-accent">
                                                    <Shield size={16} />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="p-2 min-h-0 text-muted hover:text-danger">
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-4 border-t border-border flex items-center justify-between">
                        <p className="text-small text-muted">
                            Showing <span className="font-bold text-text-primary">1-7</span> of <span className="font-bold text-text-primary">24</span>
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
        </AppShell>
    );
};
