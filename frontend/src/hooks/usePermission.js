import { useAuth } from './useAuth'

export const usePermission = () => {
  const { user } = useAuth()

  const can = (action, resource = null) => {
    if (!user) return false

    const role = user.profile?.role

    // Admin can do everything
    if (role === 'ADMIN') return true

    // Define permissions by role
    const permissions = {
      CFD_HEAD: {
        canView: ['dashboard', 'candidates', 'planning', 'attendance', 'correction', 'deliberation', 'pv'],
        canEdit: ['candidates', 'planning'],
        canDelete: [],
        canImport: ['candidates'],
        canExport: ['candidates', 'audit'],
      },
      COORDINATOR: {
        canView: ['dashboard', 'candidates', 'planning', 'attendance', 'correction', 'discrepancies', 'pv'],
        canEdit: ['candidates', 'planning', 'subjects'],
        canDelete: [],
        canImport: ['candidates'],
        canExport: ['candidates'],
      },
      CORRECTOR: {
        canView: ['dashboard', 'correction'],
        canEdit: ['correction'],
        canDelete: [],
        canImport: [],
        canExport: [],
      },
      SUPERVISOR: {
        canView: ['dashboard', 'attendance'],
        canEdit: ['attendance'],
        canDelete: [],
        canImport: [],
        canExport: [],
      },
      JURY_MEMBER: {
        canView: ['dashboard', 'deliberation', 'pv'],
        canEdit: ['deliberation'],
        canDelete: [],
        canImport: [],
        canExport: [],
      },
    }

    const rolePerms = permissions[role] || { canView: [], canEdit: [], canDelete: [], canImport: [], canExport: [] }

    switch (action) {
      case 'view':
        return rolePerms.canView.includes(resource)
      case 'edit':
        return rolePerms.canEdit.includes(resource)
      case 'delete':
        return rolePerms.canDelete.includes(resource)
      case 'import':
        return rolePerms.canImport.includes(resource)
      case 'export':
        return rolePerms.canExport.includes(resource)
      default:
        return false
    }
  }

  const isAdmin = () => user?.profile?.role === 'ADMIN'
  const isCFDHead = () => user?.profile?.role === 'CFD_HEAD'
  const isCoordinator = () => user?.profile?.role === 'COORDINATOR'
  const isCorrector = () => user?.profile?.role === 'CORRECTOR'
  const isSupervisor = () => user?.profile?.role === 'SUPERVISOR'
  const isJuryMember = () => user?.profile?.role === 'JURY_MEMBER'

  return {
    can,
    isAdmin,
    isCFDHead,
    isCoordinator,
    isCorrector,
    isSupervisor,
    isJuryMember,
    role: user?.profile?.role,
  }
}