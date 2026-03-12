import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Lock, Key } from 'lucide-react'
import { authAPI } from '../../api/auth'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import toast from 'react-hot-toast'

const ResetPassword = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const token = searchParams.get('token')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm()

  const password = watch('new_password')

  const onSubmit = async (data) => {
    if (!token) {
      toast.error('Invalid reset link')
      return
    }

    setIsLoading(true)
    try {
      await authAPI.resetPassword(token, data.new_password)
      toast.success('Password reset successfully')
      navigate('/login')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reset password')
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface/30 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-card shadow-card p-8 text-center"
        >
          <Key size={48} className="mx-auto mb-4 text-error" />
          <h1 className="text-2xl font-bold mb-4">Invalid Reset Link</h1>
          <p className="text-text-secondary mb-6">
            This password reset link is invalid or has expired.
          </p>
          <Link to="/forgot-password">
            <Button variant="primary">Request New Link</Button>
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface/30 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-card shadow-card p-8"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-accent mb-2">Reset Password</h1>
          <p className="text-text-secondary">Enter your new password</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input
            label="New Password"
            type="password"
            icon={Lock}
            placeholder="••••••••"
            error={errors.new_password?.message}
            {...register('new_password', {
              required: 'Password is required',
              minLength: {
                value: 8,
                message: 'Password must be at least 8 characters',
              },
            })}
          />

          <Input
            label="Confirm Password"
            type="password"
            icon={Lock}
            placeholder="••••••••"
            error={errors.confirm_password?.message}
            {...register('confirm_password', {
              required: 'Please confirm your password',
              validate: value => value === password || 'Passwords do not match',
            })}
          />

          <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
            Reset Password
          </Button>
        </form>
      </motion.div>
    </div>
  )
}

export default ResetPassword