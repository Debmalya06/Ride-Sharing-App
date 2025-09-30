# 🚗 Driver Verification - Quick Test Reference

## 📋 **Driver Self-Verification APIs**

| **API Endpoint** | **Method** | **Purpose** | **Expected Response** |
|------------------|------------|-------------|----------------------|
| `/api/driver/details/check` | `GET` | Check if driver profile exists | `{"data": true/false}` |
| `/api/driver/details` | `GET` | Get full profile with verification status | `{"data": {..., "isVerified": false}}` |
| `/api/driver/details` | `POST` | Create driver profile | Profile created, `isVerified: false` |
| `/api/driver/details` | `PUT` | Update driver profile | Profile updated |

---

## 👨‍💼 **Admin Verification APIs**

| **API Endpoint** | **Method** | **Purpose** | **Expected Response** |
|------------------|------------|-------------|----------------------|
| `/api/driver/verify/{id}?verified=true` | `PUT` | Approve driver | `{"data": {"isVerified": true}}` |
| `/api/driver/verify/{id}?verified=false` | `PUT` | Reject driver | `{"data": {"isVerified": false}}` |

---

## 🧪 **Testing Workflow**

### **Step 1: Register & Setup Driver**
```bash
1. POST /api/auth/register (role: "DRIVER")
2. POST /api/auth/verify-otp 
3. GET  /api/driver/details/check → Should return false
```

### **Step 2: Create Driver Profile**
```bash
4. POST /api/driver/details → Submit license, vehicle, insurance
5. GET  /api/driver/details → Check isVerified: false
6. POST /api/rides → Should FAIL ("complete profile" error)
```

### **Step 3: Admin Verification**
```bash
7. PUT /api/driver/verify/{id}?verified=true → Admin approves
8. GET /api/driver/details → Check isVerified: true
9. POST /api/rides → Should SUCCEED
```

---

## 📱 **Postman Test Scripts**

### **Check Verification Status**
```javascript
if (pm.response.code === 200) {
    const responseJson = pm.response.json();
    const isVerified = responseJson.data.isVerified;
    
    if (isVerified) {
        console.log("🎉 Driver is VERIFIED! ✅");
        pm.environment.set("driverVerified", "true");
    } else {
        console.log("⏳ Driver verification PENDING ❌");
        pm.environment.set("driverVerified", "false");
    }
}
```

### **Save Driver Detail ID**
```javascript
if (pm.response.code === 200) {
    const responseJson = pm.response.json();
    pm.environment.set("driverDetailId", responseJson.data.id);
    console.log("📋 Driver Detail ID saved: " + responseJson.data.id);
}
```

### **Test Ride Posting Block**
```javascript
pm.test("Unverified driver blocked", function () {
    pm.expect(pm.response.code).to.be.oneOf([400, 403]);
    const responseJson = pm.response.json();
    pm.expect(responseJson.message).to.include("profile");
    console.log("❌ Correctly blocked: " + responseJson.message);
});
```

---

## 🎯 **Driver Verification States**

| **State** | **Profile Status** | **isVerified** | **Can Post Rides** | **Action Needed** |
|-----------|-------------------|----------------|-------------------|-------------------|
| **New Driver** | ❌ No Profile | N/A | ❌ No | Complete profile |
| **Profile Added** | ✅ Complete | ❌ false | ❌ No | Wait for admin |
| **Verified** | ✅ Complete | ✅ true | ✅ Yes | Start driving! |
| **Rejected** | ✅ Complete | ❌ false | ❌ No | Fix issues & resubmit |

---

## 🚦 **Status Indicators**

### **Driver App Status Display:**
```
📋 Profile: ✅ Complete / ❌ Incomplete
🔍 Verification: ✅ Approved / ⏳ Pending / ❌ Rejected
🚗 Ride Status: ✅ Can Post Rides / ❌ Cannot Post
```

### **Console Messages:**
```javascript
// Profile Check
"✅ Driver profile is complete"
"❌ Driver profile needs to be completed"

// Verification Status  
"🎉 Driver is VERIFIED! Can post rides."
"⏳ Driver verification PENDING. Cannot post rides yet."

// Admin Actions
"🎉 Driver has been VERIFIED by admin!"
"❌ Driver verification has been REJECTED by admin."

// Blocking Messages
"❌ Correctly blocked: Please complete your driver profile before posting rides"
```

---

## 📊 **Required Driver Information**

### **✅ Mandatory Fields:**
- `licenseNumber` - Driving license (unique)
- `licenseExpiryDate` - Must be future date
- `carNumber` - Vehicle registration (unique)  
- `carModel` - Vehicle model
- `carYear` - Manufacturing year
- `insuranceNumber` - Insurance policy
- `insuranceExpiryDate` - Must be future date

### **✅ Optional Fields:**
- `carColor` - For passenger identification
- Additional vehicle details

### **🔍 Validation Rules:**
- License & Insurance must expire in future
- Car number and license must be unique
- All mandatory fields required
- Reasonable car year (not too old)

---

## 🎉 **Testing Success Criteria**

### **✅ Pass Criteria:**
- [x] New driver cannot post rides without profile
- [x] Driver with profile but unverified cannot post rides  
- [x] Admin can verify/reject driver profiles
- [x] Verified driver can successfully post rides
- [x] Profile status APIs return correct information
- [x] Verification status updates properly

### **📱 Mobile App Integration:**
- Profile completion progress bar
- Verification status badges
- Real-time status updates
- Admin notification system
- Driver dashboard with verification steps

**Ready to test driver verification! 🚀**