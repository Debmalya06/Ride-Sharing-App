# Firebase SMS Production Setup Guide

## ⚠️ Prerequisites

Before enabling real SMS, you need:
- Firebase project created (you already have: `ridesharing-692d1`)
- Firebase Console access
- Google Cloud Billing enabled (SMS requires payment method)

---

## 🔧 Step-by-Step Setup

### Step 1: Enable Phone Authentication in Firebase Console

1. Go to: https://console.firebase.google.com/
2. Select project: **ridesharing-692d1**
3. Navigate: **Authentication** → **Sign-in method**
4. Click: **Phone** → Enable → Save

![Firebase Phone Auth Enable](https://firebase.google.com/docs/auth/images/phone-enable.png)

### Step 2: Set Up Firebase Phone Auth REST API

The Firebase Admin SDK (already installed) will handle SMS sending.

**Add to FirebaseOtpService.java:**

```java
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;

// Send real SMS using Firebase Phone Auth
public void sendRealSms(String phoneNumber, String otp) throws FirebaseAuthException {
    // This method demonstrates how to integrate Firebase Phone Auth
    // For production: implement Firebase Cloud Functions
}
```

### Step 3: Implement Cloud Functions for SMS

Create a Firebase Cloud Function to send real SMS:

**Firebase Cloud Function (Node.js):**

```javascript
// functions/sendOtp.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.sendOtp = functions.https.onCall(async (data, context) => {
  const { phoneNumber, otp } = data;
  
  // Send SMS using Firebase Phone Auth
  const message = `Your SmartRide OTP: ${otp}. Valid for 5 minutes.`;
  
  // Method 1: Use Firebase Cloud Messaging (FCM)
  // Method 2: Integrate with Twilio/AWS SNS
  // Method 3: Use Firebase Remote Config
  
  return { success: true, messageSid: 'msg_xxxxx' };
});
```

### Step 4: Update Backend to Call Cloud Function

**Add to FirebaseOtpService.java:**

```java
import com.google.firebase.functions.FirebaseFunction;

public void generateAndSendOtp(String phoneNumber) {
    String otp = generateOtp();
    
    // For production: call Firebase Cloud Function
    // CallableReference function = FirebaseFunction.getInstance()
    //     .getHttpsCallable("sendOtp");
    // 
    // Map<String, Object> data = new HashMap<>();
    // data.put("phoneNumber", phoneNumber);
    // data.put("otp", otp);
    // 
    // function.call(data).addOnSuccessListener(result -> {
    //     System.out.println("✅ SMS sent successfully!");
    // });
    
    // Save to database
    OtpVerification otpVerification = new OtpVerification(phoneNumber, otp, expiresAt);
    otpRepository.save(otpVerification);
}
```

---

## 💰 Cost Considerations

| Method | Cost | Setup Time | Notes |
|--------|------|-----------|-------|
| **Mock OTP (Current)** | FREE | Already Done | Perfect for development |
| **Firebase Phone Auth** | FREE (limited) | 30 mins | Free tier: 10 free SMS/month |
| **Twilio (Alternative)** | $0.0075/SMS | 20 mins | Reliable, paid per SMS |
| **AWS SNS** | $0.01/SMS | 25 mins | Enterprise-grade |

---

## ✅ Current Recommended Approach

**For now (Development):**
- ✅ Keep Mock OTP (prints to console)
- ✅ Test all flows without SMS costs
- ✅ Use console output for verification

**For Production:**
- 🔄 Enable Firebase Phone Auth (free tier first)
- 🔄 Deploy Cloud Functions for SMS
- 🔄 Monitor SMS costs and scale as needed

---

## 🧪 Testing Mock OTP

```bash
# 1. Start backend
mvn spring-boot:run

# 2. Call OTP endpoint
curl -X POST http://localhost:8080/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"9876543210"}'

# 3. Check console for mock OTP output:
# ==================================================
# 🔐 MOCK OTP FOR DEVELOPMENT
# ==================================================
# 📱 Phone Number: +919876543210
# 🔢 OTP Code:    123456
# ⏰ Expires At:   2025-11-12T14:05:00
# ==================================================

# 4. Use that OTP to verify:
curl -X POST http://localhost:8080/api/auth/verify-login-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"9876543210","otp":"123456"}'
```

---

## 📚 Production Checklist

- [ ] Firebase project created and configured
- [ ] Phone authentication enabled in Firebase Console
- [ ] Cloud Function deployed for SMS sending
- [ ] Backend updated to call Cloud Function
- [ ] SMS gateway configured (Firebase/Twilio/AWS SNS)
- [ ] Rate limiting tested (5 OTPs per hour)
- [ ] OTP expiry tested (5 minutes)
- [ ] Mobile app receives SMS correctly
- [ ] OTP verification works end-to-end
- [ ] Error handling tested for failed SMS

---

## 🔗 Useful Resources

- [Firebase Phone Authentication](https://firebase.google.com/docs/auth/web/phone-auth)
- [Firebase Cloud Functions](https://firebase.google.com/docs/functions)
- [Twilio SMS Integration](https://www.twilio.com/docs)
- [AWS SNS for SMS](https://docs.aws.amazon.com/sns/latest/dg/SendMessageToPhoneNumber.html)

---

## ❓ FAQ

**Q: Why doesn't SMS send in development?**
A: Mock OTP is intentional to avoid SMS costs. In development, OTP prints to console for testing.

**Q: How do I enable real SMS?**
A: Follow the steps above to enable Firebase Phone Auth or integrate Twilio/AWS SNS.

**Q: What if I want SMS now?**
A: Integrate Twilio - it's quick (20 mins) and costs ~$0.0075 per SMS. Instructions below:

---

## 🚀 Quick Twilio Integration (Alternative)

If you want real SMS immediately:

### Install Twilio:
```bash
mvn dependency:get -Dartifact=com.twilio.sdk:twilio:9.0.0
```

### Add to application.properties:
```properties
twilio.accountSid=YOUR_ACCOUNT_SID
twilio.authToken=YOUR_AUTH_TOKEN
twilio.fromNumber=+1XXXXXXXXXX
```

### Update FirebaseOtpService.java:
```java
import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;

public void sendRealSms(String phoneNumber, String otp) {
    String message = String.format("Your SmartRide OTP: %s. Valid for 5 minutes.", otp);
    Message.creator(
        new com.twilio.type.PhoneNumber(phoneNumber),
        new com.twilio.type.PhoneNumber(fromNumber),
        message
    ).create();
}
```

Get Twilio credentials: https://www.twilio.com/console

