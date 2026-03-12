import axios from './axios'

export const candidatesAPI = {
  getAll: async (params = {}) => {
    const response = await axios.get('/candidates/', { params })
    return response.data
  },

  getById: async (id) => {
    const response = await axios.get(`/candidates/${id}/`)
    return response.data
  },

  create: async (data) => {
    const response = await axios.post('/candidates/', data)
    return response.data
  },

  update: async (id, data) => {
    const response = await axios.put(`/candidates/${id}/`, data)
    return response.data
  },

  delete: async (id) => {
    const response = await axios.delete(`/candidates/${id}/`)
    return response.data
  },

  importCSV: async (file, sessionId) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('session_id', sessionId)
    const response = await axios.post('/candidates/import_csv/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  exportCSV: async (params = {}) => {
    const response = await axios.get('/candidates/export/', {
      params,
      responseType: 'blob',
    })
    return response.data
  },

  generateCode: async (id) => {
    const response = await axios.post(`/candidates/${id}/generate_code/`)
    return response.data
  },
}