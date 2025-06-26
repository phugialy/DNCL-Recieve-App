'use client'

interface ImagePreviewProps {
  image: File | null
  label: string
  onRemove: () => void
}

export default function ImagePreview({ image, label, onRemove }: ImagePreviewProps) {
  if (!image) {
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500">
        <div className="text-2xl mb-2">📷</div>
        <div>{label}</div>
      </div>
    )
  }

  return (
    <div className="relative border border-gray-200 rounded-lg overflow-hidden">
      <img
        src={URL.createObjectURL(image)}
        alt={label}
        className="w-full h-48 object-cover"
      />
      <div className="absolute top-2 right-2">
        <button
          onClick={onRemove}
          className="bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-700 transition-colors"
          aria-label="Remove image"
        >
          ✕
        </button>
      </div>
      <div className="p-3 bg-gray-50">
        <div className="text-sm font-medium text-gray-700">{label}</div>
        <div className="text-xs text-gray-500">
          {(image.size / 1024 / 1024).toFixed(2)} MB
        </div>
      </div>
    </div>
  )
} 