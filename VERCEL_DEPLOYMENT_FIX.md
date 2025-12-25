# Vercel Deployment Fix - Project Name Error

## ❌ Error You're Seeing

**Error Message:**
> "A Project name can only contain up to 100 lowercase letters, digits, and the characters '.', '_', and '-'."

**Problem:** Vercel project names must be **lowercase only**. "ExpiryCare" contains uppercase letters.

---

## ✅ Solution

### Fix the Project Name

In the Vercel "New Project" screen:

1. **Find the "Private Repository Name" field**
2. **Change:** `ExpiryCare` 
3. **To:** `expirycare` (all lowercase)

**Or use:** `expiry-care` (with hyphen, also valid)

### Valid Project Names

✅ **Allowed:**
- `expirycare`
- `expiry-care`
- `expiry_care`
- `expirycare123`
- `expiry.care`

❌ **Not Allowed:**
- `ExpiryCare` (uppercase letters)
- `Expiry Care` (spaces)
- `ExpiryCare!` (special characters)

---

## 📋 Step-by-Step Fix

1. **In Vercel "New Project" screen:**
   - Look for "Private Repository Name" field
   - Change `ExpiryCare` to `expirycare`
   - The error should disappear

2. **Verify:**
   - No red error message
   - "Create" button is enabled

3. **Click "Create"**
   - Project will be created
   - Deployment will start

---

## 🎯 Recommended Project Name

**Use:** `expirycare`

This matches your domain (`expirycare.com`) and is clean and simple.

---

## 📝 Additional Notes

- **Project name** is different from your **domain name**
- Project name is just for Vercel's internal use
- Your domain `expirycare.com` will work regardless of project name
- You can change project name later in settings if needed

---

## ✅ After Fixing

Once you change the name to lowercase:
1. Error will disappear
2. "Create" button will be enabled
3. Click "Create" to proceed
4. Vercel will deploy your project

---

**Quick Fix:** Change `ExpiryCare` → `expirycare` in the "Private Repository Name" field.

