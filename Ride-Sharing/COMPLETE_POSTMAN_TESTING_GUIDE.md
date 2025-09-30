# 🚀 Complete Postman Testing Guide - Ride Sharing App

This comprehensive guide covers all API endpoints for testing your Ride Sharing application from user registration to ride booking.

## 📋 **Testing Environment Setup**

### **Base URL**
```
http://localhost:8080
```

### **Global Variables** (Set these in Postman Environment)
- `baseUrl`: `http://localhost:8080`
- `accessToken`: (will be set after login)
- `driverToken`: (will be set after driver login)
- `passengerToken`: (will be set after passenger login)

---

## 👤 **1. USER AUTHENTICATION TESTS**

### **1.1 Register Driver**
```
POST {{baseUrl}}/api/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Driver",
  "phoneNumber": "+1234567890",
  "email": "john.driver@example.com",
  "password": "password123",
  "role": "DRIVER"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Registration successful. Please verify your phone number.",
  "data": {
    "phoneNumber": "+1234567890"
  }
}
```

### **1.2 Verify Driver OTP**
```
POST {{baseUrl}}/api/auth/verify-otp
Content-Type: application/json

{
  "phoneNumber": "+1234567890",
  "otp": "123456"
}
```

**✅ Test Script (Set driver token):**
```javascript
if (pm.response.code === 200) {
    const responseJson = pm.response.json();
    pm.environment.set("driverToken", responseJson.data.accessToken);
}
```

### **1.3 Register Passenger**
```
POST {{baseUrl}}/api/auth/register
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Passenger",
  "phoneNumber": "+1987654321",
  "email": "jane.passenger@example.com",
  "password": "password123",
  "role": "USER"
}
```

### **1.4 Verify Passenger OTP**
```
POST {{baseUrl}}/api/auth/verify-otp
Content-Type: application/json

{
  "phoneNumber": "+1987654321",
  "otp": "654321"
}
```

**✅ Test Script (Set passenger token):**
```javascript
if (pm.response.code === 200) {
    const responseJson = pm.response.json();
    pm.environment.set("passengerToken", responseJson.data.accessToken);
}
```

### **1.5 Driver Login**
```
POST {{baseUrl}}/api/auth/login
Content-Type: application/json

{
  "phoneNumber": "+1234567890",
  "password": "password123"
}
```

### **1.6 Passenger Login**
```
POST {{baseUrl}}/api/auth/login
Content-Type: application/json

{
  "phoneNumber": "+1987654321",
  "password": "password123"
}
```

---

## 🚗 **2. DRIVER PROFILE MANAGEMENT TESTS**

### **2.1 Add Driver Details**
```
POST {{baseUrl}}/api/driver/details
Authorization: Bearer {{driverToken}}
Content-Type: application/json

{
  "licenseNumber": "DL123456789",
  "licenseExpiryDate": "2026-12-31",
  "carNumber": "MH01AB1234",
  "carModel": "Honda City",
  "carColor": "White",
  "carYear": 2023,
  "insuranceNumber": "INS987654321",
  "insuranceExpiryDate": "2026-06-30"
}
```

### **2.2 Get Driver Details**
```
GET {{baseUrl}}/api/driver/details
Authorization: Bearer {{driverToken}}
```

### **2.3 Update Driver Details**
```
PUT {{baseUrl}}/api/driver/details
Authorization: Bearer {{driverToken}}
Content-Type: application/json

{
  "licenseNumber": "DL123456789",
  "licenseExpiryDate": "2027-12-31",
  "carNumber": "MH01AB1234",
  "carModel": "Honda City VX",
  "carColor": "Pearl White",
  "carYear": 2023,
  "insuranceNumber": "INS987654321",
  "insuranceExpiryDate": "2027-06-30"
}
```

### **2.4 Check Driver Details Status**
```
GET {{baseUrl}}/api/driver/details/check
Authorization: Bearer {{driverToken}}
```

---

## 🚙 **3. RIDE MANAGEMENT TESTS (Driver)**

### **3.1 Post a New Ride**
```
POST {{baseUrl}}/api/rides
Authorization: Bearer {{driverToken}}
Content-Type: application/json

{
  "source": "Mumbai",
  "destination": "Pune",
  "departureDate": "2025-09-25T10:00:00",
  "availableSeats": 3,
  "pricePerSeat": 500.00,
  "notes": "AC car, comfortable ride. Pickup from Bandra."
}
```

**✅ Test Script (Save ride ID):**
```javascript
if (pm.response.code === 200) {
    const responseJson = pm.response.json();
    pm.environment.set("rideId", responseJson.data.id);
}
```

### **3.2 Get My Rides**
```
GET {{baseUrl}}/api/rides/my-rides
Authorization: Bearer {{driverToken}}
```

### **3.3 Get My Upcoming Rides**
```
GET {{baseUrl}}/api/rides/my-rides/upcoming
Authorization: Bearer {{driverToken}}
```

