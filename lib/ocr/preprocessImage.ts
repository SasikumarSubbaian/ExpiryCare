/**
 * Image Preprocessing for OCR
 * Simple preprocessing to improve OCR accuracy
 */
import sharp from 'sharp'

export async function preprocessImage(inputBuffer: Buffer): Promise<Buffer> {
  return sharp(inputBuffer)
    .resize({ width: 1600, withoutEnlargement: true })
    .grayscale()
    .normalize()
    .png()
    .toBuffer()
}
