'use client'

import { useRef, useState, useCallback, useEffect } from 'react'

interface CameraCaptureProps {
  onCapture: (file: File) => void
  label: string
  disabled?: boolean
}

function isIOS() {
  if (typeof window === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
}

function isGetUserMediaSupported() {
  return typeof window !== 'undefined' && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
}

export default function CameraCapture({ onCapture, label, disabled = false }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [useFileInput, setUseFileInput] = useState(false)

  // Detect iOS or lack of getUserMedia support
  useEffect(() => {
    if (isIOS() || !isGetUserMediaSupported()) {
      setUseFileInput(true)
    }
  }, [])

  const openCamera = useCallback(async () => {
    setError(null)
    if (useFileInput) {
      // Trigger file input click
      document.getElementById('file-input-' + label)?.click()
      return
    }
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      })
      setStream(mediaStream)
      setIsCameraOpen(true)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err) {
      setError('Unable to access camera. Please check permissions.')
      console.error('Camera access error:', err)
    }
  }, [useFileInput, label])

  const closeCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setIsCameraOpen(false)
    setError(null)
  }, [stream])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    if (!context) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `photo_${Date.now()}.jpg`, {
          type: 'image/jpeg'
        })
        onCapture(file)
        closeCamera()
      }
    }, 'image/jpeg', 0.8)
  }, [onCapture, closeCamera])

  // Handle file input fallback
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onCapture(file)
    }
    // Reset value so user can re-trigger the same input
    e.target.value = ''
  }

  return (
    <div className="space-y-4">
      {/* Hidden file input for iOS/fallback */}
      {useFileInput && (
        <input
          id={'file-input-' + label}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={handleFileInput}
          disabled={disabled}
        />
      )}
      {!isCameraOpen ? (
        <button
          onClick={openCamera}
          disabled={disabled}
          className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          📷 {label}
        </button>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-64 object-cover rounded-lg bg-black"
            />
            <canvas
              ref={canvasRef}
              className="hidden"
            />
          </div>
          <div className="flex space-x-2">
            <button
              onClick={capturePhoto}
              className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              📸 Capture
            </button>
            <button
              onClick={closeCamera}
              className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              ❌ Cancel
            </button>
          </div>
        </div>
      )}
      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
          {error}
        </div>
      )}
    </div>
  )
} 