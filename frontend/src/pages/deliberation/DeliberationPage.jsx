import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Award,
  Users,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Lock,
  FileText,
  ChevronRight,
} from 'lucide-react'
import { deliberationAPI } from '../../api/deliberation'
import { sessionsAPI } from '../../api/sessions'
import { usePermission } from '../../hooks/usePermission'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import toast from 'react-hot-toast'

const DeliberationPage = () => {
  const queryClient = useQueryClient()
  const { can, isJuryMember } = usePermission()
  const [selectedSession, setSelectedSession] = useState('')
  const [threshold, setThreshold] = useState(10)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [decisions, setDecisions] = useState({})
  const [isClosing, setIsClosing] = useState(false)

  // Fetch sessions
  const { data: sessions } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => sessionsAPI.getAll(),
  })

  // Fetch ranking
  const { data: ranking, isLoading } = useQuery({
    queryKey: ['ranking', selectedSession],
    queryFn: () => deliberationAPI.getRanking(selectedSession),
    enabled: !!selectedSession,
  })

  // Fetch results (if session closed)
  const { data: results } = useQuery({
    queryKey: ['results', selectedSession],
    queryFn: () => deliberationAPI.getResults(selectedSession),
    enabled: !!selectedSession,
  })

  // Close session mutation
  const closeMutation = useMutation({
    mutationFn: (data) => deliberationAPI.closeSession(selectedSession, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['ranking', selectedSession])
      queryClient.invalidateQueries(['results', selectedSession])
      toast.success('Deliberation completed successfully')
      setShowCloseModal(false)
      if (data.pv_id) {
        toast.success('PV report generated')
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to close session')
    },
  })

  const handleThresholdChange = (value) => {
    setThreshold(parseInt(value))
    // Auto-assign decisions based on threshold
    if (ranking) {
      const newDecisions = {}
      ranking.forEach((candidate, index) => {
        if (index < Math.ceil(ranking.length * 0.3)) {
          newDecisions[candidate.candidate_id] = 'ADMITTED'
        } else if (index < Math.ceil(ranking.length * 0.5)) {
          newDecisions[candidate.candidate_id] = 'WAITLIST'
        } else {
          newDecisions[candidate.candidate_id] = 'REJECTED'
        }
      })
      setDecisions(newDecisions)
    }
  }

  const handleDecisionChange = (candidateId, decision) => {
    setDecisions(prev => ({
      ...prev,
      [candidateId]: decision
    }))
  }

  const handleCloseSession = () => {
    const decisionsList = Object.entries(decisions).map(([candidateId, decision]) => ({
      candidate_id: parseInt(candidateId),
      final_score: ranking.find(r => r.candidate_id === parseInt(candidateId))?.final_score,
      decision,
      rank: ranking.findIndex(r => r.candidate_id === parseInt(candidateId)) + 1,
    }))
    closeMutation.mutate(decisionsList)
  }

  const selectedSessionData = sessions?.find(s => s.id === parseInt(selectedSession))
  const isClosed = selectedSessionData?.status === 'CLOSED'

  if (isLoading && selectedSession) {
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
          <h1 className="text-3xl font-bold mb-2">Deliberation</h1>
          <p className="text-text-secondary">
            Review rankings and make final decisions
          </p>
        </div>
        {selectedSession && !isClosed && isJuryMember && (
          <Button
            variant="primary"
            onClick={() => setShowCloseModal(true)}
          >
            <Lock size={18} className="mr-2" />
            Close Session
          </Button>
        )}
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
              onChange={(e) => {
                setSelectedSession(e.target.value)
                setDecisions({})
              }}
            >
              <option value="">Choose a session...</option>
              {sessions?.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.name} - {session.year} ({session.status})
                </option>
              ))}
            </select>
          </div>
          {isClosed && (
            <div className="flex-1">
              <Badge variant="locked">Session Closed</Badge>
            </div>
          )}
        </div>
      </Card>

      {selectedSession && !isClosed && ranking && (
        <>
          {/* Threshold Control */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 max-w-md">
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Admission Threshold: Top {threshold}%
                </label>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={threshold}
                  onChange={(e) => handleThresholdChange(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <p className="text-sm text-text-secondary">Admitted</p>
                  <p className="text-2xl font-bold text-success">
                    {Object.values(decisions).filter(d => d === 'ADMITTED').length}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-text-secondary">Waitlist</p>
                  <p className="text-2xl font-bold text-warning">
                    {Object.values(decisions).filter(d => d === 'WAITLIST').length}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-text-secondary">Rejected</p>
                  <p className="text-2xl font-bold text-error">
                    {Object.values(decisions).filter(d => d === 'REJECTED').length}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Ranking Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-surface">
                <thead className="bg-surface/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Anonymous Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Final Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Decision
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-surface">
                  {ranking.map((candidate, index) => (
                    <tr key={candidate.candidate_id} className="hover:bg-surface/30">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-bold text-lg">{index + 1}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono">
                        {candidate.anonymous_code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-bold text-primary-accent">
                          {candidate.final_score}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          className="input text-sm py-1"
                          value={decisions[candidate.candidate_id] || ''}
                          onChange={(e) => handleDecisionChange(candidate.candidate_id, e.target.value)}
                        >
                          <option value="">Select...</option>
                          <option value="ADMITTED">Admitted</option>
                          <option value="WAITLIST">Waitlist</option>
                          <option value="REJECTED">Rejected</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`/app/correction/copy/${candidate.candidate_id}`, '_blank')}
                        >
                          <FileText size={16} className="mr-1" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {selectedSession && isClosed && results && (
        <Card className="overflow-hidden">
          <div className="p-6 border-b border-surface">
            <h2 className="text-xl font-semibold">Final Results</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-surface">
              <thead className="bg-surface/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Candidate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Application #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Final Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Decision
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-surface">
                {results.map((result) => (
                  <tr key={result.candidate_id} className="hover:bg-surface/30">
                    <td className="px-6 py-4 whitespace-nowrap font-bold">
                      {result.rank}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {result.candidate_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono">
                      {result.application_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-primary-accent">
                      {result.final_score}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={result.decision.toLowerCase()}>
                        {result.decision}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {!selectedSession && (
        <EmptyState
          title="Select a session"
          description="Choose an exam session to start deliberation"
          icon={Award}
        />
      )}

      {/* Close Session Confirmation Modal */}
      <Modal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        title="Close Deliberation Session"
      >
        <div className="space-y-4">
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="text-warning flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-medium text-warning mb-1">Warning</p>
              <p className="text-sm text-text-secondary">
                Closing the session will finalize all decisions and generate the PV report.
                This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="bg-surface/30 p-4 rounded-lg">
            <h4 className="font-medium mb-3">Summary</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-text-secondary">Admitted:</span>
                <span className="font-bold text-success">
                  {Object.values(decisions).filter(d => d === 'ADMITTED').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Waitlist:</span>
                <span className="font-bold text-warning">
                  {Object.values(decisions).filter(d => d === 'WAITLIST').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Rejected:</span>
                <span className="font-bold text-error">
                  {Object.values(decisions).filter(d => d === 'REJECTED').length}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowCloseModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCloseSession}
              isLoading={closeMutation.isLoading}
            >
              <Lock size={18} className="mr-2" />
              Close Session
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}

export default DeliberationPage