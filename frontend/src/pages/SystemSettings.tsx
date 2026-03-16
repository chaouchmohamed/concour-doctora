import React, { useState } from "react";
import {
  Settings,
  Save,
  RotateCcw,
  Bell,
  Shield,
  Globe,
  Mail,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { AppShell } from "../components/AppShell";
import { Card } from "../components/UI";
import { cn } from "../constants";
import { motion, AnimatePresence } from "motion/react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GeneralSettings {
  institutionName: string;
  department: string;
  academicYear: string;
  contactEmail: string;
  timezone: string;
}

interface ExamSettings {
  maxScore: number;
  passThreshold: number;
  discrepancyThreshold: number;
  finalGradeRule: string;
  examDuration: string;
}

interface NotifSettings {
  candidateImport: boolean;
  discrepancyDetected: boolean;
  deliberationClosed: boolean;
  scanErrors: boolean;
  userAccountChanges: boolean;
  smtpHost: string;
  smtpPort: string;
  senderEmail: string;
  useTls: boolean;
}

interface SecuritySettings {
  twoFactor: boolean;
  sessionTimeout: boolean;
  ipWhitelist: boolean;
  auditEncryption: boolean;
  passwordPolicy: string;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const defaultGeneral: GeneralSettings = {
  institutionName: "École Supérieure en Informatique — Sidi Bel Abbès",
  department: "Doctoral Training Committee (CFD)",
  academicYear: "2025-2026",
  contactEmail: "admin@esi-sba.dz",
  timezone: "Africa/Algiers",
};

const defaultExam: ExamSettings = {
  maxScore: 20,
  passThreshold: 10,
  discrepancyThreshold: 3,
  finalGradeRule: "AVERAGE",
  examDuration: "3 hours",
};

const defaultNotif: NotifSettings = {
  candidateImport: true,
  discrepancyDetected: true,
  deliberationClosed: false,
  scanErrors: true,
  userAccountChanges: false,
  smtpHost: "smtp.esi-sba.dz",
  smtpPort: "587",
  senderEmail: "noreply@esi-sba.dz",
  useTls: true,
};

const defaultSecurity: SecuritySettings = {
  twoFactor: false,
  sessionTimeout: true,
  ipWhitelist: false,
  auditEncryption: true,
  passwordPolicy: "STRONG",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5">
    {children}
  </p>
);

const TextInput = ({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) => (
  <input
    type={type}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent transition-colors"
  />
);

const SelectInput = ({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) => (
  <div className="relative">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full appearance-none border border-border rounded-xl px-3 py-2.5 text-sm bg-white pr-8 focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent"
    >
      {children}
    </select>
    <ChevronDown
      size={14}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
    />
  </div>
);

const Toggle = ({
  checked,
  onChange,
  label,
  desc,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  desc: string;
}) => (
  <div className="flex items-center justify-between gap-4 py-3 border-b border-border/50 last:border-0">
    <div>
      <p className="text-xs font-semibold text-text-primary">{label}</p>
      <p className="text-[11px] text-muted mt-0.5">{desc}</p>
    </div>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "relative shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none",
        checked ? "bg-primary-accent" : "bg-gray-200 border border-gray-300",
      )}
    >
      <span
        className={cn(
          "absolute top-[3px] w-[18px] h-[18px] bg-white rounded-full shadow transition-transform duration-200",
          checked ? "translate-x-[-20px]" : "translate-x-[2px] top-[2px]",
        )}
      />
    </button>
  </div>
);

const SliderField = ({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
}) => (
  <div>
    <FieldLabel>{label}</FieldLabel>
    <div className="flex items-center gap-3">
      <input
        type="range"
        className="flex-1 accent-primary-accent"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
      />
      <span className="text-sm font-bold text-primary-accent bg-primary-accent/5 border border-primary-accent/20 rounded-lg px-2.5 py-1 w-14 text-center">
        {value.toFixed(1)}
      </span>
    </div>
  </div>
);

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const tabs = [
  { id: "general", label: "General", Icon: Globe },
  { id: "exams", label: "Exam Defaults", Icon: Settings },
  { id: "notifications", label: "Notifications", Icon: Bell },
  { id: "security", label: "Security", Icon: Shield },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export const SystemSettingsPage = () => {
  const [activeTab, setActiveTab] = useState("general");
  const [saved, setSaved] = useState(false);

  const [general, setGeneral] = useState<GeneralSettings>(defaultGeneral);
  const [exam, setExam] = useState<ExamSettings>(defaultExam);
  const [notif, setNotif] = useState<NotifSettings>(defaultNotif);
  const [security, setSecurity] = useState<SecuritySettings>(defaultSecurity);
  const [showSmtpPass, setShowSmtpPass] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    setGeneral(defaultGeneral);
    setExam(defaultExam);
    setNotif(defaultNotif);
    setSecurity(defaultSecurity);
  };

  return (
    <AppShell title="System Settings">
      {/* Fixed height layout */}
      <div className="flex flex-col gap-0 h-full">
        {/* Tabs */}
        <div className="flex items-center gap-0 border-b border-border shrink-0 bg-white">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-5 py-3 text-xs font-semibold transition-all border-b-2 whitespace-nowrap",
                activeTab === tab.id
                  ? "border-primary-accent text-primary-accent"
                  : "border-transparent text-muted hover:text-text-primary hover:bg-black/[0.02]",
              )}
            >
              <tab.Icon size={15} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto py-5 px-0.5">
          <div className="max-w-2xl space-y-4">
            {/* ── General ── */}
            {activeTab === "general" && (
              <Card className="p-5 space-y-4">
                <h3 className="text-sm font-bold flex items-center gap-2 pb-2 border-b border-border">
                  <Globe size={16} className="text-primary-accent" />{" "}
                  Institution Settings
                </h3>
                <div>
                  <FieldLabel>Institution Name</FieldLabel>
                  <TextInput
                    value={general.institutionName}
                    onChange={(v) =>
                      setGeneral((p) => ({ ...p, institutionName: v }))
                    }
                  />
                </div>
                <div>
                  <FieldLabel>Department</FieldLabel>
                  <TextInput
                    value={general.department}
                    onChange={(v) =>
                      setGeneral((p) => ({ ...p, department: v }))
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>Academic Year</FieldLabel>
                    <TextInput
                      value={general.academicYear}
                      onChange={(v) =>
                        setGeneral((p) => ({ ...p, academicYear: v }))
                      }
                      placeholder="2025-2026"
                    />
                  </div>
                  <div>
                    <FieldLabel>Contact Email</FieldLabel>
                    <TextInput
                      type="email"
                      value={general.contactEmail}
                      onChange={(v) =>
                        setGeneral((p) => ({ ...p, contactEmail: v }))
                      }
                    />
                  </div>
                </div>
                <div>
                  <FieldLabel>Timezone</FieldLabel>
                  <SelectInput
                    value={general.timezone}
                    onChange={(v) => setGeneral((p) => ({ ...p, timezone: v }))}
                  >
                    <option value="Africa/Algiers">
                      Africa/Algiers (UTC+01:00)
                    </option>
                    <option value="Europe/Paris">
                      Europe/Paris (UTC+01:00)
                    </option>
                    <option value="UTC">UTC</option>
                  </SelectInput>
                </div>
              </Card>
            )}

            {/* ── Exam Defaults ── */}
            {activeTab === "exams" && (
              <Card className="p-5 space-y-4">
                <h3 className="text-sm font-bold flex items-center gap-2 pb-2 border-b border-border">
                  <Settings size={16} className="text-primary-accent" /> Exam
                  Configuration Defaults
                </h3>
                <div>
                  <FieldLabel>Default Max Score</FieldLabel>
                  <input
                    type="number"
                    value={exam.maxScore}
                    onChange={(e) =>
                      setExam((p) => ({ ...p, maxScore: +e.target.value }))
                    }
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent"
                  />
                </div>
                <SliderField
                  label="Pass Threshold"
                  value={exam.passThreshold}
                  onChange={(v) => setExam((p) => ({ ...p, passThreshold: v }))}
                  min={5}
                  max={15}
                  step={0.5}
                />
                <SliderField
                  label="Discrepancy Threshold (pts)"
                  value={exam.discrepancyThreshold}
                  onChange={(v) =>
                    setExam((p) => ({ ...p, discrepancyThreshold: v }))
                  }
                  min={1}
                  max={6}
                  step={0.25}
                />
                <div>
                  <FieldLabel>Final Grade Rule</FieldLabel>
                  <SelectInput
                    value={exam.finalGradeRule}
                    onChange={(v) =>
                      setExam((p) => ({ ...p, finalGradeRule: v }))
                    }
                  >
                    <option value="AVERAGE">Average of all correctors</option>
                    <option value="MEDIAN">Median score</option>
                    <option value="THIRD_CORRECTOR">3rd corrector only</option>
                  </SelectInput>
                </div>
                <div>
                  <FieldLabel>Default Exam Duration</FieldLabel>
                  <SelectInput
                    value={exam.examDuration}
                    onChange={(v) =>
                      setExam((p) => ({ ...p, examDuration: v }))
                    }
                  >
                    <option>2 hours</option>
                    <option>3 hours</option>
                    <option>4 hours</option>
                  </SelectInput>
                </div>
              </Card>
            )}

            {/* ── Notifications ── */}
            {activeTab === "notifications" && (
              <>
                <Card className="p-5">
                  <h3 className="text-sm font-bold flex items-center gap-2 pb-3 mb-1 border-b border-border">
                    <Bell size={16} className="text-primary-accent" /> Email
                    Notifications
                  </h3>
                  <Toggle
                    label="Candidate import completed"
                    desc="Notify admins when a CSV import finishes"
                    checked={notif.candidateImport}
                    onChange={(v) =>
                      setNotif((p) => ({ ...p, candidateImport: v }))
                    }
                  />
                  <Toggle
                    label="Discrepancy detected"
                    desc="Alert coordinators of new grade discrepancies"
                    checked={notif.discrepancyDetected}
                    onChange={(v) =>
                      setNotif((p) => ({ ...p, discrepancyDetected: v }))
                    }
                  />
                  <Toggle
                    label="Deliberation closed"
                    desc="Notify all jury members when deliberation is finalized"
                    checked={notif.deliberationClosed}
                    onChange={(v) =>
                      setNotif((p) => ({ ...p, deliberationClosed: v }))
                    }
                  />
                  <Toggle
                    label="Scan upload errors"
                    desc="Alert when OMR scan processing fails"
                    checked={notif.scanErrors}
                    onChange={(v) => setNotif((p) => ({ ...p, scanErrors: v }))}
                  />
                  <Toggle
                    label="User account changes"
                    desc="Notify admins of role changes and new invitations"
                    checked={notif.userAccountChanges}
                    onChange={(v) =>
                      setNotif((p) => ({ ...p, userAccountChanges: v }))
                    }
                  />
                </Card>

                <Card className="p-5 space-y-4">
                  <h3 className="text-sm font-bold flex items-center gap-2 pb-2 border-b border-border">
                    <Mail size={16} className="text-primary-accent" /> SMTP
                    Configuration
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <FieldLabel>SMTP Host</FieldLabel>
                      <TextInput
                        value={notif.smtpHost}
                        onChange={(v) =>
                          setNotif((p) => ({ ...p, smtpHost: v }))
                        }
                      />
                    </div>
                    <div>
                      <FieldLabel>SMTP Port</FieldLabel>
                      <TextInput
                        type="number"
                        value={notif.smtpPort}
                        onChange={(v) =>
                          setNotif((p) => ({ ...p, smtpPort: v }))
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Sender Email</FieldLabel>
                    <TextInput
                      type="email"
                      value={notif.senderEmail}
                      onChange={(v) =>
                        setNotif((p) => ({ ...p, senderEmail: v }))
                      }
                    />
                  </div>
                  <Toggle
                    label="Use TLS encryption"
                    desc="Recommended — required by SRS (CD-NFR-SEC-01)"
                    checked={notif.useTls}
                    onChange={(v) => setNotif((p) => ({ ...p, useTls: v }))}
                  />
                </Card>
              </>
            )}

            {/* ── Security ── */}
            {activeTab === "security" && (
              <>
                <Card className="p-5">
                  <h3 className="text-sm font-bold flex items-center gap-2 pb-3 mb-1 border-b border-border">
                    <Shield size={16} className="text-primary-accent" />{" "}
                    Security & Access
                  </h3>
                  <Toggle
                    label="Two-Factor Authentication"
                    desc="Require 2FA for all admin and coordinator accounts"
                    checked={security.twoFactor}
                    onChange={(v) =>
                      setSecurity((p) => ({ ...p, twoFactor: v }))
                    }
                  />
                  <Toggle
                    label="Session Timeout"
                    desc="Auto-logout after 8 hours of inactivity (JWT expiry)"
                    checked={security.sessionTimeout}
                    onChange={(v) =>
                      setSecurity((p) => ({ ...p, sessionTimeout: v }))
                    }
                  />
                  <Toggle
                    label="IP Whitelist"
                    desc="Restrict access to approved IP ranges only"
                    checked={security.ipWhitelist}
                    onChange={(v) =>
                      setSecurity((p) => ({ ...p, ipWhitelist: v }))
                    }
                  />
                  <Toggle
                    label="Audit Log Encryption"
                    desc="Encrypt all audit trail entries at rest"
                    checked={security.auditEncryption}
                    onChange={(v) =>
                      setSecurity((p) => ({ ...p, auditEncryption: v }))
                    }
                  />
                </Card>

                <Card className="p-5 space-y-3">
                  <h3 className="text-sm font-bold flex items-center gap-2 pb-2 border-b border-border">
                    <Lock size={16} className="text-primary-accent" /> Password
                    Policy
                  </h3>
                  <p className="text-[11px] text-muted">
                    Passwords are hashed with bcrypt cost factor ≥ 12
                    (CD-NFR-SEC-02).
                  </p>
                  <SelectInput
                    value={security.passwordPolicy}
                    onChange={(v) =>
                      setSecurity((p) => ({ ...p, passwordPolicy: v }))
                    }
                  >
                    <option value="STRONG">
                      Strong — 8+ chars, uppercase, number, special
                    </option>
                    <option value="STANDARD">
                      Standard — 8+ chars, uppercase, number
                    </option>
                    <option value="BASIC">Basic — 6+ characters</option>
                  </SelectInput>
                </Card>

                <div className="flex gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <AlertCircle
                    size={15}
                    className="text-red-500 shrink-0 mt-0.5"
                  />
                  <p className="text-[11px] text-red-700 leading-relaxed">
                    Changing security settings may require all active users to
                    re-authenticate. Plan changes during off-hours.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Save bar — fixed at bottom of the layout, not sticky over content */}
        <div className="shrink-0 border-t border-border bg-white px-4 py-3 flex items-center justify-between">
          <AnimatePresence>
            {saved && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-2 text-emerald-600"
              >
                <CheckCircle2 size={15} />
                <span className="text-xs font-bold">
                  Settings saved successfully!
                </span>
              </motion.div>
            )}
            {!saved && <span />}
          </AnimatePresence>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-xs font-semibold text-text-primary hover:bg-black/[0.03] transition-colors"
            >
              <RotateCcw size={13} /> Reset
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-accent text-white text-xs font-bold hover:opacity-90 transition-opacity"
            >
              <Save size={13} /> Save Changes
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
};
