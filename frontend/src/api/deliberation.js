import axios from './axios'

export const deliberationAPI = {
  getRanking: async (sessionId) => {
    const response = await axios.get('/deliberation/ranking/', {
      params: { session: sessionId },
    })
    return response.data
  },

  closeSession: async (sessionId, decisions) => {
    const response = await axios.post('/deliberation/close_session/', {
      session_id: sessionId,
      decisions,
    })
    return response.data
  },

  getResults: async (sessionId) => {
    const response = await axios.get('/deliberation/results/', {
      params: { session: sessionId },
    })
    return response.data
  },
}