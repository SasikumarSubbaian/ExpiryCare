# Enhanced Add Item Modal

Frontend component with OCR + AI integration, visual progress tracking, and trust-building UX.

## Features

✅ **Document Upload**
- Accepts images (JPG, PNG, WEBP) and PDFs
- Max file size: 10MB
- Automatic processing for Pro/Family plans

✅ **Visual OCR Progress**
- Step-by-step progress visualization
- Progress bar with percentage
- Status messages for each step:
  - Uploading document...
  - Running OCR...
  - Extracting text...
  - Parsing with AI...

✅ **AI Prefill**
- Automatically fills form fields from parsed data
- Tracks which fields are auto-detected
- "Auto-detected" labels on filled fields
- Blue highlight on auto-filled fields

✅ **Confidence Warnings**
- Shows warning if AI confidence < 70%
- Orange alert box with confidence percentage
- Encourages user review

✅ **Editable Fields**
- All fields are editable
- Auto-detected label removed when user edits
- User has full control

✅ **No Auto-Save**
- Never saves without user confirmation
- User must click "Add Item" button
- Form validation before submission

## UI Components

### Progress Visualization
```
┌─────────────────────────────────────┐
│ Processing Document...        40%  │
│ ████████░░░░░░░░░░░░░░░░░░░░░░░░░  │
│ ⏳ Extracting text...              │
└─────────────────────────────────────┘
```

### Auto-Detected Fields
```
┌─────────────────────────────────────┐
│ Title: [iPhone 14 Warranty] [Auto-  │
│        detected]                     │
└─────────────────────────────────────┘
```

### Confidence Warning
```
┌─────────────────────────────────────┐
│ ⚠ Low Confidence Detected          │
│ AI confidence is 65.0%. Please     │
│ review all auto-filled fields...    │
└─────────────────────────────────────┘
```

## Form Fields

1. **Document Upload** (Pro/Family only)
   - File input with drag & drop
   - Shows file name when selected
   - Remove button

2. **Category**
   - Dropdown with all categories
   - Auto-detected if found in document

3. **Title / Medicine Name**
   - Text input
   - Auto-filled from product name
   - Required for non-medicine items

4. **Expiry Date**
   - Date picker
   - Auto-filled from parsed data
   - Required field

5. **Manufacturing Date** (optional)
   - Date picker
   - Auto-filled if detected
   - Stored in notes field

6. **Batch Number** (optional)
   - Text input
   - Auto-filled if detected
   - Stored in notes field

7. **Person** (Medicine only)
   - Radio buttons: Self, Dad, Mom, Custom
   - Custom text input

8. **Reminder Days**
   - Toggle buttons
   - Default: 7 days (or 30, 7, 0 for medicine)

9. **Notes**
   - Textarea
   - Auto-filled with raw OCR text if available

## User Flow

1. **User opens modal** → Empty form
2. **User uploads document** → OCR processing starts
3. **Progress visualization** → Shows steps and progress
4. **AI parsing completes** → Fields auto-filled
5. **Auto-detected labels** → Shows which fields were filled
6. **Confidence warning** → If confidence < 70%
7. **User reviews/edits** → All fields editable
8. **User clicks "Add Item"** → Form submitted
9. **Success** → Modal closes, item added

## Integration

The component is integrated via `DashboardWithModal`:

```typescript
import AddItemModal from './AddItemModalEnhanced'

<AddItemModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  onSuccess={handleItemAdded}
  userPlan={userPlan}
  currentItemCount={currentItemCount}
/>
```

## API Integration

Uses `/api/extract-expiry` endpoint:
- Sends file upload
- Receives `rawText` and `parsedData`
- Handles errors gracefully
- Falls back to manual entry if processing fails

## Trust-Building Features

1. **Transparency**
   - Shows OCR progress
   - Displays confidence scores
   - Highlights auto-detected fields

2. **User Control**
   - All fields editable
   - No auto-save
   - Clear submit button

3. **Error Handling**
   - Graceful fallbacks
   - Clear error messages
   - Manual entry always available

4. **Visual Feedback**
   - Progress indicators
   - Success/error states
   - Loading states

## Styling

- Uses Tailwind CSS
- Responsive design
- Accessible (ARIA labels)
- Loading states
- Error states
- Success states

