# Firebase OTP Implementation Quick Start ⚡

## Complete Step-by-Step Implementation Guide

### 📋 Prerequisites
- Firebase Account (free)
- Your Ride-Sharing backend project
- Maven installed
- Git (optional)

---

## 🚀 STEP 1: Create Firebase Project (5 minutes)

### 1.1 Create Project

1. Visit [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"**
3. Enter project name: `RideSharing` (or your preferred name)
4. Uncheck "Enable Google Analytics" (optional)
5. Click **"Create project"**
6. Wait for creation (1-2 minutes)

### 1.2 Enable Phone Authentication

1. Go to **Authentication** (left sidebar)
2. Click **"Get started"**
3. Click on **"Phone"** sign-in method
4. Click **"Enable"** toggle
5. Click **"Save"**

### 1.3 Create Service Account

1. Click ⚙️ **Settings** (gear icon)
2. Go to **"Project settings"** tab
3. Click **"Service accounts"** tab
4. Click **"Generate new private key"** button
5. A JSON file will download
6. **Keep this file safe!**

---

## 🔧 STEP 2: Add Firebase to Backend (10 minutes)

### 2.1 Copy Downloaded Credentials File

1. Locate downloaded JSON file: `ridesharing-xyz-firebase-adminsdk-abc.json`
2. Copy it to: `Ride-Sharing/src/main/resources/`
3. Rename to: `firebase-service-account-key.json`

**Path should be:**
```
Ride-Sharing/
└── src/
    └── main/
        └── resources/
            └── firebase-service-account-key.json  ✅
```

### 2.2 Update pom.xml (Dependencies Added)

✅ **Already done!** Check your `pom.xml` - it should have:

```xml
<!-- Firebase Admin SDK for OTP Authentication -->
<dependency>
    <groupId>com.google.firebase</groupId>
    <artifactId>firebase-admin</artifactId>
    <version>9.2.0</version>
</dependency>

<!-- Google Auth Library -->
<dependency>
    <groupId>com.google.auth</groupId>
    <artifactId>google-auth-library-oauth2-http</artifactId>
    <version>1.11.0</version>
</dependency>
```

If not there, add it to `<dependencies>` section.

### 2.3 Update application.properties

Update: `Ride-Sharing/src/main/resources/application.properties`

Replace `YOUR_FIREBASE_PROJECT_ID` with your actual project ID:

```properties
# ===== FIREBASE OTP CONFIGURATION =====
firebase.project-id=ridesharing-abc123
firebase.service-account-key-path=classpath:firebase-service-account-key.json

# Development Settings
app.mock-otp=true
```

**Where to find Project ID:**
- Firebase Console → Project Settings → Project ID

### 2.4 Files Already Created ✅

These files have been created for you:

1. **FirebaseConfig.java** - Initializes Firebase
2. **FirebaseOtpService.java** - Handles OTP logic
3. **OtpService.java** - Updated to use Firebase

---

## 📥 STEP 3: Install Dependencies

### 3.1 Maven Update

```bash
cd Ride-Sharing
mvn clean install -DskipTests
```

This will download Firebase and Google Auth libraries (~5-10 minutes first time).

---

## 🧪 STEP 4: Test the Setup

### 4.1 Start Backend

```bash
cd Ride-Sharing
mvn spring-boot:run
```

### 4.2 Check Console for Initialization

Look for these success messages:

```
✅ Firebase initialized successfully!
📱 Firebase Project ID: ridesharing-abc123
```

If you see errors, check:
- ✅ `firebase-service-account-key.json` exists in `src/main/resources/`
- ✅ Correct project ID in `application.properties`
- ✅ All dependencies installed (`mvn clean install`)

### 4.3 Test OTP Generation

Use your favorite API testing tool (Postman, curl, Insomnia):

**Request:**
```bash
curl -X POST http://localhost:8080/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+919876543210"}'
```

Or if your backend endpoint is different:
```bash
curl -X POST http://localhost:8080/api/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "9876543210"}'
```

**Expected Console Output:**
```
==================================================
🔐 MOCK OTP FOR DEVELOPMENT
==================================================
📱 Phone Number: +919876543210
🔢 OTP Code:    123456
⏰ Expires At:   2025-11-12 10:30:45
==================================================
💡 In production, Firebase would send this via SMS
💡 Use the OTP above for testing
==================================================
```

---

## 🎨 STEP 5: Frontend Integration

### 5.1 Update Login Component

**File:** `client/src/components/LoginPage.jsx` or `OtpVerification.jsx`

```javascript
import { useToast } from './ToastContext'
import apiService from '../services/api'

export default function LoginPage() {
  const toast = useToast()
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)

  // Step 1: Request OTP
  const handleSendOtp = async () => {
    try {
      if (!phoneNumber || phoneNumber.length !== 10) {
        toast.error('Enter valid 10-digit phone number')
        return
      }

      setLoading(true)
      
      // Call your backend endpoint
      const response = await apiService.post('/api/auth/send-otp', {
        phoneNumber: phoneNumber  // Backend will format it
      })

      if (response.status === 'SUCCESS') {
        setOtpSent(true)
        toast.success('OTP sent! Check console for mock OTP (development)')
      } else {
        toast.error(response.message || 'Failed to send OTP')
      }
    } catch (err) {
      toast.error(err.message || 'Error sending OTP')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    try {
      if (!otp || otp.length !== 6) {
        toast.error('Enter 6-digit OTP')
        return
      }

      setLoading(true)

      // Call your backend verification endpoint
      const response = await apiService.post('/api/auth/verify-login-otp', {
        phoneNumber: phoneNumber,
        otp: otp
      })

      if (response.status === 'SUCCESS') {
        // Store JWT token
        localStorage.setItem('token', response.token)
        toast.success('Login successful! 🎉')
        
        // Redirect to dashboard or home
        window.location.href = '/dashboard'
      } else {
        toast.error(response.message || 'Invalid OTP')
      }
    } catch (err) {
      toast.error(err.message || 'Error verifying OTP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>Login with OTP</h2>

        {!otpSent ? (
          <>
            <div className="form-group">
              <label>📱 Phone Number (10 digits)</label>
              <input
                type="tel"
                placeholder="9876543210"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                maxLength="10"
                disabled={loading}
              />
            </div>

            <button 
              onClick={handleSendOtp} 
              disabled={loading || phoneNumber.length !== 10}
              className="btn-primary"
            >
              {loading ? '⏳ Sending...' : '📤 Send OTP'}
            </button>
          </>
        ) : (
          <>
            <div className="form-group">
              <label>🔐 Enter 6-Digit OTP</label>
              <input
                type="text"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                maxLength="6"
                disabled={loading}
              />
              <small className="hint">
                💡 Check browser console (F12) for mock OTP during development
              </small>
            </div>

            <button 
              onClick={handleVerifyOtp} 
              disabled={loading || otp.length !== 6}
              className="btn-primary"
            >
              {loading ? '⏳ Verifying...' : '✅ Verify OTP'}
            </button>

            <button 
              onClick={() => {
                setOtpSent(false)
                setOtp('')
              }}
              className="btn-secondary"
            >
              ← Back
            </button>
          </>
        )}
      </div>
    </div>
  )
}
```

---

## ✅ STEP 6: Verify Everything Works

### 6.1 Full Workflow Test

1. ✅ Start backend: `mvn spring-boot:run`
2. ✅ Start frontend: `npm run dev` (in client folder)
3. ✅ Go to login page in browser
4. ✅ Enter 10-digit phone number (e.g., `9876543210`)
5. ✅ Click "Send OTP"
6. ✅ Check backend console for mock OTP
7. ✅ Copy OTP from console
8. ✅ Enter OTP in frontend
9. ✅ Click "Verify OTP"
10. ✅ Should see success message and redirect to dashboard

---

## 📊 Troubleshooting

### Issue: Firebase not initializing

**Error in console:**
```
❌ Failed to initialize Firebase
```

**Solution:**
```bash
# 1. Check file exists
ls Ride-Sharing/src/main/resources/firebase-service-account-key.json

# 2. Check content is valid JSON
cat Ride-Sharing/src/main/resources/firebase-service-account-key.json

# 3. Check application.properties has correct project-id
grep firebase.project-id Ride-Sharing/src/main/resources/application.properties
```

### Issue: OTP not printing to console

**Solution:**
- Check backend console (not browser console)
- Look for: `🔐 MOCK OTP FOR DEVELOPMENT`
- Make sure backend is running with `mvn spring-boot:run`

### Issue: Maven dependency download fails

**Solution:**
```bash
# Clear Maven cache and retry
mvn clean install -U

# Or if network issue, try:
mvn clean install -o  # offline mode
```

---

## 🎯 Summary of Changes

### Backend Changes
- ✅ Added Firebase Admin SDK to `pom.xml`
- ✅ Created `FirebaseConfig.java`
- ✅ Created `FirebaseOtpService.java`
- ✅ Updated `OtpService.java` to use Firebase
- ✅ Updated `application.properties` with Firebase config
- ✅ Keeps mock OTP printing for development

### Frontend Changes
- Update login component to send phone number
- Get OTP from console (mock)
- Enter OTP and verify
- Uses Toast notifications from ToastContext

### Key Features
- ✅ **FREE** - Firebase has free tier
- ✅ **Production-ready** - Easy to add real SMS later
- ✅ **Mock OTP** - Perfect for development testing
- ✅ **Rate limiting** - Max 5 OTPs per hour per phone
- ✅ **Secure** - Credentials in JSON file (not in code)

---

## 🚀 Next Steps

1. **Now:** Test with mock OTP locally
2. **Later:** Add real SMS sending (Firebase Cloud Functions)
3. **Production:** Use Firebase Custom Auth + Real SMS

---

## 📞 Need Help?

Check these files:
- `FIREBASE_OTP_SETUP_GUIDE.md` - Detailed setup
- `FIREBASE_CREDENTIALS_TEMPLATE.md` - How to get credentials
- Backend console logs - For troubleshooting

Good luck! 🎉
