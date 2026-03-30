# Forgot Password & Email Configuration Guide

## Overview
The forgot password feature sends password reset links via email. If users aren't receiving emails, it's usually due to SMTP configuration issues.

---

## ✅ What I Fixed

1. **Added SMTP documentation** to `.env.example` so new developers know what to configure
2. **Improved error logging** - backend now shows clear warnings when SMTP is not configured
3. **Better debugging visibility** - logs now include reset links and specific error messages
4. **Startup validation** - app warns on startup if SMTP is misconfigured

---

## 🔧 SMTP Configuration

### Current .env Settings
Your `.env` already has SMTP configured for Gmail:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=kudosdev7@gmail.com
SMTP_PASS=eqtk yajl tvus omvl
SMTP_FROM=kudosdev7@gmail.com
```

### 🚨 Important: Gmail App Passwords

The `SMTP_PASS` should be a **Gmail App Password**, NOT your regular Gmail password:

1. **Enable 2-Step Verification** on your Google account (if not already enabled)
2. Go to [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Select "Mail" and "Windows Computer" (or your device)
4. Google will generate a 16-character password
5. Copy that password and update `SMTP_PASS` in `.env`

**Current app password may be expired** - this is the most common issue!

---

## 🧪 How to Test Email Sending

### Option 1: Check Backend Logs
When the backend starts, you'll see:
```
✅ SMTP configured: kudosdev7@gmail.com @ smtp.gmail.com:587
```

Or if there's an issue:
```
⚠️  SMTP NOT CONFIGURED - Password reset emails WILL NOT be sent
```

### Option 2: Test Manually via API
Use curl to test the forgot password endpoint:

```bash
curl -X POST http://localhost:8000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

Then check the backend logs for:
- ✅ "Password reset email sent to test@example.com"
- ❌ "Failed to send reset email" (with error details)

### Option 3: Check Email in Backend
The reset link is logged even if email fails. Check backend console for:
```
Reset link that would be sent: https://kudosd.vercel.app/reset-password/{token}
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "SMTP not configured"
**Problem:** `SMTP_HOST`, `SMTP_USER`, or `SMTP_PASS` is missing from `.env`

**Solution:**
```bash
# Add to backend/.env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com
```

Then restart the backend.

### Issue 2: "Failed to send reset email - Username and password not accepted"
**Problem:** Gmail app password is wrong or expired

**Solution:**
1. Go to [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Generate a new app password
3. Update `SMTP_PASS` in `.env`
4. Restart backend

### Issue 3: "Failed to send reset email - Connection timed out"
**Problem:** Firewall or network blocking SMTP port 587

**Solution:**
- Check if your network/server blocks port 587
- Try alternative SMTP provider (SendGrid, Mailgun, AWS SES)
- Check with your IT department if on corporate network

### Issue 4: Reset Link Doesn't Work
**Problem:** `FRONTEND_URL` in `.env` is pointing to wrong domain

**Solution:**
```bash
# In backend/.env, update FRONTEND_URL to match your frontend deployment
FRONTEND_URL=https://your-domain.com  # or http://localhost:3000 for local dev
```

---

## 📋 Complete SMTP Configuration Checklist

- [ ] `SMTP_HOST=smtp.gmail.com` is set
- [ ] `SMTP_PORT=587` is set
- [ ] `SMTP_USER` is a Gmail address
- [ ] `SMTP_PASS` is a valid Gmail App Password (NOT regular password)
- [ ] `SMTP_FROM` is the same as `SMTP_USER`
- [ ] `FRONTEND_URL` matches your deployment domain
- [ ] Backend has been restarted after `.env` changes
- [ ] No firewall blocking port 587
- [ ] Google account has 2-Step Verification enabled

---

## 📝 Backend Logs to Monitor

After implementing fixes, look for these log messages:

### On Startup (Good)
```
✅ SMTP configured: kudosdev7@gmail.com @ smtp.gmail.com:587
```

### On Forgot Password Request (Good)
```
Password reset requested for: user@example.com
Attempting to send password reset email to user@example.com...
✅ Password reset email sent to user@example.com
```

### On Forgot Password Request (Bad - Shows What's Wrong)
```
Password reset requested for: user@example.com
❌ SMTP not configured! Password reset email NOT sent to user@example.com
   Configure SMTP_HOST, SMTP_USER, SMTP_PASS in .env
   Reset link that would be sent: https://kudosd.vercel.app/reset-password/{token}
```

```
❌ Failed to send reset email to user@example.com
   Error: [Errno 111] Connection refused
   Reset link: https://kudosd.vercel.app/reset-password/{token}
```

---

## 🔐 Production vs Development

### Local Development
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com
FRONTEND_URL=http://localhost:3000
```

### Production (Your Render Deployment)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=kudosdev7@gmail.com
SMTP_PASS=eqtk yajl tvus omvl
SMTP_FROM=kudosdev7@gmail.com
FRONTEND_URL=https://kudosd.vercel.app
```

Make sure to update these **secrets in Render dashboard**:
1. Go to Render → KudosD service → Environment
2. Update or add the SMTP variables
3. Redeploy

---

## 🆘 Still Not Working?

**Debug Steps:**
1. Check backend logs for startup SMTP message
2. Test forgot password endpoint with curl (above)
3. Check that `FRONTEND_URL` is correct (can copy from logs)
4. Verify Gmail app password is valid (regenerate if needed)
5. Check server/network logs for port 587 errors

**Get Detailed Error Info:**
Look at the raw error in backend logs when sending fails. If you see:
- `Username and password not accepted` → Wrong Gmail password
- `Connection refused` or `timed out` → Network/firewall issue
- `No such file or directory` → SMTP cert issue

---

## ✨ Email Flow Diagram

```
User → Click "Forgot Password" → Form submitted to /api/auth/forgot-password
   ↓
Backend checks if user exists
   ↓
Backend generates JWT token (15-min expiry)
   ↓
Backend sends email via aiosmtplib + Gmail SMTP
   ↓
User receives email with reset link
   ↓
User clicks link → Frontend /reset-password/{token}
   ↓
User enters new password → /api/auth/reset-password
   ↓
Backend validates token, updates password in MongoDB
   ↓
User can login with new password
```

---

## 📞 Support

If you're still having issues:
1. Check all the logs above
2. Verify SMTP credentials are correct
3. Test with a simple emailclient (maybe Gmail is blocking your app)
4. Consider using a dedicated email service like SendGrid or Mailgun
