import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    config.withCredentials = true // Always send cookies
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (
      error.response?.status === 401 &&
      !error.config.url.includes('/auth/me') &&
      !window.location.pathname.startsWith('/login')
    ) {
      toast.error('Η συνεδρία σας έληξε. Παρακαλώ συνδεθείτε ξανά.')
      setTimeout(() => {
        window.location.href = '/login'
      }, 1000)
    }
    return Promise.reject(error)
  }
)

export { api } 