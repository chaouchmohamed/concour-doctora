import React, { useState } from "react";
import {
  Users,
  UserPlus,
  Shield,
  Mail,
  Edit2,
  Trash2,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  X,
  RefreshCw,
  ChevronDown,
  AlertTriangle,
  KeyRound,
  LogIn,
} from "lucide-react";
import { AppShell } from "../components/AppShell";
import { Card } from "../components/UI";
import { cn } from "../constants";
import { motion, AnimatePresence } from "motion/react";

// ─── Types ────────────────────────────────────────────────────────────────────

type UserStatus = "ACTIVE" | "INACTIVE" | "PENDING";
type UserRole =
  | "ADMIN"
  | "COORDINATOR"
  | "CORRECTOR"
  | "CFD_HEAD"
  | "SUPERVISOR"
  | "JURY_PRESIDENT"
  | "JURY_MEMBER"
  | "ANONYMITY_COMMISSION";

interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  lastLogin: string;
  must_change_password: boolean; // true = first-login pending
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const initialUsers: AppUser[] = [
  {
    id: "1",
    name: "Jean Dupont",
    email: "j.dupont@univ-alger.dz",
    role: "ADMIN",
    status: "ACTIVE",
    lastLogin: "2026-03-09 14:22",
    must_change_password: false,
  },
  {
    id: "2",
    name: "Amina Saidi",
    email: "a.saidi@univ-alger.dz",
    role: "COORDINATOR",
    status: "ACTIVE",
    lastLogin: "2026-03-09 10:15",
    must_change_password: false,
  },
  {
    id: "3",
    name: "Rachid Kermiche",
    email: "r.kermiche@univ-alger.dz",
    role: "CORRECTOR",
    status: "ACTIVE",
    lastLogin: "2026-03-08 16:45",
    must_change_password: false,
  },
  {
    id: "4",
    name: "Fatima Belhadj",
    email: "f.belhadj@univ-alger.dz",
    role: "CFD_HEAD",
    status: "ACTIVE",
    lastLogin: "2026-03-07 09:30",
    must_change_password: false,
  },
  {
    id: "5",
    name: "Mourad Larbi",
    email: "m.larbi@univ-alger.dz",
    role: "SUPERVISOR",
    status: "INACTIVE",
    lastLogin: "2026-02-15 11:00",
    must_change_password: false,
  },
  {
    id: "6",
    name: "Leila Bouazza",
    email: "l.bouazza@univ-alger.dz",
    role: "CORRECTOR",
    status: "ACTIVE",
    lastLogin: "2026-03-09 08:12",
    must_change_password: false,
  },
  // ── First-login pending users (must_change_password = true) ──
  {
    id: "7",
    name: "Hassan Medjdoub",
    email: "h.medjdoub@univ-alger.dz",
    role: "JURY_MEMBER",
    status: "PENDING",
    lastLogin: "Never",
    must_change_password: true,
  },
  {
    id: "8",
    name: "Nadia Ferhat",
    email: "n.ferhat@univ-alger.dz",
    role: "CORRECTOR",
    status: "PENDING",
    lastLogin: "Never",
    must_change_password: true,
  },
  {
    id: "9",
    name: "Karim Boucherit",
    email: "k.boucherit@univ-alger.dz",
    role: "JURY_PRESIDENT",
    status: "PENDING",
    lastLogin: "Never",
    must_change_password: true,
  },
];

// ─── Config ───────────────────────────────────────────────────────────────────

const roleLabels: Record<UserRole, string> = {
  ADMIN: "Administrator",
  COORDINATOR: "Coordinator",
  CORRECTOR: "Corrector",
  CFD_HEAD: "CFD Head",
  SUPERVISOR: "Supervisor",
  JURY_PRESIDENT: "Jury President",
  JURY_MEMBER: "Jury Member",
  ANONYMITY_COMMISSION: "Anonymity Commission",
};

const rolePill: Record<UserRole, string> = {
  ADMIN: "bg-red-50 text-red-700 border border-red-200",
  COORDINATOR:
    "bg-primary-accent/10 text-primary-accent border border-primary-accent/20",
  CORRECTOR: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  CFD_HEAD: "bg-amber-50 text-amber-700 border border-amber-200",
  SUPERVISOR: "bg-sky-50 text-sky-700 border border-sky-200",
  JURY_PRESIDENT: "bg-purple-50 text-purple-700 border border-purple-200",
  JURY_MEMBER: "bg-gray-100 text-gray-600 border border-gray-200",
  ANONYMITY_COMMISSION: "bg-indigo-50 text-indigo-700 border border-indigo-200",
};

