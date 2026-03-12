import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Save,
  Clock,
  Calendar,
  Users,
  CheckCircle,
  Lock,
} from 'lucide-react'
import { subjectsAPI } from '../../api/subjects'
import { sessionsAPI } from '../../api/sessions'
import { roomsAPI } from '../../api/rooms'
import { usePermission } from '../../hooks/usePermission'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import toast from 'react-hot-toast'

const SubjectEditor = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const { can } = usePermission()
  const isNew = id === 'new'
  const sessionId = searchParams.get('session')

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm()

  // Fetch subject if editing
  const { data: subject, isLoading: subjectLoading } = useQuery({
    queryKey: ['subject', id],
    queryFn: () => subjectsAPI.getById(id),
    enabled: !isNew,
  })

  // Fetch sessions for dropdown
  const { data: sessions } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => sessionsAPI.getAll(),
  })

  // Fetch rooms
  const { data: rooms } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => roomsAPI.getAll(),
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data) => subjectsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['subjects'])
      toast.success('Subject created successfully')
      navigate('/app/planning')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to create subject')
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data) => subjectsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['subject', id])
      queryClient.invalidateQueries(['subjects'])
      toast.success('Subject updated successfully')
      navigate('/app/planning')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update subject')
    },
  })

  // Activate mutation
  const activateMutation = useMutation({
    mutationFn: () => subjectsAPI.activate(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['subject', id])
      toast.success('Subject activated successfully')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to activate subject')
    },
  })

  // Lock mutation
  const lockMutation = useMutation({
    mutationFn: () => subjectsAPI.lock(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['subject', id])
      toast.success('Subject locked successfully')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to lock subject')
    },
  })

  useEffect(() => {
    if (subject) {
      reset(subject)
    } else if (isNew && sessionId) {
      reset({ exam_session: sessionId })
    }
  }, [subject, isNew, sessionId, reset])

  const onSubmit = (data) => {
    if (isNew) {
      createMutation.mutate(data)
    } else {
      updateMutation.mutate(data)
    }
  }

  const status = watch('status')

  if (subjectLoading) {
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/app/planning')}
            className="p-2 hover:bg-surface rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {isNew ? 'Create Subject' : 'Edit Subject'}
            </h1>
            <p className="text-text-secondary">
              {isNew ? 'Add a new subject to exam session' : 'Modify subject details'}
            </p>
          </div>
          {!isNew && (
            <Badge variant={status?.toLowerCase() || 'draft'}>
              {status}
            </Badge>
          )}
        </div>

        {!isNew && can('edit', 'planning') && status === 'DRAFT' && (
          <div className="flex space-x-3">
            <Button
              variant="secondary"
              onClick={() => activateMutation.mutate()}
              isLoading={activateMutation.isLoading}
            >
              <CheckCircle size={18} className="mr-2" />
              Activate
            </Button>
          </div>
        )}

        {!isNew && can('edit', 'planning') && status === 'ACTIVE' && (
          <Button
            variant="secondary"
            onClick={() => lockMutation.mutate()}
            isLoading={lockMutation.isLoading}
          >
            <Lock size={18} className="mr-2" />
            Lock
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="p-6 border-b border-surface">
                <h2 className="text-xl font-semibold">Subject Information</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Subject Name"
                    {...register('name', { required: 'Subject name is required' })}
                    error={errors.name?.message}
                    disabled={!isNew && status !== 'DRAFT'}
                  />
                  <Input
                    label="Subject Code"
                    {...register('code', { required: 'Subject code is required' })}
                    error={errors.code?.message}
                    disabled={!isNew && status !== 'DRAFT'}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Coefficient"
                    type="number"
                    step="0.01"
                    {...register('coefficient', {
                      required: 'Coefficient is required',
                      min: { value: 0, message: 'Must be positive' },
                    })}
                    error={errors.coefficient?.message}
                    disabled={!isNew && status !== 'DRAFT'}
                  />
                  <Input
                    label="Max Score"
                    type="number"
                    step="0.01"
                    {...register('max_score', {
                      required: 'Max score is required',
                      min: { value: 0, message: 'Must be positive' },
                    })}
                    error={errors.max_score?.message}
                    disabled={!isNew && status !== 'DRAFT'}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Discrepancy Threshold"
                    type="number"
                    step="0.1"
                    {...register('discrepancy_threshold', {
                      required: 'Threshold is required',
                      min: { value: 0, message: 'Must be positive' },
                    })}
                    error={errors.discrepancy_threshold?.message}
                    disabled={!isNew && status !== 'DRAFT'}
                  />
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Grading Rule
                    </label>
                    <select
                      className="input"
                      {...register('final_grade_rule', { required: 'Grading rule is required' })}
                      disabled={!isNew && status !== 'DRAFT'}
                    >
                      <option value="AVERAGE">Average</option>
                      <option value="MEDIAN">Median</option>
                      <option value="THIRD">Third Corrector</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Exam Session
                  </label>
                  <select
                    className="input"
                    {...register('exam_session', { required: 'Exam session is required' })}
                    disabled={!isNew || !can('edit', 'planning')}
                  >
                    <option value="">Select session...</option>
                    {sessions?.map((session) => (
                      <option key={session.id} value={session.id}>
                        {session.name} - {session.year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-6 border-t border-surface">
                <h2 className="text-xl font-semibold mb-4">Schedule</h2>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Scheduled Date"
                    type="date"
                    {...register('scheduled_date')}
                    disabled={!isNew && status !== 'DRAFT'}
                  />
                  <Input
                    label="Start Time"
                    type="time"
                    {...register('start_time')}
                    disabled={!isNew && status !== 'DRAFT'}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <Input
                    label="Duration (minutes)"
                    type="number"
                    {...register('duration_minutes')}
                    disabled={!isNew && status !== 'DRAFT'}
                  />
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Room
                    </label>
                    <select
                      className="input"
                      {...register('room')}
                      disabled={!isNew && status !== 'DRAFT'}
                    >
                      <option value="">Select room...</option>
                      {rooms?.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.name} (Capacity: {room.capacity})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {(isNew || status === 'DRAFT') && can('edit', 'planning') && (
                <div className="p-6 border-t border-surface flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => navigate('/app/planning')}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={createMutation.isLoading || updateMutation.isLoading}
                  >
                    <Save size={18} className="mr-2" />
                    {isNew ? 'Create Subject' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </form>
          </Card>
        </div>

        {/* Right Column - Info */}
        <div className="space-y-6">
          <Card>
            <div className="p-6 border-b border-surface">
              <h2 className="text-xl font-semibold">Status Guide</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start space-x-3">
                <Badge variant="draft">DRAFT</Badge>
                <p className="text-sm text-text-secondary">
                  Subject can be edited, no corrections started
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <Badge variant="active">ACTIVE</Badge>
                <p className="text-sm text-text-secondary">
                  Corrections in progress, no further edits allowed
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <Badge variant="locked">LOCKED</Badge>
                <p className="text-sm text-text-secondary">
                  Corrections complete, ready for deliberation
                </p>
              </div>
            </div>
          </Card>

          {!isNew && (
            <Card>
              <div className="p-6 border-b border-surface">
                <h2 className="text-xl font-semibold">Statistics</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Copies Uploaded</span>
                  <span className="font-semibold">24</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Corrections Completed</span>
                  <span className="font-semibold">18</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Discrepancies</span>
                  <span className="font-semibold">3</span>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default SubjectEditor