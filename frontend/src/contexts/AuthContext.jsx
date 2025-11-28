import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../lib/api'

const AuthContext = createContext()

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    // During development hot-reload, context might be temporarily undefined
    if (import.meta.env.DEV) {
      console.warn('useAuth called outside AuthProvider context during hot reload')
      return {
        user: null,
        loading: true,
        login: async () => {},
        register: async () => {},
        logout: async () => {},
        resetPassword: async () => {},
        checkAuth: async () => {}
      }
    }
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await api.get('/auth/me')
      setUser(response.data.user)
    } catch (error) {
      console.log('Auth check failed:', error.message)
      // Don't redirect on 401 - just set user to null
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password })
    setUser(response.data.user)
    return response.data
  }

  const register = async (userData) => {
    const response = await api.post('/auth/register', userData)
    // Don't set user immediately for pending registrations
    // The user will be set after admin approval and login
    return response.data
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
    }
  }

  const resetPassword = async (email) => {
    const response = await api.post('/auth/reset', { email })
    return response.data
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    resetPassword,
    checkAuth
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 