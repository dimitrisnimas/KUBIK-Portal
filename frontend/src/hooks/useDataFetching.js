import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import toast from 'react-hot-toast'

export function useDataFetching(url, defaultValue = []) {
  const [data, setData] = useState(defaultValue)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = async () => {
    if (!url) {
      setLoading(false)
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      const response = await api.get(url)
      setData(response.data)
    } catch (err) {
      console.error(`Error fetching data from ${url}:`, err)
      setError(err)
      
      // Only show toast for non-401 errors to avoid spam
      if (err.response?.status !== 401) {
        toast.error(`Αποτυχία φόρτωσης δεδομένων: ${err.response?.data?.error || err.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [url])

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    setData
  }
}
