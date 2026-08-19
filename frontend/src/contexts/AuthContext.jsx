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
        requestOtp: async () => {},
        verifyOtp: async () => {},
        logout: async () => {},
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

  const requestOtp = async (email, role) => {
    const response = await api.post('/auth/otp/request', { email, role })
    return response.data
  }

  const verifyOtp = async (email, role, code) => {
    const response = await api.post('/auth/otp/verify', { email, role, code })
    setUser(response.data.user)
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

  const value = {
    user,
    loading,
    requestOtp,
    verifyOtp,
    logout,
    checkAuth
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
