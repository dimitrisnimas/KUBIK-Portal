import { useState } from 'react'

export function useFileAttachments() {
  const [files, setFiles] = useState([])

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files)
    setFiles(prev => [...prev, ...selectedFiles])
  }

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const clearFiles = () => {
    setFiles([])
  }

  const addFiles = (newFiles) => {
    const fileArray = Array.isArray(newFiles) ? newFiles : [newFiles]
    setFiles(prev => [...prev, ...fileArray])
  }

  const getFileNames = () => {
    return files.map(file => file.name)
  }

  const getTotalSize = () => {
    return files.reduce((total, file) => total + file.size, 0)
  }

  return {
    files,
    handleFileChange,
    removeFile,
    clearFiles,
    addFiles,
    getFileNames,
    getTotalSize,
    hasFiles: files.length > 0
  }
}

