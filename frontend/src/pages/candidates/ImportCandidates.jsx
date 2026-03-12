import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Upload,
  Download,
  AlertCircle,
  CheckCircle,
  XCircle,
  FileText,
  Info,
} from 'lucide-react'
import { candidatesAPI } from '../../api/candidates'
import { sessionsAPI } from '../../api/sessions'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import toast from 'react-hot-toast'

const ImportCandidates = () => {
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [selectedSession, setSelectedSession] = useState('')
  const [importResult, setImportResult] = useState(null)
  const [isUploading, setIsUploading] = useState(false)

  // Fetch sessions
  const { data: sessions } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => sessionsAPI.getAll({ status: 'ACTIVE' }),
  })

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      setFile(acceptedFiles[0])
      setImportResult(null)
    },
  })

  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a file')
      return
    }

    if (!selectedSession) {
      toast.error('Please select an exam session')
      return
    }

    setIsUploading(true)
    try {
      const result = await candidatesAPI.importCSV(file, selectedSession)
      setImportResult(result)
      if (result.created > 0) {
        toast.success(`Successfully imported ${result.created} candidates`)
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Import failed')
    } finally {
      setIsUploading(false)
    }
  }

  const downloadTemplate = () => {
    const template = `first_name,last_name,national_id,email,phone,date_of_birth,place_of_birth,address
John,Doe,123456789012345678,john.doe@email.com,0555123456,1995-01-01,Algiers,123 Main St
Jane,Smith,987654321098765432,jane.smith@email.com,0555789012,1996-02-15,Oran,456 Oak Ave`

    const blob = new Blob([template], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'candidates_template.csv'
    a.click()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/app/candidates')}
          className="p-2 hover:bg-surface rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-bold mb-2">Import Candidates</h1>
          <p className="text-text-secondary">
            Bulk import candidates from CSV file
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Import Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="p-6 border-b border-surface">
              <h2 className="text-xl font-semibold">Upload CSV File</h2>
            </div>
            <div className="p-6 space-y-6">
              {/* Session Selection */}
              <div>
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

              {/* Dropzone */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-primary-accent bg-primary-accent/5'
                    : 'border-surface hover:border-primary-accent'
                }`}
              >
                <input {...getInputProps()} />
                <Upload
                  size={48}
                  className={`mx-auto mb-4 ${
                    isDragActive ? 'text-primary-accent' : 'text-text-secondary'
                  }`}
                />
                {file ? (
                  <div>
                    <p className="font-medium text-primary-accent">{file.name}</p>
                    <p className="text-sm text-text-secondary mt-1">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium mb-2">
                      {isDragActive
                        ? 'Drop the file here'
                        : 'Drag & drop a CSV file here'}
                    </p>
                    <p className="text-sm text-text-secondary">
                      or click to browse
                    </p>
                  </div>
                )}
              </div>

              {/* Import Button */}
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  onClick={handleImport}
                  isLoading={isUploading}
                  disabled={!file || !selectedSession}
                >
                  <Upload size={18} className="mr-2" />
                  Start Import
                </Button>
              </div>
            </div>
          </Card>

          {/* Import Results */}
          {importResult && (
            <Card>
              <div className="p-6 border-b border-surface">
                <h2 className="text-xl font-semibold">Import Results</h2>
              </div>
              <div className="p-6">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="flex-1 p-4 bg-success/10 rounded-lg text-center">
                    <CheckCircle className="mx-auto mb-2 text-success" size={32} />
                    <p className="text-2xl font-bold text-success">
                      {importResult.created}
                    </p>
                    <p className="text-sm text-text-secondary">Created</p>
                  </div>
                  <div className="flex-1 p-4 bg-error/10 rounded-lg text-center">
                    <XCircle className="mx-auto mb-2 text-error" size={32} />
                    <p className="text-2xl font-bold text-error">
                      {importResult.errors?.length || 0}
                    </p>
                    <p className="text-sm text-text-secondary">Errors</p>
                  </div>
                </div>

                {importResult.errors?.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-3 flex items-center">
                      <AlertCircle size={16} className="mr-2 text-error" />
                      Error Details
                    </h3>
                    <div className="bg-error/5 rounded-lg p-4 max-h-60 overflow-y-auto">
                      {importResult.errors.map((error, index) => (
                        <p key={index} className="text-sm text-error mb-2">
                          {error}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column - Instructions */}
        <div className="space-y-6">
          <Card>
            <div className="p-6 border-b border-surface">
              <h2 className="text-xl font-semibold">Instructions</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start space-x-3">
                <Info size={20} className="text-primary-accent flex-shrink-0 mt-1" />
                <p className="text-sm text-text-secondary">
                  File must be in CSV format with UTF-8 encoding
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <Info size={20} className="text-primary-accent flex-shrink-0 mt-1" />
                <p className="text-sm text-text-secondary">
                  Required columns: first_name, last_name, national_id, email, phone
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <Info size={20} className="text-primary-accent flex-shrink-0 mt-1" />
                <p className="text-sm text-text-secondary">
                  National ID must be exactly 18 digits
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <Info size={20} className="text-primary-accent flex-shrink-0 mt-1" />
                <p className="text-sm text-text-secondary">
                  Email addresses must be unique
                </p>
              </div>

              <div className="pt-4">
                <Button variant="secondary" className="w-full" onClick={downloadTemplate}>
                  <Download size={18} className="mr-2" />
                  Download Template
                </Button>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6 border-b border-surface">
              <h2 className="text-xl font-semibold">Sample Data</h2>
            </div>
            <div className="p-6">
              <div className="bg-surface/30 rounded-lg p-4">
                <pre className="text-xs font-mono overflow-x-auto">
                  {`first_name,last_name,national_id,email,phone
John,Doe,123456789012345678,john@email.com,0555123456
Jane,Smith,987654321098765432,jane@email.com,0555789012`}
                </pre>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  )
}

export default ImportCandidates