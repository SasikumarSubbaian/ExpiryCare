# Handwriting Detection Service

Preprocessing step that detects whether an uploaded image contains handwritten text before OCR runs.

## Purpose

Handwriting detection helps:
- Set appropriate OCR expectations
- Adjust preprocessing if needed
- Provide user feedback about image quality
- Improve OCR accuracy by knowing text type

## Heuristics Used

### 1. Irregular Character Spacing
- **Handwriting:** Variable spacing between characters
- **Printed:** Consistent, uniform spacing
- **Detection:** Calculate variance in spacing between text pixels

### 2. Inconsistent Baseline
- **Handwriting:** Text doesn't follow a straight line
- **Printed:** Text follows consistent baseline
- **Detection:** Calculate variance in baseline position across text lines

### 3. Text Slant
- **Handwriting:** Often has 5-15 degree slant (italic-like)
- **Printed:** Usually vertical or minimal slant
- **Detection:** Analyze vertical edges to detect slant angle

### 4. Variable Stroke Width
- **Handwriting:** More variation in stroke thickness
- **Printed:** More consistent stroke width
- **Detection:** Calculate variance in stroke widths

## Algorithm

1. **Convert to grayscale** for analysis
2. **Sample image** at strategic points (performance optimization)
3. **Analyze features:**
   - Extract baseline points from text lines
   - Measure character spacing
   - Detect text slant from vertical edges
   - Measure stroke width variation
4. **Calculate handwriting score:**
   - Baseline variance > 5 pixels → +20 points
   - Character spacing variance > 3 → +20 points
   - Text slant 5-15 degrees → +15 points
   - Stroke width variance > 2 → +15 points
5. **Threshold:** Score > 60 = handwritten, ≤ 60 = printed

## Usage

```typescript
import { detectHandwriting } from '@/lib/ocr/handwriting-detection'

const result = await detectHandwriting(imageBuffer)

console.log(result.imageType) // 'handwritten' | 'printed'
console.log(result.confidence) // 0-100
console.log(result.features) // Detailed feature analysis
```

## Integration

Automatically runs before OCR in:
- `/api/ocr` endpoint
- `/api/extract-expiry` endpoint

Detection happens **before** OCR preprocessing to analyze original image characteristics.

## Response Format

```typescript
{
  imageType: 'handwritten' | 'printed',
  confidence: number, // 0-100
  features: {
    characterSpacingVariance: number,
    baselineVariance: number,
    textSlant: number,
    strokeWidthVariance: number
  }
}
```

## Performance

- **Fast:** Analyzes subset of image (sampling)
- **Lightweight:** No ML models required
- **Reliable:** Heuristic-based, works offline

## Limitations

- Works best on clear images
- May misclassify stylized printed text
- Requires sufficient text in image
- Performance depends on image size

## Future Enhancements

- ML-based detection (if needed)
- Adaptive thresholds
- Multi-language support
- Confidence calibration

