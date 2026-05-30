import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Upload,
  Calendar,
  ShieldCheck,
  FileText,
  AlertCircle,
  Gavel,
  Settings,
  LogOut,
  Bell,
  Menu,
  X,
  ChevronLeft,
  Search,
  History,
  Trophy,
  EyeOff,
  ChevronDown,
  BookOpen,
  Check,
  Plus,
  Loader2,
} from "lucide-react";
import { ROUTES, APP_NAME, cn } from "../constants";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { useSession } from "../context/SessionContext";
import { UserRole } from "../types";
import dashboardLogo from "../assets/logo.png";
import { api } from "../lib/api";

type NavItem = {
  icon: React.ElementType;
  label: string;
  path: string;
  roles: UserRole[];
};

const {
  ADMIN,
  CFD_HEAD,
  COORDINATOR,
  CORRECTOR,
  SUPERVISOR,
  JURY_PRESIDENT,
  JURY_MEMBER,
  ANONYMITY_COMMISSION,
} = UserRole;

const ALL_NAV_ITEMS: NavItem[] = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    path: ROUTES.DASHBOARD,
    roles: [],
  },
  {
    icon: Users,
    label: "Candidates",
    path: ROUTES.CANDIDATES,
    roles: [ADMIN, CFD_HEAD, COORDINATOR],
  },
  {
    icon: Calendar,
    label: "Exam Planning",
    path: ROUTES.EXAM_PLANNING,
    roles: [ADMIN, CFD_HEAD],
  },
  {
    icon: ShieldCheck,
    label: "Supervisors (PWA)",
    path: ROUTES.SUPERVISOR,
    roles: [ADMIN, CFD_HEAD, COORDINATOR, SUPERVISOR],
  },
  {
    icon: EyeOff,
    label: "Anonymization",
    path: ROUTES.ANONYMIZATION,
    roles: [ADMIN, CFD_HEAD, ANONYMITY_COMMISSION],
  },
  {
    icon: FileText,
    label: "Correction",
    path: ROUTES.CORRECTION,
    roles: [ADMIN, CFD_HEAD, COORDINATOR, CORRECTOR],
  },
  {
    icon: AlertCircle,
    label: "Discrepancies",
    path: ROUTES.DISCREPANCIES,
    roles: [ADMIN, CFD_HEAD, COORDINATOR],
  },
  {
    icon: Gavel,
    label: "Deliberation",
    path: ROUTES.DELIBERATION,
    roles: [ADMIN, CFD_HEAD, JURY_PRESIDENT, JURY_MEMBER],
  },
  {
    icon: Trophy,
    label: "Results",
    path: ROUTES.RESULTS,
    roles: [ADMIN, CFD_HEAD, JURY_PRESIDENT],
  },
  { icon: History, label: "Audit Trail", path: ROUTES.AUDIT, roles: [ADMIN] },
  { icon: Users, label: "Users", path: ROUTES.USERS, roles: [ADMIN] },
  { icon: Settings, label: "Settings", path: ROUTES.SETTINGS, roles: [ADMIN] },
];

const ROLE_LABELS: Record<UserRole, string> = {
  [ADMIN]: "Administrator",
  [CFD_HEAD]: "CFD Head",
  [COORDINATOR]: "Coordinator",
  [CORRECTOR]: "Corrector",
  [SUPERVISOR]: "Supervisor",
  [JURY_PRESIDENT]: "Jury President",
  [JURY_MEMBER]: "Jury Member",
  [ANONYMITY_COMMISSION]: "Anon. Commission",
};

function getInitials(fullName: string, username: string): string {
  const safeFullName = (fullName || "").trim();
  const safeUsername = (username || "").trim();
  const parts = safeFullName.split(" ").filter(Boolean);
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  if (safeUsername) return safeUsername.slice(0, 2).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return "U";
}

