// Test version with mock data
import { mockCandidates, mockSessions, mockCopies, mockDiscrepancies, mockAuditLogs } from '../mocks/testData'

// Simulate API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

export const mockAxios = {
  get: async (url, config) => {
    await delay(500) // Simulate network delay
    
    console.log('Mock GET:', url, config)
    
    if (url.includes('/candidates')) {
      if (url.includes('/candidates/')) {
        const id = url.split('/').pop()
        const candidate = mockCandidates.find(c => c.id === parseInt(id))
        return { data: candidate || mockCandidates[0] }
      }
      return { 
        data: {
          results: mockCandidates,
          count: mockCandidates.length,
        }
      }
    }
    
    if (url.includes('/sessions')) {
      if (url.includes('/sessions/')) {
        const id = url.split('/').pop()
        const session = mockSessions.find(s => s.id === parseInt(id))
        return { data: session || mockSessions[0] }
      }
      return { data: mockSessions }
    }
    
    if (url.includes('/copies')) {
      return { data: mockCopies }
    }
    
    if (url.includes('/discrepancies')) {
      return { data: mockDiscrepancies }
    }
    
    if (url.includes('/audit-logs')) {
      return { 
        data: mockAuditLogs
      }
    }
    
    if (url.includes('/auth/me')) {
      return { 
        data: {
          id: 1,
          username: 'admin',
          email: 'admin@esi-sba.dz',
          first_name: 'Admin',
          last_name: 'User',
          profile: { role: 'ADMIN' }
        }
      }
    }
    
    if (url.includes('/dashboard/stats')) {
      return {
        data: {
          total_candidates: 45,
          total_present: 32,
          pending_corrections: 12,
          active_discrepancies: 3,
          active_session: mockSessions[0]
        }
      }
    }
    
    return { data: [] }
  },
  
  post: async (url, data) => {
    await delay(500)
    console.log('Mock POST:', url, data)
    
    if (url.includes('/auth/login')) {
      const { username, password } = data
      if (username === 'admin@esi-sba.dz' && password === 'Admin123!') {
        return {
          data: {
            access: 'mock-access-token-12345',
            refresh: 'mock-refresh-token-12345',
            user: {
              id: 1,
              username: 'admin',
              email: 'admin@esi-sba.dz',
              first_name: 'Admin',
              last_name: 'User',
              profile: { role: 'ADMIN' }
            }
          }
        }
      }
      throw { response: { status: 401, data: { error: 'Invalid credentials' } } }
    }
    
    return { data: { success: true, id: 999 } }
  },
  
  put: async (url, data) => {
    await delay(500)
    console.log('Mock PUT:', url, data)
    return { data: { success: true } }
  },
  
  delete: async (url) => {
    await delay(500)
    console.log('Mock DELETE:', url)
    return { data: { success: true } }
  }
}

// Replace this in your API files for testing
// import axios from './axios'
// Change to: import { mockAxios as axios } from './axios.test'