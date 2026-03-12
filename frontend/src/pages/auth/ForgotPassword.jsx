import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Mail, Send } from 'lucide-react'
import { authAPI } from '../../api/auth'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import toast from 'react-hot-toast'

const ForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      await authAPI.forgotPassword(data.email)
      setSent(true)
      toast.success('Reset link sent to your email')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send reset link')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface/30 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-card shadow-card p-8"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-accent mb-2">Forgot Password</h1>
          <p className="text-text-secondary">
            {sent 
              ? 'Check your email for reset instructions' 
              : 'Enter your email to reset your password'}
          </p>
        </div>

        {!sent ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label="Email"
              type="email"
              icon={Mail}
              placeholder="john.doe@esi-sba.dz"
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
            />

            <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
              <Send size={18} className="mr-2" />
              Send Reset Link
            </Button>
          </form>
        ) : (
          <div className="text-center">
            <p className="mb-6 text-text-secondary">
              We've sent a password reset link to your email. Please check your inbox.
            </p>
            <Link to="/login">
              <Button variant="primary">Return to Login</Button>
            </Link>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-text-secondary">
          Remember your password?{' '}
          <Link to="/login" className="text-primary-accent hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  )
}

export default ForgotPassword