# Google Cloud Vision API Setup for Vercel

This guide walks you through setting up Google Cloud Vision API credentials for production deployment on Vercel.

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a project"** → **"New Project"**
3. Enter a project name (e.g., "ExpiryCare OCR")
4. Click **"Create"**
5. Wait for the project to be created, then select it

## Step 2: Enable Cloud Vision API

1. In the Google Cloud Console, go to **"APIs & Services"** → **"Library"**
2. Search for **"Cloud Vision API"**
3. Click on **"Cloud Vision API"**
4. Click **"Enable"**
5. Wait for the API to be enabled (usually takes a few seconds)

## Step 3: Create a Service Account

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"Service Account"**
3. Fill in the details:
   - **Service account name**: `expirycare-ocr` (or any name you prefer)
   - **Service account ID**: Auto-generated (you can change it)
   - **Description**: "Service account for ExpiryCare OCR functionality"
4. Click **"Create and Continue"**
5. **Grant this service account access to project** (optional):
   - Role: **"Cloud Vision API User"** (or "Editor" for broader access)
   - Click **"Continue"**
6. Click **"Done"** (you can skip adding users)

## Step 4: Create and Download Service Account Key

1. In the **"Credentials"** page, find your service account
2. Click on the service account email
3. Go to the **"Keys"** tab
4. Click **"Add Key"** → **"Create new key"**
5. Select **"JSON"** format
6. Click **"Create"**
7. A JSON file will be downloaded automatically (e.g., `expirycare-ocr-xxxxx.json`)

**⚠️ IMPORTANT**: Keep this file secure! It contains sensitive credentials.

## Step 5: Encode Service Account JSON to Base64

You need to convert the downloaded JSON file to base64 format. Choose one method:

### Method A: Using Command Line (Recommended)

**On Windows (PowerShell):**
```powershell
# Navigate to the folder where you downloaded the JSON file
cd C:\Users\YourName\Downloads

# Encode the file to base64
$content = Get-Content -Path "expirycare-ocr-xxxxx.json" -Raw -Encoding UTF8
$bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
$base64 = [System.Convert]::ToBase64String($bytes)
$base64 | Out-File -FilePath "credentials-base64.txt" -Encoding UTF8

# Display the base64 string (copy this)
Write-Host $base64
```

**On macOS/Linux:**
```bash
# Navigate to the folder where you downloaded the JSON file
cd ~/Downloads

# Encode the file to base64
base64 -i expirycare-ocr-xxxxx.json -o credentials-base64.txt

# Display the base64 string (copy this)
cat credentials-base64.txt
```

### Method B: Using Online Tool (Less Secure)

1. Open the JSON file in a text editor
2. Copy the entire JSON content
3. Go to [base64encode.org](https://www.base64encode.org/)
4. Paste the JSON content
5. Click **"Encode"**
6. Copy the base64 encoded string

**⚠️ WARNING**: Only use trusted online tools. For better security, use Method A.

### Method C: Using Node.js (If you have Node.js installed)

```bash
# In your project directory
node -e "const fs = require('fs'); const json = fs.readFileSync('path/to/expirycare-ocr-xxxxx.json', 'utf8'); console.log(Buffer.from(json).toString('base64'))"
```

## Step 6: Set Environment Variable in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **ExpiryCare** project
3. Go to **"Settings"** → **"Environment Variables"**
4. Click **"Add New"**
5. Fill in:
   - **Name**: `GOOGLE_CLOUD_VISION_CREDENTIALS`
   - **Value**: Paste the base64 encoded string (from Step 5)
   - **Environment**: Select all three:
     - ✅ Production
     - ✅ Preview
     - ✅ Development
6. Click **"Save"**

## Step 7: Verify the Setup

1. Go to **"Deployments"** tab in Vercel
2. Click **"Redeploy"** on the latest deployment (or wait for the next auto-deployment)
3. After deployment completes, test OCR functionality:
   - Log in to your production site
   - Try adding an item with document upload
   - Verify OCR extraction works

## Troubleshooting

### Error: "Google Vision client not initialized"

**Solution:**
- Verify `GOOGLE_CLOUD_VISION_CREDENTIALS` is set in Vercel
- Check that the base64 string is correct (no extra spaces or line breaks)
- Ensure the JSON file was properly encoded
- Redeploy after setting the environment variable

### Error: "Invalid credentials"

**Solution:**
- Verify the service account JSON is valid
- Check that Cloud Vision API is enabled in Google Cloud Console
- Ensure the service account has the "Cloud Vision API User" role
- Try re-encoding the JSON file to base64

### Error: "Permission denied"

**Solution:**
- Go to Google Cloud Console → IAM & Admin → IAM
- Find your service account
- Ensure it has the "Cloud Vision API User" role
- If not, click "Edit" and add the role

### How to Verify Base64 Encoding

You can verify your base64 string is correct by decoding it:

**On Windows (PowerShell):**
```powershell
$base64 = "YOUR_BASE64_STRING_HERE"
$bytes = [System.Convert]::FromBase64String($base64)
$json = [System.Text.Encoding]::UTF8.GetString($bytes)
Write-Host $json
```

**On macOS/Linux:**
```bash
echo "YOUR_BASE64_STRING_HERE" | base64 -d
```

The output should be valid JSON starting with `{"type":"service_account",...}`

## Security Best Practices

1. **Never commit the JSON file to Git** - It's already in `.gitignore`
2. **Never share the base64 string publicly**
3. **Rotate credentials periodically** - Create new keys and update Vercel
4. **Restrict API access** - Only enable Cloud Vision API, not other APIs
5. **Monitor usage** - Check Google Cloud Console for API usage and costs

## Cost Information

Google Cloud Vision API pricing (as of 2024):
- **First 1,000 units/month**: FREE
- **1,001-5,000,000 units**: $1.50 per 1,000 units
- **5,000,001+ units**: $0.60 per 1,000 units

1 unit = 1 page processed

**Note**: Your app enforces limits:
- Free plan: 5 OCR calls total
- Pro plan: 10 calls/day, 200 calls/month

This should keep costs minimal for most users.

## Next Steps

After setting up the credentials:

1. ✅ Test OCR functionality in production
2. ✅ Monitor Google Cloud Console for API usage
3. ✅ Check Vercel function logs for any errors
4. ✅ Verify OCR extraction works for different document types

## Support

If you encounter issues:
1. Check Vercel function logs: **Deployments** → Click deployment → **Functions** tab
2. Check Google Cloud Console logs: **APIs & Services** → **Dashboard** → **Cloud Vision API**
3. Verify all environment variables are set correctly
4. Ensure the service account has proper permissions

