import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

const Toast = ({ message, type = 'info', onClose }) => {
  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
  }

  const colors = {
    success: 'text-success',
    error: 'text-error',
    warning: 'text-warning',
    info: 'text-info',
  }

  const Icon = icons[type]

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-surface p-4 max-w-md z-50"
    >
      <div className="flex items-start space-x-3">
        <Icon className={`${colors[type]} flex-shrink-0`} size={20} />
        <p className="flex-1 text-sm text-text-primary">{message}</p>
        <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
          <X size={16} />
        </button>
      </div>
    </motion.div>
  )
}

export default Toast