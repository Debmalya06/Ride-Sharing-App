# 📧 OTP Email System - Simplified Implementation

## Overview
✅ **Firebase Removed** - All Firebase auth code has been removed
✅ **Mock OTP in Terminal** - OTP prints to console for development
✅ **Email Sending** - OTP also sent via SMTP (Gmail)

## How It Works

### 1. **User Registration**
```
POST /api/auth/register
{
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "7278429558",
  "email": "user@example.com",
  "password": "SecurePassword123",
  "role": "PASSENGER"
}
```

**What happens:**
1. User is registered in database
2. OTP (6 digits) is generated
3. **Console Output** (Terminal):
```
============================================================
🔐 MOCK OTP FOR DEVELOPMENT
============================================================
📱 Phone Number: +917278429558
📧 Email Address: user@example.com
🔢 OTP Code:     123456
⏰ Expires At:    2025-11-13T15:30:45
============================================================
✅ OTP is also being sent to your email!
============================================================
```
4. **Email Sent** - HTML formatted email with OTP to user's email
5. **OTP stored** in database with 5-minute expiry

### 2. **Verify OTP**
```
POST /api/auth/verify-otp
{
  "phoneNumber": "7278429558",
  "otp": "123456"
}
```

**Response:**
```json
{
  "message": "Phone number verified successfully",
  "accessToken": "eyJhbGc...",
  "tokenType": "Bearer",
  "user": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "+917278429558",
    "email": "user@example.com",
    "role": "PASSENGER",
    "isVerified": true
  }
}
```

### 3. **Resend OTP**
```
POST /api/auth/resend-otp?phoneNumber=7278429558
```

## Configuration

### application.properties
```properties
# Email Configuration (SMTP)
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=debmalyapan4@gmail.com
spring.mail.password=zide dsvv ooan vxqf

spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
spring.mail.properties.mail.smtp.starttls.required=true
spring.mail.properties.mail.smtp.ssl.protocols=TLSv1.2
```

## Key Classes

### 1. `OtpEmailService.java`
- **Generates** random 6-digit OTP
- **Prints** OTP to console (development testing)
- **Sends** OTP via email using SMTP
- **Verifies** OTP from database
- **Rate limits** - 5 OTPs per hour per phone
- **Auto-formats** phone number to +91XXXXXXXXXX

### 2. `OtpService.java`
- Facade/wrapper around OtpEmailService
- Maintains backward compatibility

### 3. `AuthService.java`
- Calls `otpService.generateAndSendOtp(phoneNumber, email)`
- Handles registration and OTP verification

## Email Template

OTP email is formatted as HTML:

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; }
        .otp-box { background-color: #f0f0f0; padding: 20px; }
        .otp-code { font-size: 32px; font-weight: bold; color: #007bff; }
    </style>
</head>
<body>
    <div class="container">
        <h2>🚗 SmartRide - OTP Verification</h2>
        <p>Your OTP: <span class="otp-code">123456</span></p>
        <p>⏰ Expires in: 5 minutes</p>
        <p style="color: #d9534f;"><strong>⚠️ Never share this OTP!</strong></p>
    </div>
</body>
</html>
```

## Features

✅ **OTP Expiry** - 5 minutes
✅ **OTP Length** - 6 digits
✅ **Rate Limiting** - 5 OTPs per hour per phone
✅ **Phone Formatting** - Auto-converts to +91XXXXXXXXXX
✅ **Console Output** - Development/testing convenience
✅ **Email Sending** - Real emails via SMTP
✅ **Database Storage** - OTP persisted for verification
✅ **One-Time Use** - OTP marked as used after verification

## Testing

### 1. Register User
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "phoneNumber": "7278429558",
    "email": "test@example.com",
    "password": "Test123!@#",
    "role": "PASSENGER"
  }'
```

### 2. Check Console Output
Look for OTP printed in terminal:
```
🔐 MOCK OTP FOR DEVELOPMENT
📱 Phone Number: +917278429558
🔢 OTP Code:     XXXXXX
```

### 3. Check Email Inbox
Look for email from: SmartRide <debmalyapan4@gmail.com>
Subject: 🔐 SmartRide OTP Verification - XXXXXX

### 4. Verify OTP
```bash
curl -X POST http://localhost:8080/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "7278429558",
    "otp": "123456"
  }'
```

## Removed Components

❌ Firebase Admin SDK
❌ Google Auth Library
❌ Firebase Cloud Functions
❌ Twilio API integration (via Firebase)
❌ FirebaseOtpService.java
❌ FirebaseConfig.java
❌ Firebase credentials file references

## Architecture

```
┌─────────────────┐
│  Client/Mobile  │
└────────┬────────┘
         │
         │ POST /api/auth/register
         │
┌────────▼────────┐
│  AuthController │
└────────┬────────┘
         │
         │ authService.registerUser()
         │
┌────────▼────────┐
│  AuthService    │
└────────┬────────┘
         │
         │ otpService.generateAndSendOtp(phone, email)
         │
┌────────▼──────────────┐
│  OtpService (Facade)  │
└────────┬──────────────┘
         │
         │ otpEmailService.generateAndSendOtp(phone, email)
         │
┌────────▼────────────────┐
│  OtpEmailService        │
├────────────────────────┤
│ 1. Generate OTP        │
│ 2. Print to Console    │
│ 3. Send via Email      │
│ 4. Save to Database    │
│ 5. Rate Limit Check    │
│ 6. Phone Formatting    │
└────────────────────────┘
         │
         ├──────────────────────────┐
         │                          │
    ┌────▼────┐            ┌───────▼────┐
    │ Console │            │  Gmail     │
    │ Output  │            │  SMTP      │
    └─────────┘            └────────────┘
         │                       │
    Terminal                 User Email
```

## Rate Limiting

- **Max OTPs:** 5 per hour per phone number
- **Check:** Automatic before sending
- **Error:** "Too many OTP requests. Please try again after 1 hour."

## Next Steps (Optional)

### Add SMS via Twilio
If you want to add SMS in the future:
1. Create `OtpSmsService.java`
2. Call both `sendOtpViaEmail()` and `sendOtpViaSms()`
3. Add Twilio credentials to application.properties

### Customize Email Template
Modify `OtpEmailService.java` line ~105 to change:
- HTML styling
- Email subject
- Email content

### Change OTP Expiry
Edit `OtpEmailService.java`:
```java
private static final int OTP_EXPIRY_MINUTES = 5; // Change to desired minutes
```

## Troubleshooting

### OTP Not Received in Email?
1. Check console output (OTP should print)
2. Check Gmail spam folder
3. Verify SMTP credentials in application.properties
4. Check Gmail "Less secure app access" is enabled

### Terminal Shows No OTP?
1. Ensure backend is running
2. Check application is using OtpEmailService
3. Look for error messages in console

### Rate Limit Error?
1. Wait 1 hour before requesting new OTP
2. Or check database for existing OTPs

## Summary

✨ **Clean, Simple Implementation**
- No complex Firebase setup required
- Works with Gmail SMTP (free tier)
- OTP visible in console for development
- Email sent to user for verification
- Rate limiting included
- 5-minute expiry built-in
