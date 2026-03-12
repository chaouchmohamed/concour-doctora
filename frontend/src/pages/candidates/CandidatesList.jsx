import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  QrCode,
  Mail,
  MoreVertical,
} from 'lucide-react'
import { candidatesAPI } from '../../api/candidates'
import { sessionsAPI } from '../../api/sessions'
import { usePermission } from '../../hooks/usePermission'
import Table from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import toast from 'react-hot-toast'

const CandidatesList = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { can } = usePermission()
  const [search, setSearch] = useState('')
  const [selectedSession, setSelectedSession] = useState('')
  const [page, setPage] = useState(0)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [showGenerateCodeModal, setShowGenerateCodeModal] = useState(false)

  // Fetch candidates
  const { data: candidatesData, isLoading } = useQuery({
    queryKey: ['candidates', { search, session: selectedSession, page }],
    queryFn: () => candidatesAPI.getAll({ 
      search, 
      session: selectedSession,
      page: page + 1,
      page_size: 10
    }),
  })

  // Fetch sessions for filter
  const { data: sessions } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => sessionsAPI.getAll({ status: 'ACTIVE' }),
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => candidatesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['candidates'])
      toast.success('Candidate deleted successfully')
      setShowDeleteModal(false)
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete candidate')
    },
  })

  // Generate code mutation
  const generateCodeMutation = useMutation({
    mutationFn: (id) => candidatesAPI.generateCode(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['candidates'])
      toast.success('Anonymous code generated successfully')
      setShowGenerateCodeModal(false)
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to generate code')
    },
  })

  const columns = [
    {
      key: 'application_number',
      title: 'Application #',
      render: (value) => <span className="font-mono text-sm">{value}</span>,
    },
    {
      key: 'full_name',
      title: 'Full Name',
      render: (_, record) => (
        <div>
          <p className="font-medium">{record.last_name} {record.first_name}</p>
          <p className="text-xs text-text-secondary">{record.email}</p>
        </div>
      ),
    },
    {
      key: 'national_id',
      title: 'National ID',
      render: (value) => <span className="font-mono text-sm">{value}</span>,
    },
    {
      key: 'phone',
      title: 'Phone',
    },
    {
      key: 'status',
      title: 'Status',
      render: (value) => {
        const variant = {
          'REGISTERED': 'registered',
          'PRESENT': 'present',
          'ELIMINATED': 'eliminated',
        }[value] || 'default'
        return <Badge variant={variant}>{value}</Badge>
      },
    },
    {
      key: 'anonymous_code',
      title: 'Anonymous Code',
      render: (value) => value ? (
        <span className="font-mono text-sm bg-surface px-2 py-1 rounded">{value}</span>
      ) : (
        <span className="text-text-secondary text-sm">Not generated</span>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, record) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate(`/app/candidates/${record.id}`)}
            className="p-1 hover:bg-surface rounded transition-colors"
            title="View Details"
          >
            <Eye size={18} className="text-text-secondary" />
          </button>
          {can('edit', 'candidates') && (
            <>
              <button
                onClick={() => navigate(`/app/candidates/${record.id}?edit=true`)}
                className="p-1 hover:bg-surface rounded transition-colors"
                title="Edit"
              >
                <Edit size={18} className="text-text-secondary" />
              </button>
              {!record.anonymous_code && (
                <button
                  onClick={() => {
                    setSelectedCandidate(record)
                    setShowGenerateCodeModal(true)
                  }}
                  className="p-1 hover:bg-surface rounded transition-colors"
                  title="Generate Anonymous Code"
                >
                  <QrCode size={18} className="text-text-secondary" />
                </button>
              )}
              <button
                onClick={() => {
                  setSelectedCandidate(record)
                  setShowDeleteModal(true)
                }}
                className="p-1 hover:bg-surface rounded transition-colors"
                title="Delete"
              >
                <Trash2 size={18} className="text-error" />
              </button>
            </>
          )}
          <button className="p-1 hover:bg-surface rounded transition-colors">
            <MoreVertical size={18} className="text-text-secondary" />
          </button>
        </div>
      ),
    },
  ]

  const handleExport = async () => {
    try {
      const blob = await candidatesAPI.exportCSV({ session: selectedSession })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `candidates_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      toast.success('Export started successfully')
    } catch (error) {
      toast.error('Failed to export candidates')
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
          <h1 className="text-3xl font-bold mb-2">Candidates</h1>
          <p className="text-text-secondary">
            Manage all doctoral candidates
          </p>
        </div>
        <div className="flex space-x-3">
          {can('export', 'candidates') && (
            <Button variant="secondary" onClick={handleExport}>
              <Download size={18} className="mr-2" />
              Export
            </Button>
          )}
          {can('import', 'candidates') && (
            <Button variant="secondary" onClick={() => navigate('/app/candidates/import')}>
              <Upload size={18} className="mr-2" />
              Import
            </Button>
          )}
          {can('edit', 'candidates') && (
            <Button variant="primary" onClick={() => navigate('/app/candidates/new')}>
              <Plus size={18} className="mr-2" />
              Add Candidate
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search by name, email, or application #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={Search}
            />
          </div>
          <div className="w-64">
            <select
              className="input"
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
            >
              <option value="">All Sessions</option>
              {sessions?.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.name} - {session.year}
                </option>
              ))}
            </select>
          </div>
          <Button variant="ghost" onClick={() => {
            setSearch('')
            setSelectedSession('')
          }}>
            Clear Filters
          </Button>
        </div>
      </Card>

      {/* Table */}
      {candidatesData?.results?.length > 0 ? (
        <Card className="overflow-hidden">
          <Table
            columns={columns}
            data={candidatesData.results}
            pagination={{
              page,
              pageSize: 10,
              total: candidatesData.count,
              totalPages: Math.ceil(candidatesData.count / 10),
            }}
            onPageChange={setPage}
            onRowClick={(record) => navigate(`/app/candidates/${record.id}`)}
          />
        </Card>
      ) : (
        <EmptyState
          title="No candidates found"
          description="Get started by importing candidates or creating a new one."
          action={
            <Button variant="primary" onClick={() => navigate('/app/candidates/import')}>
              Import Candidates
            </Button>
          }
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Candidate"
      >
        <div className="space-y-4">
          <p>
            Are you sure you want to delete{' '}
            <span className="font-semibold">
              {selectedCandidate?.first_name} {selectedCandidate?.last_name}
            </span>
            ? This action cannot be undone.
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
              onClick={() => deleteMutation.mutate(selectedCandidate.id)}
              isLoading={deleteMutation.isLoading}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Generate Code Modal */}
      <Modal
        isOpen={showGenerateCodeModal}
        onClose={() => setShowGenerateCodeModal(false)}
        title="Generate Anonymous Code"
      >
        <div className="space-y-4">
          <p>
            Generate anonymous code for{' '}
            <span className="font-semibold">
              {selectedCandidate?.first_name} {selectedCandidate?.last_name}
            </span>
          </p>
          <p className="text-sm text-text-secondary">
            This will create a unique code for blind correction. The candidate's identity
            will be hidden from correctors.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() => setShowGenerateCodeModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => generateCodeMutation.mutate(selectedCandidate.id)}
              isLoading={generateCodeMutation.isLoading}
            >
              Generate Code
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}

export default CandidatesList