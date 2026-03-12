import React from 'react'

const Input = ({
  label,
  error,
  icon: Icon,
  className = '',
  ...props
}) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-text-primary">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" size={18} />
        )}
        <input
          className={`input ${Icon ? 'pl-10' : ''} ${error ? 'border-error focus:ring-error' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p className="text-sm text-error">{error}</p>
      )}
    </div>
  )
}

export default Input