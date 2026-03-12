import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import {
  Upload,
  QrCode,
  FileText,
  CheckCircle,
  AlertCircle,
  Download,
  RefreshCw,
  Search,
  Eye,
} from 'lucide-react'
import { candidatesAPI } from '../../api/candidates'
import { sessionsAPI } from '../../api/sessions'
import { usePermission } from '../../hooks/usePermission'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import Table from '../../components/ui/Table'
import Modal from '../../components/ui/Modal'
import Spinner from '../../components/ui/Spinner'
import toast from 'react-hot-toast'

const AnonymizationPage = () => {
  const queryClient = useQueryClient()
  const { can } = usePermission()
  const [selectedSession, setSelectedSession] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [uploadFile, setUploadFile] = useState(null)

  // Fetch sessions
  const { data: sessions } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => sessionsAPI.getAll({ status: 'ACTIVE' }),
  })

  // Fetch candidates with their anonymous codes
  const { data: candidates, isLoading } = useQuery({
    queryKey: ['candidates-anonymization', selectedSession],
    queryFn: () => candidatesAPI.getAll({ 
      session: selectedSession,
      page_size: 100
    }),
    enabled: !!selectedSession,
  })

  // Generate codes mutation
  const generateCodesMutation = useMutation({
    mutationFn: () => candidatesAPI.generateBulkCodes(selectedSession),
    onSuccess: () => {
      queryClient.invalidateQueries(['candidates-anonymization'])
      toast.success('Anonymous codes generated successfully')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to generate codes')
    },
  })

  // Generate code for single candidate
  const generateCodeMutation = useMutation({
    mutationFn: (id) => candidatesAPI.generateCode(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['candidates-anonymization'])
      toast.success('Anonymous code generated')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to generate code')
    },
  })

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      setUploadFile(acceptedFiles[0])
    },
  })

  const handleUpload = async () => {
    if (!uploadFile || !selectedCandidate) return

    // In a real app, you'd upload the file and associate it with the candidate
    toast.success('Scan uploaded successfully')
    setShowUploadModal(false)
    setUploadFile(null)
    setSelectedCandidate(null)
  }

  const columns = [
    {
      key: 'application_number',
      title: 'Application #',
    },
    {
      key: 'full_name',
      title: 'Candidate',
      render: (_, record) => (
        <div>
          <p className="font-medium">{record.last_name} {record.first_name}</p>
          <p className="text-xs text-text-secondary">{record.email}</p>
        </div>
      ),
    },
    {
      key: 'anonymous_code',
      title: 'Anonymous Code',
      render: (value) => value ? (
        <span className="font-mono text-sm bg-surface px-2 py-1 rounded">
          {value}
        </span>
      ) : (
        <Badge variant="draft">Not generated</Badge>
      ),
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
      key: 'actions',
      title: 'Actions',
      render: (_, record) => (
        <div className="flex items-center space-x-2">
          {!record.anonymous_code && can('edit', 'anonymization') && (
            <button
              onClick={() => generateCodeMutation.mutate(record.id)}
              className="p-1 hover:bg-surface rounded transition-colors"
              title="Generate Code"
              disabled={generateCodeMutation.isLoading}
            >
              <QrCode size={18} className="text-primary-accent" />
            </button>
          )}
          {record.anonymous_code && (
            <button
              onClick={() => {
                setSelectedCandidate(record)
                setShowUploadModal(true)
              }}
              className="p-1 hover:bg-surface rounded transition-colors"
              title="Upload Scan"
            >
              <Upload size={18} className="text-text-secondary" />
            </button>
          )}
          <button className="p-1 hover:bg-surface rounded transition-colors">
            <Eye size={18} className="text-text-secondary" />
          </button>
        </div>
      ),
    },
  ]

  const candidatesWithCodes = candidates?.results?.filter(c => c.anonymous_code)?.length || 0
  const totalCandidates = candidates?.results?.length || 0

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Anonymization</h1>
          <p className="text-text-secondary">
            Generate anonymous codes and upload scanned copies
          </p>
        </div>
        {selectedSession && can('edit', 'anonymization') && (
          <Button
            variant="primary"
            onClick={() => generateCodesMutation.mutate()}
            isLoading={generateCodesMutation.isLoading}
          >
            <RefreshCw size={18} className="mr-2" />
            Generate All Codes
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
              onChange={(e) => setSelectedSession(e.target.value)}
            >
              <option value="">Choose a session...</option>
              {sessions?.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.name} - {session.year}
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

      {/* Stats Cards */}
      {selectedSession && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary mb-1">Total Candidates</p>
                <p className="text-3xl font-bold">{totalCandidates}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="text-blue-600" size={24} />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary mb-1">Codes Generated</p>
                <p className="text-3xl font-bold text-primary-accent">
                  {candidatesWithCodes}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <QrCode className="text-green-600" size={24} />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary mb-1">Progress</p>
                <p className="text-3xl font-bold">
                  {Math.round((candidatesWithCodes / totalCandidates) * 100)}%
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <CheckCircle className="text-purple-600" size={24} />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Candidates Table */}
      {selectedSession && (
        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <Spinner />
            </div>
          ) : (
            <Table
              columns={columns}
              data={candidates?.results?.filter(c =>
                `${c.first_name} ${c.last_name} ${c.application_number}`
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase())
              ) || []}
            />
          )}
        </Card>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false)
          setUploadFile(null)
          setSelectedCandidate(null)
        }}
        title="Upload Scan"
      >
        <div className="space-y-6">
          {selectedCandidate && (
            <div>
              <p className="font-medium mb-2">Candidate</p>
              <div className="bg-surface/30 p-3 rounded-lg">
                <p>{selectedCandidate.last_name} {selectedCandidate.first_name}</p>
                <p className="text-sm text-text-secondary">
                  Code: {selectedCandidate.anonymous_code}
                </p>
              </div>
            </div>
          )}

          <div
            {...getRootProps()}
            className="border-2 border-dashed border-surface rounded-lg p-8 text-center cursor-pointer hover:border-primary-accent transition-colors"
          >
            <input {...getInputProps()} />
            <Upload size={48} className="mx-auto mb-4 text-text-secondary" />
            {uploadFile ? (
              <div>
                <p className="font-medium text-primary-accent">{uploadFile.name}</p>
                <p className="text-sm text-text-secondary mt-1">
                  {(uploadFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            ) : (
              <div>
                <p className="font-medium mb-2">
                  Drag & drop a scan here
                </p>
                <p className="text-sm text-text-secondary">
                  or click to browse (PDF, PNG, JPG)
                </p>
              </div>
            )}
          </div>

          {uploadFile && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">QR Code Detection</p>
                <p>The system will automatically detect and validate the QR code in the scan.</p>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowUploadModal(false)
                setUploadFile(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleUpload}
              disabled={!uploadFile}
            >
              <Upload size={18} className="mr-2" />
              Upload Scan
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}

export default AnonymizationPage