### **3.4 Get Specific Ride Details**
```
GET {{baseUrl}}/api/rides/{{rideId}}
Authorization: Bearer {{driverToken}}
```

### **3.5 Update Ride Status**
```
PUT {{baseUrl}}/api/rides/{{rideId}}/status?status=COMPLETED
Authorization: Bearer {{driverToken}}
```

### **3.6 Get Bookings for My Ride**
```
GET {{baseUrl}}/api/rides/{{rideId}}/bookings
Authorization: Bearer {{driverToken}}
```

### **3.7 Post Another Ride (Different Route)**
```
POST {{baseUrl}}/api/rides
Authorization: Bearer {{driverToken}}
Content-Type: application/json

{
  "source": "Delhi",
  "destination": "Gurgaon",
  "departureDate": "2025-09-26T08:30:00",
  "availableSeats": 2,
  "pricePerSeat": 300.00,
  "notes": "Morning office commute. Drop at Cyber City."
}
```

---

## 🔍 **4. RIDE SEARCH TESTS (Passenger)**

### **4.1 Search All Available Rides**
```
POST {{baseUrl}}/api/rides/search
Authorization: Bearer {{passengerToken}}
Content-Type: application/json

{
  "page": 0,
  "size": 10,
  "sortBy": "departureDate",
  "sortDirection": "ASC"
}
```

### **4.2 Search Rides by Route**
```
POST {{baseUrl}}/api/rides/search
Authorization: Bearer {{passengerToken}}
Content-Type: application/json

{
  "source": "Mumbai",
  "destination": "Pune",
  "page": 0,
  "size": 10,
  "sortBy": "departureDate",
  "sortDirection": "ASC"
}
```

### **4.3 Search Rides with Filters**
```
POST {{baseUrl}}/api/rides/search
Authorization: Bearer {{passengerToken}}
Content-Type: application/json

{
  "source": "Mumbai",
  "destination": "Pune",
  "departureDate": "2025-09-25T00:00:00",
  "minSeats": 2,
  "maxPrice": 600.00,
  "vehicleType": "Sedan",
  "page": 0,
  "size": 10,
  "sortBy": "pricePerSeat",
  "sortDirection": "ASC"
}
```

### **4.4 Search Rides by Price Range**
```
POST {{baseUrl}}/api/rides/search
Authorization: Bearer {{passengerToken}}
Content-Type: application/json

{
  "maxPrice": 400.00,
  "page": 0,
  "size": 10,
  "sortBy": "pricePerSeat",
  "sortDirection": "ASC"
}
```

---

## 🎫 **5. BOOKING TESTS (Passenger)**

### **5.1 Book a Ride**
```
POST {{baseUrl}}/api/bookings
Authorization: Bearer {{passengerToken}}
Content-Type: application/json

{
  "rideId": {{rideId}},
  "seatsBooked": 2,
  "passengerName": "Jane Passenger",
  "passengerPhone": "+1987654321",
  "pickupPoint": "Bandra Station, Platform 1"
}
```

**✅ Test Script (Save booking ID):**
```javascript
if (pm.response.code === 200) {
    const responseJson = pm.response.json();
    pm.environment.set("bookingId", responseJson.data.id);
}
```

### **5.2 Get My Bookings**
```
GET {{baseUrl}}/api/bookings/my-bookings
Authorization: Bearer {{passengerToken}}
```

### **5.3 Get My Upcoming Bookings**
```
GET {{baseUrl}}/api/bookings/my-bookings/upcoming
Authorization: Bearer {{passengerToken}}
```

### **5.4 Get Specific Booking Details**
```
GET {{baseUrl}}/api/bookings/{{bookingId}}
Authorization: Bearer {{passengerToken}}
```

### **5.5 Try to Book Same Ride Again (Should Fail)**
```
POST {{baseUrl}}/api/bookings
Authorization: Bearer {{passengerToken}}
Content-Type: application/json

{
  "rideId": {{rideId}},
  "seatsBooked": 1,
  "passengerName": "Jane Passenger",
  "passengerPhone": "+1987654321",
  "pickupPoint": "Different pickup point"
}
```

**Expected:** Error - "You have already booked this ride"

### **5.6 Cancel Booking**
```
PUT {{baseUrl}}/api/bookings/{{bookingId}}/cancel
Authorization: Bearer {{passengerToken}}
```

---

## 📊 **6. DRIVER BOOKING MANAGEMENT TESTS**

### **6.1 Get All My Ride Bookings (Driver)**
```
GET {{baseUrl}}/api/bookings/driver-bookings
Authorization: Bearer {{driverToken}}
```

---

## ❌ **7. ERROR SCENARIO TESTS**

### **7.1 Try to Book Own Ride (Driver)**
```
POST {{baseUrl}}/api/bookings
Authorization: Bearer {{driverToken}}
Content-Type: application/json

{
  "rideId": {{rideId}},
  "seatsBooked": 1,
  "passengerName": "John Driver",
  "passengerPhone": "+1234567890",
  "pickupPoint": "Anywhere"
}
```

