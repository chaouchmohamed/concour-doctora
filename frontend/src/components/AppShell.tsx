import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  ShieldAlert,
  History,
  Trophy,
  EyeOff,
} from 'lucide-react';
import { ROUTES, APP_NAME, cn } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import dashboardLogo from '../assets/Icon.png';
import logoIcon from '../assets/Icon.png';
// ---------------------------------------------------------------------------
// All possible nav items
// ---------------------------------------------------------------------------
type NavItem = {
  icon: React.ElementType;
  label: string;
  path: string;
  roles: UserRole[]; // empty = accessible to all authenticated users
};

const { ADMIN, CFD_HEAD, COORDINATOR, CORRECTOR, SUPERVISOR, JURY_PRESIDENT, JURY_MEMBER, ANONYMITY_COMMISSION } = UserRole;

const ALL_NAV_ITEMS: NavItem[] = [
  {
    icon: LayoutDashboard,
    label: 'Dashboard',
    path: ROUTES.DASHBOARD,
    roles: [], // all roles
  },
  {
    icon: Users,
    label: 'Candidates',
    path: ROUTES.CANDIDATES,
    roles: [ADMIN, CFD_HEAD, COORDINATOR],
  },
  {
    icon: Upload,
    label: 'Import',
    path: ROUTES.IMPORT,
    roles: [ADMIN, CFD_HEAD],
  },
  {
    icon: Calendar,
    label: 'Exam Planning',
    path: ROUTES.EXAM_PLANNING,
    roles: [ADMIN, CFD_HEAD],
  },
  {
    icon: ShieldCheck,
    label: 'Supervisors (PWA)',
    path: ROUTES.SUPERVISOR,
    roles: [ADMIN, CFD_HEAD, COORDINATOR, SUPERVISOR],
  },
  {
    icon: EyeOff,
    label: 'Anonymization',
    path: ROUTES.ANONYMIZATION,
    roles: [ADMIN, CFD_HEAD, ANONYMITY_COMMISSION],
  },
  {
    icon: FileText,
    label: 'Correction',
    path: ROUTES.CORRECTION,
    roles: [ADMIN, CFD_HEAD, COORDINATOR, CORRECTOR],
  },
  {
    icon: AlertCircle,
    label: 'Discrepancies',
    path: ROUTES.DISCREPANCIES,
    roles: [ADMIN, CFD_HEAD, COORDINATOR],
  },
  {
    icon: Gavel,
    label: 'Deliberation',
    path: ROUTES.DELIBERATION,
    roles: [ADMIN, CFD_HEAD, JURY_PRESIDENT, JURY_MEMBER],
  },
  {
    icon: Trophy,
    label: 'Results',
    path: ROUTES.RESULTS,
    roles: [ADMIN, CFD_HEAD, JURY_PRESIDENT],
  },
  {
    icon: History,
    label: 'Audit Trail',
    path: ROUTES.AUDIT,
    roles: [ADMIN],
  },
  {
    icon: Users,
    label: 'Users',
    path: ROUTES.USERS,
    roles: [ADMIN],
  },
  {
    icon: Settings,
    label: 'Settings',
    path: ROUTES.SETTINGS,
    roles: [ADMIN],
  },
];

// ---------------------------------------------------------------------------
// Role display helpers
// ---------------------------------------------------------------------------
const ROLE_LABELS: Record<UserRole, string> = {
  [ADMIN]: 'Administrator',
  [CFD_HEAD]: 'CFD Head',
  [COORDINATOR]: 'Coordinator',
  [CORRECTOR]: 'Corrector',
  [SUPERVISOR]: 'Supervisor',
  [JURY_PRESIDENT]: 'Jury President',
  [JURY_MEMBER]: 'Jury Member',
  [ANONYMITY_COMMISSION]: 'Anon. Commission',
};

