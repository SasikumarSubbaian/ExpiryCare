# OCR & User Name Setup Guide

## ✅ Task 1: OCR Document Extraction for Pro/Family Plans

### Features Added:
- **OCR Processing**: Automatically extracts details from uploaded documents
- **Auto-fill Form**: Populates title, expiry date, category, and notes from document
- **Required Document**: Document upload is now required for Pro and Family plans
- **Free OCR Tool**: Uses Tesseract.js (completely free, no API keys needed)

### Installation Required:

```bash
npm install tesseract.js
```

### How It Works:

1. **User uploads document** (Pro/Family plans only)
2. **OCR processes the document** automatically
3. **Form fields auto-fill** with extracted data:
   - Title/Product name
   - Expiry date
   - Category (warranty, insurance, etc.)
   - Notes/Additional details

### Code Changes:

1. **Created `/api/ocr/extract` endpoint:**
   - Uses Tesseract.js for OCR
   - Extracts structured data from document text
   - Returns extracted fields

2. **Updated `AddItemModal.tsx`:**
   - Document required for Pro/Family plans
   - Automatic OCR processing on file upload
   - Auto-fills form fields from OCR results
   - Shows processing indicator

3. **Updated `package.json`:**
   - Added `tesseract.js` dependency

### Testing:

1. **Switch to Pro or Family plan** (via `/settings/plans`)
2. **Add a new item**
3. **Upload a document** (warranty card, insurance policy, etc.)
4. **Watch OCR process** - form should auto-fill
5. **Verify extracted data** - adjust if needed
6. **Submit the form**

### OCR Accuracy:

- **Best for**: Clear printed text, warranty cards, insurance documents
- **May struggle with**: Handwriting, poor quality images, complex layouts
- **Fallback**: Users can always manually edit the auto-filled fields

## ✅ Task 2: Display User Name in Dashboard

### Features Added:
- **Name from Signup**: Shows name entered during signup
- **Google OAuth Name**: Shows name from Google account
- **Fallback**: Uses email if name not available

### Code Changes:

1. **Updated `DashboardHeader.tsx`:**
   - Accepts `userName` prop
   - Displays user name instead of email

2. **Updated `app/dashboard/page.tsx`:**
   - Fetches user profile from `profiles` table
   - Falls back to user metadata
   - Passes name to DashboardHeader

3. **Updated `app/auth/callback/route.ts`:**
   - Extracts name from Google OAuth metadata
   - Updates profile table with name

### How It Works:

1. **Email Signup**: Name stored in `user_metadata.full_name` → saved to `profiles.full_name`
2. **Google OAuth**: Name from Google → stored in `profiles.full_name`
3. **Dashboard**: Reads from `profiles.full_name` → displays in header

### Testing:

1. **Sign up with email** - Enter your name
2. **Check dashboard** - Should show "Welcome back, [Your Name]"
3. **Or sign in with Google** - Should show your Google account name

## 📋 Setup Checklist

### OCR Setup:
- [ ] Install Tesseract.js: `npm install tesseract.js`
- [ ] Restart dev server
- [ ] Test OCR with a warranty card or document
- [ ] Verify form auto-fills correctly

### User Name Setup:
- [ ] No setup needed - works automatically
- [ ] Test with email signup
- [ ] Test with Google OAuth
- [ ] Verify name appears in dashboard

## 🔧 Troubleshooting

### OCR Not Working?

1. **Check Tesseract.js is installed:**
   ```bash
   npm list tesseract.js
   ```

2. **Check browser console** for errors

3. **Try a clear, high-quality document** image

4. **OCR is optional** - form can still be filled manually

### Name Not Showing?

1. **Check profile exists:**
   ```sql
   SELECT * FROM profiles WHERE id = 'YOUR_USER_ID';
   ```

2. **Update profile manually if needed:**
   ```sql
   UPDATE profiles 
   SET full_name = 'Your Name' 
   WHERE id = 'YOUR_USER_ID';
   ```

3. **For Google OAuth users**, the name should be extracted automatically

## 📝 Notes

- **OCR Processing**: Happens client-side using Tesseract.js (free, no API keys)
- **Document Required**: Only for Pro and Family plans (Free plan: optional)
- **User Name**: Automatically extracted from signup or Google OAuth
- **Fallback**: If OCR fails, users can still manually fill the form

---

**Status:** ✅ All features implemented
**Next Steps:** 
1. Install Tesseract.js: `npm install tesseract.js`
2. Test OCR with a document
3. Verify user name displays correctly

