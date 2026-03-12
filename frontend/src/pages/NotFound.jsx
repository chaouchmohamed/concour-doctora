import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, AlertCircle } from 'lucide-react'
import Button from '../components/ui/Button'

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface/30 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        <div className="mb-8">
          <div className="inline-flex p-4 bg-error/10 rounded-full mb-4">
            <AlertCircle size={64} className="text-error" />
          </div>
          <h1 className="text-6xl font-bold text-primary-accent mb-4">404</h1>
          <h2 className="text-2xl font-bold mb-2">Page Not Found</h2>
          <p className="text-text-secondary mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="space-y-4">
          <Link to="/">
            <Button variant="primary" className="w-full">
              <Home size={18} className="mr-2" />
              Go to Homepage
            </Button>
          </Link>
          <Link to="/app/dashboard">
            <Button variant="secondary" className="w-full">
              Go to Dashboard
            </Button>
          </Link>
        </div>

        <p className="mt-8 text-sm text-text-secondary">
          If you believe this is an error, please contact the administrator.
        </p>
      </motion.div>
    </div>
  )
}

export default NotFound