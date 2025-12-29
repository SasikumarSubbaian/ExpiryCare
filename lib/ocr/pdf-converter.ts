// PDF to image conversion utility
// Note: canvas and pdfjs-dist are optional dependencies
// This module will fail gracefully if they're not available

/**
 * Convert PDF first page to image buffer
 */
export async function convertPdfToImage(
  pdfBuffer: Buffer
): Promise<Buffer> {
  try {
    // Import pdfjs-dist (optional dependency)
    // @ts-ignore - pdfjs-dist is optional dependency
    const pdfjsLib = await import('pdfjs-dist')

    // Configure worker for Node.js
    if (typeof window === 'undefined') {
      try {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
      } catch (workerError) {
        // Worker setup failed, continue without worker
        console.warn('[PDF] Worker setup warning:', workerError)
      }
    }

    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({
      data: pdfBuffer,
      verbosity: 0,
    })

    const pdf = await loadingTask.promise

    if (pdf.numPages === 0) {
      throw new Error('PDF has no pages')
    }

    // Get first page
    const page = await pdf.getPage(1)
    const viewport = page.getViewport({ scale: 2.0 }) // 2x scale for quality

    // Import canvas dynamically (optional dependency)
    // @ts-ignore - canvas is optional dependency
    const canvasModule = await import('canvas')
    const createCanvas = canvasModule.createCanvas
    
    // Create canvas
    const canvas = createCanvas(
      Math.floor(viewport.width),
      Math.floor(viewport.height)
    )
    const context = canvas.getContext('2d')

    // Fill white background
    context.fillStyle = '#FFFFFF'
    context.fillRect(0, 0, canvas.width, canvas.height)

    // Render PDF page
    const renderContext = {
      canvasContext: context as any,
      viewport: viewport,
    }

    await page.render(renderContext).promise

    // Convert canvas to PNG buffer
    const imageBuffer = canvas.toBuffer('image/png')
    return imageBuffer
  } catch (error: any) {
    throw new Error(`PDF conversion failed: ${error.message}`)
  }
}

