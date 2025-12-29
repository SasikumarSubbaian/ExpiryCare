# Image Crop Modal

Interactive image cropping component for improving OCR accuracy on low-confidence scans.

## Purpose

When OCR confidence is below 60%, users can manually crop the expiry date area to improve accuracy. This is especially useful for medicine strips where the expiry date might be small or in a specific location.

## Features

✅ **Interactive Cropping**
- Drag to move crop area
- Drag corners to resize
- Visual feedback with blue border
- Dark overlay outside crop area

✅ **Canvas-Based Rendering**
- High-quality image display
- Precise pixel-level cropping
- Maintains image quality

✅ **User-Friendly**
- Clear instructions
- Visual handles on corners
- Responsive design

## Usage

```typescript
<ImageCropModal
  isOpen={showCropModal}
  imageUrl={imageUrl}
  onCrop={(croppedBlob) => {
    // Process cropped image
    processDocument(croppedBlob)
  }}
  onCancel={() => {
    // Use original results
    setShowCropModal(false)
  }}
  title="Crop Expiry Date Area"
/>
```

## How It Works

1. **User uploads image** → OCR runs
2. **OCR confidence < 60%** → Crop modal appears
3. **User crops expiry area** → Drags/resizes blue box
4. **User clicks "Use Cropped Image"** → Cropped image created
5. **Second OCR pass** → Runs on cropped image only
6. **Results merged** → Prefer cropped results for expiry date

## Crop Area

- **Initial size:** 40% width, 30% height of image
- **Initial position:** Centered
- **Minimum size:** 50x50 pixels
- **Resize handles:** Blue squares on corners
- **Border:** Blue 2px solid line

## Technical Details

- Uses HTML5 Canvas for rendering
- Converts crop coordinates to original image space
- Exports as PNG blob
- Maintains aspect ratio
- Handles image scaling correctly

## Integration with OCR Flow

The crop modal is automatically triggered when:
- OCR confidence < 60%
- First pass completed
- User is on Pro/Family plan

After cropping:
- Second OCR pass runs on cropped image
- Results are merged intelligently:
  - Expiry date: Prefer cropped result (more accurate)
  - Other fields: Prefer first pass (more context)

