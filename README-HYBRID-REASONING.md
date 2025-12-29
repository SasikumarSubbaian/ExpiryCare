# Hybrid Reasoning Engine Setup

## Overview

The ExpiryCare MVP now uses a **Hybrid Reasoning Engine** that combines:
1. **Regex Extraction** (Fast, Free, Instant) - First attempt
2. **Local AI (Ollama)** (Free, Offline) - Fallback if regex confidence is low
3. **Manual Entry** (Always available) - Final fallback

## Architecture

```
OCR Text → Regex Extract → [Confidence >= 60?] 
                              ↓ Yes → Use Regex Result
                              ↓ No  → Try Ollama AI
                              ↓     → Merge Results
                              ↓     → Show Confirmation Modal
```

## Setup Instructions

### Step 1: Install Ollama (Optional but Recommended)

Ollama is only needed if you want AI fallback. Regex works without it.

1. **Download Ollama:**
   - Visit: https://ollama.ai/
   - Download for your OS (Windows/Mac/Linux)
   - Install the application

2. **Pull Mistral Model:**
   ```bash
   ollama pull mistral
   ```
   
   Alternative models you can use:
   ```bash
   ollama pull llama3      # Llama 3 (larger, better quality)
   ollama pull phi         # Phi (smaller, faster)
   ```

3. **Verify Ollama is Running:**
   ```bash
   ollama list
   ```
   Should show `mistral` in the list.

4. **Test Ollama API:**
   ```bash
   curl http://localhost:11434/api/generate -d '{
     "model": "mistral",
     "prompt": "Hello",
     "stream": false
   }'
   ```

### Step 2: Update API Route (If Needed)

The hybrid reasoning route is already configured to use:
- **Model:** `mistral` (can be changed in `app/api/ai/hybrid-reasoning/route.ts`)
- **Endpoint:** `http://localhost:11434/api/generate`
- **Timeout:** 10 seconds

To use a different model, edit line 67 in `app/api/ai/hybrid-reasoning/route.ts`:
```typescript
model: 'llama3', // or 'phi', 'mistral', etc.
```

### Step 3: Test the Flow

1. **Without Ollama (Regex Only):**
   - Upload a document
   - Regex will extract data instantly
   - If confidence >= 60, uses regex result
   - If confidence < 60, falls back to manual entry

2. **With Ollama (Full Hybrid):**
   - Upload a document
   - Regex extracts first
   - If confidence < 60, Ollama AI processes
   - Results are merged (AI takes priority, regex fills gaps)
   - Confirmation modal shows extracted fields

## How It Works

### Regex First (Always)
- **Speed:** Instant (< 10ms)
- **Cost:** Free
- **Accuracy:** Good for clear documents (60-80% confidence)
- **Works:** Offline, no API needed

### Ollama AI Fallback (If Regex Confidence < 60)
- **Speed:** 2-5 seconds
- **Cost:** Free (runs locally)
- **Accuracy:** Better for complex documents (70-90% confidence)
- **Requires:** Ollama installed and running

### User Confirmation (Always)
- **Rule:** Never auto-fill without user confirmation
- **Modal:** Shows all extracted fields
- **Actions:** User can Confirm, Edit, or Skip fields
- **Saves:** Only confirmed fields are applied

## Confirmation Modal Logic

The system **always** shows the confirmation modal:
- ✅ If confidence < 80
- ✅ If `needsManualEntry` is true
- ✅ If expiry date is missing
- ✅ Even if confidence >= 80 (user must confirm)

**Never auto-fills** - user confirmation is mandatory.

## Benefits

1. **Fast:** Regex is instant
2. **Free:** No API costs
3. **Offline:** Works without internet (regex)
4. **Smart:** AI fallback for complex documents
5. **Reliable:** Multiple fallback layers
6. **User Control:** Always requires confirmation

## Troubleshooting

### Issue: "Ollama unavailable"
- **Solution:** Install Ollama and ensure it's running
- **Alternative:** System will use regex only (still works!)

### Issue: "Model not found"
- **Solution:** Run `ollama pull mistral` (or your chosen model)

### Issue: "Timeout error"
- **Solution:** Ollama might be slow. Increase timeout in route.ts (line 75)

### Issue: "Low confidence"
- **Solution:** This is expected for unclear documents. User can manually edit fields.

## Next Steps

1. ✅ Install Ollama (optional)
2. ✅ Pull Mistral model
3. ✅ Test with a document
4. ✅ Verify confirmation modal appears
5. ✅ Confirm fields can be edited

---

**Note:** The system works perfectly fine with just regex (no Ollama needed). Ollama is an optional enhancement for better accuracy on complex documents.

