'use client'

import { useState, useEffect } from 'react'

interface OperatorModalProps {
  initialName: string
  initialDate: string
  onConfirm: (name: string, date: string) => void
}

export default function OperatorModal({ initialName, initialDate, onConfirm }: OperatorModalProps) {
  const [name, setName] = useState(initialName)
  const [date] = useState(initialDate) // date is fixed
  const [error, setError] = useState('')
  const [blocked, setBlocked] = useState(false)

  // Prevent closing with Escape or click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setBlocked(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleConfirm = () => {
    if (!name.trim()) {
      setError('Please enter your name')
      return
    }
    onConfirm(name.trim(), date)
  }

  // Only block if background is clicked
  const handleBackdropClick = () => {
    setBlocked(true)
  }

  // Prevent modal card clicks from bubbling to backdrop
  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40" onClick={handleBackdropClick}>
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-xs relative" onClick={stopPropagation}>
        <h2 className="text-lg font-bold mb-4 text-center">Operator Confirmation</h2>
        {blocked ? (
          <div className="text-red-600 text-center font-semibold">
            Unable to identify operator.<br />Please reload and verify.
          </div>
        ) : (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Operator Name *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                autoFocus
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Date (Today)</label>
              <input
                type="date"
                value={date}
                disabled
                className="w-full px-3 py-2 border border-gray-200 bg-gray-100 rounded-lg text-gray-500 cursor-not-allowed"
                tabIndex={-1}
              />
            </div>
            {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
            <button
              className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-primary-700 transition-colors"
              onClick={handleConfirm}
            >
              Ready
            </button>
          </>
        )}
      </div>
    </div>
  )
} 