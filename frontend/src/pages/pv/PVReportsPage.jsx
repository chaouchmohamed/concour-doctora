import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  FileText,
  Download,
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  Award,
} from 'lucide-react'
import { pvAPI } from '../../api/pv'
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

const PVReportsPage = () => {
  const queryClient = useQueryClient()
  const { can, isJuryMember } = usePermission()
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [selectedSession, setSelectedSession] = useState('')
  const [pvTitle, setPvTitle] = useState('')

  // Fetch PV reports
  const { data: pvReports, isLoading } = useQuery({
    queryKey: ['pv-reports'],
    queryFn: () => pvAPI.getAll(),
  })

  // Fetch sessions for generation
  const { data: sessions } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => sessionsAPI.getAll(),
  })

  // Generate PV mutation
  const generateMutation = useMutation({
    mutationFn: ({ sessionId, title }) => pvAPI.generate(sessionId, title),
    onSuccess: () => {
      queryClient.invalidateQueries(['pv-reports'])
      toast.success('PV report generated successfully')
      setShowGenerateModal(false)
      resetForm()
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to generate PV')
    },
  })

  // Sign PV mutation
  const signMutation = useMutation({
    mutationFn: (id) => pvAPI.sign(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['pv-reports'])
      toast.success('PV signed successfully')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to sign PV')
    },
  })

  const resetForm = () => {
    setSelectedSession('')
    setPvTitle('')
  }

  const handleGenerate = (e) => {
    e.preventDefault()
    if (!selectedSession) {
      toast.error('Please select a session')
      return
    }
    generateMutation.mutate({
      sessionId: selectedSession,
      title: pvTitle || undefined,
    })
  }

  const handleDownload = async (id, filename) => {
    try {
      const blob = await pvAPI.download(id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
    } catch (error) {
      toast.error('Failed to download PV')
    }
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
          <h1 className="text-3xl font-bold mb-2">PV Reports</h1>
          <p className="text-text-secondary">
            Generate and manage deliberation reports
          </p>
        </div>
        {can('generate', 'pv') && (
          <Button variant="primary" onClick={() => setShowGenerateModal(true)}>
            <Plus size={18} className="mr-2" />
            Generate PV
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary mb-1">Total Reports</p>
              <p className="text-3xl font-bold">{pvReports?.length || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="text-blue-600" size={24} />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary mb-1">Signed</p>
              <p className="text-3xl font-bold text-success">
                {pvReports?.filter(r => r.signed).length || 0}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="text-green-600" size={24} />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary mb-1">Pending</p>
              <p className="text-3xl font-bold text-warning">
                {pvReports?.filter(r => !r.signed).length || 0}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <XCircle className="text-yellow-600" size={24} />
            </div>
          </div>
        </Card>
      </div>

      {/* PV Reports List */}
      {pvReports?.length > 0 ? (
        <div className="space-y-4">
          {pvReports.map((pv) => (
            <Card key={pv.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold">{pv.title}</h3>
                    {pv.signed ? (
                      <Badge variant="success">Signed</Badge>
                    ) : (
                      <Badge variant="warning">Pending</Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="flex items-center space-x-2 text-sm">
                      <Calendar size={16} className="text-text-secondary" />
                      <span>{new Date(pv.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <User size={16} className="text-text-secondary" />
                      <span>By: {pv.created_by_name}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Award size={16} className="text-text-secondary" />
                      <span>Session: {pv.session_name}</span>
                    </div>
                  </div>

                  {pv.signers?.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Signers:</p>
                      <div className="flex flex-wrap gap-2">
                        {pv.signers.map((signer, index) => (
                          <Badge key={index} variant="info">
                            {signer.name} ({signer.role})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {!pv.signed && isJuryMember && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => signMutation.mutate(pv.id)}
                      isLoading={signMutation.isLoading}
                    >
                      <CheckCircle size={16} className="mr-1" />
                      Sign
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(pv.id, `${pv.title}.pdf`)}
                  >
                    <Download size={16} className="mr-1" />
                    Download
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(pv.pdf_file, '_blank')}
                  >
                    <Eye size={16} className="mr-1" />
                    View
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No PV reports"
          description="Generate your first PV report from a closed deliberation session"
          icon={FileText}
          action={
            <Button variant="primary" onClick={() => setShowGenerateModal(true)}>
              Generate PV
            </Button>
          }
        />
      )}

      {/* Generate PV Modal */}
      <Modal
        isOpen={showGenerateModal}
        onClose={() => {
          setShowGenerateModal(false)
          resetForm()
        }}
        title="Generate PV Report"
      >
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Select Session
            </label>
            <select
              className="input"
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              required
            >
              <option value="">Choose a session...</option>
              {sessions?.filter(s => s.status === 'CLOSED').map((session) => (
                <option key={session.id} value={session.id}>
                  {session.name} - {session.year}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Report Title (Optional)"
            value={pvTitle}
            onChange={(e) => setPvTitle(e.target.value)}
            placeholder="e.g., PV_Deliberation_2024"
          />

          <div className="bg-info/10 border border-info/20 rounded-lg p-4">
            <p className="text-sm text-info">
              The PV report will include the final rankings, decisions, and will be
              formatted according to ESI-SBA standards.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowGenerateModal(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={generateMutation.isLoading}
            >
              <FileText size={18} className="mr-2" />
              Generate PV
            </Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  )
}

export default PVReportsPage