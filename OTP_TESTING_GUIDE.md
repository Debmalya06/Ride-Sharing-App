# 🧪 Testing OTP Email System

## ✅ Quick Test Steps

### Step 1: Register a New User
Copy and paste this in PowerShell:

```powershell
$headers = @{"Content-Type"="application/json"}
$body = @{
    "firstName" = "Test"
    "lastName" = "User"
    "phoneNumber" = "7278429558"
    "email" = "debmalyapan4@gmail.com"
    "password" = "Test123!@#"
    "role" = "PASSENGER"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8080/api/auth/register" `
  -Method POST `
  -Headers $headers `
  -Body $body
```

### Step 2: Check Terminal Output
Look in the Spring Boot console for:
```
============================================================
🔐 MOCK OTP FOR DEVELOPMENT
============================================================
📱 Phone Number: +917278429558
📧 Email Address: debmalyapan4@gmail.com
🔢 OTP Code:     123456
⏰ Expires At:    ...
============================================================
✅ OTP is also being sent to your email!
============================================================
```

**Copy the OTP code!**

### Step 3: Check Email
1. Check your inbox at debmalyapan4@gmail.com
2. Look for email from: "SmartRide <debmalyapan4@gmail.com>"
3. Subject: "🔐 SmartRide OTP Verification - XXXXXX"
4. Contains: OTP code, phone number, expiry time
5. Should arrive within 1-2 seconds

### Step 4: Verify OTP
Replace `123456` with the OTP from console:

```powershell
$headers = @{"Content-Type"="application/json"}
$body = @{
    "phoneNumber" = "7278429558"
    "otp" = "123456"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8080/api/auth/verify-otp" `
  -Method POST `
  -Headers $headers `
  -Body $body
```

Expected response:
```json
{
  "message": "Phone number verified successfully",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "user": {
    "id": 1,
    "firstName": "Test",
    "lastName": "User",
    "phoneNumber": "+917278429558",
    "email": "debmalyapan4@gmail.com",
    "role": "PASSENGER",
    "isVerified": true
  }
}
```

---

## 📱 Test Different Phone Numbers

### With Different Emails
```powershell
# Test with different email
$body = @{
    "firstName" = "John"
    "lastName" = "Doe"
    "phoneNumber" = "9876543210"
    "email" = "john@example.com"
    "password" = "Test123!@#"
    "role" = "DRIVER"
} | ConvertTo-Json
```

### Test Resend OTP
```powershell
Invoke-WebRequest -Uri "http://localhost:8080/api/auth/resend-otp?phoneNumber=7278429558" `
  -Method POST
```

---

## ⚠️ What to Verify

✅ **Console Output**
- [ ] OTP prints to terminal immediately
- [ ] Phone number formatted as +91XXXXXXXXXX
- [ ] Email address matches request
- [ ] Expiry time is correct (5 minutes from now)

✅ **Email Received**
- [ ] Email arrives in inbox within 1-2 seconds
- [ ] From address is correct
- [ ] Subject contains OTP code
- [ ] OTP matches console output
- [ ] Email is properly formatted (HTML)
- [ ] Contains all info: phone, OTP, expiry, warning

✅ **OTP Verification**
- [ ] Correct OTP: Returns access token and user info
- [ ] Wrong OTP: Returns error message
- [ ] Expired OTP: Returns error message
- [ ] Already used OTP: Returns error message

✅ **Features**
- [ ] Rate limiting works (5 OTPs per hour)
- [ ] Phone formatting auto-fixes 10 digits → +91XXXXXXXXXX
- [ ] Multiple users can have different OTPs

---

## 🔧 Troubleshooting

### Problem: Console shows OTP but email not received

**Solution:**
1. Check spam/junk folder in Gmail
2. Verify SMTP credentials in application.properties:
   ```
   spring.mail.username=debmalyapan4@gmail.com
   spring.mail.password=zide dsvv ooan vxqf
   ```
3. Check if Gmail "Less secure app access" is enabled
4. Check backend console for email errors

### Problem: Console doesn't show OTP

**Solution:**
1. Check backend is running: `Get-Process java`
2. Check URL is correct: `http://localhost:8080`
3. Check request body JSON is valid
4. Look for error messages in backend console
5. Ensure PhoneNumber and Email are provided

### Problem: "Rate limit exceeded" error

**Solution:**
1. You already sent 5 OTPs to this phone in the last hour
2. Wait 1 hour OR
3. Use a different phone number for testing

### Problem: "Phone number already exists" error

**Solution:**
1. Use a different phone number for testing
2. Or delete the user from database and retry

---

## 📊 Full Test Scenario

```
1. Register User
   Input: phone=7278429558, email=test@gmail.com
   Output: User created, OTP sent

2. Check Console
   Output: 🔐 MOCK OTP FOR DEVELOPMENT
           📱 Phone Number: +917278429558
           🔢 OTP Code: 456789

3. Check Email
   Output: Email from SmartRide with OTP 456789

4. Wait 5 Minutes (Optional)
   Test: Try to verify expired OTP

5. Verify OTP
   Input: phone=7278429558, otp=456789
   Output: accessToken returned ✅

6. Resend OTP (Test rate limiting)
   Input: phone=7278429558
   Output: New OTP sent

7. Invalid OTP (Test validation)
   Input: phone=7278429558, otp=000000
   Output: Invalid OTP error
```

---

## 🎯 Expected Results Summary

| Test Case | Input | Expected Output |
|-----------|-------|-----------------|
| Register | Valid data | User created, OTP sent |
| Register | Existing phone | Error: Phone already exists |
| Register | Missing email | Error: Email required |
| Console | OTP generated | 🔐 MOCK OTP appears |
| Email | OTP sent | HTML email in inbox |
| Verify | Correct OTP | Access token returned |
| Verify | Wrong OTP | Error: Invalid OTP |
| Verify | Expired OTP | Error: OTP expired |
| Resend | Valid phone | New OTP sent |
| Resend | 6 OTPs in hour | Error: Rate limit |

---

## ✨ Success Checklist

When everything is working, you should see:

- ✅ OTP prints to terminal immediately
- ✅ Email arrives within 1-2 seconds
- ✅ Console and email OTPs match
- ✅ OTP verification returns access token
- ✅ Invalid OTP returns error
- ✅ Rate limiting works (max 5/hour)
- ✅ Phone formatting works (+91XXXXXXXXXX)

**All checks passing = System is working correctly! 🎉**
