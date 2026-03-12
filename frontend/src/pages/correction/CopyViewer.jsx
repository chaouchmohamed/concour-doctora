import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Document, Page, pdfjs } from 'react-pdf'
import {
  ArrowLeft,
  Save,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download,
  FileText,
  AlertCircle,
} from 'lucide-react'
import { correctionsAPI } from '../../api/corrections'
import { usePermission } from '../../hooks/usePermission'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import toast from 'react-hot-toast'

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

const CopyViewer = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { can, isCorrector } = usePermission()
  
  const [numPages, setNumPages] = useState(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1.0)
  const [grade, setGrade] = useState('')
  const [comment, setComment] = useState('')
  const [attempt, setAttempt] = useState(1)

  // Fetch copy details
  const { data: copy, isLoading } = useQuery({
    queryKey: ['copy', id],
    queryFn: () => correctionsAPI.getCopyById(id),
  })

  // Fetch existing corrections
  const { data: corrections } = useQuery({
    queryKey: ['corrections', id],
    queryFn: () => correctionsAPI.getAll({ copy: id }),
  })

  // Submit correction mutation
  const submitMutation = useMutation({
    mutationFn: (data) => correctionsAPI.submit(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['corrections', id])
      queryClient.invalidateQueries(['copy', id])
      toast.success('Correction submitted successfully')
      navigate('/app/correction')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to submit correction')
    },
  })

  useEffect(() => {
    if (corrections) {
      // Determine which attempt this corrector should make
      const userCorrections = corrections.filter(c => c.corrector === 'current-user')
      if (userCorrections.length > 0) {
        setAttempt(userCorrections.length + 1)
      }
    }
  }, [corrections])

  const handleSubmit = (e) => {
    e.preventDefault()
    submitMutation.mutate({
      copy: id,
      grade: parseFloat(grade),
      comment,
      attempt,
    })
  }

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!copy) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Copy not found</h2>
        <Button variant="primary" onClick={() => navigate('/app/correction')}>
          Back to Correction
        </Button>
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
            onClick={() => navigate('/app/correction')}
            className="p-2 hover:bg-surface rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold mb-2">Correction</h1>
            <div className="flex items-center space-x-3">
              <p className="text-text-secondary">
                Copy #{copy.anonymous_code_value}
              </p>
              <Badge variant="active">{copy.subject_name}</Badge>
            </div>
          </div>
        </div>
        <Button variant="secondary" onClick={() => correctionsAPI.downloadCopy(id)}>
          <Download size={18} className="mr-2" />
          Download PDF
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PDF Viewer */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Document Viewer</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
                  className="p-1 hover:bg-surface rounded"
                >
                  <ZoomOut size={20} />
                </button>
                <span className="text-sm">{Math.round(scale * 100)}%</span>
                <button
                  onClick={() => setScale(s => Math.min(2, s + 0.1))}
                  className="p-1 hover:bg-surface rounded"
                >
                  <ZoomIn size={20} />
                </button>
              </div>
            </div>

            <div className="border border-surface rounded-lg overflow-hidden bg-gray-50 min-h-[600px] flex items-center justify-center">
              <Document
                file={copy.scan_file}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={<Spinner className="py-12" />}
                error={
                  <div className="p-12 text-center">
                    <AlertCircle size={48} className="mx-auto mb-4 text-error" />
                    <p className="text-error">Failed to load PDF</p>
                  </div>
                }
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </Document>
            </div>

            {/* Pagination */}
            {numPages > 1 && (
              <div className="flex items-center justify-center space-x-4 mt-4">
                <button
                  onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                  disabled={pageNumber === 1}
                  className="p-1 hover:bg-surface rounded disabled:opacity-50"
                >
                  <ChevronLeft size={20} />
                </button>
                <span>
                  Page {pageNumber} of {numPages}
                </span>
                <button
                  onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
                  disabled={pageNumber === numPages}
                  className="p-1 hover:bg-surface rounded disabled:opacity-50"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </Card>
        </div>

        {/* Grading Panel */}
        <div className="space-y-6">
          {/* Correction Form */}
          <Card>
            <div className="p-6 border-b border-surface">
              <h2 className="text-xl font-semibold">Grade</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Grade (0-{copy.subject?.max_score || 20})
                </label>
                <Input
                  type="number"
                  step="0.25"
                  min="0"
                  max={copy.subject?.max_score || 20}
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  required
                  placeholder="Enter grade"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Comments (Optional)
                </label>
                <textarea
                  className="input min-h-[100px]"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add any comments about the correction..."
                />
              </div>

              <div className="bg-surface/30 rounded-lg p-4">
                <p className="text-sm text-text-secondary mb-2">
                  Correction Attempt: <span className="font-semibold">{attempt}</span>
                </p>
                {attempt === 2 && (
                  <p className="text-xs text-warning">
                    This is the second correction. The system will check for discrepancies.
                  </p>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={submitMutation.isLoading}
              >
                <Save size={18} className="mr-2" />
                Submit Correction
              </Button>
            </form>
          </Card>

          {/* Previous Corrections */}
          {corrections?.length > 0 && (
            <Card>
              <div className="p-6 border-b border-surface">
                <h2 className="text-xl font-semibold">Previous Corrections</h2>
              </div>
              <div className="p-6 space-y-4">
                {corrections.map((corr, index) => (
                  <div key={index} className="border-l-4 border-primary-accent pl-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">Corrector {corr.attempt}</span>
                      <Badge variant="success">Grade: {corr.grade}</Badge>
                    </div>
                    {corr.comment && (
                      <p className="text-sm text-text-secondary">{corr.comment}</p>
                    )}
                    <p className="text-xs text-text-secondary mt-1">
                      {new Date(corr.submitted_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Instructions */}
          <Card>
            <div className="p-6 border-b border-surface">
              <h2 className="text-xl font-semibold">Instructions</h2>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex items-start space-x-3">
                <FileText size={16} className="text-primary-accent mt-1" />
                <p className="text-sm text-text-secondary">
                  Review the entire document before assigning a grade
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <AlertCircle size={16} className="text-primary-accent mt-1" />
                <p className="text-sm text-text-secondary">
                  Grades must be between 0 and {copy.subject?.max_score || 20}
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <AlertCircle size={16} className="text-primary-accent mt-1" />
                <p className="text-sm text-text-secondary">
                  Comments are optional but recommended for clarity
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  )
}

export default CopyViewer