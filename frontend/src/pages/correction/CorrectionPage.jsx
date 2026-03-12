import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  ChevronRight,
  Award,
  BookOpen,
} from 'lucide-react'
import { correctionsAPI } from '../../api/corrections'
import { usePermission } from '../../hooks/usePermission'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'

const CorrectionPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { can, isCorrector } = usePermission()
  const [filter, setFilter] = useState('pending')

  // Fetch assigned copies
  const { data: assignedCopies, isLoading } = useQuery({
    queryKey: ['assigned-copies'],
    queryFn: () => correctionsAPI.getAssigned(),
  })

  // Fetch all copies for coordinators
  const { data: allCopies } = useQuery({
    queryKey: ['all-copies', filter],
    queryFn: () => correctionsAPI.getCopies({ status: filter }),
    enabled: !isCorrector,
  })

  const copies = isCorrector ? assignedCopies : allCopies

  const getStatusBadge = (copy) => {
    const corrections = copy.corrections_count || 0
    if (corrections === 0) return <Badge variant="draft">Pending</Badge>
    if (corrections === 1) return <Badge variant="active">First Correction</Badge>
    if (corrections === 2) return <Badge variant="success">Completed</Badge>
    return <Badge variant="locked">Locked</Badge>
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
          <h1 className="text-3xl font-bold mb-2">Correction</h1>
          <p className="text-text-secondary">
            {isCorrector 
              ? 'Grade your assigned copies' 
              : 'Monitor correction progress'}
          </p>
        </div>
        {!isCorrector && (
          <div className="flex space-x-2">
            <Button
              variant={filter === 'pending' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter('pending')}
            >
              Pending
            </Button>
            <Button
              variant={filter === 'in-progress' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter('in-progress')}
            >
              In Progress
            </Button>
            <Button
              variant={filter === 'completed' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter('completed')}
            >
              Completed
            </Button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary mb-1">Total Copies</p>
              <p className="text-3xl font-bold">{copies?.length || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="text-blue-600" size={24} />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary mb-1">Pending</p>
              <p className="text-3xl font-bold text-warning">
                {copies?.filter(c => (c.corrections_count || 0) === 0).length || 0}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="text-yellow-600" size={24} />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary mb-1">In Progress</p>
              <p className="text-3xl font-bold text-info">
                {copies?.filter(c => (c.corrections_count || 0) === 1).length || 0}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <BookOpen className="text-purple-600" size={24} />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary mb-1">Completed</p>
              <p className="text-3xl font-bold text-success">
                {copies?.filter(c => (c.corrections_count || 0) === 2).length || 0}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="text-green-600" size={24} />
            </div>
          </div>
        </Card>
      </div>

      {/* Copies Grid */}
      {copies?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {copies.map((copy) => (
            <Card
              key={copy.id}
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/app/correction/copy/${copy.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-text-secondary mb-1">Anonymous Code</p>
                  <p className="font-mono text-lg font-bold text-primary-accent">
                    {copy.anonymous_code_value}
                  </p>
                </div>
                {getStatusBadge(copy)}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm">
                  <BookOpen size={16} className="mr-2 text-text-secondary" />
                  <span>{copy.subject_name}</span>
                </div>
                <div className="flex items-center text-sm">
                  <FileText size={16} className="mr-2 text-text-secondary" />
                  <span>{copy.page_count} pages</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-surface">
                <div className="flex items-center space-x-2">
                  {copy.corrections_count === 0 && (
                    <Badge variant="draft">Not started</Badge>
                  )}
                  {copy.corrections_count === 1 && (
                    <Badge variant="active">First correction done</Badge>
                  )}
                  {copy.corrections_count === 2 && (
                    <Badge variant="success">Both corrections done</Badge>
                  )}
                </div>
                <Button variant="ghost" size="sm">
                  <Eye size={16} className="mr-1" />
                  View
                  <ChevronRight size={16} className="ml-1" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No copies assigned"
          description={isCorrector 
            ? "You don't have any copies to correct at the moment"
            : "No copies available for correction"}
          icon={FileText}
        />
      )}
    </motion.div>
  )
}

export default CorrectionPage