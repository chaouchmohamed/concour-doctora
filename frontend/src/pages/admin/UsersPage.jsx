import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Mail,
  Phone,
  Shield,
  UserCog,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { usersAPI } from '../../api/users'
import { usePermission } from '../../hooks/usePermission'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import Table from '../../components/ui/Table'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import toast from 'react-hot-toast'

const UsersPage = () => {
  const queryClient = useQueryClient()
  const { can } = usePermission()
  const [search, setSearch] = useState('')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: 'CORRECTOR',
    phone: '',
    department: '',
  })

  // Fetch users
  const { data: users, isLoading } = useQuery({
    queryKey: ['users', search],
    queryFn: () => usersAPI.getAll({ search }),
  })

  // Invite user mutation
  const inviteMutation = useMutation({
    mutationFn: (data) => usersAPI.invite(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      toast.success('User invited successfully')
      setShowInviteModal(false)
      resetForm()
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to invite user')
    },
  })

  // Update user mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => usersAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      toast.success('User updated successfully')
      setShowEditModal(false)
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update user')
    },
  })

  // Delete user mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => usersAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      toast.success('User deleted successfully')
      setShowDeleteModal(false)
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete user')
    },
  })

  const resetForm = () => {
    setFormData({
      email: '',
      first_name: '',
      last_name: '',
      role: 'CORRECTOR',
      phone: '',
      department: '',
    })
  }

  const handleInvite = (e) => {
    e.preventDefault()
    inviteMutation.mutate(formData)
  }

  const handleUpdate = (e) => {
    e.preventDefault()
    updateMutation.mutate({
      id: selectedUser.id,
      data: formData,
    })
  }

  const columns = [
    {
      key: 'user',
      title: 'User',
      render: (_, record) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-primary-accent/10 flex items-center justify-center">
            <span className="font-bold text-primary-accent">
              {record.first_name?.[0]}{record.last_name?.[0]}
            </span>
          </div>
          <div>
            <p className="font-medium">{record.first_name} {record.last_name}</p>
            <p className="text-sm text-text-secondary">{record.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      title: 'Role',
      render: (value) => {
        const variants = {
          'ADMIN': 'error',
          'CFD_HEAD': 'warning',
          'COORDINATOR': 'info',
          'CORRECTOR': 'success',
          'SUPERVISOR': 'default',
          'JURY_MEMBER': 'purple',
        }
        return <Badge variant={variants[value] || 'default'}>{value}</Badge>
      },
    },
    {
      key: 'contact',
      title: 'Contact',
      render: (_, record) => (
        <div className="space-y-1">
          <div className="flex items-center text-sm">
            <Mail size={14} className="mr-2 text-text-secondary" />
            {record.email}
          </div>
          <div className="flex items-center text-sm">
            <Phone size={14} className="mr-2 text-text-secondary" />
            {record.profile?.phone || 'N/A'}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: (_, record) => (
        record.is_active ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="error">Inactive</Badge>
        )
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, record) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setSelectedUser(record)
              setFormData({
                email: record.email,
                first_name: record.first_name || '',
                last_name: record.last_name || '',
                role: record.profile?.role || 'CORRECTOR',
                phone: record.profile?.phone || '',
                department: record.profile?.department || '',
              })
              setShowEditModal(true)
            }}
            className="p-1 hover:bg-surface rounded transition-colors"
          >
            <Edit size={18} className="text-text-secondary" />
          </button>
          <button
            onClick={() => {
              setSelectedUser(record)
              setShowDeleteModal(true)
            }}
            className="p-1 hover:bg-surface rounded transition-colors"
          >
            <Trash2 size={18} className="text-error" />
          </button>
        </div>
      ),
    },
  ]

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
          <h1 className="text-3xl font-bold mb-2">User Management</h1>
          <p className="text-text-secondary">
            Manage system users and their roles
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowInviteModal(true)}>
          <Plus size={18} className="mr-2" />
          Invite User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary mb-1">Total Users</p>
              <p className="text-3xl font-bold">{users?.length || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="text-blue-600" size={24} />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary mb-1">Admins</p>
              <p className="text-3xl font-bold">
                {users?.filter(u => u.profile?.role === 'ADMIN').length || 0}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <Shield className="text-red-600" size={24} />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary mb-1">Correctors</p>
              <p className="text-3xl font-bold">
                {users?.filter(u => u.profile?.role === 'CORRECTOR').length || 0}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <UserCog className="text-green-600" size={24} />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary mb-1">Active</p>
              <p className="text-3xl font-bold text-success">
                {users?.filter(u => u.is_active).length || 0}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="text-green-600" size={24} />
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4">
        <Input
          placeholder="Search users by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={Search}
        />
      </Card>

      {/* Users Table */}
      {users?.length > 0 ? (
        <Card className="overflow-hidden">
          <Table columns={columns} data={users} />
        </Card>
      ) : (
        <EmptyState
          title="No users found"
          description="Invite your first user to get started"
          icon={Users}
          action={
            <Button variant="primary" onClick={() => setShowInviteModal(true)}>
              Invite User
            </Button>
          }
        />
      )}

      {/* Invite User Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => {
          setShowInviteModal(false)
          resetForm()
        }}
        title="Invite New User"
      >
        <form onSubmit={handleInvite} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            placeholder="user@esi-sba.dz"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              required
            />
            <Input
              label="Last Name"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Role
            </label>
            <select
              className="input"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              required
            >
              <option value="ADMIN">Administrator</option>
              <option value="CFD_HEAD">CFD Head</option>
              <option value="COORDINATOR">Coordinator</option>
              <option value="CORRECTOR">Corrector</option>
              <option value="SUPERVISOR">Supervisor</option>
              <option value="JURY_MEMBER">Jury Member</option>
            </select>
          </div>

          <Input
            label="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="0555123456"
          />

          <Input
            label="Department"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            placeholder="e.g., Computer Science"
          />

          <div className="bg-info/10 border border-info/20 rounded-lg p-4">
            <p className="text-sm text-info">
              An invitation email will be sent with login instructions.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowInviteModal(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={inviteMutation.isLoading}
            >
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          resetForm()
        }}
        title="Edit User"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            disabled
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              required
            />
            <Input
              label="Last Name"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Role
            </label>
            <select
              className="input"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              required
            >
              <option value="ADMIN">Administrator</option>
              <option value="CFD_HEAD">CFD Head</option>
              <option value="COORDINATOR">Coordinator</option>
              <option value="CORRECTOR">Corrector</option>
              <option value="SUPERVISOR">Supervisor</option>
              <option value="JURY_MEMBER">Jury Member</option>
            </select>
          </div>

          <Input
            label="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />

          <Input
            label="Department"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowEditModal(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={updateMutation.isLoading}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete User"
      >
        <div className="space-y-4">
          <p>
            Are you sure you want to delete{' '}
            <span className="font-semibold">
              {selectedUser?.first_name} {selectedUser?.last_name}
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
              onClick={() => deleteMutation.mutate(selectedUser.id)}
              isLoading={deleteMutation.isLoading}
            >
              Delete User
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}

export default UsersPage