# 👨‍💼 Admin Testing Reference - Quick Commands

## 🔑 **Admin Authentication APIs**

| **Endpoint** | **Method** | **Purpose** | **Auto-Saves** |
|--------------|------------|-------------|----------------|
| `/api/auth/register` | `POST` | Register admin (role: "ADMIN") | None |
| `/api/auth/verify-otp` | `POST` | Verify admin OTP | `adminToken` |
| `/api/auth/login` | `POST` | Admin login | `adminToken` |

---

## 👥 **User Management APIs (Admin Only)**

| **Endpoint** | **Method** | **Purpose** | **Auto-Saves** |
|--------------|------------|-------------|----------------|
| `/api/users/all` | `GET` | List all users with role stats | `userId` (first driver) |
| `/api/users/{id}` | `GET` | Get specific user details | None |
| `/api/users/{id}` | `DELETE` | Delete user account | None |

---

## 🚗 **Driver Verification APIs (Admin Only)**

| **Endpoint** | **Method** | **Purpose** | **Auto-Saves** |
|--------------|------------|-------------|----------------|
| `/api/driver/verify/{id}?verified=true` | `PUT` | Approve driver | None |
| `/api/driver/verify/{id}?verified=false` | `PUT` | Reject driver | None |

---

## 📊 **Admin Console Output Examples**

### **User Statistics:**
```
📋 Total users in system: 15
🚗 Drivers: 8
👥 Passengers: 6  
👨‍💼 Admins: 1
💾 Saved first driver ID: 3
```

### **User Details:**
```
👤 User Details Retrieved:
   Name: John Driver
   Role: DRIVER
   Phone: +1234567890
   Email: john.driver@example.com
```

### **Driver Verification:**
```
🎉 Driver verified successfully by admin!
   Driver ID: 4
   License: DL123456789
   Vehicle: Honda City (MH01AB1234)
```

### **System Actions:**
```
🔑 Admin authenticated successfully!
🗑️ User deleted successfully by admin
❌ Driver verification rejected by admin
```

---

## 🧪 **Admin Test Scripts**

### **Save Admin Token:**
```javascript
if (pm.response.code === 200) {
    const responseJson = pm.response.json();
    pm.environment.set("adminToken", responseJson.data.accessToken);
    console.log("🔑 Admin authenticated successfully!");
}
```

### **User Statistics Counter:**
```javascript
pm.test("Admin can access all users", function () {
    const responseJson = pm.response.json();
    console.log("📋 Total users in system: " + responseJson.length);
    
    let drivers = responseJson.filter(user => user.role === 'DRIVER').length;
    let passengers = responseJson.filter(user => user.role === 'USER').length;
    let admins = responseJson.filter(user => user.role === 'ADMIN').length;
    
    console.log("🚗 Drivers: " + drivers);
    console.log("👥 Passengers: " + passengers);
    console.log("👨‍💼 Admins: " + admins);
});
```

### **Driver Verification Test:**
```javascript
pm.test("Admin successfully verified driver", function () {
    pm.response.to.have.status(200);
    const responseJson = pm.response.json();
    pm.expect(responseJson.data.isVerified).to.be.true;
    console.log("🎉 Driver verified successfully by admin!");
});
```

---

## 🎯 **Admin Role Testing Checklist**

### **✅ Authentication**
- [x] Admin registration with ADMIN role
- [x] Admin OTP verification and token generation
- [x] Admin login with credentials

### **✅ User Management**  
- [x] View all system users
- [x] Get specific user details
- [x] Delete user accounts
- [x] Role-based statistics counting

### **✅ Driver Verification**
- [x] Approve driver applications
- [x] Reject driver applications  
- [x] Verify status changes in driver profiles

### **✅ Authorization**
- [x] Admin-only endpoints protected
- [x] Non-admin access denied
- [x] JWT token authorization working

---

## 🚦 **Admin Permission Matrix**

| **Action** | **Admin** | **Driver** | **Passenger** |
|------------|-----------|------------|---------------|
| **User Management** |
| View all users | ✅ Yes | ❌ No | ❌ No |
| Get specific user | ✅ Yes | ❌ No | ❌ No |
| Delete users | ✅ Yes | ❌ No | ❌ No |
| **Driver Verification** |
| Verify drivers | ✅ Yes | ❌ No | ❌ No |
| Reject drivers | ✅ Yes | ❌ No | ❌ No |
| **Profile Management** |
| View own profile | ✅ Yes | ✅ Yes | ✅ Yes |
| Update own profile | ✅ Yes | ✅ Yes | ✅ Yes |

---

## 🔐 **Security Testing**

### **Test Admin Access Control:**
```javascript
// Test 1: Admin can access protected endpoints
pm.test("Admin access granted", function () {
    pm.response.to.have.status(200);
});

// Test 2: Non-admin users get 403 Forbidden  
pm.test("Non-admin access denied", function () {
    pm.response.to.have.status(403);
});
```

### **Test Authorization Headers:**
```http
Authorization: Bearer {{adminToken}}    // ✅ Should work
Authorization: Bearer {{driverToken}}   // ❌ Should fail (403)
Authorization: Bearer {{passengerToken}} // ❌ Should fail (403)
```

---

## 📱 **Admin Workflow Scenarios**

### **Scenario 1: New System Setup**
1. Register first admin account
2. Verify admin via OTP
3. Check system status (should be empty)
4. Monitor user registrations

### **Scenario 2: Driver Application Review**
1. View all users → Find drivers
2. Check driver profiles → Review documents
3. Verify or reject drivers → Update status
4. Monitor driver activity

### **Scenario 3: System Monitoring**
1. Regular user statistics review
2. Driver verification queue management
3. Problem user account management
4. System health monitoring

### **Scenario 4: Issue Resolution**  
1. Identify problematic accounts
2. Review user details and activity
3. Take corrective actions (warnings/deletion)
4. Monitor resolution effectiveness

---

## 🎛️ **Admin Dashboard Components**

### **User Management Panel:**
```
👥 User Overview
┌─────────────────┐
│ Total: 156      │
│ Active: 142     │
│ Drivers: 45     │
│ Passengers: 97  │
│ Admins: 14      │
└─────────────────┘
```

### **Driver Verification Queue:**
```
🚗 Pending Verifications (8)
┌─────────────────────────────────┐
│ ⏳ John Smith - Honda City      │
│ ⏳ Mike Johnson - Toyota Camry  │
│ ⏳ Sarah Wilson - Hyundai Verna │
└─────────────────────────────────┘
[📋 Review All] [✅ Bulk Approve]
```

### **System Statistics:**
```
📊 Daily Metrics
┌─────────────────┐
│ 📈 New Users: 12│
│ 🚗 Rides: 245   │
│ 📱 Bookings: 189│
│ 💰 Revenue: $2.4K│
└─────────────────┘
```

**Complete admin testing system ready! 👨‍💼🎉**