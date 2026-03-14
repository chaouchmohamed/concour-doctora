import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Mail, 
  MoreVertical, 
  Eye, 
  Edit2, 
  UserX,
  ChevronLeft,
  ChevronRight,
  Plus
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { Card, Badge, Button, Input } from '../components/UI';
import { CandidateStatus } from '../types';

const mockCandidates = [
  { id: '1', appNum: 'DOCT-2026-001', name: 'Amine Benali', nid: '199201020304', email: 'a.benali@email.com', phone: '0550123456', status: CandidateStatus.REGISTERED, session: 'Session 2026' },
  { id: '2', appNum: 'DOCT-2026-002', name: 'Sarah Mansouri', nid: '199505060708', email: 's.mansouri@email.com', phone: '0661987654', status: CandidateStatus.PRESENT, session: 'Session 2026' },
  { id: '3', appNum: 'DOCT-2026-003', name: 'Karim Zidi', nid: '199009101112', email: 'k.zidi@email.com', phone: '0772345678', status: CandidateStatus.ELIMINATED, session: 'Session 2026' },
  { id: '4', appNum: 'DOCT-2026-004', name: 'Lina Khelifi', nid: '199812131415', email: 'l.khelifi@email.com', phone: '0555112233', status: CandidateStatus.REGISTERED, session: 'Session 2026' },
  { id: '5', appNum: 'DOCT-2026-005', name: 'Yacine Brahimi', nid: '199316171819', email: 'y.brahimi@email.com', phone: '0662445566', status: CandidateStatus.PRESENT, session: 'Session 2026' },
];

export const CandidatesPage = () => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    setSelectedIds(prev => prev.length === mockCandidates.length ? [] : mockCandidates.map(c => c.id));
  };

  const getStatusBadge = (status: CandidateStatus) => {
    switch (status) {
      case CandidateStatus.REGISTERED: return <Badge variant="accent">REGISTERED</Badge>;
      case CandidateStatus.PRESENT: return <Badge variant="success">PRESENT</Badge>;
      case CandidateStatus.ELIMINATED: return <Badge variant="danger">ELIMINATED</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <AppShell title="Candidate Management">
      <div className="space-y-6">
        {/* Top Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-3 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
              <input 
                type="text" 
                placeholder="Search by name, application #, or ID..." 
                className="input-field pl-10"
              />
            </div>
            <Button variant="secondary" className="gap-2 shrink-0">
              <Filter size={18} /> Filters
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" className="gap-2">
              <Download size={16} /> Export
            </Button>
            <Button variant="secondary" size="sm" className="gap-2">
              <Upload size={16} /> Import CSV
            </Button>
            <Button size="sm" className="gap-2">
              <Plus size={16} /> Add Candidate
            </Button>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedIds.length > 0 && (
          <div className="bg-primary-accent/5 border border-primary-accent/20 rounded-md p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
            <p className="text-small font-medium text-primary-accent">
              {selectedIds.length} candidates selected
            </p>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" className="text-primary-accent gap-2">
                <Mail size={16} /> Send Convocation
              </Button>
              <Button size="sm" variant="ghost" className="text-danger gap-2">
                <UserX size={16} /> Deactivate
              </Button>
            </div>
          </div>
        )}

        {/* Table */}
        <Card className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/[0.02] border-b border-border">
                <th className="p-4 w-10">
                  <input 
                    type="checkbox" 
                    className="rounded border-border text-primary-accent focus:ring-primary-accent" 
                    checked={selectedIds.length === mockCandidates.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="p-4 text-small font-bold text-muted uppercase tracking-wider">App #</th>
                <th className="p-4 text-small font-bold text-muted uppercase tracking-wider">Full Name</th>
                <th className="p-4 text-small font-bold text-muted uppercase tracking-wider">National ID</th>
                <th className="p-4 text-small font-bold text-muted uppercase tracking-wider">Status</th>
                <th className="p-4 text-small font-bold text-muted uppercase tracking-wider">Session</th>
                <th className="p-4 text-small font-bold text-muted uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {mockCandidates.map((candidate) => (
                <tr key={candidate.id} className="hover:bg-black/[0.01] transition-colors group">
                  <td className="p-4">
                    <input 
                      type="checkbox" 
                      className="rounded border-border text-primary-accent focus:ring-primary-accent" 
                      checked={selectedIds.includes(candidate.id)}
                      onChange={() => toggleSelect(candidate.id)}
                    />
                  </td>
                  <td className="p-4 text-small font-mono font-medium">{candidate.appNum}</td>
                  <td className="p-4">
                    <div>
                      <p className="text-small font-bold text-text-primary">{candidate.name}</p>
                      <p className="text-[11px] text-muted">{candidate.email}</p>
                    </div>
                  </td>
                  <td className="p-4 text-small text-muted">{candidate.nid}</td>
                  <td className="p-4">{getStatusBadge(candidate.status)}</td>
                  <td className="p-4 text-small text-muted">{candidate.session}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" className="p-2 min-h-0 text-muted hover:text-primary-accent">
                        <Eye size={16} />
                      </Button>
                      <Button variant="ghost" size="sm" className="p-2 min-h-0 text-muted hover:text-primary-accent">
                        <Edit2 size={16} />
                      </Button>
                      <Button variant="ghost" size="sm" className="p-2 min-h-0 text-muted hover:text-danger">
                        <MoreVertical size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="p-4 border-t border-border flex items-center justify-between">
            <p className="text-small text-muted">
              Showing <span className="font-bold text-text-primary">1-5</span> of <span className="font-bold text-text-primary">1,248</span>
            </p>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" className="p-2 min-h-0" disabled>
                <ChevronLeft size={18} />
              </Button>
              <div className="flex items-center gap-1">
                <Button size="sm" className="min-h-0 w-8 h-8 p-0">1</Button>
                <Button variant="ghost" size="sm" className="min-h-0 w-8 h-8 p-0">2</Button>
                <Button variant="ghost" size="sm" className="min-h-0 w-8 h-8 p-0">3</Button>
                <span className="text-muted px-1">...</span>
                <Button variant="ghost" size="sm" className="min-h-0 w-8 h-8 p-0">25</Button>
              </div>
              <Button variant="secondary" size="sm" className="p-2 min-h-0">
                <ChevronRight size={18} />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
};
