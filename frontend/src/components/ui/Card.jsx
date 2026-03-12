import React from 'react'
import { motion } from 'framer-motion'

const Card = ({ children, className = '', onClick, hoverable = false }) => {
  return (
    <motion.div
      whileHover={hoverable ? { y: -2 } : {}}
      className={`card ${className} ${hoverable ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {children}
    </motion.div>
  )
}

export default Card