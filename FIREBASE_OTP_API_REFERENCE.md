# Firebase OTP API Reference

Complete API endpoints for OTP authentication with Firebase.

## 🔐 Endpoints Overview

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/send-otp` | POST | Send OTP to phone number |
| `/api/auth/verify-login-otp` | POST | Verify OTP for login |
| `/api/auth/send-registration-otp` | POST | Send OTP for registration |
| `/api/auth/verify-registration-otp` | POST | Verify OTP during registration |

---

## 1️⃣ Send Login OTP

### Request
```bash
curl -X POST http://localhost:8080/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "9876543210"
  }'
```

### Request Body
```json
{
  "phoneNumber": "9876543210"  // 10-digit number OR +91-9876543210
}
```

### Response (Success)
```json
{
  "status": "SUCCESS",
  "message": "OTP sent successfully",
  "data": {
    "phoneNumber": "+919876543210",
    "expiresIn": 300  // seconds
  }
}
```

### Response (Error)
```json
{
  "status": "ERROR",
  "message": "Too many OTP requests. Please try again after 1 hour.",
  "data": null
}
```

### Phone Number Formats Accepted
- ✅ `9876543210` (10 digits) - Will add +91
- ✅ `+919876543210` (with country code)
- ✅ `91-9876543210` (with dash)
- ✅ `91 9876543210` (with space)

---

## 2️⃣ Verify Login OTP

### Request
```bash
curl -X POST http://localhost:8080/api/auth/verify-login-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "9876543210",
    "otp": "123456"
  }'
```

### Request Body
```json
{
  "phoneNumber": "9876543210",  // Same as sent to send-otp
  "otp": "123456"                // 6-digit code
}
```

### Response (Success)
```json
{
  "status": "SUCCESS",
  "message": "OTP verified successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "phoneNumber": "+919876543210",
    "name": "John Doe",
    "role": "PASSENGER",
    "averageRating": 4.5
  }
}
```

### Response (Error)
```json
{
  "status": "ERROR",
  "message": "Invalid or expired OTP",
  "token": null,
  "user": null
}
```

### Error Cases
| Error Message | Cause |
|---------------|-------|
| `Invalid or expired OTP` | Wrong OTP or OTP expired |
| `Too many verification attempts` | Too many wrong tries |
| `User not found` | Phone not registered |
| `OTP not found` | Never requested OTP |

---

## 3️⃣ Send Registration OTP

### Request
```bash
curl -X POST http://localhost:8080/api/auth/send-registration-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "9876543210"
  }'
```

### Request Body
```json
{
  "phoneNumber": "9876543210"
}
```

### Response (Success)
```json
{
  "status": "SUCCESS",
  "message": "OTP sent to your phone number",
  "data": {
    "phoneNumber": "+919876543210",
    "expiresIn": 300
  }
}
```

### Response (Error - Already Registered)
```json
{
  "status": "ERROR",
  "message": "Phone number already registered",
  "data": null
}
```

---

## 4️⃣ Verify Registration OTP & Register

### Request
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "9876543210",
    "otp": "123456",
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "role": "PASSENGER"
  }'
```

### Request Body
```json
{
  "phoneNumber": "9876543210",
  "otp": "123456",
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",  // Min 6 characters
  "role": "PASSENGER"  // or "DRIVER"
}
```

### Response (Success)
```json
{
  "status": "SUCCESS",
  "message": "Registration successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 123,
    "phoneNumber": "+919876543210",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "PASSENGER"
  }
}
```

### Response (Error)
```json
{
  "status": "ERROR",
  "message": "Invalid OTP",
  "token": null,
  "user": null
}
```

---

## 🧪 Testing with cURL

### Test Flow

1. **Send OTP**
```bash
curl -X POST http://localhost:8080/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "9876543210"}'
```

2. **Check Backend Console**
   - Look for: `🔐 MOCK OTP FOR DEVELOPMENT`
   - Copy the OTP code (e.g., `123456`)

3. **Verify OTP**
```bash
curl -X POST http://localhost:8080/api/auth/verify-login-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "9876543210", "otp": "123456"}'
```

4. **Check Response**
   - Should contain `token` and `user` data

---

## 🧪 Testing with Postman

### Create Collection

1. Open Postman
2. Create new collection: `RideSharing OTP Tests`

