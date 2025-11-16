# Email Configuration Guide

## Problem: SMTP Connection Timeout on Render

When deployed on Render, Gmail SMTP connection may timeout because:
- Render's network may restrict outbound SMTP connections
- Gmail SMTP (port 587) can be slow or blocked
- Connection needs to be properly configured with timeouts

## Solutions

### Option 1: Use SendGrid (⭐ RECOMMENDED for Production)

SendGrid is a professional email service that works reliably on Render.

#### Setup Steps:

1. **Create SendGrid Account**
   - Go to [SendGrid](https://sendgrid.com/)
   - Sign up for free account (includes 100 emails/day)
   - Verify your sender email

2. **Get API Key**
   - Dashboard → Settings → API Keys
   - Create a new key with "Mail Send" permissions
   - Copy the key (keep it secret!)

3. **Update Environment Variables on Render**
   ```
   MAIL_HOST=smtp.sendgrid.net
   MAIL_PORT=587
   MAIL_USERNAME=apikey
   MAIL_PASSWORD=SG.xxxxxxxxxxxxx  # Your SendGrid API key
   ```

4. **Rebuild and Deploy**
   ```bash
   git push  # Trigger GitHub Actions rebuild
   ```

#### Configuration in application.properties:
```properties
spring.mail.host=${MAIL_HOST:smtp.sendgrid.net}
spring.mail.port=${MAIL_PORT:587}
spring.mail.username=${MAIL_USERNAME:apikey}
spring.mail.password=${MAIL_PASSWORD}
```

---

### Option 2: Use Gmail with App Password (For Development)

This works well for local development but may timeout on Render.

#### Setup Steps:

1. **Enable 2-Factor Authentication on Gmail**
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable 2-Step Verification

2. **Create App Password**
   - Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Select Mail and Device (Windows Computer or your system)
   - Generate password
   - Copy the 16-character password

3. **Update Environment Variables**
   ```
   MAIL_HOST=smtp.gmail.com
   MAIL_PORT=587
   MAIL_USERNAME=your-email@gmail.com
   MAIL_PASSWORD=xxxx xxxx xxxx xxxx  # 16-character app password
   ```

#### Configuration in application.properties:
```properties
spring.mail.host=${MAIL_HOST:smtp.gmail.com}
spring.mail.port=${MAIL_PORT:587}
spring.mail.username=${MAIL_USERNAME}
spring.mail.password=${MAIL_PASSWORD}
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
spring.mail.properties.mail.smtp.starttls.required=true
spring.mail.properties.mail.smtp.ssl.protocols=TLSv1.2
spring.mail.properties.mail.smtp.connectiontimeout=5000
spring.mail.properties.mail.smtp.timeout=5000
spring.mail.properties.mail.smtp.writetimeout=5000
```

---

### Option 3: Use AWS SES (For Enterprise)

AWS Simple Email Service is very reliable for large-scale applications.

#### Setup Steps:

1. **Create AWS Account and SES Setup**
   - Go to [AWS SES Console](https://console.aws.amazon.com/ses/)
   - Verify sender email
   - Request production access
   - Create SMTP credentials

2. **Update Environment Variables**
   ```
   MAIL_HOST=email-smtp.region.amazonaws.com
   MAIL_PORT=587
   MAIL_USERNAME=AWS_SES_USERNAME
   MAIL_PASSWORD=AWS_SES_PASSWORD
   ```

---

## How to Update on Render

1. **Go to Render Dashboard**
   - Select your backend service
   - Click "Environment" tab
   - Add/Update environment variables:
     ```
     MAIL_HOST=smtp.sendgrid.net
     MAIL_PORT=587
     MAIL_USERNAME=apikey
     MAIL_PASSWORD=SG.xxxxx
     ```

2. **Redeploy**
   - Click "Redeploy" button
   - Or push to GitHub to trigger automatic rebuild

3. **Test**
   - Register a new account on your hosted frontend
   - Check if OTP email is received

---

## Troubleshooting

### ❌ Still Getting Timeout?

```
Mail server connection failed. 
Couldn't connect to host, port: smtp.gmail.com, 587
```

**Solutions:**
1. Switch to SendGrid (recommended)
2. Increase timeout values:
   ```properties
   spring.mail.properties.mail.smtp.connectiontimeout=10000
   spring.mail.properties.mail.smtp.timeout=10000
   spring.mail.properties.mail.smtp.writetimeout=10000
   ```
3. Check firewall/network restrictions on Render

### ❌ Authentication Failed?

```
Authentication failed for user
```

**Solutions:**
1. Verify API key/password is correct
2. For Gmail: Make sure you're using App Password (not account password)
3. For SendGrid: Username must be `apikey` (literal string)

### ❌ Email Not Received?

1. Check spam folder
2. Verify sender email is verified in SendGrid
3. Check application logs for errors
4. Test with a different recipient email

---

## Email Template

OTP emails are sent using this HTML template:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; }
        .header { text-align: center; color: #333; }
        .otp-box { background-color: #f0f0f0; padding: 20px; text-align: center; }
        .otp-code { font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <h2>🚗 SmartRide - OTP Verification</h2>
        <p>Your One-Time Password is:</p>
        <div class="otp-box">
            <div class="otp-code">XXXXXX</div>
        </div>
        <p><strong>⏰ Expires in:</strong> 5 minutes</p>
        <p><strong>⚠️ Never share this OTP!</strong></p>
    </div>
</body>
</html>
```

---

## Summary

| Service | Cost | Reliability | Setup Difficulty |
|---------|------|-------------|------------------|
| **SendGrid** ⭐ | Free for 100/day | ✅ Excellent | Easy |
| **Gmail** | Free | ⚠️ Sometimes times out | Easy |
| **AWS SES** | Pay per email | ✅ Excellent | Medium |

**Recommendation:** Use **SendGrid** for production on Render.
