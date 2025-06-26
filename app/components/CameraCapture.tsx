'use client'

import { useRef, useState, useCallback } from 'react'

interface CameraCaptureProps {
  onCapture: (file: File) => void
  label: string
  disabled?: boolean
}

export default function CameraCapture({ onCapture, label, disabled = false }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const openCamera = useCallback(async () => {
    try {
      setError(null)
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Use back camera on mobile
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
  }, [])

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

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convert canvas to blob
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

  return (
    <div className="space-y-4">
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