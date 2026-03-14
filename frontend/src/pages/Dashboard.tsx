import React from 'react';
import {
  Users,
  UserCheck,
  Activity,
  AlertTriangle,
  Plus,
  FileUp,
  Gavel,
  ArrowUpRight,
  Calendar as CalendarIcon,
  Clock,
  ChevronRight
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { Card, Badge, Button } from '../components/UI';
import { motion } from 'motion/react';
import { cn } from '../constants';

const stats = [
  { label: 'Total Registered', value: '1,248', icon: Users, trend: '+12%', color: 'accent' },
  { label: 'Present Today', value: '1,192', icon: UserCheck, trend: '95.5%', color: 'success' },
  { label: 'Active Sessions', value: '12', icon: Activity, trend: 'Live', color: 'accent' },
  { label: 'Pending Discrepancies', value: '42', icon: AlertTriangle, trend: 'High', color: 'danger' },
];

const activities = [
  { user: 'AS', action: 'Imported 450 candidates', time: '10 mins ago', type: 'info' },
  { user: 'JD', action: 'Locked Subject: Mathematics', time: '25 mins ago', type: 'warning' },
  { user: 'ML', action: 'Assigned 3rd corrector for copy #DOCT-2026-042', time: '1 hour ago', type: 'info' },
  { user: 'RK', action: 'Generated Attendance PV for Room A102', time: '2 hours ago', type: 'info' },
];

const upcomingExams = [
  { subject: 'Mathematics & Logic', date: 'Mar 10, 2026', time: '09:00', rooms: 'A101, A102' },
  { subject: 'English Proficiency', date: 'Mar 10, 2026', time: '14:00', rooms: 'B204' },
  { subject: 'Specialty: Computer Science', date: 'Mar 11, 2026', time: '09:00', rooms: 'C301' },
];

export const Dashboard = () => {
  return (
    <AppShell title="System Overview">
      <div className="space-y-8">
        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="p-6 hover:shadow-2 transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm",
                    stat.color === 'accent' && "bg-[#8B7355]/10 text-[#8B7355]",
                    stat.color === 'success' && "bg-[#10B981]/10 text-[#10B981]",
                    stat.color === 'warning' && "bg-[#F59E0B]/10 text-[#F59E0B]",
                    stat.color === 'danger' && "bg-[#EF4444]/10 text-[#EF4444]",
                  )}>
                    <stat.icon size={24} />
                  </div>
                  <Badge variant={stat.color as any}>{stat.trend}</Badge>
                </div>
                <div>
                  <p className="text-[12px] text-[#6B6B6B] font-semibold uppercase tracking-wider mb-1">{stat.label}</p>
                  <h3 className="text-[24px] font-bold text-[#1A1A1A]">{stat.value}</h3>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Actions */}
            <section>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Button variant="secondary" className="h-[90px] flex-col gap-2 bg-white border border-[#EBEBEB] hover:border-[#8B7355] transition-all group">
                  <div className="w-8 h-8 rounded-lg bg-[#F0EDE7] flex items-center justify-center text-[#8B7355] group-hover:bg-[#8B7355] group-hover:text-white transition-colors">
                    <Plus size={20} />
                  </div>
                  <span className="text-[13px] font-bold">Create Exam</span>
                </Button>
                <Button variant="secondary" className="h-[90px] flex-col gap-2 bg-white border border-[#EBEBEB] hover:border-[#8B7355] transition-all group">
                  <div className="w-8 h-8 rounded-lg bg-[#F0EDE7] flex items-center justify-center text-[#8B7355] group-hover:bg-[#8B7355] group-hover:text-white transition-colors">
                    <FileUp size={20} />
                  </div>
                  <span className="text-[13px] font-bold">Import Candidates</span>
                </Button>
                <Button variant="secondary" className="h-[90px] flex-col gap-2 bg-white border border-[#EBEBEB] hover:border-[#8B7355] transition-all group">
                  <div className="w-8 h-8 rounded-lg bg-[#F0EDE7] flex items-center justify-center text-[#8B7355] group-hover:bg-[#8B7355] group-hover:text-white transition-colors">
                    <Gavel size={20} />
                  </div>
                  <span className="text-[13px] font-bold">Open Deliberation</span>
                </Button>
              </div>
            </section>

            {/* Recent Activity */}
            <Card className="p-0">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h3 className="text-lg font-bold">Recent Activity</h3>
                <Button variant="ghost" size="sm" className="text-primary-accent">View all</Button>
              </div>
              <div className="divide-y divide-border">
                {activities.map((activity, i) => (
                  <div key={i} className="p-4 flex items-start gap-4 hover:bg-black/[0.01] transition-colors">
                    <div className="w-9 h-9 rounded-full bg-[#F0EDE7] flex items-center justify-center text-[#8B7355] font-bold text-[12px] shrink-0 border border-[#8B7355]/10">
                      {activity.user}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-small text-text-primary leading-tight mb-1">
                        <span className="font-bold">{activity.user}</span> {activity.action}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-muted flex items-center gap-1">
                          <Clock size={12} /> {activity.time}
                        </span>
                        <Badge variant={activity.type === 'warning' ? 'warning' : 'accent'}>
                          {activity.type.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="p-1 min-h-0">
                      <ChevronRight size={18} className="text-muted" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Side Column */}
          <div className="space-y-8">
            {/* Upcoming Exams */}
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-6 flex items-center justify-between">
                Upcoming Exams
                <CalendarIcon size={20} className="text-muted" />
              </h3>
              <div className="space-y-6">
                {upcomingExams.map((exam, i) => (
                  <div key={i} className="relative pl-4 border-l-2 border-primary-accent/20 hover:border-primary-accent transition-colors">
                    <p className="text-small font-bold text-text-primary mb-1">{exam.subject}</p>
                    <div className="flex items-center gap-3 text-[12px] text-muted mb-2">
                      <span className="flex items-center gap-1"><CalendarIcon size={12} /> {exam.date}</span>
                      <span className="flex items-center gap-1"><Clock size={12} /> {exam.time}</span>
                    </div>
                    <p className="text-[11px] text-muted">Rooms: {exam.rooms}</p>
                  </div>
                ))}
              </div>
              <Button variant="secondary" className="w-full mt-8 gap-2">
                View Calendar <ArrowUpRight size={16} />
              </Button>
            </Card>

            {/* System Alerts */}
            <Card className="p-6 bg-danger/5 border-danger/20">
              <h3 className="text-lg font-bold text-danger mb-4 flex items-center gap-2">
                <AlertTriangle size={20} /> System Alerts
              </h3>
              <div className="space-y-3">
                <div className="p-3 bg-white rounded-md border border-danger/10 shadow-sm">
                  <p className="text-small font-bold text-danger mb-1">Unsynced Attendance</p>
                  <p className="text-[12px] text-muted">Room B204 has 12 records pending sync for over 2 hours.</p>
                </div>
                <div className="p-3 bg-white rounded-md border border-danger/10 shadow-sm">
                  <p className="text-small font-bold text-danger mb-1">Missing Scans</p>
                  <p className="text-[12px] text-muted">Subject "Physics" has 5 present candidates without uploaded scans.</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

// Dashboard component logic ends

