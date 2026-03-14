import React, { useState } from 'react';
import {
    Calendar,
    Clock,
    MapPin,
    Plus,
    Edit2,
    Trash2,
    Shuffle,
    Lock,
    Unlock,
    ChevronDown,
    FileText,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { Card, Badge, Button, Input } from '../components/UI';
import { cn } from '../constants';
import { motion, AnimatePresence } from 'motion/react';

const mockExams = [
    { id: '1', subject: 'Mathematics & Logic', date: '2026-03-10', time: '09:00', duration: '3h', rooms: ['A101', 'A102'], status: 'SCHEDULED', coefficient: 3 },
    { id: '2', subject: 'English Proficiency', date: '2026-03-10', time: '14:00', duration: '2h', rooms: ['B204'], status: 'ACTIVE', coefficient: 2 },
    { id: '3', subject: 'Specialty: Computer Science', date: '2026-03-11', time: '09:00', duration: '3h', rooms: ['C301', 'C302'], status: 'DRAFT', coefficient: 4 },
    { id: '4', subject: 'General Knowledge', date: '2026-03-12', time: '09:00', duration: '2h', rooms: ['A101'], status: 'LOCKED', coefficient: 1 },
];

const availableRooms = ['A101', 'A102', 'B204', 'C301', 'C302', 'D105', 'D106'];

export const ExamPlanningPage = () => {
    const [showLottery, setShowLottery] = useState(false);
    const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
    const [lotterySpinning, setLotterySpinning] = useState(false);

    const statusConfig: Record<string, { variant: 'success' | 'warning' | 'danger' | 'neutral' | 'accent'; label: string }> = {
        SCHEDULED: { variant: 'accent', label: 'Scheduled' },
        ACTIVE: { variant: 'success', label: 'Active' },
        DRAFT: { variant: 'neutral', label: 'Draft' },
        LOCKED: { variant: 'warning', label: 'Locked' },
    };

    const handleLottery = () => {
        setLotterySpinning(true);
        setSelectedVersion(null);
        setTimeout(() => {
            const versions = ['A', 'B', 'C'];
            setSelectedVersion(versions[Math.floor(Math.random() * versions.length)]);
            setLotterySpinning(false);
        }, 2000);
    };

    return (
        <AppShell title="Exam Planning">
            <div className="space-y-8">
                {/* Top Actions */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <p className="text-muted">Manage exam schedules, assign rooms, and configure subjects for the current session.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="secondary" className="gap-2" onClick={() => setShowLottery(!showLottery)}>
                            <Shuffle size={18} /> Subject Lottery
                        </Button>
                        <Button className="gap-2">
                            <Plus size={18} /> Create Exam
                        </Button>
                    </div>
                </div>

                {/* Subject Selection Lottery Modal */}
                <AnimatePresence>
                    {showLottery && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <Card className="p-8 border-primary-accent/20 bg-primary-accent/[0.02]">
                                <div className="text-center max-w-md mx-auto">
                                    <h3 className="text-xl font-bold mb-2 flex items-center justify-center gap-2">
                                        <Shuffle size={24} className="text-primary-accent" /> Subject Selection Lottery
                                    </h3>
                                    <p className="text-small text-muted mb-8">
                                        Randomly select the exam version to be used. This action is logged in the audit trail.
                                    </p>

                                    <div className="flex items-center justify-center gap-6 mb-8">
                                        {['A', 'B', 'C'].map((version) => (
                                            <motion.div
                                                key={version}
                                                animate={lotterySpinning ? {
                                                    scale: [1, 1.2, 1],
                                                    opacity: [0.3, 1, 0.3]
                                                } : {}}
                                                transition={{ repeat: lotterySpinning ? Infinity : 0, duration: 0.6, delay: ['A', 'B', 'C'].indexOf(version) * 0.2 }}
                                                className={cn(
                                                    "w-24 h-24 rounded-lg flex items-center justify-center text-3xl font-bold border-2 transition-all",
                                                    selectedVersion === version
                                                        ? "bg-primary-accent text-white border-primary-accent shadow-2 scale-110"
                                                        : "bg-white text-muted border-border"
                                                )}
                                            >
                                                {version}
                                            </motion.div>
                                        ))}
                                    </div>

                                    {selectedVersion && !lotterySpinning && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mb-6"
                                        >
                                            <Badge variant="success">Version {selectedVersion} Selected</Badge>
                                        </motion.div>
                                    )}

                                    <Button onClick={handleLottery} disabled={lotterySpinning} className="gap-2">
                                        {lotterySpinning ? 'Drawing...' : 'Draw Version'}
                                    </Button>
                                </div>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Table */}
                    <div className="lg:col-span-2">
                        <Card className="overflow-hidden">
                            <div className="p-6 border-b border-border flex items-center justify-between bg-black/[0.01]">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Calendar size={20} className="text-primary-accent" /> Exam Schedule
                                </h3>
                                <Badge variant="accent">{mockExams.length} Exams</Badge>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-black/[0.02] border-b border-border">
                                            <th className="p-4 text-small font-bold text-muted uppercase tracking-wider">Subject</th>
                                            <th className="p-4 text-small font-bold text-muted uppercase tracking-wider">Date & Time</th>
                                            <th className="p-4 text-small font-bold text-muted uppercase tracking-wider">Duration</th>
                                            <th className="p-4 text-small font-bold text-muted uppercase tracking-wider">Rooms</th>
                                            <th className="p-4 text-small font-bold text-muted uppercase tracking-wider">Status</th>
                                            <th className="p-4 text-small font-bold text-muted uppercase tracking-wider text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {mockExams.map((exam) => (
                                            <tr key={exam.id} className="hover:bg-black/[0.01] transition-colors group">
                                                <td className="p-4">
                                                    <div>
                                                        <p className="text-small font-bold text-text-primary">{exam.subject}</p>
                                                        <p className="text-[11px] text-muted">Coefficient: {exam.coefficient}</p>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2 text-small text-muted">
                                                        <Calendar size={14} /> {exam.date}
                                                        <Clock size={14} /> {exam.time}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-small text-muted">{exam.duration}</td>
                                                <td className="p-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        {exam.rooms.map(room => (
                                                            <span key={room} className="px-2 py-0.5 bg-surface/30 rounded text-[11px] font-medium border border-border">
                                                                {room}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <Badge variant={statusConfig[exam.status]?.variant || 'neutral'}>
                                                        {statusConfig[exam.status]?.label || exam.status}
                                                    </Badge>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button variant="ghost" size="sm" className="p-2 min-h-0 text-muted hover:text-primary-accent">
                                                            <Edit2 size={16} />
                                                        </Button>
                                                        <Button variant="ghost" size="sm" className="p-2 min-h-0 text-muted hover:text-primary-accent">
                                                            {exam.status === 'LOCKED' ? <Unlock size={16} /> : <Lock size={16} />}
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
                        </Card>
                    </div>

                    {/* Side Column */}
                    <div className="space-y-6">
                        {/* Room Assignment */}
                        <Card className="p-6">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                <MapPin size={20} className="text-primary-accent" /> Room Assignment
                            </h3>
                            <div className="space-y-3">
                                {availableRooms.slice(0, 5).map((room) => {
                                    const assigned = mockExams.some(e => e.rooms.includes(room));
                                    return (
                                        <div key={room} className={cn(
                                            "p-3 rounded-md border flex items-center justify-between transition-all",
                                            assigned ? "bg-primary-accent/5 border-primary-accent/20" : "bg-white border-border"
                                        )}>
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-8 h-8 rounded flex items-center justify-center text-sm font-bold",
                                                    assigned ? "bg-primary-accent/10 text-primary-accent" : "bg-surface/30 text-muted"
                                                )}>
                                                    <MapPin size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-small font-bold">{room}</p>
                                                    <p className="text-[11px] text-muted">Capacity: {Math.floor(Math.random() * 50) + 30}</p>
                                                </div>
                                            </div>
                                            <Badge variant={assigned ? 'accent' : 'neutral'}>
                                                {assigned ? 'Assigned' : 'Available'}
                                            </Badge>
                                        </div>
                                    );
                                })}
                            </div>
                            <Button variant="secondary" className="w-full mt-4 gap-2">
                                <Plus size={16} /> Add Room
                            </Button>
                        </Card>

                        {/* Quick Info */}
                        <Card className="p-6 bg-surface/10">
                            <h4 className="text-small font-bold mb-4 flex items-center gap-2">
                                <AlertCircle size={16} className="text-primary-accent" /> Planning Notes
                            </h4>
                            <ul className="space-y-3">
                                <li className="text-[12px] text-muted flex gap-2">
                                    <span className="text-primary-accent font-bold">•</span>
                                    Ensure no room conflicts across concurrent exams.
                                </li>
                                <li className="text-[12px] text-muted flex gap-2">
                                    <span className="text-primary-accent font-bold">•</span>
                                    Lock subjects once supervisors are assigned.
                                </li>
                                <li className="text-[12px] text-muted flex gap-2">
                                    <span className="text-primary-accent font-bold">•</span>
                                    Subject lottery results are immutable and audited.
                                </li>
                            </ul>
                        </Card>
                    </div>
                </div>
            </div>
        </AppShell>
    );
};
