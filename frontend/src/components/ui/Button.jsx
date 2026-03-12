import React from 'react'
import { motion } from 'framer-motion'

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  ...props
}) => {
  const baseClasses = 'rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-accent focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary: 'bg-primary-accent text-white hover:bg-primary-dark',
    secondary: 'bg-white border border-primary-accent text-primary-accent hover:bg-primary-accent/10',
    danger: 'bg-error text-white hover:bg-error/90',
    ghost: 'text-text-secondary hover:text-text-primary hover:bg-surface',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  }

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      type={type}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      onClick={onClick}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </div>
      ) : (
        children
      )}
    </motion.button>
  )
}

export default Button