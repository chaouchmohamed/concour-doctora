import axios from './axios'

export const correctionsAPI = {
  getAll: async (params = {}) => {
    const response = await axios.get('/corrections/', { params })
    return response.data
  },

  getById: async (id) => {
    const response = await axios.get(`/corrections/${id}/`)
    return response.data
  },

  submit: async (data) => {
    const response = await axios.post('/corrections/', data)
    return response.data
  },

  getAssigned: async () => {
    const response = await axios.get('/corrections/assigned/')
    return response.data
  },

  getCopies: async (params = {}) => {
    const response = await axios.get('/copies/', { params })
    return response.data
  },

  getCopyById: async (id) => {
    const response = await axios.get(`/copies/${id}/`)
    return response.data
  },

  downloadCopy: async (id) => {
    const response = await axios.get(`/copies/${id}/download/`, {
      responseType: 'blob',
    })
    return response.data
  },
}