import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Mail, Lock, LogIn } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

const Login = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const onSubmit = async (data) => {
    setIsLoading(true)
    const result = await login(data)
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
          <h1 className="text-3xl font-bold text-primary-accent mb-2">CONCOUR DOCTORA</h1>
          <p className="text-text-secondary">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input
            label="Email"
            type="email"
            icon={Mail}
            placeholder="admin@esi-sba.dz"
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

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-primary-accent focus:ring-primary-accent" />
              <span className="ml-2 text-sm text-text-secondary">Remember me</span>
            </label>
            <Link to="/forgot-password" className="text-sm text-primary-accent hover:underline">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
            <LogIn size={18} className="mr-2" />
            Sign In
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-text-secondary">
            Demo accounts:{' '}
            <span className="font-mono text-xs">admin@esi-sba.dz / Admin123!</span>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default Login