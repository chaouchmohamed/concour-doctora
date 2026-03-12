import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Save,
  Mail,
  Phone,
  MapPin,
  Calendar,
  IdCard,
  User,
  FileText,
  QrCode,
  Download,
  Edit2,
} from 'lucide-react'
import { candidatesAPI } from '../../api/candidates'
import { usePermission } from '../../hooks/usePermission'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import toast from 'react-hot-toast'

const CandidateProfile = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const { can } = usePermission()
  const isEditMode = searchParams.get('edit') === 'true'
  const [isEditing, setIsEditing] = useState(isEditMode)

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  // Fetch candidate details
  const { data: candidate, isLoading } = useQuery({
    queryKey: ['candidate', id],
    queryFn: () => candidatesAPI.getById(id),
  })

  // Update candidate mutation
  const updateMutation = useMutation({
    mutationFn: (data) => candidatesAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['candidate', id])
      queryClient.invalidateQueries(['candidates'])
      toast.success('Candidate updated successfully')
      setIsEditing(false)
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update candidate')
    },
  })

  // Generate code mutation
  const generateCodeMutation = useMutation({
    mutationFn: () => candidatesAPI.generateCode(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['candidate', id])
      toast.success('Anonymous code generated successfully')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to generate code')
    },
  })

  useEffect(() => {
    if (candidate) {
      reset(candidate)
    }
  }, [candidate, reset])

  const onSubmit = (data) => {
    updateMutation.mutate(data)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!candidate) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Candidate not found</h2>
        <Button variant="primary" onClick={() => navigate('/app/candidates')}>
          Back to Candidates
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
            onClick={() => navigate('/app/candidates')}
            className="p-2 hover:bg-surface rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {candidate.last_name} {candidate.first_name}
            </h1>
            <p className="text-text-secondary">
              Application #{candidate.application_number}
            </p>
          </div>
          <Badge variant={candidate.status.toLowerCase()}>
            {candidate.status}
          </Badge>
        </div>
        <div className="flex space-x-3">
          {!isEditing && can('edit', 'candidates') && (
            <>
              <Button
                variant="secondary"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 size={18} className="mr-2" />
                Edit
              </Button>
              {!candidate.anonymous_code && (
                <Button
                  variant="primary"
                  onClick={() => generateCodeMutation.mutate()}
                  isLoading={generateCodeMutation.isLoading}
                >
                  <QrCode size={18} className="mr-2" />
                  Generate Code
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Personal Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="p-6 border-b border-surface">
                <h2 className="text-xl font-semibold">Personal Information</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    {...register('first_name', { required: 'First name is required' })}
                    error={errors.first_name?.message}
                    disabled={!isEditing}
                  />
                  <Input
                    label="Last Name"
                    {...register('last_name', { required: 'Last name is required' })}
                    error={errors.last_name?.message}
                    disabled={!isEditing}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Email"
                    type="email"
                    icon={Mail}
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address',
                      },
                    })}
                    error={errors.email?.message}
                    disabled={!isEditing}
                  />
                  <Input
                    label="Phone"
                    icon={Phone}
                    {...register('phone', { required: 'Phone is required' })}
                    error={errors.phone?.message}
                    disabled={!isEditing}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="National ID"
                    icon={IdCard}
                    {...register('national_id', {
                      required: 'National ID is required',
                      pattern: {
                        value: /^[0-9]{18}$/,
                        message: 'Must be 18 digits',
                      },
                    })}
                    error={errors.national_id?.message}
                    disabled={!isEditing}
                  />
                  <Input
                    label="Date of Birth"
                    type="date"
                    icon={Calendar}
                    {...register('date_of_birth', { required: 'Date of birth is required' })}
                    error={errors.date_of_birth?.message}
                    disabled={!isEditing}
                  />
                </div>

                <Input
                  label="Place of Birth"
                  {...register('place_of_birth', { required: 'Place of birth is required' })}
                  error={errors.place_of_birth?.message}
                  disabled={!isEditing}
                />

                <Input
                  label="Address"
                  {...register('address', { required: 'Address is required' })}
                  error={errors.address?.message}
                  disabled={!isEditing}
                />

                {isEditing && (
                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setIsEditing(false)
                        reset(candidate)
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      isLoading={updateMutation.isLoading}
                    >
                      <Save size={18} className="mr-2" />
                      Save Changes
                    </Button>
                  </div>
                )}
              </div>
            </form>
          </Card>

          {/* Documents */}
          <Card>
            <div className="p-6 border-b border-surface">
              <h2 className="text-xl font-semibold">Documents</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-3 bg-surface/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText size={20} className="text-text-secondary" />
                  <div>
                    <p className="font-medium">National ID</p>
                    <p className="text-xs text-text-secondary">
                      {candidate.national_id_file ? 'Uploaded' : 'Not uploaded'}
                    </p>
                  </div>
                </div>
                {candidate.national_id_file && (
                  <Button variant="ghost" size="sm">
                    <Download size={16} />
                  </Button>
                )}
              </div>

              <div className="flex items-center justify-between p-3 bg-surface/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText size={20} className="text-text-secondary" />
                  <div>
                    <p className="font-medium">Diploma</p>
                    <p className="text-xs text-text-secondary">
                      {candidate.diploma_file ? 'Uploaded' : 'Not uploaded'}
                    </p>
                  </div>
                </div>
                {candidate.diploma_file && (
                  <Button variant="ghost" size="sm">
                    <Download size={16} />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Exam Info */}
        <div className="space-y-6">
          {/* Exam Session */}
          <Card>
            <div className="p-6 border-b border-surface">
              <h2 className="text-xl font-semibold">Exam Information</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-text-secondary">Exam Session</p>
                <p className="font-medium">{candidate.exam_session_name}</p>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Registration Date</p>
                <p className="font-medium">
                  {new Date(candidate.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </Card>

          {/* Anonymous Code */}
          {candidate.anonymous_code && (
            <Card>
              <div className="p-6 border-b border-surface">
                <h2 className="text-xl font-semibold">Anonymous Code</h2>
              </div>
              <div className="p-6">
                <div className="bg-surface/50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-mono font-bold text-primary-accent">
                    {candidate.anonymous_code}
                  </p>
                  <p className="text-xs text-text-secondary mt-2">
                    Generated for blind correction
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Attendance History */}
          <Card>
            <div className="p-6 border-b border-surface">
              <h2 className="text-xl font-semibold">Attendance History</h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Mathématiques</span>
                  <Badge variant="present">Present</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Informatique</span>
                  <Badge variant="present">Present</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Anglais</span>
                  <Badge variant="present">Present</Badge>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  )
}

export default CandidateProfile