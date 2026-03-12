import axios from './axios'

export const sessionsAPI = {
  getAll: async (params = {}) => {
    const response = await axios.get('/sessions/', { params })
    return response.data
  },

  getById: async (id) => {
    const response = await axios.get(`/sessions/${id}/`)
    return response.data
  },

  create: async (data) => {
    const response = await axios.post('/sessions/', data)
    return response.data
  },

  update: async (id, data) => {
    const response = await axios.put(`/sessions/${id}/`, data)
    return response.data
  },

  delete: async (id) => {
    const response = await axios.delete(`/sessions/${id}/`)
    return response.data
  },

  activate: async (id) => {
    const response = await axios.post(`/sessions/${id}/activate/`)
    return response.data
  },

  close: async (id) => {
    const response = await axios.post(`/sessions/${id}/close/`)
    return response.data
  },
}