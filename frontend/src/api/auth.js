import axios from './axios'

export const authAPI = {
  login: async (credentials) => {
    const response = await axios.post('/auth/login/', credentials)
    return response.data
  },

  logout: async (refreshToken) => {
    const response = await axios.post('/auth/logout/', { refresh: refreshToken })
    return response.data
  },

  register: async (userData) => {
    const response = await axios.post('/auth/register/', userData)
    return response.data
  },

  forgotPassword: async (email) => {
    const response = await axios.post('/auth/forgot-password/', { email })
    return response.data
  },

  resetPassword: async (token, newPassword) => {
    const response = await axios.post('/auth/reset-password/', {
      token,
      new_password: newPassword,
    })
    return response.data
  },

  refreshToken: async (refresh) => {
    const response = await axios.post('/auth/refresh/', { refresh })
    return response.data
  },

  getCurrentUser: async () => {
    const response = await axios.get('/auth/me/')
    return response.data
  },
}