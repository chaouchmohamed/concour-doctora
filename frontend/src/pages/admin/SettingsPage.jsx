import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Settings,
  Mail,
  Shield,
  Bell,
  Database,
  Globe,
  Save,
  RefreshCw,
} from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import toast from 'react-hot-toast'

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('general')
  const [isSaving, setIsSaving] = useState(false)

  // General settings
  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'CONCOUR DOCTORA',
    siteUrl: 'https://concour-doctora.dz',
    adminEmail: 'admin@esi-sba.dz',
    timezone: 'Africa/Algiers',
    dateFormat: 'DD/MM/YYYY',
    itemsPerPage: '20',
  })

  // Email settings
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    smtpUser: 'noreply@esi-sba.dz',
    smtpPassword: '********',
    useTLS: true,
    fromEmail: 'noreply@esi-sba.dz',
    fromName: 'CONCOUR DOCTORA',
  })

  // Security settings
  const [securitySettings, setSecuritySettings] = useState({
    sessionTimeout: '60',
    maxLoginAttempts: '5',
    passwordMinLength: '8',
    requireStrongPassword: true,
    twoFactorAuth: false,
    ipWhitelist: '',
  })

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    notifyOnNewUser: true,
    notifyOnDiscrepancy: true,
    notifyOnCorrectionComplete: true,
    notifyOnDeliberation: true,
  })

  const handleSave = () => {
    setIsSaving(true)
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false)
      toast.success('Settings saved successfully')
    }, 1500)
  }

  const handleReset = () => {
    // Reset to defaults
    toast.success('Settings reset to defaults')
  }

  const tabs = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'database', label: 'Database', icon: Database },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-text-secondary">
            Configure system preferences and options
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="secondary" onClick={handleReset}>
            <RefreshCw size={18} className="mr-2" />
            Reset
          </Button>
          <Button variant="primary" onClick={handleSave} isLoading={isSaving}>
            <Save size={18} className="mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <Card className="lg:w-64 h-fit">
          <nav className="p-2 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-accent text-white'
                    : 'text-text-secondary hover:bg-surface hover:text-text-primary'
                }`}
              >
                <tab.icon size={20} />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </Card>

        {/* Content */}
        <Card className="flex-1">
          <div className="p-6 border-b border-surface">
            <h2 className="text-xl font-semibold capitalize">
              {activeTab} Settings
            </h2>
          </div>

          <div className="p-6">
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="space-y-4">
                <Input
                  label="Site Name"
                  value={generalSettings.siteName}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, siteName: e.target.value })}
                />
                <Input
                  label="Site URL"
                  value={generalSettings.siteUrl}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, siteUrl: e.target.value })}
                />
                <Input
                  label="Admin Email"
                  type="email"
                  value={generalSettings.adminEmail}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, adminEmail: e.target.value })}
                />
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Timezone
                  </label>
                  <select
                    className="input"
                    value={generalSettings.timezone}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, timezone: e.target.value })}
                  >
                    <option value="Africa/Algiers">Africa/Algiers (UTC+1)</option>
                    <option value="UTC">UTC</option>
                    <option value="Europe/Paris">Europe/Paris</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Date Format
                  </label>
                  <select
                    className="input"
                    value={generalSettings.dateFormat}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, dateFormat: e.target.value })}
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
                <Input
                  label="Items Per Page"
                  type="number"
                  value={generalSettings.itemsPerPage}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, itemsPerPage: e.target.value })}
                />
              </div>
            )}

            {/* Email Settings */}
            {activeTab === 'email' && (
              <div className="space-y-4">
                <Input
                  label="SMTP Host"
                  value={emailSettings.smtpHost}
                  onChange={(e) => setEmailSettings({ ...emailSettings, smtpHost: e.target.value })}
                />
                <Input
                  label="SMTP Port"
                  value={emailSettings.smtpPort}
                  onChange={(e) => setEmailSettings({ ...emailSettings, smtpPort: e.target.value })}
                />
                <Input
                  label="SMTP Username"
                  value={emailSettings.smtpUser}
                  onChange={(e) => setEmailSettings({ ...emailSettings, smtpUser: e.target.value })}
                />
                <Input
                  label="SMTP Password"
                  type="password"
                  value={emailSettings.smtpPassword}
                  onChange={(e) => setEmailSettings({ ...emailSettings, smtpPassword: e.target.value })}
                />
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="useTLS"
                    checked={emailSettings.useTLS}
                    onChange={(e) => setEmailSettings({ ...emailSettings, useTLS: e.target.checked })}
                    className="rounded border-gray-300 text-primary-accent focus:ring-primary-accent"
                  />
                  <label htmlFor="useTLS" className="text-sm text-text-primary">
                    Use TLS
                  </label>
                </div>
                <Input
                  label="From Email"
                  type="email"
                  value={emailSettings.fromEmail}
                  onChange={(e) => setEmailSettings({ ...emailSettings, fromEmail: e.target.value })}
                />
                <Input
                  label="From Name"
                  value={emailSettings.fromName}
                  onChange={(e) => setEmailSettings({ ...emailSettings, fromName: e.target.value })}
                />
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="space-y-4">
                <Input
                  label="Session Timeout (minutes)"
                  type="number"
                  value={securitySettings.sessionTimeout}
                  onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: e.target.value })}
                />
                <Input
                  label="Max Login Attempts"
                  type="number"
                  value={securitySettings.maxLoginAttempts}
                  onChange={(e) => setSecuritySettings({ ...securitySettings, maxLoginAttempts: e.target.value })}
                />
                <Input
                  label="Password Minimum Length"
                  type="number"
                  value={securitySettings.passwordMinLength}
                  onChange={(e) => setSecuritySettings({ ...securitySettings, passwordMinLength: e.target.value })}
                />
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="strongPassword"
                    checked={securitySettings.requireStrongPassword}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, requireStrongPassword: e.target.checked })}
                    className="rounded border-gray-300 text-primary-accent focus:ring-primary-accent"
                  />
                  <label htmlFor="strongPassword" className="text-sm text-text-primary">
                    Require strong passwords
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="twoFactor"
                    checked={securitySettings.twoFactorAuth}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, twoFactorAuth: e.target.checked })}
                    className="rounded border-gray-300 text-primary-accent focus:ring-primary-accent"
                  />
                  <label htmlFor="twoFactor" className="text-sm text-text-primary">
                    Enable two-factor authentication
                  </label>
                </div>
                <Input
                  label="IP Whitelist (comma-separated)"
                  value={securitySettings.ipWhitelist}
                  onChange={(e) => setSecuritySettings({ ...securitySettings, ipWhitelist: e.target.value })}
                  placeholder="192.168.1.1, 10.0.0.1"
                />
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-text-secondary">
                      Receive system notifications via email
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={notificationSettings.emailNotifications}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, emailNotifications: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-accent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-accent"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-text-secondary">
                      Receive browser push notifications
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={notificationSettings.pushNotifications}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, pushNotifications: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-accent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-accent"></div>
                  </label>
                </div>

                <div className="pt-4 border-t border-surface">
                  <h3 className="font-medium mb-4">Notification Events</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="notifyNewUser"
                        checked={notificationSettings.notifyOnNewUser}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, notifyOnNewUser: e.target.checked })}
                        className="rounded border-gray-300 text-primary-accent focus:ring-primary-accent"
                      />
                      <label htmlFor="notifyNewUser" className="text-sm">
                        New user registration
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="notifyDiscrepancy"
                        checked={notificationSettings.notifyOnDiscrepancy}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, notifyOnDiscrepancy: e.target.checked })}
                        className="rounded border-gray-300 text-primary-accent focus:ring-primary-accent"
                      />
                      <label htmlFor="notifyDiscrepancy" className="text-sm">
                        Discrepancy detected
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="notifyCorrection"
                        checked={notificationSettings.notifyOnCorrectionComplete}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, notifyOnCorrectionComplete: e.target.checked })}
                        className="rounded border-gray-300 text-primary-accent focus:ring-primary-accent"
                      />
                      <label htmlFor="notifyCorrection" className="text-sm">
                        Correction completed
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="notifyDeliberation"
                        checked={notificationSettings.notifyOnDeliberation}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, notifyOnDeliberation: e.target.checked })}
                        className="rounded border-gray-300 text-primary-accent focus:ring-primary-accent"
                      />
                      <label htmlFor="notifyDeliberation" className="text-sm">
                        Deliberation ready
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Database Settings */}
            {activeTab === 'database' && (
              <div className="space-y-6">
                <div className="bg-surface/30 p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Database Status</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Type:</span>
                      <span className="font-mono">PostgreSQL 14</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Size:</span>
                      <span className="font-mono">156 MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Tables:</span>
                      <span className="font-mono">15</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Last Backup:</span>
                      <span className="font-mono">2024-01-15 03:00</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button variant="secondary" className="w-full">
                    <Database size={18} className="mr-2" />
                    Backup Now
                  </Button>
                  <Button variant="secondary" className="w-full">
                    <RefreshCw size={18} className="mr-2" />
                    Optimize
                  </Button>
                </div>

                <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                  <p className="text-sm text-warning">
                    Regular backups are recommended. The system automatically performs
                    daily backups at 03:00 AM.
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </motion.div>
  )
}

export default SettingsPage