import axios from './axios'

export const usersAPI = {
  getAll: async (params = {}) => {
    const response = await axios.get('/users/', { params })
    return response.data
  },

  getById: async (id) => {
    const response = await axios.get(`/users/${id}/`)
    return response.data
  },

  invite: async (data) => {
    const response = await axios.post('/users/invite/', data)
    return response.data
  },

  update: async (id, data) => {
    const response = await axios.put(`/users/${id}/`, data)
    return response.data
  },

  changeRole: async (id, role) => {
    const response = await axios.put(`/users/${id}/change_role/`, { role })
    return response.data
  },

  delete: async (id) => {
    const response = await axios.delete(`/users/${id}/`)
    return response.data
  },
}