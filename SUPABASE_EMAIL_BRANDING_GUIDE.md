# Supabase Email Branding Guide for ExpiryCare

This guide shows you how to customize Supabase Auth emails to use ExpiryCare branding **without breaking any existing authentication flows**.

---

## 📋 Table of Contents

1. [Supabase Dashboard Configuration](#1-supabase-dashboard-configuration)
2. [Custom Email Templates](#2-custom-email-templates)
3. [Subject Line Customization](#3-subject-line-customization)
4. [Sender Identity (Optional)](#4-sender-identity-optional)
5. [Safety Checklist](#5-safety-checklist)
6. [Rollback Strategy](#6-rollback-strategy)
7. [Testing Guide](#7-testing-guide)

---

## 1️⃣ Supabase Dashboard Configuration

### Step 1: Access Authentication Settings

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your **ExpiryCare** project
3. Navigate to: **Authentication** → **Email Templates** (left sidebar)
4. You'll see templates for:
   - Confirm signup
   - Invite user
   - Magic link
   - Change email address
   - Reset password

### Step 2: Configure Site URL

1. Go to: **Settings** → **API** (or **Authentication** → **URL Configuration**)
2. Find **Site URL** field
3. Set it to your production domain:
   ```
   https://expirycare.com
   ```
   Or for local testing:
   ```
   http://localhost:3000
   ```

### Step 3: Configure Redirect URLs

1. In the same settings page, find **Redirect URLs**
2. Add your allowed redirect URLs (one per line):
   ```
   https://expirycare.com/auth/callback
   https://expirycare.com/dashboard
   http://localhost:3000/auth/callback
   http://localhost:3000/dashboard
   ```
3. **Important:** Include both production and localhost URLs for testing

### Step 4: Email Sender Configuration (Basic)

1. Go to: **Settings** → **Auth** → **Email**
2. Find **Email Sender Name**
3. Change from: `Supabase Auth`
4. Change to: `ExpiryCare`
5. **Email Sender Address** (if using Supabase default):
   - This will remain: `noreply@mail.app.supabase.io`
   - To change this, you need custom SMTP (see Section 4)

---

## 2️⃣ Custom Email Templates

### Template: Confirm Signup Email

This is the email sent when a user signs up. Replace the default template with this:

**Subject Line:**
```
Confirm your ExpiryCare account
```

**HTML Template:**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm your ExpiryCare account</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
  
  <!-- Header with Branding -->
  <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">ExpiryCare</h1>
    <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 14px;">Never miss an important expiry</p>
  </div>
  
  <!-- Main Content -->
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <h2 style="color: #111827; margin-top: 0; font-size: 20px; font-weight: 600;">Welcome to ExpiryCare! 🎉</h2>
    
    <p style="margin-bottom: 20px; color: #374151;">
      Thank you for signing up! We're excited to help you track your important expiries and never miss a deadline.
    </p>
    
    <p style="margin-bottom: 24px; color: #374151;">
      To complete your registration and start using ExpiryCare, please confirm your email address by clicking the button below:
    </p>
    
    <!-- CTA Button -->
    <div style="text-align: center; margin: 32px 0;">
      <a href="{{ .ConfirmationURL }}" 
         style="display: inline-block; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); transition: transform 0.2s;">
        Confirm your ExpiryCare account
      </a>
    </div>
    
    <!-- Alternative Link -->
    <p style="margin-top: 24px; font-size: 14px; color: #6b7280; text-align: center;">
      Or copy and paste this link into your browser:<br>
      <a href="{{ .ConfirmationURL }}" style="color: #0ea5e9; word-break: break-all; text-decoration: underline;">
        {{ .ConfirmationURL }}
      </a>
    </p>
    
    <!-- Expiry Notice -->
    <div style="margin-top: 32px; padding: 16px; background: #f0f9ff; border-left: 4px solid #0ea5e9; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px; color: #1e40af;">
        <strong>⏰ This confirmation link expires in 24 hours.</strong><br>
        If you didn't create an ExpiryCare account, you can safely ignore this email.
      </p>
    </div>
    
    <!-- Footer -->
    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0; font-size: 14px; color: #6b7280;">
        If you have any questions, please contact our support team at 
        <a href="mailto:support@expirycare.com" style="color: #0ea5e9; text-decoration: none;">support@expirycare.com</a>
      </p>
    </div>
  </div>
  
  <!-- Bottom Footer -->
  <div style="text-align: center; margin-top: 24px; color: #9ca3af; font-size: 12px;">
    <p style="margin: 0;">© 2024 ExpiryCare. All rights reserved.</p>
    <p style="margin: 4px 0 0 0;">You're receiving this email because you signed up for ExpiryCare.</p>
  </div>
  
</body>
</html>
```

**Plain Text Version (for email clients that don't support HTML):**
```
Welcome to ExpiryCare! 🎉

Thank you for signing up! We're excited to help you track your important expiries and never miss a deadline.

To complete your registration and start using ExpiryCare, please confirm your email address by clicking the link below:

{{ .ConfirmationURL }}

⏰ This confirmation link expires in 24 hours.
If you didn't create an ExpiryCare account, you can safely ignore this email.

If you have any questions, please contact our support team at support@expirycare.com

© 2024 ExpiryCare. All rights reserved.
You're receiving this email because you signed up for ExpiryCare.
```

### How to Apply the Template

1. In Supabase Dashboard, go to: **Authentication** → **Email Templates**
2. Click on **Confirm signup** template
3. **Subject:** Paste `Confirm your ExpiryCare account`
4. **Body (HTML):** Paste the HTML template above
5. **Body (Plain text):** Paste the plain text version above
6. Click **Save**

**⚠️ CRITICAL:** Make sure `{{ .ConfirmationURL }}` is preserved exactly as shown. This is the placeholder Supabase uses to inject the confirmation link.

---

## 3️⃣ Subject Line Customization

### Available Email Templates to Customize

1. **Confirm signup**
   - Subject: `Confirm your ExpiryCare account`

2. **Invite user** (if you use team features)
   - Subject: `You've been invited to ExpiryCare`

3. **Magic link** (if enabled)
   - Subject: `Your ExpiryCare login link`

4. **Change email address**
   - Subject: `Confirm your new ExpiryCare email address`

5. **Reset password**
   - Subject: `Reset your ExpiryCare password`

### How to Change Subject Lines

1. Go to: **Authentication** → **Email Templates**
2. Select the template you want to customize
3. Edit the **Subject** field
4. Click **Save**

**Important Notes:**
- Subject lines support plain text only (no HTML)
- Keep them concise (50-60 characters recommended)
- Always include "ExpiryCare" for brand recognition

---

## 4️⃣ Sender Identity (Optional)

### Option A: Use Supabase Default (Recommended for MVP)

**Pros:**
- ✅ No configuration needed
- ✅ Works immediately
- ✅ No DNS setup required
- ✅ Reliable delivery

**Cons:**
- ❌ Sender address: `noreply@mail.app.supabase.io`
- ❌ Shows "via Supabase" in some email clients

**Configuration:**
- Sender Name: `ExpiryCare` (set in Dashboard)
- Sender Address: `noreply@mail.app.supabase.io` (default, cannot change)

### Option B: Custom SMTP (Advanced - Production Only)

If you want `no-reply@expirycare.com` as the sender, you need:

1. **Custom Domain Email Setup**
   - Purchase email service (SendGrid, AWS SES, Resend, etc.)
   - Configure custom domain: `expirycare.com`

2. **DNS Configuration**

   **SPF Record:**
   ```
   TXT record: v=spf1 include:_spf.sendgrid.net ~all
   ```
   (Replace `sendgrid.net` with your email provider's SPF)

   **DKIM Record:**
   ```
   (Provided by your email service provider)
   ```

   **DMARC Record (Optional but Recommended):**
   ```
   TXT record: v=DMARC1; p=quarantine; rua=mailto:dmarc@expirycare.com
   ```

3. **Supabase SMTP Configuration**

   Go to: **Settings** → **Auth** → **SMTP Settings**
   
   Enable **Custom SMTP** and fill in:
   - **Host:** `smtp.sendgrid.net` (or your provider)
   - **Port:** `587` (or `465` for SSL)
   - **Username:** Your SMTP username
   - **Password:** Your SMTP password
   - **Sender email:** `no-reply@expirycare.com`
   - **Sender name:** `ExpiryCare`

4. **Test SMTP Connection**
   - Click **Test SMTP** button
   - Send a test email to your own address
   - Verify it arrives and sender shows as `ExpiryCare <no-reply@expirycare.com>`

**⚠️ WARNING:**
- Only enable custom SMTP if you have a production domain
- Test thoroughly before going live
- Keep Supabase default as fallback during testing

---

## 5️⃣ Safety Checklist

Before deploying email changes to production, verify:

### ✅ Email Delivery
- [ ] Test signup flow sends email
- [ ] Email arrives in inbox (not spam)
- [ ] Sender name shows as "ExpiryCare"
- [ ] Subject line is correct

### ✅ Confirmation Link Works
- [ ] Click confirmation link in email
- [ ] User is redirected to `/auth/callback`
- [ ] User is logged in successfully
- [ ] User is redirected to `/dashboard`
- [ ] Session persists after page refresh

### ✅ Redirect URLs
- [ ] Production URL works: `https://expirycare.com/auth/callback`
- [ ] Localhost URL works: `http://localhost:3000/auth/callback`
- [ ] No "Invalid redirect URL" errors

### ✅ Auth Flow Integrity
- [ ] New signup works end-to-end
- [ ] Existing users can still log in
- [ ] Password reset emails work (if enabled)
- [ ] OAuth (Google) sign-in still works
- [ ] Email verification status updates correctly

### ✅ Edge Cases
- [ ] Resend confirmation email works
- [ ] Expired confirmation link shows appropriate error
- [ ] Multiple signup attempts handled correctly
- [ ] Email with special characters works

### ✅ Mobile Email Clients
- [ ] Email renders correctly on Gmail (mobile)
- [ ] Email renders correctly on Apple Mail
- [ ] Email renders correctly on Outlook
- [ ] Confirmation link is clickable on mobile

---

## 6️⃣ Rollback Strategy

If email delivery fails or auth breaks:

### Immediate Rollback Steps

1. **Revert Email Template**
   - Go to: **Authentication** → **Email Templates**
   - Click **Reset to default** on the affected template
   - Click **Save**

2. **Revert SMTP Settings** (if custom SMTP enabled)
   - Go to: **Settings** → **Auth** → **SMTP Settings**
   - Disable **Custom SMTP**
   - Click **Save**
   - Supabase will revert to default email service

3. **Verify Auth Still Works**
   - Test signup flow
   - Test login flow
   - Check Supabase logs: **Logs** → **Auth Logs**

### Testing Before Rollback

1. **Check Supabase Logs**
   - Go to: **Logs** → **Auth Logs**
   - Look for email send failures
   - Check for error messages

2. **Test Email Sending**
   - Use Supabase Dashboard: **Authentication** → **Users**
   - Click on a test user
   - Click **Send confirmation email**
   - Check if email arrives

3. **Verify Template Syntax**
   - Ensure `{{ .ConfirmationURL }}` is present
   - No broken HTML tags
   - No missing closing tags

### Prevention

- Always test on a staging environment first
- Keep a backup of working templates
- Test with a real email address (not test@example.com)
- Monitor Supabase logs after changes

---

## 7️⃣ Testing Guide

### Step-by-Step Testing Process

#### Test 1: New User Signup

1. Go to: `https://expirycare.com/signup` (or localhost)
2. Enter test email: `your-test-email@gmail.com`
3. Enter password and name
4. Click "Create Account"
5. **Expected:**
   - Redirect to `/verify-email` page
   - Email arrives within 1-2 minutes
   - Email sender: "ExpiryCare"
   - Email subject: "Confirm your ExpiryCare account"
   - Email contains ExpiryCare branding

#### Test 2: Email Confirmation

1. Open the confirmation email
2. Click "Confirm your ExpiryCare account" button
3. **Expected:**
   - Browser opens confirmation link
   - Redirects to `/auth/callback`
   - Then redirects to `/dashboard`
   - User is logged in
   - Email verification status: `true`

#### Test 3: Resend Confirmation

1. If email doesn't arrive, go to `/verify-email`
2. Click "Resend Code" (or use Supabase Dashboard)
3. **Expected:**
   - New email arrives
   - Same branding and format
   - New confirmation link works

#### Test 4: Expired Link

1. Wait 24+ hours (or manually expire in Supabase)
2. Click old confirmation link
3. **Expected:**
   - Error message: "Link expired"
   - Option to resend confirmation email

### Monitoring

**Supabase Dashboard:**
- **Logs** → **Auth Logs**: Check for email send failures
- **Authentication** → **Users**: Verify user email_verified status

**Application Logs:**
- Check browser console for errors
- Check server logs for auth callback issues

---

## 📝 Summary

### Quick Configuration Checklist

- [ ] Set Site URL in Supabase Dashboard
- [ ] Add Redirect URLs (production + localhost)
- [ ] Change Email Sender Name to "ExpiryCare"
- [ ] Update "Confirm signup" email template
- [ ] Update subject line to "Confirm your ExpiryCare account"
- [ ] Test signup flow end-to-end
- [ ] Test email confirmation link
- [ ] Verify email renders correctly on mobile
- [ ] Monitor Supabase logs for 24 hours

### Key Files to Remember

- **No code changes needed** - all configuration is in Supabase Dashboard
- Your existing auth code (`app/signup/page.tsx`, `app/login/page.tsx`) will continue working
- The OTP verification system you built will work alongside Supabase email confirmation

### Support

If you encounter issues:
1. Check Supabase documentation: https://supabase.com/docs/guides/auth/auth-email-templates
2. Review Supabase logs: **Logs** → **Auth Logs**
3. Test with Supabase default template first to isolate issues

---

**✅ You're all set!** Your ExpiryCare emails will now be branded and professional while maintaining full auth functionality.
