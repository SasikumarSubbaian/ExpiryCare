# Confidence Guardrail

Validation layer that checks confidence scores and flags fields requiring user confirmation.

## Purpose

Prevent auto-saving low-confidence data by validating confidence scores and identifying fields that need user confirmation.

## Rules

- **If expiryConfidence < 70**: Mark expiryDate as "needs confirmation"
- **If companyConfidence < 60**: Allow manual entry
- **Never auto-save low-confidence fields**

## Confidence Thresholds

```typescript
{
  expiry: 70,      // Expiry date requires 70%+ confidence
  company: 60,     // Company name requires 60%+ confidence
  product: 50,     // Product name requires 50%+ confidence
  category: 50,    // Category requires 50%+ confidence
}
```

## Usage

### Basic Validation

```typescript
import { validateConfidence } from '@/lib/ai/confidenceGuardrail'
import type { ReasoningEngineOutput } from '@/lib/ai/reasoningEngine'

const output: ReasoningEngineOutput = {
  expiryDate: "2022-02-22",
  expiryConfidence: 65,  // Below threshold (70)
  companyName: "Lakshay Manufacture",
  companyConfidence: 55,  // Below threshold (60)
  itemCategory: "other",
  productName: null,
  detectedKeywords: ["WARRANTY", "VALID UP TO"]
}

const validation = validateConfidence(output)

console.log(validation.requiresUserConfirmation)  // true
console.log(validation.weakFields)                 // ["expiryDate", "companyName"]
```

### Check if Field Can Be Auto-Saved

```typescript
import { canAutoSave } from '@/lib/ai/confidenceGuardrail'

// Check if expiry date can be auto-saved
if (canAutoSave('expiryDate', output)) {
  // Auto-save expiry date
  setExpiryDate(output.expiryDate)
} else {
  // Require user confirmation
  showConfirmationDialog('expiryDate', output.expiryDate)
}
```

### Get Confidence Threshold

```typescript
import { getConfidenceThreshold } from '@/lib/ai/confidenceGuardrail'

const threshold = getConfidenceThreshold('expiryDate')  // 70
```

## Response Format

```typescript
{
  requiresUserConfirmation: boolean,
  weakFields: string[],
  fieldStatus: {
    expiryDate: {
      needsConfirmation: boolean,
      confidence: number,
      threshold: number
    },
    companyName: {
      needsConfirmation: boolean,
      confidence: number,
      threshold: number
    },
    productName: {
      needsConfirmation: boolean,
      confidence: number,
      threshold: number
    },
    itemCategory: {
      needsConfirmation: boolean,
      confidence: number,
      threshold: number
    }
  }
}
```

## API Integration

The confidence guardrail is automatically integrated into the reasoning engine API route:

```bash
POST /api/ai/reasoning-engine

Response:
{
  "expiryDate": "2022-02-22",
  "expiryConfidence": 65,
  "companyName": "Lakshay Manufacture",
  "companyConfidence": 55,
  "itemCategory": "other",
  "productName": null,
  "detectedKeywords": ["WARRANTY", "VALID UP TO"],
  "validation": {
    "requiresUserConfirmation": true,
    "weakFields": ["expiryDate", "companyName"]
  }
}
```

## Examples

### Example 1: Low Confidence Expiry Date

```typescript
const output = {
  expiryDate: "2022-02-22",
  expiryConfidence: 65,  // Below 70 threshold
  companyName: "Lakshay",
  companyConfidence: 90,
  // ...
}

const validation = validateConfidence(output)
// validation.requiresUserConfirmation = true
// validation.weakFields = ["expiryDate"]
```

### Example 2: Low Confidence Company Name

```typescript
const output = {
  expiryDate: "2022-02-22",
  expiryConfidence: 95,
  companyName: "Lakshay",
  companyConfidence: 55,  // Below 60 threshold
  // ...
}

const validation = validateConfidence(output)
// validation.requiresUserConfirmation = true
// validation.weakFields = ["companyName"]
```

### Example 3: All Fields High Confidence

```typescript
const output = {
  expiryDate: "2022-02-22",
  expiryConfidence: 95,
  companyName: "Lakshay",
  companyConfidence: 90,
  // ...
}

const validation = validateConfidence(output)
// validation.requiresUserConfirmation = false
// validation.weakFields = []
```

## Frontend Integration

```typescript
// In your form component
const handleOCRResult = async (rawText: string) => {
  const response = await fetch('/api/ai/reasoning-engine', {
    method: 'POST',
    body: JSON.stringify({ rawText }),
  })
  
  const data = await response.json()
  
  // Check if user confirmation is required
  if (data.validation.requiresUserConfirmation) {
    // Show confirmation dialog for weak fields
    showConfirmationDialog(data.validation.weakFields, data)
  } else {
    // Auto-save all fields
    autoSaveFields(data)
  }
}
```

## Notes

- **Never auto-save** fields in `weakFields` array
- **Always require confirmation** for fields with confidence below threshold
- **Product name and category** confidence is inferred from other fields if not explicitly provided
- **Thresholds are configurable** via `CONFIDENCE_THRESHOLDS` constant

