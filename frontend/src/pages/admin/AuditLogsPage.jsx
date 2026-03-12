import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  History,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { auditAPI } from '../../api/audit'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDateTime } from '../../utils/formatDate'

const AuditLogsPage = () => {
  const [search, setSearch] = useState('')
  const [selectedAction, setSelectedAction] = useState('')
  const [selectedUser, setSelectedUser] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [expandedRow, setExpandedRow] = useState(null)

  // Fetch audit logs
  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-logs', { search, action: selectedAction, user: selectedUser, startDate, endDate }],
    queryFn: () => auditAPI.getAll({
      search,
      action: selectedAction,
      user: selectedUser,
      start_date: startDate,
      end_date: endDate,
    }),
  })

  // Fetch unique actions for filter
  const actions = [...new Set(logs?.map(log => log.action) || [])]

  // Fetch unique users for filter
  const users = [...new Set(logs?.map(log => log.username).filter(Boolean) || [])]

  const handleExport = async () => {
    try {
      const blob = await auditAPI.export({
        search,
        action: selectedAction,
        user: selectedUser,
        start_date: startDate,
        end_date: endDate,
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
    } catch (error) {
      toast.error('Failed to export audit logs')
    }
  }

  const getActionBadge = (action) => {
    const variants = {
      'CREATE': 'success',
      'UPDATE': 'info',
      'DELETE': 'error',
      'LOGIN': 'default',
      'LOGOUT': 'default',
      'IMPORT': 'warning',
      'EXPORT': 'warning',
      'GENERATE_CODE': 'purple',
      'UPLOAD_SCAN': 'purple',
      'MARK_ATTENDANCE': 'info',
      'SUBMIT_GRADE': 'success',
      'RESOLVE_DISCREPANCY': 'success',
      'CLOSE_SESSION': 'error',
      'SIGN_PV': 'success',
    }
    return <Badge variant={variants[action] || 'default'}>{action}</Badge>
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Audit Logs</h1>
          <p className="text-text-secondary">
            View all system actions and changes
          </p>
        </div>
        <Button variant="secondary" onClick={handleExport}>
          <Download size={18} className="mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={Search}
          />

          <div>
            <select
              className="input"
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
            >
              <option value="">All Actions</option>
              {actions.map(action => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              className="input"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              <option value="">All Users</option>
              {users.map(user => (
                <option key={user} value={user}>{user}</option>
              ))}
            </select>
          </div>

          <div className="flex space-x-2">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Start Date"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="End Date"
            />
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch('')
              setSelectedAction('')
              setSelectedUser('')
              setStartDate('')
              setEndDate('')
            }}
          >
            Clear Filters
          </Button>
        </div>
      </Card>

      {/* Logs List */}
      {logs?.length > 0 ? (
        <div className="space-y-4">
          {logs.map((log) => (
            <Card key={log.id} className="overflow-hidden">
              <div
                className="p-4 flex items-start justify-between cursor-pointer hover:bg-surface/50 transition-colors"
                onClick={() => setExpandedRow(
                  expandedRow === log.id ? null : log.id
                )}
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {getActionBadge(log.action)}
                    <span className="text-sm text-text-secondary">
                      {formatDateTime(log.timestamp)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="flex items-center">
                      <User size={14} className="mr-1 text-text-secondary" />
                      {log.user_full_name || 'System'}
                    </span>
                    <span className="flex items-center">
                      <FileText size={14} className="mr-1 text-text-secondary" />
                      {log.object_type} {log.object_id && `#${log.object_id}`}
                    </span>
                  </div>
                </div>
                {expandedRow === log.id ? (
                  <ChevronUp size={20} className="text-text-secondary" />
                ) : (
                  <ChevronDown size={20} className="text-text-secondary" />
                )}
              </div>

              {/* Expanded Details */}
              {expandedRow === log.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="border-t border-surface p-4 bg-surface/30"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Details</p>
                      <pre className="text-xs bg-white p-3 rounded-lg overflow-x-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">Metadata</p>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-text-secondary">IP Address:</span>
                          <span className="ml-2 font-mono">{log.ip_address || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-text-secondary">User Agent:</span>
                          <span className="ml-2 text-xs">{log.user_agent || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No audit logs found"
          description="Try adjusting your filters"
          icon={History}
        />
      )}
    </motion.div>
  )
}

export default AuditLogsPage