**Expected:** Error - "Cannot book your own ride"

### **7.2 Book More Seats Than Available**
```
POST {{baseUrl}}/api/bookings
Authorization: Bearer {{passengerToken}}
Content-Type: application/json

{
  "rideId": {{rideId}},
  "seatsBooked": 10,
  "passengerName": "Jane Passenger",
  "passengerPhone": "+1987654321",
  "pickupPoint": "Station"
}
```

**Expected:** Error - "Not enough seats available"

### **7.3 Post Ride Without Driver Details**
Create a new driver without completing profile and try to post ride:

```
POST {{baseUrl}}/api/rides
Authorization: Bearer {{newDriverToken}}
Content-Type: application/json

{
  "source": "Test City",
  "destination": "Test Destination",
  "departureDate": "2025-09-26T10:00:00",
  "availableSeats": 2,
  "pricePerSeat": 100.00
}
```

**Expected:** Error - "Please complete your driver profile before posting rides"

### **7.4 Invalid Date Validation**
```
POST {{baseUrl}}/api/rides
Authorization: Bearer {{driverToken}}
Content-Type: application/json

{
  "source": "Mumbai",
  "destination": "Pune",
  "departureDate": "2025-01-01T10:00:00",
  "availableSeats": 3,
  "pricePerSeat": 500.00
}
```

**Expected:** Error - "Departure date must be in the future"

---

## 🧪 **8. FULL USER JOURNEY TESTS**

### **Journey 1: Complete Driver Flow**
1. Register as DRIVER → Verify OTP → Login
2. Add driver details → Verify profile completion
3. Post a ride → View my rides
4. Wait for bookings → Check bookings for ride
5. Update ride status to COMPLETED

### **Journey 2: Complete Passenger Flow**
1. Register as USER → Verify OTP → Login
2. Search available rides → Filter by preferences
3. Book a ride → View my bookings
4. Check upcoming rides → Cancel if needed

### **Journey 3: Multiple Bookings Test**
1. Driver posts ride with 3 seats
2. Passenger 1 books 2 seats (1 seat remaining)
3. Passenger 2 books 1 seat (ride becomes FULL)
4. Passenger 3 tries to book → Should fail
5. Passenger 1 cancels → Seat becomes available
6. Passenger 3 can now book

---

## 📱 **9. POSTMAN COLLECTION STRUCTURE**

```
📁 Ride Sharing API Tests
├── 📁 Authentication
│   ├── Register Driver
│   ├── Register Passenger  
│   ├── Verify OTP (Driver)
│   ├── Verify OTP (Passenger)
│   ├── Login Driver
│   └── Login Passenger
├── 📁 Driver Profile
│   ├── Add Driver Details
│   ├── Get Driver Details
│   ├── Update Driver Details
│   └── Check Driver Status
├── 📁 Ride Management (Driver)
│   ├── Post New Ride
│   ├── Get My Rides
│   ├── Get Upcoming Rides
│   ├── Update Ride Status
│   └── Get Ride Bookings
├── 📁 Ride Search (Passenger)
│   ├── Search All Rides
│   ├── Search by Route
│   ├── Search with Filters
│   └── Search by Price
├── 📁 Booking Management
│   ├── Book a Ride
│   ├── Get My Bookings
│   ├── Get Upcoming Bookings
│   ├── Cancel Booking
│   └── Get Driver Bookings
└── 📁 Error Scenarios
    ├── Book Own Ride
    ├── Insufficient Seats
    ├── Invalid Dates
    └── Unauthorized Access
```

---

## 🎯 **10. TESTING CHECKLIST**

### **✅ Authentication**
- [ ] Driver registration and OTP verification
- [ ] Passenger registration and OTP verification  
- [ ] Login with valid credentials
- [ ] JWT token generation and storage

### **✅ Driver Profile**
- [ ] Add driver details with vehicle info
- [ ] Update driver details
- [ ] Profile completion validation
- [ ] Verification status check

### **✅ Ride Management**
- [ ] Post ride with auto-filled vehicle details
- [ ] View posted rides
- [ ] Update ride status
- [ ] Delete rides (with validation)

### **✅ Ride Search**
- [ ] Search with multiple filters
- [ ] Pagination and sorting
- [ ] Real-time seat availability
- [ ] Route-based search

### **✅ Booking System**
- [ ] Successful booking with seat reduction
- [ ] Duplicate booking prevention
- [ ] Booking cancellation with seat restoration
- [ ] Booking history and status tracking

### **✅ Business Rules**
- [ ] Drivers can't book their own rides
- [ ] Seat availability updates in real-time
- [ ] Future date validation
- [ ] Role-based access control

All tests are ready for execution! 🚀 Start with the authentication flow and work through each section systematically.