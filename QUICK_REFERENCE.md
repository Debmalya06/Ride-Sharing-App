# 🚀 Firebase FCM SMS - Quick Reference Card

## Current Status

| Component | Status | Details |
|-----------|--------|---------|
| Mock OTP | ❌ DISABLED | `app.mock-otp=false` |
| Real SMS | ⏳ READY | Waiting for Cloud Function deployment |
| Backend | ✅ READY | Updated FirebaseOtpService.java |
| Database | ✅ READY | OTP saved with 5-min expiry |
| Rate Limiting | ✅ READY | Max 5 OTPs per hour |

---

## ⚡ Quick Commands

### Deploy Cloud Function
```bash
firebase init functions
cd functions && npm install twilio && cd ..
firebase deploy --only functions:sendOtp
```

### Set Twilio Credentials
```bash
firebase functions:config:set twilio.accountsid="YOUR_SID"
firebase functions:config:set twilio.authtoken="YOUR_TOKEN"  
firebase functions:config:set twilio.phonenumber="+1234567890"
firebase deploy --only functions:sendOtp
```

### Start Backend
```bash
cd Ride-Sharing
mvn spring-boot:run
```

### Test OTP
```bash
curl -X POST http://localhost:8080/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"9876543210"}'
```

---

## 📁 Files Modified

| File | Change | Status |
|------|--------|--------|
| `application.properties` | Set `app.mock-otp=false` | ✅ Done |
| `FirebaseOtpService.java` | Added FCM sending | ✅ Done |
| `functions-sendOtp.js` | Cloud Function template | ✅ Created |

---

## 🎯 Next Steps (In Order)

1. **Get Twilio Account** → https://www.twilio.com/console
   - Copy Account SID
   - Copy Auth Token
   - Get Phone Number

2. **Install Firebase CLI** → `npm install -g firebase-tools`

3. **Deploy Function** → `firebase deploy --only functions:sendOtp`

4. **Set Credentials** → `firebase functions:config:set twilio.accountsid="..."`

5. **Restart Backend** → `mvn spring-boot:run`

6. **Test** → Send OTP request and check mobile for SMS

---

## 📱 How It Works

```
Client POST /api/auth/send-otp
         ↓
Backend: Generate OTP + Save to DB
         ↓  
Backend: Call Firebase Cloud Function
         ↓
Cloud Function: Call Twilio API
         ↓
Twilio: Send SMS to Mobile
         ↓
User: Receives SMS with OTP code
```

---

## ✅ Verification Checklist

Before declaring ready:

- [ ] Firebase CLI version displayed correctly
- [ ] Cloud Function URL accessible
- [ ] Twilio credentials configured
- [ ] OTP appears in database
- [ ] Backend logs show "OTP sending initiated"
- [ ] SMS received on mobile device
- [ ] OTP verification works end-to-end

---

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| SMS not received | Check Twilio account is active (not trial) |
| Cloud Function error | Run `firebase functions:log` to see errors |
| Connection refused | Make sure backend is running (`mvn spring-boot:run`) |
| Rate limit error | Wait 1 hour or test with different phone |
| Invalid phone | Format: `9876543210` or `+919876543210` |

---

## 💾 Backup Files

Created for reference:
- `FIREBASE_CLOUD_FUNCTIONS_SETUP.md` - Full setup guide
- `FIREBASE_FCM_SETUP_SUMMARY.md` - Summary overview
- `functions-sendOtp.js` - Cloud Function code

---

## 📊 Expected Costs

- **Firebase**: FREE (2M function calls/month)
- **Twilio SMS**: $0.0075/SMS
- **Example**: 1000 messages = ~$7.50/month

---

## 🎉 Once It's Working

You'll see in backend logs:
```
📱 Calling Firebase Cloud Function to send SMS to: +919876543210
🔐 OTP sending initiated via Firebase Cloud Function
📤 Payload: {"phoneNumber": "+919876543210", "otp": "654321"}
✅ OTP generated and sent to phone: +919876543210
```

And on mobile:
```
Your SmartRide OTP: 654321. Valid for 5 minutes. Do not share this code.
```

---

## 🔗 Important Links

- Twilio Console: https://www.twilio.com/console
- Firebase Console: https://console.firebase.google.com/
- Firebase Docs: https://firebase.google.com/docs/functions
- Twilio SMS Docs: https://www.twilio.com/docs/sms

---

**Ready to deploy? Follow the 6 quick steps above! 🚀**
