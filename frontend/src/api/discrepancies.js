import axios from './axios'

export const discrepanciesAPI = {
  getAll: async (params = {}) => {
    const response = await axios.get('/discrepancies/', { params })
    return response.data
  },

  getById: async (id) => {
    const response = await axios.get(`/discrepancies/${id}/`)
    return response.data
  },

  assignThird: async (id, correctorId) => {
    const response = await axios.post(`/discrepancies/${id}/assign_third/`, {
      corrector_id: correctorId,
    })
    return response.data
  },

  resolve: async (id, finalGrade, note = '') => {
    const response = await axios.post(`/discrepancies/${id}/resolve/`, {
      final_grade: finalGrade,
      note,
    })
    return response.data
  },
}