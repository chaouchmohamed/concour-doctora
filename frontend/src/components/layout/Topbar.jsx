import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, Menu } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const Topbar = () => {
  const navigate = useNavigate()
  const [showNotifications, setShowNotifications] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const notifications = [
    { id: 1, message: 'New discrepancy detected', time: '5 min ago', type: 'warning' },
    { id: 2, message: '5 corrections pending', time: '1 hour ago', type: 'info' },
    { id: 3, message: 'Session MATH01 activated', time: '2 hours ago', type: 'success' },
  ]

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/app/candidates?search=${searchQuery}`)
    }
  }

  return (
    <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
      <div className="flex items-center flex-1">
        <button className="lg:hidden mr-4">
          <Menu size={24} />
        </button>
        <form onSubmit={handleSearch} className="relative max-w-md w-full">
          <input
            type="text"
            placeholder="Search candidates, sessions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" size={18} />
        </form>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-text-secondary hover:text-text-primary hover:bg-surface rounded-lg transition-colors"
          >
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-surface z-50"
              >
                <div className="p-4 border-b border-surface">
                  <h3 className="font-semibold">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notif) => (
                    <div key={notif.id} className="p-4 hover:bg-surface/50 cursor-pointer border-b border-surface last:border-0">
                      <p className="text-sm">{notif.message}</p>
                      <p className="text-xs text-text-secondary mt-1">{notif.time}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}

export default Topbar