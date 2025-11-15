# Firebase Authentication OTP Setup Guide 🔐

Complete step-by-step guide to replace Twilio with Firebase Authentication for free OTP verification.

## 📋 Table of Contents
1. [Firebase Project Setup](#firebase-project-setup)
2. [Get Firebase Credentials](#get-firebase-credentials)
3. [Backend Configuration](#backend-configuration)
4. [Code Implementation](#code-implementation)
5. [Frontend Integration](#frontend-integration)
6. [Testing & Verification](#testing--verification)

---

## Firebase Project Setup

### Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a new project"** (or "+ Add project")
3. Enter your project name: `RideSharing` (or your preferred name)
4. Configure project settings:
   - ✅ Keep "Analytics" unchecked (optional)
   - Click **"Create project"**
5. Wait for project creation to complete (1-2 minutes)

### Step 2: Enable Phone Authentication

1. In Firebase Console, go to **Authentication** (left sidebar)
2. Click **"Get started"**
3. Go to **"Sign-in method"** tab
4. Click on **"Phone"** and enable it
5. Click **"Save"**
6. You'll see "Phone" is now enabled ✅

### Step 3: Add Web App to Firebase Project

1. In Firebase Console, click **⚙️ Settings** (top-left, gear icon next to "Project Overview")
2. Go to **"Project settings"** tab
3. Scroll down to "Your apps" section
4. Click **"Web"** (</> icon) to add a web app
5. Register app with name: `RideSharing Frontend`
6. **Copy the Firebase config** (you'll need this for frontend)
   ```javascript
   // Example config (yours will be different)
   {
     apiKey: "AIzaSyD...",
     authDomain: "ridesharing-xyz.firebaseapp.com",
     projectId: "ridesharing-xyz",
     storageBucket: "ridesharing-xyz.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc..."
   }
   ```

---

## Get Firebase Credentials

### Step 4: Download Service Account Key

1. In Firebase Console, go to **⚙️ Settings** → **"Project settings"**
2. Click **"Service accounts"** tab
3. Click **"Generate new private key"** button
4. This will download a JSON file named: `ridesharing-xyz-firebase-adminsdk-xxxxx.json`
5. **Keep this file safe!** It contains your private key

### Step 5: Copy Service Account Key to Your Project

1. Save the downloaded JSON file to your backend resources folder:
   ```
   Ride-Sharing/src/main/resources/firebase-service-account-key.json
   ```

2. Open the JSON file and copy its contents (you'll add it to `application.properties`)

---

## Backend Configuration

### Step 6: Update `pom.xml`

Add Firebase dependency to your `pom.xml`:

```xml
<!-- Add to <dependencies> section -->
<dependency>
    <groupId>com.google.firebase</groupId>
    <artifactId>firebase-admin</artifactId>
    <version>9.2.0</version>
</dependency>
```

Run Maven update:
```bash
mvn clean install
```

### Step 7: Update `application.properties`

Replace Twilio credentials with Firebase config:

```properties
# ===== FIREBASE CONFIGURATION =====
firebase.project-id=ridesharing-xyz
firebase.service-account-key-path=classpath:firebase-service-account-key.json

# Disable Twilio (keep for reference, but won't be used)
# twilio.accountSid=xxx
# twilio.authToken=xxx
# twilio.fromNumber=xxx

# Development Settings
app.mock-otp=true
```

---

## Code Implementation

### Step 8: Create Firebase Configuration Class

**File:** `Ride-Sharing/src/main/java/com/ridesharing/config/FirebaseConfig.java`

```java
package com.ridesharing.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;

import java.io.IOException;
import java.io.InputStream;

@Configuration
public class FirebaseConfig {

    @Value("${firebase.service-account-key-path}")
    private Resource serviceAccountKey;

    @Value("${firebase.project-id}")
    private String projectId;

    @Bean
    public FirebaseApp firebaseApp() throws IOException {
        if (FirebaseApp.getApps().isEmpty()) {
            try (InputStream serviceAccount = serviceAccountKey.getInputStream()) {
                GoogleCredentials credentials = GoogleCredentials.fromStream(serviceAccount);

                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(credentials)
                        .setProjectId(projectId)
                        .build();

                FirebaseApp.initializeApp(options);
                System.out.println("✅ Firebase initialized successfully!");
            } catch (IOException e) {
                System.err.println("❌ Failed to initialize Firebase: " + e.getMessage());
                throw e;
            }
        }
        return FirebaseApp.getInstance();
    }
}
```

### Step 9: Create Firebase OTP Service

**File:** `Ride-Sharing/src/main/java/com/ridesharing/service/FirebaseOtpService.java`

```java
package com.ridesharing.service;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.SessionCookieOptions;
import com.google.firebase.auth.UserRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ridesharing.entity.OtpVerification;
import com.ridesharing.repository.OtpVerificationRepository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

@Service
@Transactional
public class FirebaseOtpService {

    private static final Logger logger = LoggerFactory.getLogger(FirebaseOtpService.class);
    private final OtpVerificationRepository otpRepository;
    private static final int OTP_EXPIRY_MINUTES = 5;
    private static final int OTP_LENGTH = 6;
    private static final int MAX_ATTEMPTS_PER_HOUR = 5;

    public FirebaseOtpService(OtpVerificationRepository otpRepository) {
        this.otpRepository = otpRepository;
    }

    /**
     * Generate a random 6-digit OTP
     */
    public String generateOtp() {
        Random random = new Random();
        StringBuilder otp = new StringBuilder();
        
        for (int i = 0; i < OTP_LENGTH; i++) {
            otp.append(random.nextInt(10));
        }
        
        return otp.toString();
    }

    /**
     * Generate and save OTP (Firebase will handle sending via SMS)
     * For development: OTP is printed to console
     */
    public void generateAndSendOtp(String phoneNumber) {
        try {
            // Validate phone number format
            if (!phoneNumber.startsWith("+")) {
                phoneNumber = "+91" + phoneNumber; // Add India country code
            }

            // Check rate limiting (max 5 OTPs per hour)
            if (!canSendOtp(phoneNumber)) {
                throw new RuntimeException("Too many OTP requests. Please try again after 1 hour.");
            }

            // Delete any existing OTPs for this phone number
            otpRepository.deleteByPhoneNumber(phoneNumber);

            // Generate new OTP
            String otp = generateOtp();
            LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES);

            // Save OTP to database
            OtpVerification otpVerification = new OtpVerification(phoneNumber, otp, expiresAt);
            otpRepository.save(otpVerification);

            // ===== MOCK OTP - For development (prints to console) =====
            System.out.println("==============================================");
            System.out.println("🔐 OTP FOR DEVELOPMENT (MOCK)");
            System.out.println("📱 Phone: " + phoneNumber);
            System.out.println("🔢 OTP: " + otp);
            System.out.println("⏰ Expires: " + expiresAt);
            System.out.println("==============================================");
            System.out.println("💡 In production, Firebase would send this via SMS");
            System.out.println("==============================================");

            // ===== PRODUCTION: Firebase SMS would be sent here =====
            // In real production, you would:
            // 1. Use Firebase Authentication REST API to send OTP
            // 2. Or use a third-party SMS service integrated with Firebase
            // For now, we use mock OTP for development
            
            logger.info("OTP generated and saved for phone: {}", phoneNumber);

        } catch (Exception e) {
            logger.error("Error generating OTP: ", e);
            throw new RuntimeException("Failed to generate OTP: " + e.getMessage());
        }
    }

    /**
     * Verify OTP from database
     */
    public boolean verifyOtp(String phoneNumber, String otp) {
        try {
            if (!phoneNumber.startsWith("+")) {
                phoneNumber = "+91" + phoneNumber;
            }

            Optional<OtpVerification> otpVerificationOpt = 
                otpRepository.findByPhoneNumberAndOtpAndIsUsedFalse(phoneNumber, otp);

            if (otpVerificationOpt.isPresent()) {
                OtpVerification otpVerification = otpVerificationOpt.get();
                
                if (otpVerification.isValid()) {
                    // Mark OTP as used
                    otpVerification.markAsUsed();
                    otpRepository.save(otpVerification);
                    
                    logger.info("OTP verified successfully for phone: {}", phoneNumber);
                    return true;
                } else {
                    logger.warn("OTP expired for phone: {}", phoneNumber);
                    return false;
                }
            }

            logger.warn("Invalid OTP attempt for phone: {}", phoneNumber);
            return false;

        } catch (Exception e) {
            logger.error("Error verifying OTP: ", e);
            return false;
        }
    }

    /**
     * Check if user can send OTP (rate limiting)
     */
    public boolean canSendOtp(String phoneNumber) {
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
        long otpCount = otpRepository.countByPhoneNumberAndCreatedAtAfter(phoneNumber, oneHourAgo);
        return otpCount < MAX_ATTEMPTS_PER_HOUR;
    }

    /**
     * Clean up expired OTPs (scheduled task)
     */
    public void cleanupExpiredOtps() {
        otpRepository.deleteByExpiresAtBefore(LocalDateTime.now());
        logger.info("Expired OTPs cleaned up");
    }
}
```

### Step 10: Update OtpService to Use Firebase

**File:** `Ride-Sharing/src/main/java/com/ridesharing/service/OtpService.java`

Replace the old OtpService with:

```java
package com.ridesharing.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ridesharing.entity.OtpVerification;
import com.ridesharing.repository.OtpVerificationRepository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

@Service
@Transactional
public class OtpService {

    private final OtpVerificationRepository otpRepository;
    private final FirebaseOtpService firebaseOtpService;

    // OTP settings
    private static final int OTP_EXPIRY_MINUTES = 5;
    private static final int OTP_LENGTH = 6;

    public OtpService(OtpVerificationRepository otpRepository, FirebaseOtpService firebaseOtpService) {
        this.otpRepository = otpRepository;
        this.firebaseOtpService = firebaseOtpService;
    }

    public String generateOtp() {
        Random random = new Random();
        StringBuilder otp = new StringBuilder();
        
        for (int i = 0; i < OTP_LENGTH; i++) {
            otp.append(random.nextInt(10));
        }
        
        return otp.toString();
    }

    /**
     * Generate and send OTP using Firebase
     */
    public void generateAndSendOtp(String phoneNumber) {
        firebaseOtpService.generateAndSendOtp(phoneNumber);
    }

    /**
     * Verify OTP
     */
    public boolean verifyOtp(String phoneNumber, String otp) {
        return firebaseOtpService.verifyOtp(phoneNumber, otp);
    }

    /**
     * Clean up expired OTPs
     */
    public void cleanupExpiredOtps() {
        firebaseOtpService.cleanupExpiredOtps();
    }

    /**
     * Check if user can send OTP
     */
    public boolean canSendOtp(String phoneNumber) {
        return firebaseOtpService.canSendOtp(phoneNumber);
    }
}
```

### Step 11: Remove Twilio Service (Optional)

You can keep TwilioService for reference or delete it. If keeping, just don't use it.

---

## Frontend Integration

### Step 12: Update Login Page OTP UI

In your `client/src/components/OtpVerification.jsx` or `LoginPage.jsx`:

```javascript
import { useToast } from './ToastContext'

const LoginPage = () => {
  const toast = useToast()
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)

  // Request OTP
  const handleSendOtp = async () => {
    try {
      if (!phoneNumber || phoneNumber.length !== 10) {
        toast.error('Enter valid 10-digit phone number')
        return
      }

      setLoading(true)
      const response = await apiService.post('/api/auth/send-otp', {
        phoneNumber: '+91' + phoneNumber
      })

      if (response.status === 'SUCCESS') {
        setOtpSent(true)
        toast.success('OTP sent to your phone! Check terminal for mock OTP.')
      } else {
        toast.error(response.message || 'Failed to send OTP')
      }
    } catch (err) {
      toast.error(err.message || 'Error sending OTP')
    } finally {
      setLoading(false)
    }
  }

  // Verify OTP
  const handleVerifyOtp = async () => {
    try {
      if (!otp || otp.length !== 6) {
        toast.error('Enter 6-digit OTP')
        return
      }

      setLoading(true)
      const response = await apiService.post('/api/auth/verify-login-otp', {
        phoneNumber: '+91' + phoneNumber,
        otp: otp
      })

      if (response.status === 'SUCCESS') {
        // Store token and redirect
        localStorage.setItem('token', response.token)
        toast.success('Login successful!')
        // Redirect to dashboard
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
    <div className="login-form">
      {!otpSent ? (
        <>
          <input
            type="tel"
            placeholder="Enter 10-digit phone number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            maxLength="10"
            pattern="\d{10}"
          />
          <button onClick={handleSendOtp} disabled={loading}>
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </>
      ) : (
        <>
          <input
            type="text"
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength="6"
            pattern="\d{6}"
          />
          <button onClick={handleVerifyOtp} disabled={loading}>
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
          <button onClick={() => setOtpSent(false)}>
            Send OTP again
          </button>
        </>
      )}
    </div>
  )
}
```

---

## Testing & Verification

### Step 13: Test the Implementation

1. **Start your backend:**
   ```bash
   cd Ride-Sharing
   mvn spring-boot:run
   ```

2. **Check console output:**
   You should see:
   ```
   ✅ Firebase initialized successfully!
   ```

3. **Test OTP generation:**
   - Go to login page
   - Enter phone number: `9876543210`
   - Click "Send OTP"
   - Check backend console for mock OTP:
     ```
     ==============================================
     🔐 OTP FOR DEVELOPMENT (MOCK)
     📱 Phone: +919876543210
     🔢 OTP: 123456
     ⏰ Expires: 2025-11-12 10:30:45
     ==============================================
     ```

4. **Test OTP verification:**
   - Enter the OTP from console
   - Click "Verify OTP"
   - Should see success message

### Step 14: Firebase Console Verification

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Your project should be visible and "Authentication" should show "Phone" is enabled
3. (Optional) Check "Authentication" → "Users" tab to see registered users

---

## Production Deployment

### For Production (Future Enhancement):

To send real SMS via Firebase in production:

1. **Option A: Firebase Cloud Functions**
   ```javascript
   // Create Cloud Function to send SMS via Twilio/Nexmo
   exports.sendOtp = functions.https.onCall((data, context) => {
     // Send SMS to data.phoneNumber
   })
   ```

2. **Option B: Third-Party SMS Service**
   - Use Firebase + AWS SNS
   - Use Firebase + Twilio (but through Cloud Functions)
   - Use Firebase + Fast2SMS (popular in India)

3. **Current Setup (Development)**
   - Mock OTP in console
   - Easy testing without real SMS costs

---

## Troubleshooting

### Issue: Firebase not initializing

**Solution:**
- Check `firebase-service-account-key.json` exists in `src/main/resources/`
- Verify `firebase.project-id` in `application.properties`
- Check file permissions on the JSON file

### Issue: OTP not generating

**Solution:**
- Check console logs for errors
- Verify database connection
- Ensure `OtpVerification` table exists

### Issue: Phone number format issues

**Solution:**
- Frontend should send: `+919876543210`
- Backend will validate and format automatically
- Mock OTP will show correct format

---

## Summary

✅ **What you get:**
- Free OTP verification via Firebase
- Mock OTP prints to console (development)
- Production-ready structure
- Easy to switch to real SMS later
- No Twilio costs

✅ **Key Files Changed:**
1. `pom.xml` - Added Firebase dependency
2. `application.properties` - Firebase config
3. New: `FirebaseConfig.java` - Firebase initialization
4. New: `FirebaseOtpService.java` - Firebase OTP logic
5. Updated: `OtpService.java` - Uses Firebase service

✅ **Next Steps:**
1. Add `firebase-service-account-key.json` to project
2. Update `pom.xml` with Firebase dependency
3. Update `application.properties`
4. Add new config and service classes
5. Update `OtpService.java`
6. Test on frontend

---

**Questions or issues?** Check the console logs first - they provide detailed information! 🚀
