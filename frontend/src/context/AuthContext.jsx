import React, { createContext, useState, useEffect, useContext } from 'react'
import { authAPI } from '../api/auth'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Check for stored user data
    const storedUser = localStorage.getItem('user')
    const token = localStorage.getItem('access_token')

    if (storedUser && token) {
      setUser(JSON.parse(storedUser))
      setIsAuthenticated(true)
      
      // Verify token validity
      verifyToken()
    } else {
      setLoading(false)
    }
  }, [])

  const verifyToken = async () => {
    try {
      const userData = await authAPI.getCurrentUser()
      setUser(userData)
      setIsAuthenticated(true)
    } catch (error) {
      console.error('Token invalid:', error)
      logout()
    } finally {
      setLoading(false)
    }
  }

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials)
      
      // Store tokens and user data
      localStorage.setItem('access_token', response.access)
      localStorage.setItem('refresh_token', response.refresh)
      localStorage.setItem('user', JSON.stringify(response.user))
      
      setUser(response.user)
      setIsAuthenticated(true)
      
      toast.success('Login successful!')
      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      toast.error(error.response?.data?.error || 'Login failed')
      return { success: false, error: error.response?.data?.error }
    }
  }

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) {
        await authAPI.logout(refreshToken)
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear storage
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      
      setUser(null)
      setIsAuthenticated(false)
      
      toast.success('Logged out successfully')
    }
  }

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData)
      
      localStorage.setItem('access_token', response.access)
      localStorage.setItem('refresh_token', response.refresh)
      localStorage.setItem('user', JSON.stringify(response.user))
      
      setUser(response.user)
      setIsAuthenticated(true)
      
      toast.success('Registration successful!')
      return { success: true }
    } catch (error) {
      console.error('Registration error:', error)
      toast.error(error.response?.data?.error || 'Registration failed')
      return { success: false, error: error.response?.data?.error }
    }
  }

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    register,
    hasRole: (roles) => {
      if (!user) return false
      if (typeof roles === 'string') return user.profile?.role === roles
      return roles.includes(user.profile?.role)
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}