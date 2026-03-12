import React from 'react'
import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardCheck,
  QrCode,
  FileCheck,
  AlertTriangle,
  Scale,
  FileText,
  Settings,
  UserCog,
  History,
  LogOut,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const Sidebar = ({ role }) => {
  const { logout, user } = useAuth()

  const menuItems = [
    { path: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['ADMIN', 'CFD_HEAD', 'COORDINATOR', 'CORRECTOR', 'SUPERVISOR', 'JURY_MEMBER'] },
    { path: '/app/candidates', icon: Users, label: 'Candidates', roles: ['ADMIN', 'CFD_HEAD', 'COORDINATOR'] },
    { path: '/app/planning', icon: Calendar, label: 'Exam Planning', roles: ['ADMIN', 'CFD_HEAD', 'COORDINATOR'] },
    { path: '/app/attendance', icon: ClipboardCheck, label: 'Attendance', roles: ['ADMIN', 'CFD_HEAD', 'COORDINATOR', 'SUPERVISOR'] },
    { path: '/app/anonymization', icon: QrCode, label: 'Anonymization', roles: ['ADMIN', 'CFD_HEAD', 'COORDINATOR'] },
    { path: '/app/correction', icon: FileCheck, label: 'Correction', roles: ['ADMIN', 'CFD_HEAD', 'COORDINATOR', 'CORRECTOR'] },
    { path: '/app/discrepancies', icon: AlertTriangle, label: 'Discrepancies', roles: ['ADMIN', 'CFD_HEAD', 'COORDINATOR'] },
    { path: '/app/deliberation', icon: Scale, label: 'Deliberation', roles: ['ADMIN', 'CFD_HEAD', 'JURY_MEMBER'] },
    { path: '/app/pv', icon: FileText, label: 'PV Reports', roles: ['ADMIN', 'CFD_HEAD', 'COORDINATOR', 'JURY_MEMBER'] },
    { path: '/app/admin/users', icon: UserCog, label: 'User Management', roles: ['ADMIN'] },
    { path: '/app/admin/audit', icon: History, label: 'Audit Logs', roles: ['ADMIN'] },
    { path: '/app/admin/settings', icon: Settings, label: 'Settings', roles: ['ADMIN'] },
  ]

  const filteredMenu = menuItems.filter(item => item.roles.includes(role))

  return (
    <motion.aside 
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-64 bg-white shadow-lg flex flex-col"
    >
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary-accent">CONCOUR</h1>
        <p className="text-sm text-text-secondary">DOCTORA</p>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {filteredMenu.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-primary-accent/10 text-primary-accent border-l-4 border-primary-accent'
                  : 'text-text-secondary hover:bg-surface hover:text-text-primary'
              }`
            }
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-surface">
        <div className="flex items-center space-x-3 px-4 py-3">
          <div className="w-10 h-10 rounded-full bg-primary-accent flex items-center justify-center text-white font-bold">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-text-secondary truncate">{role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center space-x-3 px-4 py-3 w-full text-left text-error hover:bg-error/10 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </motion.aside>
  )
}

export default Sidebar