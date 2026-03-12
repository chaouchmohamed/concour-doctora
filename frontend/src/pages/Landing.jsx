import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Users,
  Calendar,
  ClipboardCheck,
  QrCode,
  FileCheck,
  Scale,
  ChevronRight,
  Award,
  Shield,
  Clock,
} from 'lucide-react'
import Button from '../components/ui/Button'

const Landing = () => {
  const features = [
    {
      icon: Users,
      title: 'Candidate Management',
      description: 'Bulk import, validation, and status tracking for all candidates',
    },
    {
      icon: Calendar,
      title: 'Exam Planning',
      description: 'Schedule sessions, assign rooms, and generate call lists',
    },
    {
      icon: ClipboardCheck,
      title: 'Real-time Attendance',
      description: 'Mobile-optimized attendance with offline support',
    },
    {
      icon: QrCode,
      title: 'Anonymous Correction',
      description: 'Double-blind correction with QR code anonymization',
    },
    {
      icon: FileCheck,
      title: 'Discrepancy Detection',
      description: 'Automatic flagging and third-corrector arbitration',
    },
    {
      icon: Scale,
      title: 'Electronic Deliberation',
      description: 'Secure multi-step closing with digital signatures',
    },
  ]

  const stats = [
    { icon: Users, value: '500+', label: 'Candidates' },
    { icon: Award, value: '98%', label: 'Success Rate' },
    { icon: Shield, value: '100%', label: 'Secure' },
    { icon: Clock, value: '24/7', label: 'Support' },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-accent/10 to-surface py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              CONCOUR <span className="text-primary-accent">DOCTORA</span>
            </h1>
            <p className="text-xl text-text-secondary mb-8">
              Complete management platform for ESI-SBA doctoral entrance examinations
            </p>
            <div className="flex justify-center space-x-4">
              <Link to="/login">
                <Button variant="primary" size="lg">
                  Get Started
                  <ChevronRight size={20} className="ml-2" />
                </Button>
              </Link>
              <a href="#features">
                <Button variant="secondary" size="lg">
                  Learn More
                </Button>
              </a>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16"
          >
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex p-3 bg-white rounded-full mb-4">
                  <stat.icon className="text-primary-accent" size={24} />
                </div>
                <div className="text-3xl font-bold text-text-primary">{stat.value}</div>
                <div className="text-text-secondary">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4">Complete Examination Management</h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              Everything you need to manage doctoral entrance exams in one platform
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card hover:shadow-lg transition-shadow"
              >
                <div className="inline-flex p-3 bg-primary-accent/10 rounded-lg mb-4">
                  <feature.icon className="text-primary-accent" size={24} />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-text-secondary">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-accent py-20">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Join ESI-SBA in modernizing doctoral entrance examinations
            </p>
            <Link to="/register">
              <Button variant="secondary" size="lg">
                Create Account
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default Landing