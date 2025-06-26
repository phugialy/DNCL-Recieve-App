'use client'

import { useState, useEffect } from 'react'
import CameraCapture from './components/CameraCapture'
import ImagePreview from './components/ImagePreview'
import OperatorModal from './components/OperatorModal'
import { storageUtils } from './utils/storage'

interface FormData {
  trackingNumber: string
}

interface ExtraDetail {
  image: File | null
  note: string
}

function getToday() {
  const d = new Date()
  return d.toISOString().slice(0, 10)
}

const MAX_DETAILS = 5

export default function Home() {
  // Operator modal state
  const [operatorConfirmed, setOperatorConfirmed] = useState(false)
  const [operatorName, setOperatorName] = useState('')
  const [operatorDate, setOperatorDate] = useState(getToday())

  // Main form state
  const [formData, setFormData] = useState<FormData>({ trackingNumber: '' })
  const [image1, setImage1] = useState<File | null>(null)
  const [image2, setImage2] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  // Extra details state
  const [details, setDetails] = useState<ExtraDetail[]>([])

  // On mount, load operator data if available
  useEffect(() => {
    const saved = storageUtils.loadOperatorData()
    if (saved.name) setOperatorName(saved.name)
    if (saved.date) setOperatorDate(saved.date)
  }, [])

  // Save operator data on confirm
  const handleOperatorConfirm = (name: string, date: string) => {
    setOperatorName(name)
    setOperatorDate(date)
    storageUtils.saveOperatorData({ name, date })
    setOperatorConfirmed(true)
  }

  const handleInputChange = (value: string) => {
    setFormData({ trackingNumber: value })
  }

  const handleImageCapture = (imageNumber: 1 | 2) => (file: File) => {
    if (imageNumber === 1) setImage1(file)
    else setImage2(file)
  }
  const handleImageRemove = (imageNumber: 1 | 2) => () => {
    if (imageNumber === 1) setImage1(null)
    else setImage2(null)
  }

  // Extra details handlers
  const handleAddDetail = () => {
    if (details.length < MAX_DETAILS) {
      setDetails([...details, { image: null, note: '' }])
    }
  }
  const handleDetailImage = (idx: number) => (file: File) => {
    setDetails(details => details.map((d, i) => i === idx ? { ...d, image: file } : d))
  }
  const handleDetailRemoveImage = (idx: number) => () => {
    setDetails(details => details.map((d, i) => i === idx ? { ...d, image: null } : d))
  }
  const handleDetailNote = (idx: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setDetails(details => details.map((d, i) => i === idx ? { ...d, note: e.target.value } : d))
  }

  const validateForm = (): boolean => {
    if (!formData.trackingNumber.trim()) {
      setErrorMessage('Please enter a tracking number')
      return false
    }
    if (!image1) {
      setErrorMessage('Please capture Tracking and Front of Device')
      return false
    }
    if (!image2) {
      setErrorMessage('Please capture Tracking and Back of Device')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    setIsSubmitting(true)
    setSubmitStatus('idle')
    setErrorMessage('')
    try {
      const formDataToSend = new FormData()
      formDataToSend.append('name', operatorName)
      formDataToSend.append('date', operatorDate)
      formDataToSend.append('trackingNumber', formData.trackingNumber)
      formDataToSend.append('image1', image1!)
      formDataToSend.append('image2', image2!)
      details.forEach((d, i) => {
        if (d.image) formDataToSend.append('detailsImages[]', d.image)
        formDataToSend.append('detailsNotes[]', d.note)
      })
      const response = await fetch('/api/session', {
        method: 'POST',
        body: formDataToSend
      })
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      setSubmitStatus('success')
      setFormData({ trackingNumber: '' })
      setImage1(null)
      setImage2(null)
      setDetails([])
    } catch (error) {
      setSubmitStatus('error')
      setErrorMessage('Failed to submit form. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = formData.trackingNumber && image1 && image2

  return (
    <div className="mobile-container py-6">
      {!operatorConfirmed && (
        <OperatorModal
          initialName={operatorName}
          initialDate={operatorDate}
          onConfirm={handleOperatorConfirm}
        />
      )}
      {operatorConfirmed && (
        <div className="max-w-md mx-auto">
          <header className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              DNCL Receive App
            </h1>
            <p className="text-gray-600">
              Tracking and Device Image Capture
            </p>
          </header>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="trackingNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Tracking Number *
                </label>
                <input
                  type="text"
                  id="trackingNumber"
                  value={formData.trackingNumber}
                  onChange={e => handleInputChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Scan or enter tracking number"
                  required
                />
              </div>
            </div>
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Capture Images</h2>
              <div className="space-y-4">
                <div>
                  <ImagePreview
                    image={image1}
                    label="Tracking and Front of Device"
                    onRemove={handleImageRemove(1)}
                  />
                  <div className="mt-2">
                    <CameraCapture
                      onCapture={handleImageCapture(1)}
                      label="Capture Tracking and Front of Device"
                      disabled={!!image1}
                    />
                  </div>
                </div>
                <div>
                  <ImagePreview
                    image={image2}
                    label="Tracking and Back of Device"
                    onRemove={handleImageRemove(2)}
                  />
                  <div className="mt-2">
                    <CameraCapture
                      onCapture={handleImageCapture(2)}
                      label="Capture Tracking and Back of Device"
                      disabled={!!image2}
                    />
                  </div>
                </div>
              </div>
            </div>
            {/* Extra Notes Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Extra Notes</h2>
              {details.map((d, idx) => (
                <div key={idx} className="flex flex-col gap-2 border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <ImagePreview
                      image={d.image}
                      label={`Detail Image ${idx + 1}`}
                      onRemove={handleDetailRemoveImage(idx)}
                    />
                  </div>
                  <div>
                    <CameraCapture
                      onCapture={handleDetailImage(idx)}
                      label={d.image ? 'Retake Image' : 'Capture Detail Image'}
                      disabled={!!d.image}
                    />
                  </div>
                  <input
                    type="text"
                    value={d.note}
                    onChange={handleDetailNote(idx)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent mt-2"
                    placeholder="Optional note for this image"
                  />
                </div>
              ))}
              {details.length < MAX_DETAILS && (
                <button
                  type="button"
                  onClick={handleAddDetail}
                  className="w-full flex items-center justify-center gap-2 bg-primary-100 text-primary-700 py-2 px-4 rounded-lg font-medium hover:bg-primary-200 transition-colors border border-primary-200"
                >
                  <span className="text-xl font-bold">+</span> Add Detail Image
                </button>
              )}
            </div>
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {errorMessage}
              </div>
            )}
            {submitStatus === 'success' && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                ✅ Form submitted successfully!
              </div>
            )}
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Form'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
} 