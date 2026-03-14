import React, { useState } from 'react';
import {
    Settings,
    Save,
    RotateCcw,
    Bell,
    Shield,
    Globe,
    Palette,
    Mail,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { Card, Badge, Button, Input } from '../components/UI';
import { cn } from '../constants';
import { motion } from 'motion/react';

const tabs = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'exams', label: 'Exam Defaults', icon: Settings },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
];

export const SystemSettingsPage = () => {
    const [activeTab, setActiveTab] = useState('general');
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <AppShell title="System Settings">
            <div className="space-y-8">
                {/* Tabs */}
                <div className="flex items-center gap-1 border-b border-border overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-5 py-3 text-small font-medium transition-all border-b-2 whitespace-nowrap",
                                activeTab === tab.id
                                    ? "border-primary-accent text-primary-accent"
                                    : "border-transparent text-muted hover:text-text-primary"
                            )}
                        >
                            <tab.icon size={18} /> {tab.label}
                        </button>
                    ))}
                </div>

                {/* General Tab */}
                {activeTab === 'general' && (
                    <div className="space-y-6 max-w-2xl">
                        <Card className="p-6 space-y-6">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Globe size={20} className="text-primary-accent" /> Institution Settings
                            </h3>
                            <Input label="Institution Name" defaultValue="University of Algiers 1" />
                            <Input label="Department" defaultValue="Faculty of Exact Sciences" />
                            <Input label="Academic Year" defaultValue="2025-2026" />
                            <Input label="Contact Email" defaultValue="admin@univ-alger1.dz" type="email" />
                            <div className="space-y-1.5">
                                <label className="text-small font-medium text-text-primary block">Timezone</label>
                                <select className="input-field appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat">
                                    <option>Africa/Algiers (UTC+01:00)</option>
                                    <option>Europe/Paris (UTC+01:00)</option>
                                    <option>UTC</option>
                                </select>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Exam Defaults Tab */}
                {activeTab === 'exams' && (
                    <div className="space-y-6 max-w-2xl">
                        <Card className="p-6 space-y-6">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Settings size={20} className="text-primary-accent" /> Exam Configuration Defaults
                            </h3>
                            <div className="space-y-2">
                                <label className="text-small font-bold text-text-primary block">Default Max Score</label>
                                <input type="number" className="input-field" defaultValue="20" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-small font-bold text-text-primary block">Pass Threshold</label>
                                <div className="flex items-center gap-3">
                                    <input type="range" className="flex-1 accent-primary-accent" min="5" max="15" step="0.5" defaultValue="10" />
                                    <span className="w-14 text-center font-bold text-primary-accent bg-primary-accent/5 rounded px-2 py-1">10.0</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-small font-bold text-text-primary block">Discrepancy Threshold (pts)</label>
                                <div className="flex items-center gap-3">
                                    <input type="range" className="flex-1 accent-primary-accent" min="1" max="6" step="0.25" defaultValue="3" />
                                    <span className="w-14 text-center font-bold text-primary-accent bg-primary-accent/5 rounded px-2 py-1">3.0</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-small font-bold text-text-primary block">Final Grade Rule</label>
                                <select className="input-field appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat">
                                    <option value="AVERAGE">Average of all correctors</option>
                                    <option value="MEDIAN">Median score</option>
                                    <option value="THIRD_CORRECTOR">3rd corrector only</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-small font-bold text-text-primary block">Default Exam Duration</label>
                                <select className="input-field appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat">
                                    <option>2 hours</option>
                                    <option>3 hours</option>
                                    <option>4 hours</option>
                                </select>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                    <div className="space-y-6 max-w-2xl">
                        <Card className="p-6 space-y-6">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Bell size={20} className="text-primary-accent" /> Email Notifications
                            </h3>
                            {[
                                { label: 'Candidate import completed', desc: 'Notify admins when a CSV import finishes', checked: true },
                                { label: 'Discrepancy detected', desc: 'Alert coordinators of new grade discrepancies', checked: true },
                                { label: 'Deliberation closed', desc: 'Notify all jury members when deliberation is finalized', checked: false },
                                { label: 'Scan upload errors', desc: 'Alert when OMR scan processing fails', checked: true },
                                { label: 'User account changes', desc: 'Notify admins of role changes and new invitations', checked: false },
                            ].map((item, i) => (
                                <label key={i} className="flex items-start justify-between gap-4 cursor-pointer group p-3 rounded-md hover:bg-black/[0.01] transition-colors">
                                    <div>
                                        <p className="text-small font-bold text-text-primary group-hover:text-primary-accent transition-colors">{item.label}</p>
                                        <p className="text-[12px] text-muted">{item.desc}</p>
                                    </div>
                                    <div className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                                        <input type="checkbox" defaultChecked={item.checked} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-border rounded-full peer peer-checked:bg-primary-accent peer-focus:ring-4 peer-focus:ring-focus-ring transition-all after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                                    </div>
                                </label>
                            ))}
                        </Card>

                        <Card className="p-6 space-y-4">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Mail size={20} className="text-primary-accent" /> SMTP Configuration
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="SMTP Host" defaultValue="smtp.univ-alger1.dz" />
                                <Input label="SMTP Port" defaultValue="587" type="number" />
                            </div>
                            <Input label="Sender Email" defaultValue="noreply@univ-alger1.dz" />
                            <div className="flex items-center gap-2">
                                <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-border text-primary-accent" />
                                <span className="text-small text-muted">Use TLS encryption</span>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                    <div className="space-y-6 max-w-2xl">
                        <Card className="p-6 space-y-6">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Shield size={20} className="text-primary-accent" /> Security & Access
                            </h3>
                            <div className="space-y-4">
                                {[
                                    { label: 'Two-Factor Authentication', desc: 'Require 2FA for all admin and coordinator accounts', checked: false },
                                    { label: 'Session Timeout', desc: 'Auto-logout after 30 minutes of inactivity', checked: true },
                                    { label: 'IP Whitelist', desc: 'Restrict access to approved IP ranges only', checked: false },
                                    { label: 'Audit Log Encryption', desc: 'Encrypt all audit trail entries at rest', checked: true },
                                ].map((item, i) => (
                                    <label key={i} className="flex items-start justify-between gap-4 cursor-pointer group p-3 rounded-md hover:bg-black/[0.01] transition-colors">
                                        <div>
                                            <p className="text-small font-bold text-text-primary">{item.label}</p>
                                            <p className="text-[12px] text-muted">{item.desc}</p>
                                        </div>
                                        <div className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                                            <input type="checkbox" defaultChecked={item.checked} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-border rounded-full peer peer-checked:bg-primary-accent peer-focus:ring-4 peer-focus:ring-focus-ring transition-all after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                                        </div>
                                    </label>
                                ))}
                            </div>

                            <div className="space-y-2">
                                <label className="text-small font-bold text-text-primary block">Password Policy</label>
                                <select className="input-field appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat">
                                    <option>Strong (8+ chars, uppercase, number, special)</option>
                                    <option>Standard (8+ chars, uppercase, number)</option>
                                    <option>Basic (6+ characters)</option>
                                </select>
                            </div>
                        </Card>

                        <div className="p-4 bg-danger/5 border border-danger/20 rounded-md flex gap-3">
                            <AlertCircle size={20} className="text-danger shrink-0" />
                            <p className="text-[12px] text-muted">
                                Changing security settings may require all active users to re-authenticate. Plan changes during off-hours.
                            </p>
                        </div>
                    </div>
                )}

                {/* Save Bar */}
                <div className="flex items-center justify-between p-4 bg-white border border-border rounded-md shadow-1 sticky bottom-4">
                    <div className="flex items-center gap-3">
                        {saved && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-2 text-success"
                            >
                                <CheckCircle2 size={18} />
                                <span className="text-small font-bold">Settings saved successfully!</span>
                            </motion.div>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="secondary" className="gap-2">
                            <RotateCcw size={16} /> Reset
                        </Button>
                        <Button className="gap-2" onClick={handleSave}>
                            <Save size={16} /> Save Changes
                        </Button>
                    </div>
                </div>
            </div>
        </AppShell>
    );
};
