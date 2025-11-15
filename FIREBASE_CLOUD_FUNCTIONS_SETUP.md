# Firebase Cloud Functions Setup - Complete Guide

## ✅ What Was Done

Your backend is now configured to send **real SMS via Firebase Cloud Functions**!

### Changes Made:
1. ✅ Updated `app.mock-otp=false` in `application.properties`
2. ✅ Updated `FirebaseOtpService.java` to call Firebase Cloud Function
3. ✅ Removed mock OTP console printing
4. ✅ Created Cloud Function template: `functions-sendOtp.js`

---

## 🚀 Next Steps: Deploy Firebase Cloud Function

### Step 1: Install Firebase CLI

```bash
# Install globally
npm install -g firebase-tools

# Verify installation
firebase --version
```

### Step 2: Initialize Firebase Functions

```bash
# Navigate to your Firebase project directory
cd your-project-root

# Initialize Firebase
firebase init functions

# Choose:
# - Language: JavaScript
# - ESLint: Y (for code quality)
# - Install dependencies: Y
```

### Step 3: Create the sendOtp Function

Replace `functions/index.js` with the content from `functions-sendOtp.js`:

```bash
# Copy the template file
cp functions-sendOtp.js functions/index.js

# Or manually copy the content from functions-sendOtp.js
```

### Step 4: Install Twilio

```bash
cd functions
npm install twilio
cd ..
```

### Step 5: Set Environment Variables

Firebase Cloud Functions require Twilio credentials. Set them in Firebase Console:

```bash
# Deploy with environment variables (interactive)
firebase functions:config:set twilio.accountsid="ACxxxxxxxxxxxxxxxx" twilio.authtoken="xxxxxxxxxxxxxxxx" twilio.phonenumber="+1234567890"

# Or use .env file in functions/ directory:
```

**Create `functions/.env.local`:**
```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
```

### Step 6: Get Twilio Credentials

1. Go to: https://www.twilio.com/console
2. Copy:
   - **Account SID** (Account > API Keys & tokens)
   - **Auth Token** (Account > API Keys & tokens)
   - **Phone Number** (Phone Numbers > Manage Active Numbers)

### Step 7: Deploy Cloud Function

```bash
# Deploy specific function
firebase deploy --only functions:sendOtp

# Or deploy all functions
firebase deploy

# Watch logs
firebase functions:log
```

### Step 8: Get Cloud Function URL

After deployment, you'll see:

```
✔ functions[sendOtp]: https://REGION-PROJECT_ID.cloudfunctions.net/sendOtp
```

### Step 9: Update Backend (Optional - Already Done)

The URL is already configured in `FirebaseOtpService.java`:

```java
String region = "asia-south1";
String projectId = "ridesharing-692d1";
return String.format("https://%s-%s.cloudfunctions.net/sendOtp", region, projectId);
```

---

## 📋 Complete Setup Checklist

- [ ] Firebase CLI installed (`firebase --version`)
- [ ] Firebase project initialized (`firebase init functions`)
- [ ] `functions/index.js` created with sendOtp function
- [ ] Twilio installed (`npm install twilio` in functions/)
- [ ] Twilio credentials obtained (AccountSID, AuthToken, PhoneNumber)
- [ ] Environment variables set in Firebase
- [ ] Cloud Function deployed (`firebase deploy --only functions:sendOtp`)
- [ ] Cloud Function URL visible in Firebase Console
- [ ] Backend `FirebaseOtpService.java` updated (✅ Already done)
- [ ] `app.mock-otp=false` set (✅ Already done)

---

## 🧪 Test the Integration

### Test 1: Call OTP Endpoint

```bash
curl -X POST http://localhost:8080/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"9876543210"}'
```

### Expected Response:

```json
{
  "success": true,
  "message": "✅ OTP generated and sent to phone: +919876543210"
}
```

### Check Backend Logs:

```
📱 Calling Firebase Cloud Function to send SMS to: +919876543210
🔐 OTP sending initiated via Firebase Cloud Function
📤 Payload: {"phoneNumber": "+919876543210", "otp": "654321"}
💬 Firebase will send SMS: 'Your SmartRide OTP: 654321 via Cloud Function'
```

### Check Mobile Phone:

You should receive SMS:
```
Your SmartRide OTP: 654321. Valid for 5 minutes. Do not share this code.
```

---

## 🔐 Environment Variables Setup (Detailed)

### Method 1: Firebase Console (Easiest)

1. Go to: https://console.firebase.google.com/
2. Select your project: `ridesharing-692d1`
3. Navigate: **Functions** → **Runtime settings** (⚙️)
4. Set environment variables:
   ```
   TWILIO_ACCOUNT_SID = ACxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN = xxxxxxxxxxxxxxxx
   TWILIO_PHONE_NUMBER = +1234567890
   ```
5. Save and redeploy

### Method 2: Firebase CLI

