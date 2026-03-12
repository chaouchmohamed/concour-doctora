import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usePermission } from '../hooks/usePermission'

const RoleRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading } = useAuth()
  const { role } = usePermission()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-accent"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/app/dashboard" />
  }

  return children
}

export default RoleRoute