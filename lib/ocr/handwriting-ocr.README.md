# Handwriting-Optimized OCR Pipeline

Specialized OCR pipeline for handwritten text with aggressive preprocessing and dual-pass recognition.

## Purpose

Handwritten text requires different OCR strategies than printed text:
- More aggressive preprocessing needed
- Different Tesseract PSM modes work better
- Multiple passes improve accuracy
- Confidence merging provides better results

## Pipeline Flow

```
1. Detect handwriting (imageType === "handwritten")
2. Apply aggressive preprocessing:
   - Increase contrast
   - Adaptive thresholding
   - Noise removal
   - Stroke thickening
3. Run OCR Pass 1: PSM 6 (Uniform block)
4. Apply alternative preprocessing
5. Run OCR Pass 2: PSM 11 (Sparse text)
6. Merge results by confidence
7. Return merged text + average confidence
```

## Aggressive Preprocessing

### Primary Preprocessing (Pass 1)
1. **Grayscale conversion**
2. **Gamma correction** (1.2) - Enhance brightness
3. **Contrast increase** (20% linear)
4. **Normalization** - Stretch histogram
5. **Sharpening** - Enhance text edges
6. **Thresholding** (128) - Binarization
7. **Noise removal** - Light blur + sharpen
8. **Stroke thickening** - Light blur + threshold

### Alternative Preprocessing (Pass 2)
1. **Higher gamma** (1.5) - More aggressive
2. **Higher contrast** (30% linear)
3. **Lower threshold** (110) - Preserve more detail
4. **Stronger sharpening** - More edge enhancement
5. **Minimal noise removal** - Preserve detail

## Dual OCR Pass

### Pass 1: PSM 6 (Uniform Block)
- **PSM Mode:** 6 - Uniform block of text
- **Engine:** OEM 1 (LSTM)
- **Use Case:** Handwritten text in blocks/paragraphs
- **Preprocessing:** Primary aggressive preprocessing

### Pass 2: PSM 11 (Sparse Text)
- **PSM Mode:** 11 - Sparse text
- **Engine:** OEM 1 (LSTM)
- **Use Case:** Handwritten text with irregular spacing
- **Preprocessing:** Alternative preprocessing

## Result Merging

Results are merged intelligently:

1. **Sort by confidence** (highest first)
2. **Use primary result** (highest confidence) as base
3. **Calculate average confidence** from all passes
4. **Merge unique words** from secondary if:
   - Secondary confidence > 0
   - Confidence difference < 10%
   - Words are unique (not in primary)

## Response Format

```typescript
{
  rawText: string,           // Merged text from both passes
  averageConfidence: number, // Average of all passes
  passes: Array<{
    psm: string,            // PSM mode used
    confidence: number,     // Confidence for this pass
    textLength: number      // Text length for this pass
  }>
}
```

## Usage

```typescript
import { runHandwritingOCR } from '@/lib/ocr/handwriting-ocr'

const result = await runHandwritingOCR(imageBuffer, 30000)

console.log(result.rawText)              // Merged text
console.log(result.averageConfidence)    // Average confidence
console.log(result.passes)                // Individual pass results
```

## Automatic Integration

The pipeline is automatically used when:
- `imageType === "handwritten"` is detected
- Called via `extractTextFromImage()` with `imageType` parameter
- Integrated in `/api/ocr` and `/api/extract-expiry` endpoints

## Performance

- **Time:** ~2x standard OCR (dual pass)
- **Accuracy:** Significantly improved for handwritten text
- **Fallback:** Falls back to standard OCR on error

## Logging

```
[Handwriting OCR] Starting optimized pipeline...
[Handwriting Preprocessing] Starting aggressive preprocessing...
[Handwriting OCR] Pass 1: PSM 6 (Uniform block)...
[Handwriting OCR] PSM 6 Progress: 50%
[Handwriting OCR] PSM 6 completed - Confidence: 75.2%, Text: 45 chars
[Handwriting OCR] Pass 2: PSM 11 (Sparse text)...
[Handwriting OCR] PSM 11 Progress: 50%
[Handwriting OCR] PSM 11 completed - Confidence: 72.8%, Text: 42 chars
[Handwriting OCR] Merged result - Confidence: 74.0%, Text: 48 chars
```

## Benefits

✅ **Higher Accuracy** - Dual pass catches more text
✅ **Better Preprocessing** - Aggressive enhancements for handwriting
✅ **Confidence Merging** - Uses best results from both passes
✅ **Automatic** - No manual configuration needed
✅ **Fallback** - Gracefully falls back on errors

