# Ride Sharing API Documentation

This document describes the complete API endpoints for the Ride Sharing application, including user registration, driver management, ride posting, and booking features.

## Base URL
```
http://localhost:8080
```

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 🚗 **Ride Management APIs (Driver)**

### 1. Post a New Ride
**POST** `/api/rides`

Driver can post a new ride with vehicle details auto-filled from their profile.

**Headers:**
- `Authorization: Bearer <jwt_token>`

**Request Body:**
```json
{
    "source": "Mumbai",
    "destination": "Pune",
    "departureDate": "2025-09-22T10:00:00",
    "availableSeats": 3,
    "pricePerSeat": 500.00,
    "notes": "AC car, comfortable ride"
}
```

**Response:**
```json
{
    "status": "SUCCESS",
    "message": "Ride posted successfully",
    "data": {
        "id": 1,
        "driverName": "John Driver",
        "driverPhone": "+1234567890",
        "source": "Mumbai",
        "destination": "Pune",
        "departureDate": "2025-09-22T10:00:00",
        "availableSeats": 3,
        "totalSeats": 3,
        "pricePerSeat": 500.00,
        "vehicleType": "Sedan",
        "vehicleModel": "Honda City",
        "vehicleColor": "White",
        "vehicleNumber": "MH01AB1234",
        "notes": "AC car, comfortable ride",
        "status": "ACTIVE",
        "createdAt": "2025-09-21T10:30:00",
        "updatedAt": "2025-09-21T10:30:00",
        "bookedSeats": 0
    }
}
```

### 2. Get My Rides
**GET** `/api/rides/my-rides`

Get all rides posted by the authenticated driver.

**Headers:**
- `Authorization: Bearer <jwt_token>`

**Response:**
```json
{
    "status": "SUCCESS",
    "message": "Rides retrieved successfully",
    "data": [
        {
            "id": 1,
            "driverName": "John Driver",
            "source": "Mumbai",
            "destination": "Pune",
            "departureDate": "2025-09-22T10:00:00",
            "availableSeats": 2,
            "totalSeats": 3,
            "pricePerSeat": 500.00,
            "status": "ACTIVE",
            "bookedSeats": 1
            // ... other fields
        }
    ]
}
```

### 3. Get My Upcoming Rides
**GET** `/api/rides/my-rides/upcoming`

Get upcoming rides for the authenticated driver.

### 4. Update Ride Status
**PUT** `/api/rides/{rideId}/status?status=COMPLETED`

Update ride status (ACTIVE, COMPLETED, CANCELLED, FULL).

### 5. Delete Ride
**DELETE** `/api/rides/{rideId}`

Delete a ride (only if no confirmed bookings exist).

### 6. Get Ride Bookings
**GET** `/api/rides/{rideId}/bookings`

Get all bookings for a specific ride (driver only).

---

## 🔍 **Ride Search APIs (Passenger)**

### 1. Search Available Rides
**POST** `/api/rides/search`

Search for available rides with filters.

**Request Body:**
```json
{
    "source": "Mumbai",
    "destination": "Pune",
    "departureDate": "2025-09-22T00:00:00",
    "minSeats": 2,
    "maxPrice": 600.00,
    "vehicleType": "Sedan",
    "page": 0,
    "size": 10,
    "sortBy": "departureDate",
    "sortDirection": "ASC"
}
```

**Response:**
```json
{
    "status": "SUCCESS",
    "message": "Rides found successfully",
    "data": {
        "content": [
            {
                "id": 1,
                "driverName": "John Driver",
                "driverPhone": "+1234567890",
                "source": "Mumbai",
                "destination": "Pune",
                "departureDate": "2025-09-22T10:00:00",
                "availableSeats": 2,
                "totalSeats": 3,
                "pricePerSeat": 500.00,
                "vehicleType": "Sedan",
                "vehicleModel": "Honda City",
                "vehicleColor": "White",
                "vehicleNumber": "MH01AB1234",
                "notes": "AC car, comfortable ride",
                "status": "ACTIVE"
            }
        ],
        "pageable": {
            "pageNumber": 0,
            "pageSize": 10
        },
        "totalElements": 5,
        "totalPages": 1,
        "first": true,
        "last": true
    }
}
```

