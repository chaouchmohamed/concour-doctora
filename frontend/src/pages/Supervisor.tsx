import React, { useState, useEffect } from 'react';
import {
  Wifi,
  WifiOff,
  Check,
  X,
  Clock,
  AlertCircle,
  Undo2,
  Printer,
  Search,
  ChevronLeft,
  Users
} from 'lucide-react';
import { Card, Badge, Button } from '../components/UI';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../constants';

const mockStudents = [
  { id: '1', seat: '01', appNum: 'DOCT-001', name: 'Amine Benali', status: 'PENDING' },
  { id: '2', seat: '02', appNum: 'DOCT-002', name: 'Sarah Mansouri', status: 'PRESENT' },
  { id: '3', seat: '03', appNum: 'DOCT-003', name: 'Karim Zidi', status: 'ABSENT' },
  { id: '4', seat: '04', appNum: 'DOCT-004', name: 'Lina Khelifi', status: 'PENDING' },
  { id: '5', seat: '05', appNum: 'DOCT-005', name: 'Yacine Brahimi', status: 'PENDING' },
  { id: '6', seat: '06', appNum: 'DOCT-006', name: 'Mounir Haddad', status: 'PRESENT' },
  { id: '7', seat: '07', appNum: 'DOCT-007', name: 'Fatiha Belkacem', status: 'PENDING' },
];

export const SupervisorPWA = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [students, setStudents] = useState(mockStudents);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleStatus = (id: string, newStatus: string) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
  };

  const presentCount = students.filter(s => s.status === 'PRESENT').length;
  const totalCount = students.length;

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.appNum.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.seat.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-bg flex flex-col max-w-[1024px] mx-auto border-x border-border shadow-2">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-30">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="p-2 min-h-0">
              <ChevronLeft size={24} />
            </Button>
            <div>
              <h1 className="text-lg font-bold leading-tight">Room A102</h1>
              <p className="text-[12px] text-muted">Mathematics & Logic • Session 2026</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AnimatePresence mode="wait">
              {isOnline ? (
                <motion.div
                  key="online"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-1.5 px-2 py-1 bg-success/10 text-success rounded-full text-[11px] font-bold"
                >
                  <Wifi size={14} /> SYNCED
                </motion.div>
              ) : (
                <motion.div
                  key="offline"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-1.5 px-2 py-1 bg-warning/10 text-warning rounded-full text-[11px] font-bold"
                >
                  <WifiOff size={14} /> OFFLINE
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Live Counter */}
        <div className="px-4 pb-4">
          <div className="bg-surface/30 rounded-md p-3 flex items-center justify-between border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-border shadow-sm">
                <Users size={20} className="text-primary-accent" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Attendance</p>
                <p className="text-lg font-bold text-text-primary">{presentCount} / {totalCount} Marked</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-muted">
              <Clock size={16} />
              <span className="text-small font-mono">01:42:15</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
            <input
              type="text"
              placeholder="Search seat, name, or app #..."
              className="input-field pl-10 bg-black/[0.02]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </header>

      {/* Main List */}
      <main className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredStudents.map((student) => (
          <motion.div
            layout
            key={student.id}
            className={cn(
              "p-4 rounded-md border transition-all flex items-center justify-between gap-4",
              student.status === 'PRESENT' ? "bg-success/5 border-success/20" :
                student.status === 'ABSENT' ? "bg-danger/5 border-danger/20 opacity-60" :
                  "bg-white border-border shadow-sm"
            )}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-md bg-surface flex items-center justify-center text-primary-accent font-bold border border-primary-accent/10">
                {student.seat}
              </div>
              <div>
                <p className="font-bold text-text-primary leading-tight">{student.name}</p>
                <p className="text-[12px] text-muted font-mono">{student.appNum}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleStatus(student.id, student.status === 'PRESENT' ? 'PENDING' : 'PRESENT')}
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                  student.status === 'PRESENT'
                    ? "bg-success text-white shadow-md"
                    : "bg-black/[0.03] text-muted hover:bg-black/[0.06]"
                )}
              >
                <Check size={24} />
              </button>
              <button
                onClick={() => toggleStatus(student.id, student.status === 'ABSENT' ? 'PENDING' : 'ABSENT')}
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                  student.status === 'ABSENT'
                    ? "bg-danger text-white shadow-md"
                    : "bg-black/[0.03] text-muted hover:bg-black/[0.06]"
                )}
              >
                <X size={24} />
              </button>
              <Button variant="ghost" size="sm" className="p-2 min-h-0 text-muted">
                <AlertCircle size={20} />
              </Button>
            </div>
          </motion.div>
        ))}
      </main>

      {/* Sticky Actions */}
      <footer className="bg-white border-t border-border p-4 sticky bottom-0 z-30">
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" className="gap-2">
            <Undo2 size={18} /> Undo Last
          </Button>
          <Button className="gap-2">
            Submit All
          </Button>
        </div>
        <div className="mt-3 flex items-center justify-center">
          <Button variant="ghost" size="sm" className="text-muted gap-2">
            <Printer size={16} /> Print Call List (PDF)
          </Button>
        </div>
      </footer>
    </div>
  );
};
