import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

// Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Auth token ekle (varsa)
    const token = localStorage.getItem('auth-token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Global error handling
    if (error.response?.status === 401) {
      localStorage.removeItem('auth-token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Articles API
export const articlesApi = {
  getLatest: async (limit = 20) => {
    const response = await api.get(`/articles?limit=${limit}`)
    return response.data
  },
  
  getBySource: async (sourceId: number, limit = 20) => {
    const response = await api.get(`/articles/source/${sourceId}?limit=${limit}`)
    return response.data
  },
  
  search: async (params: Record<string, any>) => {
    const response = await api.get('/articles', { params })
    return response.data
  }
}

// Sources API
export const sourcesApi = {
  getAll: async () => {
    const response = await api.get('/sources')
    return response.data
  }
}

// Financial API
export const financialApi = {
  getExchangeRates: async () => {
    const response = await api.get('/financial/exchange-rates')
    return response.data
  }
}

// Auth API
export const authApi = {
  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post('/auth/login', credentials)
    return response.data
  },
  
  register: async (userData: { email: string; password: string; firstName: string; lastName: string }) => {
    const response = await api.post('/auth/register', userData)
    return response.data
  }
}

export default api 