import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  UserPlus,
  Save,
  Eye,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { discrepanciesAPI } from '../../api/discrepancies'
import { usersAPI } from '../../api/users'
import { usePermission } from '../../hooks/usePermission'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import toast from 'react-hot-toast'

const DiscrepanciesPage = () => {
  const queryClient = useQueryClient()
  const { can } = usePermission()
  const [expandedRow, setExpandedRow] = useState(null)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showResolveModal, setShowResolveModal] = useState(false)
  const [selectedDiscrepancy, setSelectedDiscrepancy] = useState(null)
  const [selectedCorrector, setSelectedCorrector] = useState('')
  const [finalGrade, setFinalGrade] = useState('')
  const [coordinatorNote, setCoordinatorNote] = useState('')

  // Fetch discrepancies
  const { data: discrepancies, isLoading } = useQuery({
    queryKey: ['discrepancies'],
    queryFn: () => discrepanciesAPI.getAll(),
  })

  // Fetch correctors for assignment
  const { data: correctors } = useQuery({
    queryKey: ['users', { role: 'CORRECTOR' }],
    queryFn: () => usersAPI.getAll({ role: 'CORRECTOR' }),
  })

  // Assign third corrector mutation
  const assignMutation = useMutation({
    mutationFn: ({ id, correctorId }) => 
      discrepanciesAPI.assignThird(id, correctorId),
    onSuccess: () => {
      queryClient.invalidateQueries(['discrepancies'])
      toast.success('Third corrector assigned successfully')
      setShowAssignModal(false)
      setSelectedCorrector('')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to assign corrector')
    },
  })

  // Resolve discrepancy mutation
  const resolveMutation = useMutation({
    mutationFn: ({ id, grade, note }) => 
      discrepanciesAPI.resolve(id, grade, note),
    onSuccess: () => {
      queryClient.invalidateQueries(['discrepancies'])
      toast.success('Discrepancy resolved successfully')
      setShowResolveModal(false)
      setFinalGrade('')
      setCoordinatorNote('')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to resolve discrepancy')
    },
  })

  const handleAssign = () => {
    if (!selectedCorrector) {
      toast.error('Please select a corrector')
      return
    }
    assignMutation.mutate({
      id: selectedDiscrepancy.id,
      correctorId: selectedCorrector,
    })
  }

  const handleResolve = () => {
    if (!finalGrade) {
      toast.error('Please enter final grade')
      return
    }
    resolveMutation.mutate({
      id: selectedDiscrepancy.id,
      grade: parseFloat(finalGrade),
      note: coordinatorNote,
    })
  }

  const getSeverityBadge = (difference) => {
    if (difference > 5) return <Badge variant="error">High</Badge>
    if (difference > 3) return <Badge variant="warning">Medium</Badge>
    return <Badge variant="info">Low</Badge>
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
      <div>
        <h1 className="text-3xl font-bold mb-2">Discrepancies</h1>
        <p className="text-text-secondary">
          Review and resolve grading discrepancies
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary mb-1">Total Discrepancies</p>
              <p className="text-3xl font-bold">{discrepancies?.length || 0}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary mb-1">Pending</p>
              <p className="text-3xl font-bold text-warning">
                {discrepancies?.filter(d => !d.resolved).length || 0}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <XCircle className="text-yellow-600" size={24} />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary mb-1">Resolved</p>
              <p className="text-3xl font-bold text-success">
                {discrepancies?.filter(d => d.resolved).length || 0}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="text-green-600" size={24} />
            </div>
          </div>
        </Card>
      </div>

      {/* Discrepancies List */}
      {discrepancies?.length > 0 ? (
        <div className="space-y-4">
          {discrepancies.map((discrepancy) => (
            <Card key={discrepancy.id} className="overflow-hidden">
              {/* Header */}
              <div
                className="p-6 flex items-center justify-between cursor-pointer hover:bg-surface/50 transition-colors"
                onClick={() => setExpandedRow(
                  expandedRow === discrepancy.id ? null : discrepancy.id
                )}
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold">
                      Copy #{discrepancy.copy_anonymous_code}
                    </h3>
                    {getSeverityBadge(discrepancy.difference)}
                    {discrepancy.resolved ? (
                      <Badge variant="success">Resolved</Badge>
                    ) : (
                      <Badge variant="warning">Pending</Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-6 text-sm text-text-secondary">
                    <span>Subject: {discrepancy.subject_name}</span>
                    <span>Difference: {discrepancy.difference} points</span>
                    <span>Created: {new Date(discrepancy.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                {expandedRow === discrepancy.id ? (
                  <ChevronUp size={20} className="text-text-secondary" />
                ) : (
                  <ChevronDown size={20} className="text-text-secondary" />
                )}
              </div>

              {/* Expanded Details */}
              {expandedRow === discrepancy.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="border-t border-surface p-6"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Grades */}
                    <div>
                      <h4 className="font-medium mb-4">Grades</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-surface/30 rounded-lg">
                          <span>First Corrector</span>
                          <span className="font-mono font-bold text-lg">
                            {discrepancy.grade1}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-surface/30 rounded-lg">
                          <span>Second Corrector</span>
                          <span className="font-mono font-bold text-lg">
                            {discrepancy.grade2}
                          </span>
                        </div>
                        {discrepancy.third_grade && (
                          <div className="flex items-center justify-between p-3 bg-primary-accent/10 rounded-lg">
                            <span className="font-medium">Third Corrector</span>
                            <span className="font-mono font-bold text-lg text-primary-accent">
                              {discrepancy.third_grade}
                            </span>
                          </div>
                        )}
                        {discrepancy.final_grade && (
                          <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg">
                            <span className="font-medium">Final Grade</span>
                            <span className="font-mono font-bold text-lg text-success">
                              {discrepancy.final_grade}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div>
                      <h4 className="font-medium mb-4">Actions</h4>
                      <div className="space-y-3">
                        {!discrepancy.resolved && !discrepancy.third_corrector && (
                          <Button
                            variant="secondary"
                            className="w-full"
                            onClick={() => {
                              setSelectedDiscrepancy(discrepancy)
                              setShowAssignModal(true)
                            }}
                          >
                            <UserPlus size={18} className="mr-2" />
                            Assign Third Corrector
                          </Button>
                        )}

                        {discrepancy.third_corrector && !discrepancy.resolved && (
                          <Button
                            variant="primary"
                            className="w-full"
                            onClick={() => {
                              setSelectedDiscrepancy(discrepancy)
                              setShowResolveModal(true)
                            }}
                          >
                            <CheckCircle size={18} className="mr-2" />
                            Resolve Discrepancy
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          className="w-full"
                          onClick={() => window.open(`/app/correction/copy/${discrepancy.copy}`, '_blank')}
                        >
                          <Eye size={18} className="mr-2" />
                          View Copy
                        </Button>
                      </div>

                      {discrepancy.coordinator_note && (
                        <div className="mt-4 p-3 bg-surface/30 rounded-lg">
                          <p className="text-sm font-medium mb-1">Coordinator Note:</p>
                          <p className="text-sm text-text-secondary">
                            {discrepancy.coordinator_note}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No discrepancies found"
          description="All corrections are within the threshold"
          icon={CheckCircle}
        />
      )}

      {/* Assign Third Corrector Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false)
          setSelectedCorrector('')
        }}
        title="Assign Third Corrector"
      >
        <div className="space-y-4">
          <p className="text-text-secondary">
            Select a corrector to perform the third correction for copy{' '}
            <span className="font-mono font-bold">
              {selectedDiscrepancy?.copy_anonymous_code}
            </span>
          </p>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Select Corrector
            </label>
            <select
              className="input"
              value={selectedCorrector}
              onChange={(e) => setSelectedCorrector(e.target.value)}
            >
              <option value="">Choose a corrector...</option>
              {correctors?.map((corrector) => (
                <option key={corrector.id} value={corrector.id}>
                  {corrector.first_name} {corrector.last_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setShowAssignModal(false)
                setSelectedCorrector('')
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAssign}
              isLoading={assignMutation.isLoading}
            >
              Assign Corrector
            </Button>
          </div>
        </div>
      </Modal>

      {/* Resolve Discrepancy Modal */}
      <Modal
        isOpen={showResolveModal}
        onClose={() => {
          setShowResolveModal(false)
          setFinalGrade('')
          setCoordinatorNote('')
        }}
        title="Resolve Discrepancy"
      >
        <div className="space-y-4">
          <div className="bg-surface/30 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4 mb-2">
              <div>
                <p className="text-sm text-text-secondary">First Grade</p>
                <p className="text-xl font-bold">{selectedDiscrepancy?.grade1}</p>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Second Grade</p>
                <p className="text-xl font-bold">{selectedDiscrepancy?.grade2}</p>
              </div>
            </div>
            {selectedDiscrepancy?.third_grade && (
              <div className="mt-2 pt-2 border-t border-surface">
                <p className="text-sm text-text-secondary">Third Grade</p>
                <p className="text-xl font-bold text-primary-accent">
                  {selectedDiscrepancy?.third_grade}
                </p>
              </div>
            )}
          </div>

          <Input
            label="Final Grade"
            type="number"
            step="0.25"
            value={finalGrade}
            onChange={(e) => setFinalGrade(e.target.value)}
            placeholder="Enter final grade"
            required
          />

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Coordinator Note (Optional)
            </label>
            <textarea
              className="input min-h-[100px]"
              value={coordinatorNote}
              onChange={(e) => setCoordinatorNote(e.target.value)}
              placeholder="Add any notes about the resolution..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setShowResolveModal(false)
                setFinalGrade('')
                setCoordinatorNote('')
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleResolve}
              isLoading={resolveMutation.isLoading}
            >
              <Save size={18} className="mr-2" />
              Resolve
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}

export default DiscrepanciesPage