function getInitials(fullName: string, username: string): string {
  const parts = fullName.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return username.slice(0, 2).toUpperCase();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const AppShell = ({ children, title }: { children: React.ReactNode; title: string }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const userRole = user?.profile?.role as UserRole | undefined;

  /** Filter nav items by the current user's role */
  const sidebarItems = ALL_NAV_ITEMS.filter(
    (item) => item.roles.length === 0 || (userRole && item.roles.includes(userRole))
  );

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  const fullName = user?.full_name || user?.username || 'User';
  const initials = user ? getInitials(fullName, user.username) : '?';
  const roleLabel = userRole ? (ROLE_LABELS[userRole] ?? userRole) : '';

  const NavLinks = ({ collapsed = false, onNavigate = () => { } }) => (
    <>
      {sidebarItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md transition-all group relative',
              isActive
                ? 'bg-[#8B7355]/5 text-[#8B7355] font-bold'
                : 'text-[#6B6B6B] hover:bg-[#F9F9F9] hover:text-[#1A1A1A]'
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
              className={cn(isActive ? 'text-[#8B7355]' : 'text-[#6B6B6B] group-hover:text-[#1A1A1A]')}
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
    <div className="min-h-screen bg-bg flex">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col bg-white border-r border-border transition-all duration-300 sticky top-0 h-screen',
          isSidebarCollapsed ? 'w-[80px]' : 'w-[260px]'
        )}
      >
        <div className="p-6 flex items-center justify-between">
          {!isSidebarCollapsed && (
            <Link to={ROUTES.DASHBOARD} className="flex items-center gap-2.5 group">
              <div className="w-[32px] h-[32px] bg-[#8B7355] rounded-full flex items-center justify-center transition-transform group-hover:scale-105 shrink-0">
                <img src={dashboardLogo} alt={APP_NAME} className="w-[18px] h-[18px] brightness-0 invert" />
              </div>
              <span className="font-extrabold text-[15px] text-[#1A1A1A] tracking-tight">{APP_NAME}</span>
            </Link>
          )}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1.5 hover:bg-black/[0.03] rounded-md text-muted"
          >
            {isSidebarCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          <NavLinks collapsed={isSidebarCollapsed} />
        </nav>

        <div className="p-4 border-t border-border">
          {/* User chip */}
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
              <div className="w-7 h-7 rounded-full bg-[#F0EDE7] flex items-center justify-center text-[#8B7355] font-bold text-[10px] border border-[#8B7355]/10 shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-[#1A1A1A] truncate">{fullName}</p>
                <p className="text-[10px] text-muted truncate">{roleLabel}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full text-muted hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
          >
            <LogOut size={18} />
            {!isSidebarCollapsed && <span className="text-[13px]">Sign out</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
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
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-[280px] h-full bg-white flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 flex items-center justify-between border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="w-[32px] h-[32px] bg-[#8B7355] rounded-full flex items-center justify-center shrink-0">
                    <img src={dashboardLogo} alt={APP_NAME} className="w-[18px] h-[18px] brightness-0 invert" />
                  </div>
                  <span className="font-bold text-xl text-[#8B7355]">{APP_NAME}</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)}>
                  <X size={24} />
                </button>
              </div>
              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                <NavLinks onNavigate={() => setIsMobileMenuOpen(false)} />
              </nav>
              <div className="p-4 border-t border-border">
                <button
                  onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }}
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-border flex items-center justify-between px-4 lg:px-8 sticky top-0 z-40">
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
            <div className="hidden md:flex items-center bg-black/[0.03] rounded-md px-3 py-1.5 border border-border focus-within:ring-2 focus-within:ring-[#8B7355]/30 transition-all">
              <Search size={18} className="text-muted" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent border-none outline-none px-2 text-small w-48"
              />
            </div>

            <button className="p-2 hover:bg-black/[0.03] rounded-md relative text-muted">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>

            <div className="h-8 w-px bg-border mx-1" />

            <div className="flex items-center gap-2 p-1 rounded-md">
              <div className="w-8 h-8 rounded-full bg-[#F0EDE7] flex items-center justify-center text-[#8B7355] font-bold text-[11px] border border-[#8B7355]/10 shadow-sm">
                {initials}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold leading-tight">{fullName}</p>
                <p className="text-[10px] text-muted leading-tight">{roleLabel}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 max-w-[1200px] mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
};
