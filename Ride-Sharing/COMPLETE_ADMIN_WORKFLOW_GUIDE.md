# 👨‍💼 Complete Admin Workflow - Registration to Driver Verification

## 🔑 **Admin Authentication Flow**

### **Step 1: Admin Registration**
```http
POST {{baseUrl}}/api/auth/register
Content-Type: application/json

{
  "firstName": "Admin",
  "lastName": "Manager", 
  "phoneNumber": "+1111111111",
  "email": "admin@ridesharing.com",
  "password": "admin123",
  "role": "ADMIN"
}
```

### **Step 2: Admin OTP Verification**
```http
POST {{baseUrl}}/api/auth/verify-otp
Content-Type: application/json

{
  "phoneNumber": "+1111111111",
  "otp": "111111"  // Check console for mock OTP
}
```
**✅ Test Script**: Automatically saves `adminToken` for future requests

### **Step 3: Admin Login**
```http
POST {{baseUrl}}/api/auth/login
Content-Type: application/json

{
  "phoneNumber": "+1111111111", 
  "password": "admin123"
}
```

---

## 👨‍💼 **Admin Management Functions**

### **🔍 User Management**

#### **Get All Users**
```http
GET {{baseUrl}}/api/users/all
Authorization: Bearer {{adminToken}}
```

**Response Example:**
```json
[
  {
    "id": 1,
    "firstName": "John",
    "lastName": "Driver", 
    "phoneNumber": "+1234567890",
    "email": "john.driver@example.com",
    "role": "DRIVER"
  },
  {
    "id": 2,
    "firstName": "Jane",
    "lastName": "Passenger",
    "phoneNumber": "+1987654321", 
    "email": "jane.passenger@example.com",
    "role": "USER"
  }
]
```

**✅ Smart Features:**
- Automatically counts users by role
- Saves first driver ID for testing
- Console logging with user statistics

#### **Get Specific User**
```http
GET {{baseUrl}}/api/users/{{userId}}
Authorization: Bearer {{adminToken}}
```

#### **Delete User**
```http
DELETE {{baseUrl}}/api/users/{{userId}}  
Authorization: Bearer {{adminToken}}
```

---

### **🚗 Driver Verification Management**

#### **View All Driver Details**
```http
GET {{baseUrl}}/api/admin/drivers
Authorization: Bearer {{adminToken}}
```

**Response Features:**
- Shows all driver profiles with verification status
- Counts verified vs pending drivers
- Auto-saves unverified driver ID for testing

#### **Verify Driver** 
```http
PUT {{baseUrl}}/api/driver/verify/{{driverDetailId}}?verified=true
Authorization: Bearer {{adminToken}}
```

**✅ Success Response:**
```json
{
  "status": "SUCCESS",
  "message": "Driver details verified successfully",
  "data": {
    "id": 1,
    "licenseNumber": "DL123456789",
    "carNumber": "MH01AB1234", 
    "carModel": "Honda City",
    "isVerified": true,  // ✅ Now verified!
    // ... other details
  }
}
```

#### **Reject Driver Verification**
```http
PUT {{baseUrl}}/api/driver/verify/{{driverDetailId}}?verified=false
Authorization: Bearer {{adminToken}}
```

---

## 🧪 **Complete Admin Testing Workflow**

### **Phase 1: Admin Setup**
```bash
1. POST /api/auth/register (role: "ADMIN")
2. POST /api/auth/verify-otp (use console OTP)  
3. POST /api/auth/login
   → adminToken saved automatically
```

### **Phase 2: System Overview**
```bash
4. GET /api/users/all
   → View all users, count by roles
   → Auto-save driver ID for testing
```

### **Phase 3: Driver Management**
```bash 
5. GET /api/admin/drivers  
   → View all driver profiles
   → See verification status
   → Auto-save unverified driver ID
```

