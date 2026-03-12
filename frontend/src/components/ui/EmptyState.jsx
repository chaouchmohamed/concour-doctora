import React from 'react'
import { motion } from 'framer-motion'
import { Inbox } from 'lucide-react'

const EmptyState = ({ title, description, icon: Icon = Inbox, action }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-12"
    >
      <div className="flex justify-center mb-4">
        <div className="p-4 bg-surface rounded-full">
          <Icon size={48} className="text-text-secondary" />
        </div>
      </div>
      <h3 className="text-lg font-medium text-text-primary mb-2">{title}</h3>
      <p className="text-text-secondary mb-6">{description}</p>
      {action}
    </motion.div>
  )
}

export default EmptyState