### 2. Get Ride Details
**GET** `/api/rides/{rideId}`

Get detailed information about a specific ride.

---

## 🎫 **Booking Management APIs (Passenger)**

### 1. Book a Ride
**POST** `/api/bookings`

Book seats in a ride.

**Headers:**
- `Authorization: Bearer <jwt_token>`

**Request Body:**
```json
{
    "rideId": 1,
    "seatsBooked": 2,
    "passengerName": "Jane Passenger",
    "passengerPhone": "+1987654321",
    "pickupPoint": "Bandra Station, Platform 1"
}
```

**Response:**
```json
{
    "status": "SUCCESS",
    "message": "Ride booked successfully",
    "data": {
        "id": 1,
        "rideId": 1,
        "source": "Mumbai",
        "destination": "Pune",
        "departureDate": "2025-09-22T10:00:00",
        "driverName": "John Driver",
        "driverPhone": "+1234567890",
        "seatsBooked": 2,
        "totalAmount": 1000.00,
        "passengerName": "Jane Passenger",
        "passengerPhone": "+1987654321",
        "pickupPoint": "Bandra Station, Platform 1",
        "status": "CONFIRMED",
        "bookingDate": "2025-09-21T15:30:00",
        "vehicleModel": "Honda City",
        "vehicleColor": "White",
        "vehicleNumber": "MH01AB1234"
    }
}
```

### 2. Get My Bookings
**GET** `/api/bookings/my-bookings`

Get all bookings made by the authenticated user.

### 3. Get My Upcoming Bookings
**GET** `/api/bookings/my-bookings/upcoming`

Get upcoming bookings for the authenticated user.

### 4. Cancel Booking
**PUT** `/api/bookings/{bookingId}/cancel`

Cancel a booking (at least 2 hours before departure).

### 5. Get Booking Details
**GET** `/api/bookings/{bookingId}`

Get detailed information about a specific booking.

---

## 🚛 **Driver Booking Management**

### Get Driver Bookings
**GET** `/api/bookings/driver-bookings`

Get all bookings for rides posted by the authenticated driver.

---

## 📋 **Complete User Flow Examples**

### **Driver Flow:**

1. **Register as Driver** → `POST /api/auth/register` (role: "DRIVER")
2. **Verify OTP** → `POST /api/auth/verify-otp`
3. **Add Driver Details** → `POST /api/driver/details`
4. **Post a Ride** → `POST /api/rides`
5. **View My Rides** → `GET /api/rides/my-rides`
6. **Check Bookings** → `GET /api/rides/{rideId}/bookings`

### **Passenger Flow:**

1. **Register as User** → `POST /api/auth/register` (role: "USER")
2. **Verify OTP** → `POST /api/auth/verify-otp`
3. **Search Rides** → `POST /api/rides/search`
4. **Book a Ride** → `POST /api/bookings`
5. **View My Bookings** → `GET /api/bookings/my-bookings`

---

## 🔧 **Business Rules**

### **Ride Posting:**
- Only verified drivers can post rides
- Driver details must be completed and verified
- Vehicle details are auto-filled from driver profile
- Departure date must be in the future

### **Booking:**
- Users cannot book their own rides
- Cannot book if insufficient seats available
- Cannot book past rides
- Cannot book the same ride twice
- Seat availability updates automatically

### **Cancellation:**
- Bookings can be cancelled up to 2 hours before departure
- Cancelled bookings restore seat availability
- Drivers cannot delete rides with confirmed bookings

---

## 🎯 **Key Features Implemented**

✅ **Ride Posting** - Drivers post rides with auto-filled vehicle details  
✅ **Ride Search** - Advanced search with multiple filters  
✅ **Seat Booking** - Real-time seat availability management  
✅ **Booking Confirmation** - Visible to both driver and passenger  
✅ **Role-based Access** - Separate functionality for drivers and passengers  
✅ **Data Validation** - Comprehensive input validation  
✅ **Error Handling** - Proper error messages and status codes  

The complete ride sharing system is now ready for testing! 🚀