```bash
firebase functions:config:set twilio.accountsid="ACxxxxxxxxxxxxxxxx"
firebase functions:config:set twilio.authtoken="xxxxxxxxxxxxxxxx"
firebase functions:config:set twilio.phonenumber="+1234567890"

firebase deploy --only functions:sendOtp
```

### Method 3: .env File (Development)

Create `functions/.env.local`:
```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
```

---

## 📱 Test Scenarios

### Scenario 1: Successful SMS

**Request:**
```bash
curl -X POST http://localhost:8080/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"9876543210"}'
```

**Response:**
```json
{
  "success": true,
  "message": "✅ OTP generated and sent to phone: +919876543210"
}
```

**SMS Received:**
```
Your SmartRide OTP: 123456. Valid for 5 minutes. Do not share this code.
```

### Scenario 2: Rate Limit (Too Many Requests)

**Request (5th request within 1 hour):**
```bash
curl -X POST http://localhost:8080/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"9876543210"}'
```

**Response:**
```json
{
  "success": false,
  "message": "Too many OTP requests. Please try again after 1 hour."
}
```

### Scenario 3: Invalid Phone Number

**Request:**
```bash
curl -X POST http://localhost:8080/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":""}'
```

**Response:**
```json
{
  "success": false,
  "message": "Phone number cannot be empty"
}
```

---

## ❌ Troubleshooting

### Issue: "Firebase Cloud Function URL not accessible"

**Cause:** Function not deployed or URL is wrong

**Fix:**
```bash
# Check deployment status
firebase deploy --only functions:sendOtp

# Check logs
firebase functions:log
```

### Issue: "Twilio credentials not found"

**Cause:** Environment variables not set

**Fix:**
```bash
# Verify env variables
firebase functions:config:get

# Re-set them
firebase functions:config:set twilio.accountsid="your-sid"
firebase functions:config:set twilio.authtoken="your-token"
firebase functions:config:set twilio.phonenumber="your-phone"

# Redeploy
firebase deploy --only functions:sendOtp
```

### Issue: "SMS not received"

**Cause 1:** Twilio account not activated
- Go to: https://www.twilio.com/console
- Verify account is active (not on trial)

**Cause 2:** Phone number in wrong format
- Expected: +1234567890 or +919876543210
- Wrong: 9876543210 or (987) 654-3210

**Cause 3:** Function not deployed
```bash
firebase deploy --only functions:sendOtp
firebase functions:log  # Check for errors
```

---

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────┐
│  MOBILE APP / WEB CLIENT                                │
├─────────────────────────────────────────────────────────┤
│  POST /api/auth/send-otp                                │
│  { "phoneNumber": "+919876543210" }                     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  SPRING BOOT BACKEND (localhost:8080)                   │
├─────────────────────────────────────────────────────────┤
│  FirebaseOtpService.java                                │
│  1. Generate OTP: 654321                                │
│  2. Save to Database                                    │
│  3. Call Firebase Cloud Function                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  FIREBASE CLOUD FUNCTION (sendOtp)                      │
├─────────────────────────────────────────────────────────┤
│  https://asia-south1-ridesharing-692d1.cloudfunctions…│
│  Receives: { phoneNumber, otp }                         │
│  Calls Twilio API to send SMS                           │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  TWILIO SMS GATEWAY                                     │
├─────────────────────────────────────────────────────────┤
│  Send SMS to +919876543210                              │
│  Message: "Your SmartRide OTP: 654321..."               │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  USER'S MOBILE PHONE                                    │
├─────────────────────────────────────────────────────────┤
│  SMS Received: "Your SmartRide OTP: 654321..."          │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Cost Estimation

| Service | Cost | Notes |
|---------|------|-------|
| Firebase Cloud Functions | FREE (2 million calls/month) | First 10k sends might be counted as function calls |
| Twilio SMS | $0.0075/SMS | Standard US rate; India rates may vary |
| Example: 1000 users * 5 SMS each | ~$37.50 | Monthly cost |

---

## 📚 Resources

- [Firebase Cloud Functions](https://firebase.google.com/docs/functions)
- [Twilio SMS Documentation](https://www.twilio.com/docs/sms)
- [Spring Boot REST Calls](https://www.baeldung.com/spring-boot-rest-template)
- [Environment Variables in Firebase](https://firebase.google.com/docs/functions/config/set-up-config)

---

## ✅ Summary

**What's Enabled:**
- ✅ Firebase Cloud Functions for OTP sending
- ✅ Real SMS via Twilio
- ✅ Mock OTP disabled
- ✅ Rate limiting (5 OTPs/hour per phone)
- ✅ OTP expiry (5 minutes)

**What's Remaining:**
1. Deploy Cloud Function (firebase deploy)
2. Set Twilio environment variables
3. Test with real phone number

**Next Command:**
```bash
firebase deploy --only functions:sendOtp
```

---

**Status: ⏳ Ready to deploy! Just run Firebase deployment command above.** 🚀