### Request 1: Send OTP
- **Name:** Send OTP
- **Method:** POST
- **URL:** `{{base_url}}/api/auth/send-otp`
- **Body (JSON):**
  ```json
  {
    "phoneNumber": "9876543210"
  }
  ```
- **Pre-request Script:**
  ```javascript
  pm.environment.set("base_url", "http://localhost:8080");
  ```

### Request 2: Verify OTP
- **Name:** Verify OTP
- **Method:** POST
- **URL:** `{{base_url}}/api/auth/verify-login-otp`
- **Body (JSON):**
  ```json
  {
    "phoneNumber": "9876543210",
    "otp": "123456"
  }
  ```
- **Tests (Save token for next requests):**
  ```javascript
  if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    pm.environment.set("token", jsonData.token);
  }
  ```

### Use Token in Headers
For any authenticated endpoint:
```
Authorization: Bearer {{token}}
```

---

## 🔒 Rate Limiting

### Limits
- **Max OTPs:** 5 per hour per phone number
- **OTP Validity:** 5 minutes
- **Verification Attempts:** Unlimited (but OTP expires)

### Error Response (Rate Limit)
```json
{
  "status": "ERROR",
  "message": "Too many OTP requests. Please try again after 1 hour."
}
```

---

## 📱 Phone Number Format Examples

### Input Examples → Converted To
| Input | Converted |
|-------|-----------|
| `9876543210` | `+919876543210` |
| `+919876543210` | `+919876543210` |
| `91-9876543210` | `+919876543210` |
| `+91 9876543210` | `+919876543210` |
| `00919876543210` | `+919876543210` |

---

## 🆘 Common Issues & Solutions

### Issue 1: OTP Doesn't Print to Console

**Problem:** No OTP visible in backend console

**Solution:**
1. Ensure backend is running with `mvn spring-boot:run`
2. Check you're looking at backend console (not browser dev tools)
3. Search for: `🔐 MOCK OTP FOR DEVELOPMENT`

### Issue 2: "Invalid or expired OTP" Error

**Problem:** Correct OTP shows as invalid

**Solution:**
1. Check OTP is within 5 minutes of generation
2. Ensure phone number matches (format doesn't matter)
3. OTP can only be used once - send new OTP to try again

### Issue 3: "Too many OTP requests"

**Problem:** Getting rate limit error

**Solution:**
1. Wait 1 hour before requesting new OTP
2. Or use different phone number for testing
3. Check in database if OTPs are old (can delete old rows)

### Issue 4: 404 Endpoint Not Found

**Problem:** `POST /api/auth/send-otp` returns 404

**Solution:**
1. Check backend is running: `mvn spring-boot:run`
2. Verify endpoint exists in AuthController
3. Check exact endpoint URL matches your implementation
4. Use `http://localhost:8080` not `http://127.0.0.1:8080`

---

## 🔄 Complete Registration Flow

```
┌─────────────────┐
│  Send OTP       │ POST /api/auth/send-registration-otp
│  Phone: 98765   │ ✅ Response: OTP sent
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ User Gets OTP   │ Check backend console
│ in Terminal     │ 🔐 MOCK OTP: 123456
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Register       │ POST /api/auth/register
│  with OTP       │ Phone + OTP + Email + Name
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Verify OTP     │ Backend verifies
│  Create User    │ ✅ Registration Success
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Token & User   │ Return JWT token
│  Data           │ + User information
└─────────────────┘
```

---

## 🔄 Complete Login Flow

```
┌─────────────────┐
│  Send OTP       │ POST /api/auth/send-otp
│  Phone: 98765   │ ✅ Response: OTP sent
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ User Gets OTP   │ Check backend console
│ in Terminal     │ 🔐 MOCK OTP: 654321
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Verify OTP     │ POST /api/auth/verify-login-otp
│  Phone + OTP    │ Phone + OTP code
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Check Phone    │ Backend verifies
│  Verify OTP     │ OTP matches & not expired
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Generate JWT   │ Create session token
│  Return User    │ ✅ Login Success
└─────────────────┘
```

---

## 📝 Notes

- All phone numbers are normalized to international format
- OTP codes are 6 random digits (0-9)
- OTP expires after 5 minutes
- Maximum 5 OTP requests per phone per hour
- Mock OTP prints to backend console (development mode)
- Production: Integrate real SMS service

---

**Questions?** Check FIREBASE_IMPLEMENTATION_GUIDE.md for complete setup! 🚀