const SessionDropdown = () => {
  const { selectedSession, setSelectedSession } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [sessions, setSessions] = useState<{ id: number; name: string; year: number; status: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    // Skip if already loading or have sessions
    if (sessions.length > 0 || loading) {
      return;
    }

    let active = true;
    setLoading(true);
    setLoadError(null);

    api.sessions
      .list()
      .then((response) => {
        if (!active) return;
        console.log("Sessions response:", response);
        
        // Handle paginated response
        const sessionList = Array.isArray(response) ? response : (response.results || []);
        
        const nextSessions = sessionList.map((session: any) => ({
          id: session.id,
          name: session.name,
          year: session.year,
          status: session.status,
        }));
        
        console.log("Mapped sessions:", nextSessions);
        setSessions(nextSessions);
        
        // Set first session as default if none selected
        if (nextSessions.length > 0 && !selectedSession) {
          setSelectedSession(nextSessions[0]);
        }
      })
      .catch((error) => {
        if (!active) return;
        console.error("Error loading sessions:", error);
        setLoadError(error instanceof Error ? error.message : "Unable to load sessions.");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, selectedSession, setSelectedSession]);

  const activeSession = selectedSession ?? sessions[0] ?? null;

  return (
    <div className="relative hidden sm:block z-50" ref={dropdownRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 pl-3 pr-2 py-1.5 bg-white border border-border rounded-xl hover:bg-[#FAFAFA] hover:border-[#E5E0D8] transition-all group shadow-sm cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md flex items-center justify-center bg-[#F0EDE7] text-[#8B7355]">
            <BookOpen size={13} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col items-start -space-y-0.5">
            <span className="text-[12px] font-extrabold text-[#1A1A1A] leading-tight">
              {activeSession ? activeSession.name : "Loading sessions..."}
            </span>
            <span className="text-[10px] font-bold text-[#8B7355] leading-tight">
              {activeSession ? `Session ${activeSession.year} · ${activeSession.status}` : "No session"}
            </span>
          </div>
        </div>
        <ChevronDown size={14} className={cn("text-[#9B9B9B] transition-transform duration-200", isOpen && "rotate-180")} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute top-full right-0 mt-2 w-[320px] bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-border overflow-hidden origin-top-right"
          >
              <div className="max-h-[400px] overflow-y-auto flex flex-col gap-0.5 p-1.5">
                {loading && (
                  <div className="flex items-center gap-2 px-3 py-3 text-[12px] text-[#6B6B6B]">
                    <Loader2 size={14} className="animate-spin text-[#8B7355]" />
                    Loading sessions...
                  </div>
                )}

                {loadError && (
                  <div className="px-3 py-2 text-[12px] text-red-700 bg-red-50 rounded-lg mx-0.5">
                    {loadError}
                  </div>
                )}

                {!loading && !loadError && sessions.length === 0 && (
                  <div className="px-3 py-3 text-[12px] text-[#6B6B6B]">
                    No sessions available.
                  </div>
                )}

                {!loading && !loadError && sessions.map((session) => {
                  const isSelected = activeSession?.id === session.id;
                  const color =
                    session.status === "ACTIVE"
                      ? "bg-emerald-50 text-emerald-600"
                      : session.status === "CLOSED"
                        ? "bg-slate-100 text-slate-600"
                        : "bg-blue-50 text-blue-600";
                return (
                  <button
                      key={session.id}
                      onClick={() => {
                        setSelectedSession(session);
                        setIsOpen(false);
                      }}
                    className={cn(
                      "w-full text-left flex items-center justify-between px-2.5 py-2 rounded-lg transition-all border border-transparent",
                      isSelected ? "bg-[#8B7355]/5 border-[#8B7355]/10" : "hover:bg-[#FAFAFA] hover:border-border/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                        <div className={cn("w-7 h-7 rounded-md flex items-center justify-center shrink-0", color)}>
                          <BookOpen size={14} />
                      </div>
                      <div className="flex flex-col -space-y-0.5">
                        <p className={cn("text-[13px] font-bold", isSelected ? "text-[#8B7355]" : "text-[#1A1A1A]")}>
                            {session.name}
                        </p>
                          <p className="text-[11px] text-[#9B9B9B] font-medium leading-tight mt-0.5">
                            {session.year} · {session.status}
                          </p>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-[#8B7355] flex items-center justify-center shadow-sm">
                        <Check size={12} strokeWidth={3} className="text-white" />
                      </div>
                    )}
                  </button>
                );
                })}
              </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const AppShell = ({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const userRole =
    ((user as any)?.profile?.role || (user as any)?.role) as
      | UserRole
      | undefined;

  const sidebarItems = ALL_NAV_ITEMS.filter(
    (item) =>
      item.roles.length === 0 || (userRole && item.roles.includes(userRole)),
  );

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  const fullName =
    (user as any)?.full_name ||
    `${(user as any)?.first_name || ""} ${(user as any)?.last_name || ""}`.trim() ||
    (user as any)?.username ||
    (user as any)?.email ||
    "User";
  const usernameForInitials =
    (user as any)?.username ||
    (typeof (user as any)?.email === "string"
      ? (user as any).email.split("@")[0]
      : "");
  const initials = user ? getInitials(fullName, usernameForInitials) : "?";
  const roleLabel = userRole ? (ROLE_LABELS[userRole] ?? userRole) : "";

  const NavLinks = ({ collapsed = false, onNavigate = () => {} }) => (
    <>
      {sidebarItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md transition-all group relative",
              isActive
                ? "bg-[#8B7355]/5 text-[#8B7355] font-bold"
                : "text-[#6B6B6B] hover:bg-[#F9F9F9] hover:text-[#1A1A1A]",
            )}
          >
            {isActive && (
              <motion.div
                layoutId="active-nav"
                className="absolute left-0 w-1 h-5 bg-[#8B7355] rounded-r-full"
              />
            )}
            <item.icon
              size={18}
              className={cn(
                isActive
                  ? "text-[#8B7355]"
                  : "text-[#6B6B6B] group-hover:text-[#1A1A1A]",
              )}
            />
            {!collapsed && <span className="text-[13.5px]">{item.label}</span>}
            {collapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-[#1A1A1A] text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                {item.label}
              </div>
            )}
          </Link>
        );
      })}
    </>
  );

  return (
    // Root: h-screen + overflow-hidden so nothing ever escapes the viewport
    <div className="h-screen overflow-hidden bg-bg flex">
      {/* ── Desktop Sidebar ── */}
      <aside
        className={cn(
          "hidden lg:flex flex-col bg-white border-r border-border transition-all duration-300 shrink-0 h-screen",
          isSidebarCollapsed ? "w-[80px]" : "w-[260px]",
        )}
      >
        <div className="p-6 flex items-center justify-between shrink-0">
          {!isSidebarCollapsed && (
            <Link
              to={ROUTES.DASHBOARD}
              className="flex items-center gap-2.5 group"
            >
              <div className="w-[32px] h-[32px] bg-[#8B7355] rounded-full flex items-center justify-center transition-transform group-hover:scale-105 shrink-0">
                <img
                  src={dashboardLogo}
                  alt="Logo"
                  className="w-10 h-10 rounded-xl"
                />
              </div>
              <span className="font-extrabold text-[15px] text-[#1A1A1A] tracking-tight">
                {APP_NAME}
              </span>
            </Link>
          )}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1.5 hover:bg-black/[0.03] rounded-md text-muted"
          >
            {isSidebarCollapsed ? (
              <Menu size={20} />
            ) : (
              <ChevronLeft size={20} />
            )}
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-hidden">
          <NavLinks collapsed={isSidebarCollapsed} />
        </nav>

        <div className="p-4 border-t border-border shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full text-muted hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
          >
            <LogOut size={18} />
            {!isSidebarCollapsed && (
              <span className="text-[13px]">Sign out</span>
            )}
          </button>
        </div>
      </aside>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-[280px] h-full bg-white flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 flex items-center justify-between border-b border-border shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-[32px] h-[32px] bg-[#8B7355] rounded-full flex items-center justify-center shrink-0">
                    <img
                      src={dashboardLogo}
                      alt="Logo"
                      className="w-8 h-8 rounded-lg"
                    />
                  </div>
                  <span className="font-bold text-xl text-[#8B7355]">
                    {APP_NAME}
                  </span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)}>
                  <X size={24} />
                </button>
              </div>
              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                <NavLinks onNavigate={() => setIsMobileMenuOpen(false)} />
              </nav>
              <div className="p-4 border-t border-border shrink-0">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center gap-3 px-4 py-3 w-full text-muted hover:text-red-500 rounded-md"
                >
                  <LogOut size={20} />
                  <span>Sign out</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Content Area ── */}
      {/*
        KEY HEIGHT CHAIN:
        1. Root div          → h-screen overflow-hidden
        2. This div          → flex-1 flex flex-col min-w-0  (fills remaining width, column direction)
        3. header            → shrink-0                       (fixed height, never shrinks)
        4. main              → flex-1 min-h-0 overflow-hidden (takes ALL remaining height, clips overflow)
        5. main > div        → h-full flex flex-col gap-4     (gives children the full height to work with)
        6. Page outer div    → h-full flex flex-col gap-4     (just use h-full — NO inline calc needed)
      */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Header — fixed height */}
        <header className="h-16 shrink-0 bg-white border-b border-border flex items-center justify-between px-4 lg:px-8 z-40">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 hover:bg-black/[0.03] rounded-md"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h1 className="text-[17px] font-bold text-[#1A1A1A]">{title}</h1>
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
            {userRole === ADMIN && (
              <Link to={ROUTES.CREATE_CONCOUR} className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#8B7355] text-white rounded-xl hover:bg-[#7A6548] transition-all font-bold text-[12px] shadow-sm shadow-[#8B7355]/20 active:scale-95">
                <Plus size={14} strokeWidth={3} />
                Create Concour
              </Link>
            )}
            <SessionDropdown />

            <div className="h-8 w-px bg-border mx-1" />

            <div className="flex items-center gap-2 p-1 rounded-md">
              <div className="w-8 h-8 rounded-full bg-[#F0EDE7] flex items-center justify-center text-[#8B7355] font-bold text-[11px] border border-[#8B7355]/10 shadow-sm">
                {initials}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold leading-tight">
                  {fullName}
                </p>
                <p className="text-[10px] text-muted leading-tight">
                  {roleLabel}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Main — takes all remaining height, clips overflow */}
        <main className="flex-1 min-h-0 overflow-hidden p-4 pb-2">
          <div className="h-full w-full overflow-hidden">{children}</div>
        </main>
      </div>
    </div>
  );
};
