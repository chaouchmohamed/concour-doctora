import axios from './axios'

export const dashboardAPI = {
  getStats: async () => {
    const response = await axios.get('/dashboard/stats/')
    return response.data
  },

  getActivityFeed: async () => {
    const response = await axios.get('/dashboard/activity_feed/')
    return response.data
  },
}