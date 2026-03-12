import axios from './axios'

export const auditAPI = {
  getAll: async (params = {}) => {
    const response = await axios.get('/audit-logs/', { params })
    return response.data
  },

  export: async (params = {}) => {
    const response = await axios.get('/audit-logs/export/', {
      params,
      responseType: 'blob',
    })
    return response.data
  },
}