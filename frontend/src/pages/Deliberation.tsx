import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  FileText,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Printer,
  Download,
  ShieldCheck,
  ChevronDown,
  Info,
  Settings
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { Card, Badge, Button } from '../components/UI';
import { motion } from 'motion/react';
import { cn } from '../constants';

const mockRanking = [
  { rank: 1, code: 'DOCT-2026-042', avg: 17.45, status: 'ADMITTED', math: 18.5, english: 16.4 },
  { rank: 2, code: 'DOCT-2026-118', avg: 16.82, status: 'ADMITTED', math: 15.0, english: 18.6 },
  { rank: 3, code: 'DOCT-2026-009', avg: 16.10, status: 'ADMITTED', math: 17.2, english: 15.0 },
  { rank: 4, code: 'DOCT-2026-254', avg: 15.95, status: 'WAITLIST', math: 14.5, english: 17.4 },
  { rank: 5, code: 'DOCT-2026-087', avg: 15.42, status: 'WAITLIST', math: 16.0, english: 14.8 },
  { rank: 6, code: 'DOCT-2026-156', avg: 14.20, status: 'REJECTED', math: 12.0, english: 16.4 },
];

export const DeliberationPage = () => {
  const [isClosed, setIsClosed] = useState(false);
  const [showRealNames, setShowRealNames] = useState(false);

  const handleCloseDeliberation = () => {
    if (window.confirm("Are you sure you want to close the deliberation? This action is irreversible and will lift anonymity.")) {
      setIsClosed(true);
      setShowRealNames(true);
    }
  };

  return (
    <AppShell title="Final Deliberation Panel">
      <div className="space-y-8">
        {/* Top Controls & Status */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center border-2",
              isClosed ? "bg-success/10 border-success text-success" : "bg-warning/10 border-warning text-warning"
            )}>
              {isClosed ? <Lock size={28} /> : <Unlock size={28} />}
            </div>
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                Status: {isClosed ? "Closed & Finalized" : "Open Deliberation"}
                {isClosed && <Badge variant="success">OFFICIAL</Badge>}
              </h2>
              <p className="text-small text-muted">
                {isClosed ? "Anonymity lifted. Results are ready for publication." : "Reviewing aggregated grades. Anonymity is active."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isClosed ? (
              <Button className="gap-2 h-12 px-8" onClick={handleCloseDeliberation}>
                <ShieldCheck size={20} /> Close Deliberation
              </Button>
            ) : (
              <>
                <Button variant="secondary" className="gap-2">
                  <Printer size={18} /> Print PV
                </Button>
                <Button className="gap-2">
                  <Download size={18} /> Publish Results
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Ranking Table */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="overflow-hidden">
              <div className="p-6 border-b border-border flex items-center justify-between bg-black/[0.01]">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  Provisional Ranking
                  <TrendingUp size={20} className="text-primary-accent" />
                </h3>
                <div className="flex items-center gap-2">
                  <Badge variant="accent">1,248 Candidates</Badge>
                  <Badge variant="neutral">3 Subjects</Badge>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-black/[0.02] border-b border-border">
                      <th className="p-4 text-small font-bold text-muted uppercase tracking-wider w-16">Rank</th>
                      <th className="p-4 text-small font-bold text-muted uppercase tracking-wider">
                        {showRealNames ? "Full Name" : "Anonymous Code"}
                      </th>
                      <th className="p-4 text-small font-bold text-muted uppercase tracking-wider">Avg. Grade</th>
                      <th className="p-4 text-small font-bold text-muted uppercase tracking-wider">Status</th>
                      <th className="p-4 text-small font-bold text-muted uppercase tracking-wider text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {mockRanking.map((item) => (
                      <tr key={item.code} className="hover:bg-black/[0.01] transition-colors group">
                        <td className="p-4">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs",
                            item.rank <= 3 ? "bg-primary-accent text-white" : "bg-surface text-primary-accent"
                          )}>
                            {item.rank}
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="text-small font-bold text-text-primary">
                            {showRealNames ? (item.rank === 1 ? "Amine Benali" : "Candidate " + item.rank) : item.code}
                          </p>
                          {showRealNames && <p className="text-[11px] text-muted font-mono">{item.code}</p>}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-text-primary">{item.avg.toFixed(2)}</span>
                            <div className="flex flex-col text-[10px] text-muted leading-tight">
                              <span>M: {item.math.toFixed(1)}</span>
                              <span>E: {item.english.toFixed(1)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant={item.status === 'ADMITTED' ? 'success' : item.status === 'WAITLIST' ? 'warning' : 'neutral'}>
                            {item.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          <Button variant="ghost" size="sm" className="p-2 min-h-0 text-muted">
                            <ChevronDown size={18} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-4 border-t border-border bg-black/[0.01] text-center">
                <Button variant="ghost" size="sm" className="text-primary-accent font-bold">
                  Load more candidates...
                </Button>
              </div>
            </Card>
          </div>

          {/* Deliberation Controls */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                Deliberation Rules
                <Settings size={20} className="text-muted" />
              </h3>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-small font-bold text-text-primary block">Admissibility Threshold</label>
                  <div className="flex items-center gap-3">
                    <input type="range" className="flex-1 accent-primary-accent" min="8" max="14" step="0.1" defaultValue="10" />
                    <span className="w-12 text-center font-bold text-primary-accent">10.0</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-small font-bold text-text-primary block">Quota (Admitted)</label>
                  <input type="number" className="input-field" defaultValue="45" />
                </div>

                <div className="p-4 bg-surface/20 rounded-md border border-border space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-small text-muted">Admitted</span>
                    <span className="text-small font-bold text-success">45</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-small text-muted">Waitlist</span>
                    <span className="text-small font-bold text-warning">15</span>
                  </div>
                  <div className="h-px bg-border"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-small text-muted">Last Admitted Avg.</span>
                    <span className="text-small font-bold text-primary-accent">12.42</span>
                  </div>
                </div>

                <Button variant="secondary" className="w-full">Apply Rules</Button>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <CheckCircle2 size={20} className="text-success" /> Checklist
              </h3>
              <div className="space-y-3">
                {[
                  { label: "All subjects validated", checked: true },
                  { label: "Attendance PVs signed", checked: true },
                  { label: "Discrepancies resolved", checked: true },
                  { label: "Jury signatures collected", checked: false },
                ].map((item, i) => (
                  <label key={i} className="flex items-center gap-3 cursor-pointer group">
                    <div className={cn(
                      "w-5 h-5 rounded border flex items-center justify-center transition-all",
                      item.checked ? "bg-success border-success text-white" : "border-border group-hover:border-primary-accent"
                    )}>
                      {item.checked && <CheckCircle2 size={14} />}
                    </div>
                    <span className={cn("text-small transition-colors", item.checked ? "text-text-primary font-medium" : "text-muted")}>
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
            </Card>

            <div className="p-4 bg-primary-accent/5 border border-primary-accent/20 rounded-md flex gap-3">
              <Info size={20} className="text-primary-accent shrink-0" />
              <p className="text-[12px] text-muted leading-tight">
                Closing the deliberation will lock all grades and generate the final ranking PV. This action is logged in the audit trail.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

// Page component logic ends

