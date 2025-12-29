'use client'

import { useState, useRef, useEffect } from 'react'

type ImageCropModalProps = {
  isOpen: boolean
  imageUrl: string
  onCrop: (croppedImageBlob: Blob) => void
  onCancel: () => void
  title?: string
}

/**
 * Image Crop Modal Component
 * Allows user to manually crop an image to focus on expiry date area
 */
export default function ImageCropModal({
  isOpen,
  imageUrl,
  onCrop,
  onCancel,
  title = 'Crop Expiry Date Area',
}: ImageCropModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 200, height: 100 })
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      imageRef.current = img
      setImageSize({ width: img.width, height: img.height })
      setImageLoaded(true)

      // Initialize crop area to center, 40% of image size
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth - 40
        const containerHeight = containerRef.current.clientHeight - 40
        const scaleX = containerWidth / img.width
        const scaleY = containerHeight / img.height
        const scale = Math.min(scaleX, scaleY, 1)

        const displayWidth = img.width * scale
        const displayHeight = img.height * scale

        setCropArea({
          x: (displayWidth - displayWidth * 0.4) / 2,
          y: (displayHeight - displayHeight * 0.3) / 2,
          width: displayWidth * 0.4,
          height: displayHeight * 0.3,
        })
        setContainerSize({ width: displayWidth, height: displayHeight })
      }
    }
    img.src = imageUrl
  }, [isOpen, imageUrl])

  useEffect(() => {
    if (!imageLoaded || !canvasRef.current || !imageRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size to match container
    if (containerRef.current) {
      canvas.width = containerRef.current.clientWidth
      canvas.height = containerRef.current.clientHeight
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw image
    const img = imageRef.current
    const scaleX = canvas.width / img.width
    const scaleY = canvas.height / img.height
    const scale = Math.min(scaleX, scaleY, 1)

    const x = (canvas.width - img.width * scale) / 2
    const y = (canvas.height - img.height * scale) / 2

    ctx.drawImage(img, x, y, img.width * scale, img.height * scale)

    // Draw overlay (darken outside crop area)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.clearRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height)

    // Draw crop area border
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 2
    ctx.setLineDash([])
    ctx.strokeRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height)

    // Draw corner handles
    const handleSize = 12
    ctx.fillStyle = '#3b82f6'
    const corners = [
      { x: cropArea.x, y: cropArea.y },
      { x: cropArea.x + cropArea.width, y: cropArea.y },
      { x: cropArea.x, y: cropArea.y + cropArea.height },
      { x: cropArea.x + cropArea.width, y: cropArea.y + cropArea.height },
    ]

    corners.forEach((corner) => {
      ctx.fillRect(corner.x - handleSize / 2, corner.y - handleSize / 2, handleSize, handleSize)
    })

    // Draw instructions
    ctx.fillStyle = 'white'
    ctx.font = '14px sans-serif'
    ctx.fillText('Drag to move, drag corners to resize', 10, 30)
  }, [imageLoaded, cropArea, imageSize])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!imageLoaded) return

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Check if clicking on corner handle
    const handleSize = 12
    const corners = [
      { x: cropArea.x, y: cropArea.y, handle: 'nw' },
      { x: cropArea.x + cropArea.width, y: cropArea.y, handle: 'ne' },
      { x: cropArea.x, y: cropArea.y + cropArea.height, handle: 'sw' },
      { x: cropArea.x + cropArea.width, y: cropArea.y + cropArea.height, handle: 'se' },
    ]

    for (const corner of corners) {
      if (
        Math.abs(x - corner.x) < handleSize &&
        Math.abs(y - corner.y) < handleSize
      ) {
        setResizeHandle(corner.handle)
        setIsDragging(true)
        setDragStart({ x, y })
        return
      }
    }

    // Check if clicking inside crop area (for moving)
    if (
      x >= cropArea.x &&
      x <= cropArea.x + cropArea.width &&
      y >= cropArea.y &&
      y <= cropArea.y + cropArea.height
    ) {
      setIsDragging(true)
      setResizeHandle(null)
      setDragStart({ x: x - cropArea.x, y: y - cropArea.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !imageLoaded || !canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (resizeHandle) {
      // Resize crop area
      const minSize = 50
      let newCropArea = { ...cropArea }

      if (resizeHandle === 'nw') {
        newCropArea.width = cropArea.width + (cropArea.x - x)
        newCropArea.height = cropArea.height + (cropArea.y - y)
        newCropArea.x = Math.max(0, x)
        newCropArea.y = Math.max(0, y)
      } else if (resizeHandle === 'ne') {
        newCropArea.width = x - cropArea.x
        newCropArea.height = cropArea.height + (cropArea.y - y)
        newCropArea.y = Math.max(0, y)
      } else if (resizeHandle === 'sw') {
        newCropArea.width = cropArea.width + (cropArea.x - x)
        newCropArea.height = y - cropArea.y
        newCropArea.x = Math.max(0, x)
      } else if (resizeHandle === 'se') {
        newCropArea.width = x - cropArea.x
        newCropArea.height = y - cropArea.y
      }

      // Enforce minimum size
      if (newCropArea.width < minSize) {
        newCropArea.width = minSize
      }
      if (newCropArea.height < minSize) {
        newCropArea.height = minSize
      }

      // Keep within bounds
      if (newCropArea.x + newCropArea.width > containerSize.width) {
        newCropArea.width = containerSize.width - newCropArea.x
      }
      if (newCropArea.y + newCropArea.height > containerSize.height) {
        newCropArea.height = containerSize.height - newCropArea.y
      }

      setCropArea(newCropArea)
    } else {
      // Move crop area
      const newX = Math.max(0, Math.min(x - dragStart.x, containerSize.width - cropArea.width))
      const newY = Math.max(0, Math.min(y - dragStart.y, containerSize.height - cropArea.height))
      setCropArea({ ...cropArea, x: newX, y: newY })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setResizeHandle(null)
  }

  const handleCrop = () => {
    if (!imageRef.current || !canvasRef.current) return

    const img = imageRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Calculate scale factor
    const scaleX = canvas.width / img.width
    const scaleY = canvas.height / img.height
    const scale = Math.min(scaleX, scaleY, 1)

    const imageX = (canvas.width - img.width * scale) / 2
    const imageY = (canvas.height - img.height * scale) / 2

    // Calculate crop coordinates in original image space
    const cropX = (cropArea.x - imageX) / scale
    const cropY = (cropArea.y - imageY) / scale
    const cropWidth = cropArea.width / scale
    const cropHeight = cropArea.height / scale

    // Create new canvas for cropped image
    const cropCanvas = document.createElement('canvas')
    cropCanvas.width = cropWidth
    cropCanvas.height = cropHeight
    const cropCtx = cropCanvas.getContext('2d')
    if (!cropCtx) return

    // Draw cropped portion
    cropCtx.drawImage(
      img,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    )

    // Convert to blob
    cropCanvas.toBlob((blob) => {
      if (blob) {
        onCrop(blob)
      }
    }, 'image/png', 1.0)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">
            Crop the area containing the expiry date for better accuracy
          </p>
        </div>

        <div className="flex-1 p-6 overflow-auto">
          <div
            ref={containerRef}
            className="relative bg-gray-100 rounded-lg overflow-hidden"
            style={{ minHeight: '400px' }}
          >
            <canvas
              ref={canvasRef}
              className="w-full h-full cursor-move"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          </div>

          <div className="mt-4 text-sm text-gray-600">
            <p>• Drag the blue box to move it</p>
            <p>• Drag the blue corners to resize</p>
            <p>• Position it over the expiry date area</p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCrop}
            disabled={!imageLoaded}
            className="flex-1 px-4 py-2 border border-transparent rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Use Cropped Image
          </button>
        </div>
      </div>
    </div>
  )
}

