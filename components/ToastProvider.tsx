'use client'

import { useState, useCallback } from 'react'
import Toast from './Toast'

type ToastMessage = {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

let toastId = 0

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast-${toastId++}`
    setToasts((prev) => [...prev, { id, message, type }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  return { showToast, removeToast, toasts }
}

export function ToastContainer({ toasts, onRemove }: { toasts: ToastMessage[], onRemove: (id: string) => void }) {
  return (
    <>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </>
  )
}

