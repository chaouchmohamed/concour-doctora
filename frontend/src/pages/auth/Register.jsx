import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Mail, Lock, User, Phone, UserPlus } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

const Register = () => {
  const navigate = useNavigate()
  const { register: registerUser } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm()

  const password = watch('password')

  const onSubmit = async (data) => {
    setIsLoading(true)
    const result = await registerUser(data)
    setIsLoading(false)

    if (result.success) {
      navigate('/app/dashboard')
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
          <h1 className="text-3xl font-bold text-primary-accent mb-2">Create Account</h1>
          <p className="text-text-secondary">Register for CONCOUR DOCTORA</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              placeholder="John"
              error={errors.first_name?.message}
              {...register('first_name', { required: 'First name is required' })}
            />
            <Input
              label="Last Name"
              placeholder="Doe"
              error={errors.last_name?.message}
              {...register('last_name', { required: 'Last name is required' })}
            />
          </div>

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

          <Input
            label="Phone"
            type="tel"
            icon={Phone}
            placeholder="0555123456"
            error={errors.phone?.message}
            {...register('phone', { required: 'Phone number is required' })}
          />

          <Input
            label="Password"
            type="password"
            icon={Lock}
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password', {
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
            error={errors.confirmPassword?.message}
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: value => value === password || 'Passwords do not match',
            })}
          />

          <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
            <UserPlus size={18} className="mr-2" />
            Register
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-accent hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  )
}

export default Register