import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Users,
  Calendar,
  FileCheck,
  AlertTriangle,
  Clock,
  TrendingUp,
  UserCheck,
  UserX,
  Award,
} from 'lucide-react'
import { dashboardAPI } from '../api/dashboard'
import { usePermission } from '../hooks/usePermission'
import Card from '../components/ui/Card'
import Spinner from '../components/ui/Spinner'
import Badge from '../components/ui/Badge'
import { formatRelativeTime } from '../utils/formatDate'

const Dashboard = () => {
  const { role, isAdmin, isCFDHead, isCoordinator } = usePermission()

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardAPI.getStats,
  })

  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: dashboardAPI.getActivityFeed,
  })

  if (statsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  const getRoleSpecificCards = () => {
    switch (role) {
      case 'ADMIN':
      case 'CFD_HEAD':
      case 'COORDINATOR':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="text-blue-600" size={24} />
                </div>
                <span className="text-3xl font-bold">{stats?.total_candidates || 0}</span>
              </div>
              <h3 className="text-text-secondary">Total Candidates</h3>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <UserCheck className="text-green-600" size={24} />
                </div>
                <span className="text-3xl font-bold">{stats?.total_present || 0}</span>
              </div>
              <h3 className="text-text-secondary">Present Today</h3>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <FileCheck className="text-yellow-600" size={24} />
                </div>
                <span className="text-3xl font-bold">{stats?.pending_corrections || 0}</span>
              </div>
              <h3 className="text-text-secondary">Pending Corrections</h3>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-red-100 rounded-lg">
                  <AlertTriangle className="text-red-600" size={24} />
                </div>
                <span className="text-3xl font-bold">{stats?.active_discrepancies || 0}</span>
              </div>
              <h3 className="text-text-secondary">Active Discrepancies</h3>
            </Card>
          </div>
        )

      case 'CORRECTOR':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FileCheck className="text-blue-600" size={24} />
                </div>
                <span className="text-3xl font-bold">{stats?.assigned_copies || 0}</span>
              </div>
              <h3 className="text-text-secondary">Assigned Copies</h3>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Award className="text-green-600" size={24} />
                </div>
                <span className="text-3xl font-bold">{stats?.completed_corrections || 0}</span>
              </div>
              <h3 className="text-text-secondary">Completed Corrections</h3>
            </Card>
          </div>
        )

      case 'SUPERVISOR':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <UserCheck className="text-green-600" size={24} />
                </div>
                <span className="text-3xl font-bold">{stats?.today_attendance || 0}</span>
              </div>
              <h3 className="text-text-secondary">Today's Attendance</h3>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="text-blue-600" size={24} />
                </div>
                <span className="text-3xl font-bold">{stats?.total_today || 0}</span>
              </div>
              <h3 className="text-text-secondary">Total Today</h3>
            </Card>
          </div>
        )

      case 'JURY_MEMBER':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Users className="text-purple-600" size={24} />
                </div>
                <span className="text-3xl font-bold">{stats?.candidates_to_deliberate || 0}</span>
              </div>
              <h3 className="text-text-secondary">To Deliberate</h3>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Award className="text-green-600" size={24} />
                </div>
                <span className="text-3xl font-bold">
                  {stats?.deliberation_completed ? 'Yes' : 'No'}
                </span>
              </div>
              <h3 className="text-text-secondary">Deliberation Completed</h3>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-text-secondary">
          Welcome back, {role} - Here's what's happening with your exams
        </p>
      </div>

      {/* Stats Cards */}
      {getRoleSpecificCards()}

      {/* Active Session */}
      {stats?.active_session && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">Active Session</h2>
              <p className="text-2xl font-bold text-primary-accent">
                {stats.active_session.name}
              </p>
              <p className="text-text-secondary">
                {new Date(stats.active_session.date).toLocaleDateString()}
              </p>
            </div>
            <Badge variant="active">Active</Badge>
          </div>
        </Card>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activities */}
        <Card className="lg:col-span-2 p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activities</h2>
          {activitiesLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <div className="space-y-4">
              {activities?.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start space-x-3 p-3 bg-surface/30 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">
                      {activity.user_full_name || 'System'} - {activity.action}
                    </p>
                    <p className="text-sm text-text-secondary">
                      {activity.object_type} {activity.object_id}
                    </p>
                  </div>
                  <span className="text-xs text-text-secondary">
                    {formatRelativeTime(activity.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            {(isAdmin || isCFDHead || isCoordinator) && (
              <>
                <button className="w-full text-left p-3 bg-surface/30 rounded-lg hover:bg-surface transition-colors">
                  Import Candidates
                </button>
                <button className="w-full text-left p-3 bg-surface/30 rounded-lg hover:bg-surface transition-colors">
                  Create Exam Session
                </button>
              </>
            )}
            {role === 'SUPERVISOR' && (
              <button className="w-full text-left p-3 bg-surface/30 rounded-lg hover:bg-surface transition-colors">
                Mark Attendance
              </button>
            )}
            {role === 'CORRECTOR' && (
              <button className="w-full text-left p-3 bg-surface/30 rounded-lg hover:bg-surface transition-colors">
                Start Correction
              </button>
            )}
            {role === 'JURY_MEMBER' && (
              <button className="w-full text-left p-3 bg-surface/30 rounded-lg hover:bg-surface transition-colors">
                View Deliberation
              </button>
            )}
          </div>
        </Card>
      </div>
    </motion.div>
  )
}

export default Dashboard