# 🚀 Quick Postman Test Execution Guide

## 📥 **Import Setup**

### 1. Import Collection
- Open Postman
- Click **Import** button
- Select `Ride-Sharing-API-Collection.postman_collection.json`

### 2. Import Environment
- Click **Import** button
- Select `Ride-Sharing-Development.postman_environment.json`
- Set **Ride Sharing Development** as active environment

## ⚡ **Quick Test Execution Order**

### **Phase 1: Setup All Users (Required First)**
```
1. Authentication → Register Driver
2. Authentication → Verify Driver OTP (check console for OTP)
3. Authentication → Register Passenger  
4. Authentication → Verify Passenger OTP (check console for OTP)
5. Admin Authentication → Register Admin
6. Admin Authentication → Verify Admin OTP (check console for OTP)
```

### **Phase 2: Admin System Overview**
```
7. Admin Authentication → Get All Users (Admin Only)
8. Admin Authentication → Get User by ID (Admin Only)
```

### **Phase 3: Complete Driver Profile**
```
9. Driver Profile → Check Driver Profile Status
10. Driver Profile → Add Driver Details
11. Driver Profile → Get Driver Details (verify isVerified: false)
```

### **Phase 4: Admin Driver Verification**
```  
12. Admin Authentication → Verify Driver (Admin Action)
13. Driver Profile → Get Driver Details (verify isVerified: true)
```

### **Phase 5: Post Rides**
```
14. Ride Management → Post New Ride (saves rideId automatically)
15. Ride Management → Get My Rides
```

### **Phase 6: Search & Book (Passenger)**
```
16. Ride Search → Search All Rides
17. Ride Search → Search Rides by Route
18. Booking → Book a Ride (saves bookingId automatically)
19. Booking → Get My Bookings
```

### **Phase 7: Driver Booking Management**
```
20. Ride Management → Get Ride Bookings
```

### **Phase 8: Admin Management**
```
21. Admin Authentication → Get All Users (see system stats)
22. Admin Authentication → Get User by ID (view specific user)
```

### **Phase 9: Test Error Scenarios**
```
23. Error Scenarios → Book Own Ride (Should Fail)
24. Error Scenarios → Book More Seats Than Available
25. Error Scenarios → Post Ride Without Verification (Should Fail)
```

## 🔧 **Environment Variables (Auto-Set)**

These are automatically set by test scripts:
- `driverToken` - Set after driver OTP verification
- `passengerToken` - Set after passenger OTP verification
- `adminToken` - Set after admin OTP verification
- `rideId` - Set when ride is posted
- `bookingId` - Set when booking is created
- `driverDetailId` - Set when driver details are added
- `userId` - Set from admin user list

## 📝 **Manual Variables to Update**

Update these in environment if needed:
- `baseUrl` - Change if not running on localhost:8080
- `driverPhone` - Change driver phone number
- `passengerPhone` - Change passenger phone number  
- `adminPhone` - Change admin phone number

## 🎯 **Key Testing Points**

### ✅ **Success Scenarios**
- Driver registration → profile setup → admin verification → ride posting
- Passenger registration → ride search → booking
- Admin registration → system management → driver verification
- Seat count updates after booking/cancellation
- JWT token authentication working for all roles

### ❌ **Error Scenarios**
- Cannot book own rides
- Cannot book more seats than available
- Cannot book duplicate rides
- Unverified drivers cannot post rides
- Non-admin users cannot access admin endpoints
- Future date validation
- Unauthorized access attempts

## 📊 **Expected Response Codes**

- **200** - Success (GET, PUT operations)
- **201** - Created (POST operations)
- **400** - Bad Request (validation errors)
- **401** - Unauthorized (missing/invalid token)
- **403** - Forbidden (role restrictions)
- **404** - Not Found
- **409** - Conflict (duplicate bookings)

## 🔍 **Debugging Tips**

### **Check Console Output**
Mock OTP will appear in your application console:
```
📱 Mock OTP Service: Sending OTP 123456 to +1234567890
```

### **Verify Environment Variables**
Check that tokens are being set correctly:
- Look for green checkmark next to variable names
- Verify token format: `eyJhbGciOiJIUzI1NiJ9...`

### **Common Issues**
1. **Token not set**: Run authentication flow first
2. **404 errors**: Check if Spring Boot app is running
3. **Validation errors**: Check future dates in ride posting
4. **Database errors**: Verify MySQL connection

## 🚀 **Run All Tests**

Use Postman's **Collection Runner**:
1. Click collection → **Run**
2. Select environment: **Ride Sharing Development**
3. Click **Run Ride Sharing API**
4. Watch automated execution with results

**Total Tests**: ~25 API calls
**Execution Time**: ~2-3 minutes for full suite
**Success Rate**: Should be 100% if app is running properly

Start testing! 🎉