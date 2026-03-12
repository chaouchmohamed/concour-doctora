import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Camera,
  CheckCircle,
  XCircle,
  UserCheck,
  UserX,
  Wifi,
  WifiOff,
  Save,
  RefreshCw,
  Search,
  Calendar,
} from 'lucide-react'
import { attendanceAPI } from '../../api/attendance'
import { sessionsAPI } from '../../api/sessions'
import { candidatesAPI } from '../../api/candidates'
import { usePermission } from '../../hooks/usePermission'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import toast from 'react-hot-toast'

// PWA offline storage
const STORAGE_KEY = 'attendance_offline_queue'

const AttendancePage = () => {
  const queryClient = useQueryClient()
  const { can } = usePermission()
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [selectedSession, setSelectedSession] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [attendanceData, setAttendanceData] = useState({})
  const [offlineQueue, setOfflineQueue] = useState([])
  const [isSyncing, setIsSyncing] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState(null)

  // Fetch sessions
  const { data: sessions } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => sessionsAPI.getAll({ status: 'ACTIVE' }),
  })

  // Fetch candidates for selected session
  const { data: candidates, isLoading } = useQuery({
    queryKey: ['candidates', selectedSession],
    queryFn: () => candidatesAPI.getAll({ 
      session: selectedSession,
      page_size: 100 
    }),
    enabled: !!selectedSession,
  })

  // Fetch existing attendance
  const { data: existingAttendance } = useQuery({
    queryKey: ['attendance', selectedSession],
    queryFn: () => attendanceAPI.getBySession(selectedSession),
    enabled: !!selectedSession,
  })

  // Bulk attendance mutation
  const bulkMutation = useMutation({
    mutationFn: (data) => attendanceAPI.markBulk(selectedSession, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['attendance', selectedSession])
      toast.success('Attendance marked successfully')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to mark attendance')
    },
  })

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      syncOfflineData()
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Load offline queue from localStorage
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      setOfflineQueue(JSON.parse(saved))
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Update attendance data when existing attendance loads
  useEffect(() => {
    if (existingAttendance) {
      const data = {}
      existingAttendance.forEach(record => {
        data[record.candidate] = record.present
      })
      setAttendanceData(data)
    }
  }, [existingAttendance])

  // Save offline queue to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(offlineQueue))
  }, [offlineQueue])

  const handleAttendanceChange = (candidateId, present) => {
    setAttendanceData(prev => ({
      ...prev,
      [candidateId]: present
    }))

    // Add to offline queue if offline
    if (!isOnline) {
      const newQueue = [...offlineQueue]
      const existingIndex = newQueue.findIndex(
        item => item.candidateId === candidateId
      )

      const queueItem = {
        candidateId,
        present,
        timestamp: new Date().toISOString()
      }

      if (existingIndex >= 0) {
        newQueue[existingIndex] = queueItem
      } else {
        newQueue.push(queueItem)
      }

      setOfflineQueue(newQueue)
    }
  }

  const handleSubmit = () => {
    const attendanceList = Object.entries(attendanceData).map(([candidateId, present]) => ({
      candidate_id: parseInt(candidateId),
      present: present.toString()
    }))

    if (isOnline) {
      // Submit directly
      bulkMutation.mutate(attendanceList)
    } else {
      // Add all to queue
      const newQueue = [...offlineQueue]
      attendanceList.forEach(item => {
        const existingIndex = newQueue.findIndex(
          q => q.candidateId === item.candidate_id
        )
        if (existingIndex >= 0) {
          newQueue[existingIndex] = {
            candidateId: item.candidate_id,
            present: item.present === 'true',
            timestamp: new Date().toISOString()
          }
        } else {
          newQueue.push({
            candidateId: item.candidate_id,
            present: item.present === 'true',
            timestamp: new Date().toISOString()
          })
        }
      })
      setOfflineQueue(newQueue)
      toast.success('Saved offline. Will sync when online.')
    }
  }

  const syncOfflineData = async () => {
    if (offlineQueue.length === 0 || !isOnline) return

    setIsSyncing(true)
    try {
      const attendanceList = offlineQueue.map(item => ({
        candidate_id: item.candidateId,
        present: item.present.toString()
      }))

      await attendanceAPI.markBulk(selectedSession, attendanceList)
      
      // Clear queue on success
      setOfflineQueue([])
      localStorage.removeItem(STORAGE_KEY)
      
      // Refresh data
      queryClient.invalidateQueries(['attendance', selectedSession])
      toast.success('Offline data synced successfully')
    } catch (error) {
      toast.error('Failed to sync offline data')
    } finally {
      setIsSyncing(false)
    }
  }

  const filteredCandidates = candidates?.results?.filter(candidate =>
    `${candidate.first_name} ${candidate.last_name} ${candidate.application_number}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  )

  const presentCount = Object.values(attendanceData).filter(Boolean).length
  const totalCount = candidates?.results?.length || 0

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <WifiOff className="text-warning" size={20} />
            <div>
              <p className="font-medium text-warning">You are offline</p>
              <p className="text-sm text-text-secondary">
                Changes will be saved locally and synced when connection is restored
              </p>
            </div>
          </div>
          {offlineQueue.length > 0 && (
            <Badge variant="warning">{offlineQueue.length} pending</Badge>
          )}
        </div>
      )}

      {/* Online Banner with Sync */}
      {isOnline && offlineQueue.length > 0 && (
        <div className="bg-info/10 border border-info/20 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Wifi className="text-info" size={20} />
            <div>
              <p className="font-medium text-info">Offline changes pending</p>
              <p className="text-sm text-text-secondary">
                {offlineQueue.length} attendance records waiting to be synced
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={syncOfflineData}
            isLoading={isSyncing}
          >
            <RefreshCw size={16} className="mr-2" />
            Sync Now
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Attendance</h1>
          <p className="text-text-secondary">
            Mark candidate attendance for exam sessions
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-2xl font-bold text-primary-accent">
              {presentCount}/{totalCount}
            </p>
            <p className="text-sm text-text-secondary">Present</p>
          </div>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={bulkMutation.isLoading}
            disabled={!selectedSession}
          >
            <Save size={18} className="mr-2" />
            Save Attendance
          </Button>
        </div>
      </div>

      {/* Session Selection */}
      <Card className="p-6">
        <div className="flex items-center space-x-4">
          <div className="w-96">
            <label className="block text-sm font-medium text-text-primary mb-2">
              Select Exam Session
            </label>
            <select
              className="input"
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
            >
              <option value="">Choose a session...</option>
              {sessions?.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.name} - {new Date(session.date).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <Input
              placeholder="Search candidates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search}
              disabled={!selectedSession}
            />
          </div>
        </div>
      </Card>

      {/* Attendance Grid */}
      {selectedSession && (
        <Card className="overflow-hidden">
          <div className="divide-y divide-surface">
            {isLoading ? (
              <div className="p-8 text-center">
                <Spinner />
              </div>
            ) : filteredCandidates?.length > 0 ? (
              filteredCandidates.map((candidate) => (
                <div
                  key={candidate.id}
                  className="p-4 flex items-center justify-between hover:bg-surface/30 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-primary-accent/10 flex items-center justify-center">
                        <span className="font-bold text-primary-accent">
                          {candidate.first_name[0]}{candidate.last_name[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">
                          {candidate.last_name} {candidate.first_name}
                        </p>
                        <p className="text-sm text-text-secondary">
                          {candidate.application_number}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedCandidate(candidate)}
                      className="p-2 hover:bg-surface rounded-lg transition-colors"
                    >
                      <Camera size={20} className="text-text-secondary" />
                    </button>
                    <button
                      onClick={() => handleAttendanceChange(candidate.id, true)}
                      className={`p-3 rounded-lg transition-colors ${
                        attendanceData[candidate.id] === true
                          ? 'bg-success text-white'
                          : 'bg-surface/50 hover:bg-success/10 text-text-secondary'
                      }`}
                    >
                      <UserCheck size={20} />
                    </button>
                    <button
                      onClick={() => handleAttendanceChange(candidate.id, false)}
                      className={`p-3 rounded-lg transition-colors ${
                        attendanceData[candidate.id] === false
                          ? 'bg-error text-white'
                          : 'bg-surface/50 hover:bg-error/10 text-text-secondary'
                      }`}
                    >
                      <UserX size={20} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-text-secondary">
                No candidates found for this session
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Summary Card */}
      {selectedSession && totalCount > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Attendance Summary</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-success/10 rounded-lg text-center">
              <CheckCircle className="mx-auto mb-2 text-success" size={24} />
              <p className="text-2xl font-bold text-success">{presentCount}</p>
              <p className="text-sm text-text-secondary">Present</p>
            </div>
            <div className="p-4 bg-error/10 rounded-lg text-center">
              <XCircle className="mx-auto mb-2 text-error" size={24} />
              <p className="text-2xl font-bold text-error">
                {totalCount - presentCount}
              </p>
              <p className="text-sm text-text-secondary">Absent</p>
            </div>
            <div className="p-4 bg-surface/50 rounded-lg text-center">
              <Calendar className="mx-auto mb-2 text-text-secondary" size={24} />
              <p className="text-2xl font-bold">{totalCount}</p>
              <p className="text-sm text-text-secondary">Total</p>
            </div>
          </div>
        </Card>
      )}
    </motion.div>
  )
}

export default AttendancePage