### **Phase 4: Driver Verification**
```bash
6. PUT /api/driver/verify/{id}?verified=true
   → Approve driver for ride posting
   
7. GET /api/driver/details (as driver)
   → Verify isVerified: true
   
8. POST /api/rides (as driver)
   → Should now succeed!
```

---

## 📊 **Admin Dashboard Insights**

### **User Statistics Console Output:**
```
📋 Total users in system: 15
🚗 Drivers: 8  
👥 Passengers: 6
👨‍💼 Admins: 1

💾 Saved first driver ID: 3
```

### **Driver Verification Status:**
```
📋 Total driver profiles: 8
✅ Verified drivers: 3
⏳ Pending verification: 5

🎯 Saved driver ID for verification: 4
```

### **Verification Actions:**
```
🎉 Driver verified successfully by admin!
   Driver ID: 4
   License: DL123456789
   Vehicle: Honda City (MH01AB1234)
```

---

## 🔐 **Security & Authorization**

### **Admin-Only Endpoints:**
| **Endpoint** | **Access** | **Function** |
|--------------|------------|--------------|
| `GET /api/users/all` | ✅ Admin Only | List all users |
| `GET /api/users/{id}` | ✅ Admin Only | Get specific user |
| `DELETE /api/users/{id}` | ✅ Admin Only | Delete user |
| `PUT /api/driver/verify/{id}` | ✅ Admin Only | Verify/reject drivers |

### **Authorization Headers:**
```http
Authorization: Bearer {{adminToken}}
```

**❌ Access Denied Response** (Non-admin users):
```json
{
  "status": "ERROR",
  "message": "Access Denied. Admin privileges required.",
  "data": null
}
```

---

## 🎯 **Admin Postman Collection Structure**

```
📁 Admin Authentication & Management
├── 🔑 Register Admin
├── 🔑 Verify Admin OTP  
├── 🔑 Login Admin
├── 📊 Get All Users (Admin Only)
├── 👤 Get User by ID (Admin Only)
├── 🗑️ Delete User (Admin Only)
```

**Integrated with Driver Verification:**
```
📁 Driver Profile & Verification  
├── ... (driver endpoints)
├── 👨‍💼 Admin: Verify Driver
├── 👨‍💼 Admin: Reject Driver Verification
```

---

## 🚀 **Testing Execution Order**

### **Complete Admin Workflow Test:**
1. **Admin Setup**: Register → Verify OTP → Login
2. **System Overview**: Get all users → Check system statistics  
3. **Driver Management**: View driver profiles → Check verification status
4. **Driver Actions**: Register driver → Add driver details
5. **Admin Verification**: Approve driver → Verify status change
6. **Validation**: Driver can now post rides successfully

### **Environment Variables (Auto-Set):**
- `adminToken` - Set after admin authentication
- `userId` - Set from user list for testing
- `driverDetailId` - Set from driver profiles for verification

---

## 📱 **Admin Mobile/Web Interface**

### **Admin Dashboard Mockup:**
```
👨‍💼 Admin Dashboard
━━━━━━━━━━━━━━━━━━━

📊 System Overview
┌─────────────────┐
│ 👥 Users: 15    │
│ 🚗 Drivers: 8   │  
│ ⏳ Pending: 5   │
│ ✅ Verified: 3  │
└─────────────────┘

🔍 Driver Verification Queue
┌─────────────────────────────────┐
│ John Smith - DL123456789        │
│ Honda City - MH01AB1234         │
│ [✅ Approve] [❌ Reject]        │
├─────────────────────────────────┤
│ Mike Johnson - DL987654321      │
│ Toyota Camry - DL05CD5678       │
│ [✅ Approve] [❌ Reject]        │
└─────────────────────────────────┘

[📋 All Users] [🔍 Search] [📊 Reports]
```

### **Admin Actions Flow:**
1. **Login** → Admin dashboard  
2. **Review** → Driver verification queue
3. **Approve/Reject** → Driver documents
4. **Monitor** → System statistics  
5. **Manage** → User accounts

**Complete admin system ready for testing! 🎉**