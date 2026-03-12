import React from 'react'

const Badge = ({ children, variant = 'default' }) => {
  const variants = {
    default: 'bg-surface text-text-primary',
    registered: 'badge-registered',
    present: 'badge-present',
    admitted: 'badge-admitted',
    eliminated: 'badge-eliminated',
    rejected: 'badge-rejected',
    waitlist: 'badge-waitlist',
    pending: 'badge-pending',
    draft: 'badge-draft',
    active: 'badge-active',
    locked: 'badge-locked',
    success: 'bg-success text-white',
    error: 'bg-error text-white',
    warning: 'bg-warning text-white',
    info: 'bg-info text-white',
  }

  return (
    <span className={`${variants[variant] || variants.default} badge`}>
      {children}
    </span>
  )
}

export default Badge