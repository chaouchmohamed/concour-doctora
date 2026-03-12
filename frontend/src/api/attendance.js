import axios from './axios'

export const attendanceAPI = {
  getAll: async (params = {}) => {
    const response = await axios.get('/attendance/', { params })
    return response.data
  },

  mark: async (data) => {
    const response = await axios.post('/attendance/', data)
    return response.data
  },

  markBulk: async (sessionId, attendance) => {
    const response = await axios.post('/attendance/bulk/', {
      session_id: sessionId,
      attendance,
    })
    return response.data
  },

  getBySession: async (sessionId) => {
    const response = await axios.get('/attendance/', {
      params: { session: sessionId },
    })
    return response.data
  },
}