const statusPill: Record<UserStatus, string> = {
  ACTIVE:
    "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200",
  INACTIVE:
    "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-500 border border-gray-200",
  PENDING:
    "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200",
};

const initials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

// ─── Invite Modal ─────────────────────────────────────────────────────────────

const InviteModal = ({
  onClose,
  onInvite,
}: {
  onClose: () => void;
  onInvite: (u: AppUser) => void;
}) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("CORRECTOR");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const handleSend = () => {
    if (!name || !email) return;
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setDone(true);
      onInvite({
        id: Date.now().toString(),
        name,
        email,
        role,
        status: "PENDING",
        lastLogin: "Never",
        must_change_password: true, // New invitees always need first-login password change
      });
      setTimeout(onClose, 1000);
    }, 1300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        className="bg-white rounded-2xl w-full max-w-[420px] shadow-2xl overflow-hidden"
      >
        <div className="bg-gradient-to-r from-[#8B7355] to-[#6d5a42] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <UserPlus size={15} className="text-white/80" />
            <p className="font-bold text-white text-sm">Invite New User</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/60 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {done ? (
          <div className="py-10 text-center space-y-2">
            <CheckCircle2 size={36} className="mx-auto text-emerald-500" />
            <p className="font-semibold text-sm text-gray-800">
              Invitation Sent!
            </p>
            <p className="text-xs text-gray-400">{email}</p>
            <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 mx-4 flex items-center gap-1.5 justify-center">
              <KeyRound size={11} />
              User will be required to change password on first login
            </p>
          </div>
        ) : (
          <>
            <div className="px-5 py-4 space-y-3.5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  Full Name
                </p>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B7355]/25 focus:border-[#8B7355]"
                />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  Institutional Email
                </p>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@institution.dz"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B7355]/25 focus:border-[#8B7355]"
                />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  Role (CD-FR-AUTH-04)
                </p>
                <div className="relative">
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white pr-8 focus:outline-none focus:ring-2 focus:ring-[#8B7355]/25 focus:border-[#8B7355]"
                  >
                    {(Object.entries(roleLabels) as [UserRole, string][]).map(
                      ([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ),
                    )}
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  Each role has strictly defined permissions per the SRS.
                </p>
              </div>
              {/* Note about first-login */}
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                <KeyRound size={13} className="text-amber-600 mt-0.5 shrink-0" />
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  A temporary password will be emailed. The user must change it on first login.
                </p>
              </div>
            </div>
            <div className="px-5 pb-5 flex gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={!name || !email || sending}
                className={cn(
                  "flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-2",
                  name && email && !sending
                    ? "bg-[#8B7355] hover:bg-[#7a6449]"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed",
                )}
              >
                {sending ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" /> Sending...
                  </>
                ) : (
                  <>
                    <Mail size={12} /> Send Invitation
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

// ─── Edit Role Modal ──────────────────────────────────────────────────────────

const EditModal = ({
  user,
  onClose,
  onSave,
}: {
  user: AppUser;
  onClose: () => void;
  onSave: (id: string, role: UserRole) => void;
}) => {
  const [role, setRole] = useState<UserRole>(user.role);
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      onSave(user.id, role);
      setSaving(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        className="bg-white rounded-2xl w-full max-w-[360px] shadow-2xl overflow-hidden"
      >
        <div className="bg-gradient-to-r from-[#8B7355] to-[#6d5a42] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Edit2 size={14} className="text-white/80" />
            <p className="font-bold text-white text-sm">Edit User Role</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/60 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl p-3">
            <div className="w-9 h-9 rounded-full bg-primary-accent/10 flex items-center justify-center text-primary-accent font-bold text-xs border border-primary-accent/20">
              {initials(user.name)}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">{user.name}</p>
              <p className="text-xs text-gray-400">{user.email}</p>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              New Role
            </p>
            <div className="relative">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white pr-8 focus:outline-none focus:ring-2 focus:ring-[#8B7355]/25 focus:border-[#8B7355]"
              >
                {(Object.entries(roleLabels) as [UserRole, string][]).map(
                  ([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ),
                )}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-[#8B7355] text-white text-xs font-bold hover:bg-[#7a6449] transition-colors flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <RefreshCw size={12} className="animate-spin" /> Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

const DeleteModal = ({
  user,
  onClose,
  onConfirm,
}: {
  user: AppUser;
  onClose: () => void;
  onConfirm: (id: string) => void;
}) => {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = () => {
    setDeleting(true);
    setTimeout(() => {
      onConfirm(user.id);
      setDeleting(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        className="bg-white rounded-2xl w-full max-w-[340px] shadow-2xl overflow-hidden"
      >
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
              <AlertTriangle size={18} className="text-red-500" />
            </div>
            <div>
              <p className="font-bold text-sm text-gray-800">Deactivate User</p>
              <p className="text-xs text-gray-400">
                This will revoke all access immediately.
              </p>
            </div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
            <p className="text-sm font-semibold text-gray-700">{user.name}</p>
            <p className="text-xs text-gray-400">
              {user.email} · {roleLabels[user.role]}
            </p>
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
          >
            {deleting ? (
              <>
                <RefreshCw size={12} className="animate-spin" /> Deactivating...
              </>
            ) : (
              <>
                <Trash2 size={12} /> Deactivate
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── First-Login Badge ────────────────────────────────────────────────────────

const FirstLoginBadge = () => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-300 whitespace-nowrap">
    <KeyRound size={9} />
    First Login
  </span>
);

const LoggedInBadge = () => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
    <LogIn size={9} />
    Logged In
  </span>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

type LoginFilter = "ALL" | "FIRST_LOGIN" | "ACTIVATED";

export const UserManagementPage = () => {
  const [users, setUsers] = useState<AppUser[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "ALL">("ALL");
  const [loginFilter, setLoginFilter] = useState<LoginFilter>("ALL");
  const [showFilter, setShowFilter] = useState(false);
  const [showLoginFilter, setShowLoginFilter] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [editTarget, setEditTarget] = useState<AppUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AppUser | null>(null);

  const filtered = users.filter((u) => {
    const matchSearch =
      search === "" ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "ALL" || u.role === roleFilter;
    const matchLogin =
      loginFilter === "ALL" ||
      (loginFilter === "FIRST_LOGIN" && u.must_change_password) ||
      (loginFilter === "ACTIVATED" && !u.must_change_password);
    return matchSearch && matchRole && matchLogin;
  });

  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === "ACTIVE").length,
    inactive: users.filter((u) => u.status === "INACTIVE").length,
    pending: users.filter((u) => u.status === "PENDING").length,
    firstLogin: users.filter((u) => u.must_change_password).length,
  };

  const handleInvite = (u: AppUser) => setUsers((prev) => [...prev, u]);
  const handleSave = (id: string, role: UserRole) =>
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
  const handleDelete = (id: string) =>
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: "INACTIVE" } : u)),
    );

  const loginFilterLabel: Record<LoginFilter, string> = {
    ALL: "All",
    FIRST_LOGIN: "First Login Pending",
    ACTIVATED: "Already Activated",
  };

  return (
    <AppShell title="User Management">
      <AnimatePresence>
        {showInvite && (
          <InviteModal
            onClose={() => setShowInvite(false)}
            onInvite={handleInvite}
          />
        )}
        {editTarget && (
          <EditModal
            user={editTarget}
            onClose={() => setEditTarget(null)}
            onSave={handleSave}
          />
        )}
        {deleteTarget && (
          <DeleteModal
            user={deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onConfirm={handleDelete}
          />
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-4 h-full">
        {/* Stats */}
        <div className="grid grid-cols-5 gap-3 shrink-0">
          {[
            {
              label: "Total Users",
              value: stats.total,
              Icon: Users,
              cls: "text-primary-accent bg-primary-accent/10",
            },
            {
              label: "Active",
              value: stats.active,
              Icon: CheckCircle2,
              cls: "text-emerald-600 bg-emerald-50",
            },
            {
              label: "Inactive",
              value: stats.inactive,
              Icon: XCircle,
              cls: "text-gray-500 bg-gray-100",
            },
            {
              label: "Pending",
              value: stats.pending,
              Icon: Clock,
              cls: "text-amber-600 bg-amber-50",
            },
            {
              label: "First Login",
              value: stats.firstLogin,
              Icon: KeyRound,
              cls: "text-orange-600 bg-orange-50",
            },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Card
                className={cn(
                  "p-4 flex items-center gap-3 cursor-pointer transition-all hover:shadow-md",
                  s.label === "First Login" && stats.firstLogin > 0
                    ? "ring-1 ring-orange-200 hover:ring-orange-300"
                    : "",
                )}
                onClick={() => {
                  if (s.label === "First Login") {
                    setLoginFilter(loginFilter === "FIRST_LOGIN" ? "ALL" : "FIRST_LOGIN");
                  }
                }}
              >
                <div
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
                    s.cls,
                  )}
                >
                  <s.Icon size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted leading-tight">
                    {s.label}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <p className="text-2xl font-bold text-text-primary leading-none mt-0.5">
                      {s.value}
                    </p>
                    {s.label === "First Login" && s.value > 0 && (
                      <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse mt-0.5" />
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* First-login alert banner */}
        <AnimatePresence>
          {stats.firstLogin > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden shrink-0"
            >
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
                <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <KeyRound size={13} className="text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="text-[12px] font-bold text-amber-800">
                    {stats.firstLogin} user{stats.firstLogin > 1 ? "s" : ""} awaiting first login
                  </p>
                  <p className="text-[11px] text-amber-600">
                    These users received a temporary password by email and must set a new one before accessing the platform.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setLoginFilter(loginFilter === "FIRST_LOGIN" ? "ALL" : "FIRST_LOGIN")}
                  className="text-[11px] font-bold text-amber-700 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors shrink-0"
                >
                  {loginFilter === "FIRST_LOGIN" ? "Show all" : "View them"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 shrink-0 flex-wrap">
          <div className="flex items-center gap-2 flex-1 max-w-2xl">
            <div className="relative flex-1">
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted"
                size={13}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email…"
                className="input-field pl-8 text-xs h-9 w-full"
              />
            </div>

            {/* Role filter */}
            <div className="relative">
              <button
                type="button"
                onClick={() => { setShowFilter((v) => !v); setShowLoginFilter(false); }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors",
                  roleFilter !== "ALL"
                    ? "border-primary-accent bg-primary-accent/5 text-primary-accent"
                    : "border-border text-text-primary hover:bg-black/[0.03]",
                )}
              >
                <Filter size={13} />
                {roleFilter === "ALL" ? "Role" : roleLabels[roleFilter]}
                <ChevronDown
                  size={12}
                  className={cn("transition-transform", showFilter && "rotate-180")}
                />
              </button>
              <AnimatePresence>
                {showFilter && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="absolute left-0 top-full mt-1 z-30 bg-white border border-border rounded-xl shadow-lg overflow-hidden min-w-[190px]"
                  >
                    {(["ALL", ...Object.keys(roleLabels)] as (UserRole | "ALL")[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => { setRoleFilter(r); setShowFilter(false); }}
                        className={cn(
                          "w-full text-left px-4 py-2.5 text-xs transition-colors hover:bg-black/[0.04]",
                          roleFilter === r ? "font-bold text-primary-accent" : "text-muted",
                        )}
                      >
                        {r === "ALL" ? "All Roles" : roleLabels[r as UserRole]}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Login status filter */}
            <div className="relative">
              <button
                type="button"
                onClick={() => { setShowLoginFilter((v) => !v); setShowFilter(false); }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors",
                  loginFilter !== "ALL"
                    ? "border-amber-500 bg-amber-50 text-amber-700"
                    : "border-border text-text-primary hover:bg-black/[0.03]",
                )}
              >
                <KeyRound size={13} />
                {loginFilterLabel[loginFilter]}
                <ChevronDown
                  size={12}
                  className={cn("transition-transform", showLoginFilter && "rotate-180")}
                />
              </button>
              <AnimatePresence>
                {showLoginFilter && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="absolute left-0 top-full mt-1 z-30 bg-white border border-border rounded-xl shadow-lg overflow-hidden min-w-[200px]"
                  >
                    {(["ALL", "FIRST_LOGIN", "ACTIVATED"] as LoginFilter[]).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => { setLoginFilter(f); setShowLoginFilter(false); }}
                        className={cn(
                          "w-full text-left px-4 py-2.5 text-xs transition-colors hover:bg-black/[0.04] flex items-center gap-2",
                          loginFilter === f ? "font-bold text-amber-700" : "text-muted",
                        )}
                      >
                        {f === "FIRST_LOGIN" && <KeyRound size={11} className="text-amber-500" />}
                        {f === "ACTIVATED" && <LogIn size={11} className="text-emerald-500" />}
                        {f === "ALL" && <Users size={11} />}
                        {loginFilterLabel[f]}
                        {f === "FIRST_LOGIN" && stats.firstLogin > 0 && (
                          <span className="ml-auto bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            {stats.firstLogin}
                          </span>
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Clear filters */}
            {(roleFilter !== "ALL" || loginFilter !== "ALL") && (
              <button
                type="button"
                onClick={() => { setRoleFilter("ALL"); setLoginFilter("ALL"); }}
                className="flex items-center gap-1 px-2.5 py-2 rounded-xl border border-border text-xs text-muted hover:text-text-primary hover:bg-black/[0.03] transition-colors"
              >
                <X size={12} /> Clear
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-accent text-white text-xs font-bold hover:opacity-90 transition-opacity shrink-0"
          >
            <UserPlus size={14} /> Invite User
          </button>
        </div>

        {/* Table card */}
        <Card className="overflow-hidden flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-surface border-b border-border">
                  {["User", "Role", "Status", "Password Setup", "Last Login", "Actions"].map((h) => (
                    <th
                      key={h}
                      className="p-3 text-[10px] font-bold text-muted uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((user) => (
                  <motion.tr
                    key={user.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={cn(
                      "hover:bg-black/[0.015] transition-colors group",
                      user.must_change_password && "bg-amber-50/40",
                    )}
                  >
                    {/* User */}
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px] border shrink-0 relative",
                          user.must_change_password
                            ? "bg-amber-100 text-amber-700 border-amber-300"
                            : "bg-primary-accent/10 text-primary-accent border-primary-accent/20"
                        )}>
                          {initials(user.name)}
                          {user.must_change_password && (
                            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center">
                              <KeyRound size={6} className="text-white" />
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-text-primary">{user.name}</p>
                          <p className="text-[10px] text-muted">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="p-3">
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap",
                        rolePill[user.role],
                      )}>
                        {roleLabels[user.role]}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="p-3">
                      <span className={statusPill[user.status]}>{user.status}</span>
                    </td>

                    {/* Password Setup — the new column */}
                    <td className="p-3">
                      {user.must_change_password ? (
                        <FirstLoginBadge />
                      ) : (
                        <LoggedInBadge />
                      )}
                    </td>

                    {/* Last login */}
                    <td className="p-3 text-xs text-muted tabular-nums">
                      {user.lastLogin === "Never" ? (
                        <span className="text-amber-600 font-medium flex items-center gap-1">
                          <Clock size={11} /> Never
                        </span>
                      ) : (
                        user.lastLogin
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => setEditTarget(user)}
                          className="p-1.5 rounded-lg hover:bg-black/[0.05] text-muted hover:text-primary-accent transition-colors"
                          title="Edit role"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          className="p-1.5 rounded-lg hover:bg-black/[0.05] text-muted hover:text-primary-accent transition-colors"
                          title="View permissions"
                        >
                          <Shield size={14} />
                        </button>
                        {user.status !== "INACTIVE" && (
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(user)}
                            className="p-1.5 rounded-lg hover:bg-black/[0.05] text-muted hover:text-red-500 transition-colors"
                            title="Deactivate user"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-muted text-xs">
                      No users match your search or filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-border flex items-center justify-between shrink-0">
            <p className="text-xs text-muted">
              Showing{" "}
              <span className="font-semibold text-text-primary">{filtered.length}</span>{" "}
              of{" "}
              <span className="font-semibold text-text-primary">{users.length}</span>{" "}
              users
              {loginFilter === "FIRST_LOGIN" && (
                <span className="ml-2 text-amber-600 font-semibold">· First login pending</span>
              )}
            </p>
            <div className="flex items-center gap-3">
              {stats.firstLogin > 0 && (
                <p className="text-xs text-amber-600 flex items-center gap-1.5">
                  <KeyRound size={10} />
                  {stats.firstLogin} awaiting first login
                </p>
              )}
              <p className="text-xs text-muted flex items-center gap-1.5">
                <Shield size={10} className="text-primary-accent" />
                RBAC enforced · {Object.keys(roleLabels).length} roles defined
              </p>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
};
