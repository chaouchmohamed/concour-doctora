import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Calendar,
  Clock,
  Users,
  FileText,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  Download,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { sessionsAPI } from '../../api/sessions'
import { subjectsAPI } from '../../api/subjects'
import { usePermission } from '../../hooks/usePermission'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import toast from 'react-hot-toast'

const ExamPlanning = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { can } = usePermission()
  const [expandedSession, setExpandedSession] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedSession, setSelectedSession] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    year: new Date().getFullYear(),
    date: '',
    description: '',
  })

  // Fetch sessions
  const { data: sessions, isLoading } = useQuery({
    queryKey: ['sessions-with-subjects'],
    queryFn: async () => {
      const data = await sessionsAPI.getAll()
      // Fetch subjects for each session
      const sessionsWithSubjects = await Promise.all(
        data.map(async (session) => {
          const subjects = await subjectsAPI.getAll({ exam_session: session.id })
          return { ...session, subjects }
        })
      )
      return sessionsWithSubjects
    },
  })

  // Create session mutation
  const createMutation = useMutation({
    mutationFn: (data) => sessionsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['sessions-with-subjects'])
      toast.success('Exam session created successfully')
      setShowCreateModal(false)
      resetForm()
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to create session')
    },
  })

  // Delete session mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => sessionsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['sessions-with-subjects'])
      toast.success('Session deleted successfully')
      setShowDeleteModal(false)
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete session')
    },
  })

  // Activate session mutation
  const activateMutation = useMutation({
    mutationFn: (id) => sessionsAPI.activate(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['sessions-with-subjects'])
      toast.success('Session activated successfully')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to activate session')
    },
  })

  const resetForm = () => {
    setFormData({
      name: '',
      year: new Date().getFullYear(),
      date: '',
      description: '',
    })
  }

  const handleCreate = (e) => {
    e.preventDefault()
    createMutation.mutate(formData)
  }

  const getStatusBadge = (status) => {
    const variants = {
      'DRAFT': 'draft',
      'ACTIVE': 'active',
      'CLOSED': 'locked',
    }
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>
  }

  const getSubjectStatusBadge = (status) => {
    const variants = {
      'DRAFT': 'draft',
      'ACTIVE': 'active',
      'LOCKED': 'locked',
    }
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>
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
          <h1 className="text-3xl font-bold mb-2">Exam Planning</h1>
          <p className="text-text-secondary">
            Manage exam sessions and subjects
          </p>
        </div>
        {can('edit', 'planning') && (
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={18} className="mr-2" />
            New Session
          </Button>
        )}
      </div>

      {/* Sessions List */}
      {sessions?.length > 0 ? (
        <div className="space-y-4">
          {sessions.map((session) => (
            <Card key={session.id} className="overflow-hidden">
              {/* Session Header */}
              <div
                className="p-6 flex items-center justify-between cursor-pointer hover:bg-surface/50 transition-colors"
                onClick={() => setExpandedSession(
                  expandedSession === session.id ? null : session.id
                )}
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h2 className="text-xl font-semibold">{session.name}</h2>
                    {getStatusBadge(session.status)}
                  </div>
                  <div className="flex items-center space-x-6 text-sm text-text-secondary">
                    <span className="flex items-center">
                      <Calendar size={16} className="mr-1" />
                      {new Date(session.date).toLocaleDateString()}
                    </span>
                    <span className="flex items-center">
                      <Users size={16} className="mr-1" />
                      {session.candidates_count || 0} Candidates
                    </span>
                    <span className="flex items-center">
                      <FileText size={16} className="mr-1" />
                      {session.subjects?.length || 0} Subjects
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  {can('edit', 'planning') && session.status === 'DRAFT' && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          activateMutation.mutate(session.id)
                        }}
                        className="p-2 hover:bg-green-100 rounded-lg transition-colors text-success"
                        title="Activate Session"
                      >
                        <CheckCircle size={20} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedSession(session)
                          setShowDeleteModal(true)
                        }}
                        className="p-2 hover:bg-error/10 rounded-lg transition-colors text-error"
                        title="Delete Session"
                      >
                        <Trash2 size={20} />
                      </button>
                    </>
                  )}
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 hover:bg-surface rounded-lg transition-colors"
                  >
                    <Download size={20} className="text-text-secondary" />
                  </button>
                  {expandedSession === session.id ? (
                    <ChevronUp size={20} className="text-text-secondary" />
                  ) : (
                    <ChevronDown size={20} className="text-text-secondary" />
                  )}
                </div>
              </div>

              {/* Expanded Subjects */}
              <AnimatePresence>
                {expandedSession === session.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-surface"
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold">Subjects</h3>
                        {can('edit', 'planning') && session.status === 'DRAFT' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate(`/app/planning/subjects/new?session=${session.id}`)}
                          >
                            <Plus size={16} className="mr-1" />
                            Add Subject
                          </Button>
                        )}
                      </div>

                      {session.subjects?.length > 0 ? (
                        <div className="space-y-3">
                          {session.subjects.map((subject) => (
                            <div
                              key={subject.id}
                              className="flex items-center justify-between p-4 bg-surface/30 rounded-lg hover:bg-surface/50 transition-colors cursor-pointer"
                              onClick={() => navigate(`/app/planning/subjects/${subject.id}`)}
                            >
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-1">
                                  <span className="font-medium">{subject.name}</span>
                                  {getSubjectStatusBadge(subject.status)}
                                </div>
                                <div className="flex items-center space-x-4 text-sm text-text-secondary">
                                  <span>Coeff: {subject.coefficient}</span>
                                  <span>Max: {subject.max_score}</span>
                                  <span className="flex items-center">
                                    <Clock size={14} className="mr-1" />
                                    {subject.duration_minutes} min
                                  </span>
                                </div>
                              </div>
                              <Edit size={18} className="text-text-secondary" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-text-secondary py-4">
                          No subjects added yet
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No exam sessions"
          description="Create your first exam session to get started"
          action={
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              Create Session
            </Button>
          }
        />
      )}

      {/* Create Session Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          resetForm()
        }}
        title="Create Exam Session"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Session Name"
            placeholder="e.g., Doctorat 2024"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Year"
            type="number"
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
            required
          />
          <Input
            label="Date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
          <Input
            label="Description"
            placeholder="Optional description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowCreateModal(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={createMutation.isLoading}
            >
              Create Session
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Session"
      >
        <div className="space-y-4">
          <p>
            Are you sure you want to delete{' '}
            <span className="font-semibold">{selectedSession?.name}</span>?
            This will also delete all associated subjects and data.
          </p>
          <p className="text-sm text-error">
            This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteMutation.mutate(selectedSession.id)}
              isLoading={deleteMutation.isLoading}
            >
              Delete Session
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}

export default ExamPlanning