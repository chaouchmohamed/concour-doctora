import axios from './axios'

export const subjectsAPI = {
  getAll: async (params = {}) => {
    const response = await axios.get('/subjects/', { params })
    return response.data
  },

  getById: async (id) => {
    const response = await axios.get(`/subjects/${id}/`)
    return response.data
  },

  create: async (data) => {
    const response = await axios.post('/subjects/', data)
    return response.data
  },

  update: async (id, data) => {
    const response = await axios.put(`/subjects/${id}/`, data)
    return response.data
  },

  delete: async (id) => {
    const response = await axios.delete(`/subjects/${id}/`)
    return response.data
  },

  activate: async (id) => {
    const response = await axios.post(`/subjects/${id}/activate/`)
    return response.data
  },

  lock: async (id) => {
    const response = await axios.post(`/subjects/${id}/lock/`)
    return response.data
  },
}