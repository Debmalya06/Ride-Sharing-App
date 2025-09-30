# 🚗 Driver Verification Process - Complete Guide

## 📋 **Driver Verification Workflow**

Your Ride Sharing app has a comprehensive driver verification system to ensure safety and compliance.

### **🔄 Verification Steps:**

1. **Driver Registration** → Create account with DRIVER role
2. **Complete Profile** → Submit all required documents and vehicle details
3. **Admin Verification** → Admin reviews and approves driver details
4. **Ride Posting** → Only verified drivers can post rides

---

## 🚗 **Driver Self-Verification APIs**

### **1. Check Verification Status**
```http
GET {{baseUrl}}/api/driver/details/check
Authorization: Bearer {{driverToken}}
```

**Response:**
```json
{
  "status": "SUCCESS",
  "message": "Driver details check completed",
  "data": true  // true if driver has completed profile
}
```

### **2. Get Driver Profile with Verification Status**
```http
GET {{baseUrl}}/api/driver/details
Authorization: Bearer {{driverToken}}
```

**Response:**
```json
{
  "status": "SUCCESS", 
  "message": "Driver details retrieved successfully",
  "data": {
    "id": 1,
    "licenseNumber": "DL123456789",
    "licenseExpiry": "2026-12-31T00:00:00",
    "carNumber": "MH01AB1234",
    "carModel": "Honda City",
    "carColor": "White",
    "carYear": 2023,
    "insuranceNumber": "INS987654321",
    "insuranceExpiry": "2026-06-30T00:00:00",
    "isVerified": false,  // ← Verification Status
    "createdAt": "2025-09-21T10:30:00",
    "updatedAt": "2025-09-21T10:30:00"
  }
}
```

### **3. Update Profile to Improve Verification Chances**
```http
PUT {{baseUrl}}/api/driver/details
Authorization: Bearer {{driverToken}}
Content-Type: application/json

{
  "licenseNumber": "DL123456789",
  "licenseExpiryDate": "2027-12-31",
  "carNumber": "MH01AB1234", 
  "carModel": "Honda City VX CVT",
  "carColor": "Pearl White",
  "carYear": 2023,
  "insuranceNumber": "INS987654321",
  "insuranceExpiryDate": "2027-06-30"
}
```

---

## 👨‍💼 **Admin Verification APIs**

### **4. Verify Driver (Admin Only)**
```http
PUT {{baseUrl}}/api/driver/verify/{{driverDetailId}}?verified=true
Authorization: Bearer {{adminToken}}
```

**Response:**
```json
{
  "status": "SUCCESS",
  "message": "Driver details verified successfully", 
  "data": {
    "id": 1,
    "isVerified": true,  // ← Now verified!
    // ... other driver details
  }
}
```

### **5. Reject Driver Verification**
```http
PUT {{baseUrl}}/api/driver/verify/{{driverDetailId}}?verified=false
Authorization: Bearer {{adminToken}}
```

---

## 📋 **Verification Requirements Checklist**

### **✅ Required Information for Verification:**

#### **📄 License Details:**
- ✅ Valid license number (unique)
- ✅ License expiry date (must be future)
- ✅ License should be valid for at least 6 months

#### **🚗 Vehicle Information:**
- ✅ Car registration number (unique)
- ✅ Car model and year
- ✅ Car color for passenger identification
- ✅ Vehicle age (preferably under 10 years)

#### **🛡️ Insurance Details:**
- ✅ Insurance policy number
- ✅ Insurance expiry date (must be future)
- ✅ Insurance should be valid for at least 3 months

#### **📊 Profile Completeness:**
- ✅ All mandatory fields filled
- ✅ Valid future dates for expiry
- ✅ Unique license and car numbers
- ✅ Reasonable vehicle year (not too old)

---

## 🚦 **Verification Status Flow**

```
📱 Driver Registration
    ↓
📋 Submit Driver Details 
    ↓ 
⏳ Verification Pending (isVerified: false)
    ↓
👨‍💼 Admin Review Process
    ↓
✅ Approved (isVerified: true) → Can Post Rides
    ↓
🚗 Driver Can Start Offering Rides
```

---

## 🔍 **How Drivers Can Check Their Status**

### **Method 1: Check Profile Completion**
```javascript
// Postman Test Script
pm.test("Driver profile completed", function () {
    const responseJson = pm.response.json();
    pm.expect(responseJson.data).to.be.true;
});
```

### **Method 2: Check Verification Status**
```javascript
// Postman Test Script  
pm.test("Driver verification status", function () {
    const responseJson = pm.response.json();
    const isVerified = responseJson.data.isVerified;
    
    if (isVerified) {
        console.log("✅ Driver is VERIFIED - Can post rides!");
    } else {
        console.log("⏳ Driver is PENDING - Waiting for admin approval");
    }
});
```

### **Method 3: Try Posting Ride (Verification Check)**
```http
POST {{baseUrl}}/api/rides
Authorization: Bearer {{driverToken}}

{
  "source": "Test City",
  "destination": "Test Destination", 
  "departureDate": "2025-09-25T10:00:00",
  "availableSeats": 2,
  "pricePerSeat": 100.00
}
```

**If Not Verified:**
```json
{
  "status": "ERROR",
  "message": "Please complete your driver profile before posting rides",
  "data": null
}
```

**If Verified:**
```json
{
  "status": "SUCCESS", 
  "message": "Ride posted successfully",
  "data": { /* ride details */ }
}
```

---

## 🧪 **Testing Driver Verification**

### **Test Case 1: New Driver Profile**
1. Register as DRIVER
2. Check status → Should be `false` (no profile)
3. Add driver details
4. Check status → Should be `true` (profile complete, but not verified)
5. Check verification → `isVerified: false`

### **Test Case 2: Verification Workflow**  
1. Submit complete driver profile
2. Admin verifies → `PUT /api/driver/verify/1?verified=true`
3. Check profile → `isVerified: true`
4. Try posting ride → Should succeed

### **Test Case 3: Incomplete Profile**
1. Try posting ride without driver details
2. Should get error: "Please complete your driver profile"

---

## 📱 **Driver Mobile App Flow**

### **For Driver Mobile Interface:**

#### **Profile Status Screen:**
```
👤 Profile Status
━━━━━━━━━━━━━━━━━
📋 Profile: ✅ Complete
🔍 Verification: ⏳ Pending
🚗 Rides Posted: 0

⚠️  Your profile is under review
   Admin approval needed to start posting rides
   
[Update Profile] [Contact Support]
```

#### **Verified Driver Screen:**
```
👤 Profile Status  
━━━━━━━━━━━━━━━━━
📋 Profile: ✅ Complete
🔍 Verification: ✅ Approved
🚗 Active Rides: 2

🎉 You're verified! Start posting rides
   
[Post New Ride] [My Rides] [Earnings]
```

---

## 🎯 **Quick Status Check Commands**

### **For Driver:**
```bash
# Check if profile is complete
GET /api/driver/details/check

# Get verification status  
GET /api/driver/details
# Look for: isVerified field

# Test ride posting ability
POST /api/rides
# Success = Verified, Error = Not verified/incomplete
```

### **For Admin:**
```bash
# Get all pending verifications
GET /api/admin/drivers/pending

# Verify specific driver
PUT /api/driver/verify/{id}?verified=true

# Get driver details for review
GET /api/driver/details/{driverId}
```

The driver verification system ensures only legitimate drivers with proper documentation can offer rides, maintaining platform safety and compliance! 🚗✅