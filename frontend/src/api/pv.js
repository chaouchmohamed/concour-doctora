import axios from './axios'

export const pvAPI = {
  getAll: async (params = {}) => {
    const response = await axios.get('/pv/', { params })
    return response.data
  },

  getById: async (id) => {
    const response = await axios.get(`/pv/${id}/`)
    return response.data
  },

  generate: async (sessionId, title) => {
    const response = await axios.post('/pv/generate/', {
      session_id: sessionId,
      title,
    })
    return response.data
  },

  sign: async (id) => {
    const response = await axios.post(`/pv/${id}/sign/`)
    return response.data
  },

  download: async (id) => {
    const response = await axios.get(`/pv/${id}/download/`, {
      responseType: 'blob',
    })
    return response.data
  },
}