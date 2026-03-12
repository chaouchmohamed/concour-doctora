import axios from './axios'

export const roomsAPI = {
  getAll: async (params = {}) => {
    const response = await axios.get('/rooms/', { params })
    return response.data
  },

  getById: async (id) => {
    const response = await axios.get(`/rooms/${id}/`)
    return response.data
  },

  create: async (data) => {
    const response = await axios.post('/rooms/', data)
    return response.data
  },

  update: async (id, data) => {
    const response = await axios.put(`/rooms/${id}/`, data)
    return response.data
  },

  delete: async (id) => {
    const response = await axios.delete(`/rooms/${id}/`)
    return response.data
  },
}