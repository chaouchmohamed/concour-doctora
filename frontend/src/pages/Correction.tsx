import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Save, 
  AlertCircle,
  FileText,
  CheckCircle2
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { Card, Badge, Button, Input } from '../components/UI';
import { cn } from '../constants';
import { motion } from 'motion/react';

export const CorrectionPage = () => {
  const [grade, setGrade] = useState('');
  const [comment, setComment] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <AppShell title="Double-Blind Correction">
      <div className="h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-6">
        {/* Left: Document Viewer */}
        <div className="flex-1 flex flex-col min-w-0 bg-black/[0.02] rounded-lg border border-border overflow-hidden">
          <div className="p-3 bg-white border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant="accent">ANONYMOUS: DOCT-2026-042</Badge>
              <div className="h-4 w-px bg-border"></div>
              <p className="text-small font-medium text-muted">Page 1 of 4</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="p-2 min-h-0"><ZoomOut size={18} /></Button>
              <Button variant="ghost" size="sm" className="p-2 min-h-0"><ZoomIn size={18} /></Button>
              <Button variant="ghost" size="sm" className="p-2 min-h-0"><Maximize2 size={18} /></Button>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto p-8 flex justify-center">
            <div className="w-full max-w-[800px] aspect-[1/1.414] bg-white shadow-2 rounded-sm p-12 border border-border relative">
              {/* Mock Scan Content */}
              <div className="space-y-6 opacity-40 select-none">
                <div className="h-8 bg-black/[0.05] w-3/4 rounded"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-black/[0.05] w-full rounded"></div>
                  <div className="h-4 bg-black/[0.05] w-full rounded"></div>
                  <div className="h-4 bg-black/[0.05] w-5/6 rounded"></div>
                </div>
                <div className="h-40 bg-black/[0.03] w-full rounded border-2 border-dashed border-border flex items-center justify-center">
                  <p className="text-muted text-small italic">Handwritten response area</p>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-black/[0.05] w-full rounded"></div>
                  <div className="h-4 bg-black/[0.05] w-2/3 rounded"></div>
                </div>
              </div>
              
              {/* Watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-6xl font-bold text-black/[0.03] -rotate-45 uppercase tracking-widest">Confidential</p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-white border-t border-border flex items-center justify-center gap-4">
            <Button variant="secondary" size="sm" className="gap-2">
              <ChevronLeft size={18} /> Previous Copy
            </Button>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4].map(p => (
                <button key={p} className={cn("w-8 h-8 rounded text-xs font-bold transition-all", p === 1 ? "bg-primary-accent text-white" : "hover:bg-black/[0.05] text-muted")}>
                  {p}
                </button>
              ))}
            </div>
            <Button variant="secondary" size="sm" className="gap-2">
              Next Copy <ChevronRight size={18} />
            </Button>
          </div>
        </div>

        {/* Right: Grading Panel */}
        <div className="w-full lg:w-[360px] flex flex-col gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Grading Panel</h3>
              <Badge variant="warning">1st Attempt</Badge>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-small font-bold text-text-primary block mb-2">Subject</label>
                <div className="p-3 bg-surface/20 rounded-md border border-border">
                  <p className="text-small font-medium">Mathematics & Logic</p>
                  <p className="text-[11px] text-muted">Max Score: 20.00 • Threshold: 10.00</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-small font-bold text-text-primary block">Numeric Grade</label>
                <div className="relative">
                  <input 
                    type="number" 
                    step="0.25"
                    min="0"
                    max="20"
                    placeholder="0.00"
                    className="input-field text-2xl font-bold text-center h-16"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted font-bold">/ 20</div>
                </div>
                <p className="text-[11px] text-muted italic">Enter grade with 0.25 precision (e.g. 14.75)</p>
              </div>

              <div className="space-y-2">
                <label className="text-small font-bold text-text-primary block">Corrector Comments</label>
                <textarea 
                  className="input-field min-h-[120px] resize-none text-small"
                  placeholder="Optional justification for the grade..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                ></textarea>
                <p className="text-right text-[10px] text-muted">{comment.length}/300 chars</p>
              </div>

              <Button 
                className="w-full gap-2 h-14 text-lg" 
                onClick={handleSave}
                disabled={!grade}
              >
                <Save size={20} /> Save Grade
              </Button>

              {isSaved && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-success bg-success/5 p-3 rounded-md border border-success/20"
                >
                  <CheckCircle2 size={18} />
                  <span className="text-small font-bold">Grade saved successfully!</span>
                </motion.div>
              )}
            </div>
          </Card>

          <Card className="p-6 bg-surface/10">
            <h4 className="text-small font-bold mb-4 flex items-center gap-2">
              <AlertCircle size={16} className="text-primary-accent" /> Grading Guidance
            </h4>
            <ul className="space-y-3">
              <li className="text-[12px] text-muted flex gap-2">
                <span className="text-primary-accent font-bold">•</span>
                Double-check the anonymous code matches the physical copy.
              </li>
              <li className="text-[12px] text-muted flex gap-2">
                <span className="text-primary-accent font-bold">•</span>
                Ensure all pages are legible before submitting.
              </li>
              <li className="text-[12px] text-muted flex gap-2">
                <span className="text-primary-accent font-bold">•</span>
                Discrepancies {'>'} 3.00 points will trigger a 3rd correction.
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </AppShell>
  );
};

// Page component logic ends

