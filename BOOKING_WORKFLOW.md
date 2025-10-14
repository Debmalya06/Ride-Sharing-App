# Complete Booking Workflow Documentation

## Overview
This document describes the complete booking workflow in the SmartRide application, from passenger booking to payment completion.

## Workflow Steps

### 1. **Passenger Books a Ride**
**Frontend:** `PassengerDashboard.jsx` → `handleBooking()`
**Backend:** `POST /api/rides/{rideId}/booking?seatsToBook={seats}`
**Controller:** `RideController.createBooking()`
**Service:** `BookingService.createBooking()`

**Process:**
- Passenger searches for available rides
- Selects a ride and number of seats
- Clicks "Book Now" button
- System creates booking with status: `PENDING`
- Available seats are reduced
- Booking is saved and returned to passenger

**Frontend Code:**
```javascript
const handleBooking = async (ride, seats) => {
  const response = await apiService.createBooking(ride.id, seats)
  // Opens payment modal if successful
}
```

**Backend Response:**
```json
{
  "status": "SUCCESS",
  "message": "Booking created successfully",
  "data": {
    "id": 1,
    "rideId": 5,
    "source": "Mumbai",
    "destination": "Pune",
    "departureDate": "2025-10-15T14:00:00",
    "driverName": "John Doe",
    "seatsBooked": 2,
    "totalAmount": 800.00,
    "status": "PENDING",
    "bookingDate": "2025-10-13T10:30:00"
  }
}
```

---

### 2. **Driver Confirms Booking**
**Frontend:** `DriverDashboard.jsx` → `handleBookingAction('confirm')`
**Backend:** `PUT /api/rides/{rideId}/bookings/{bookingId}/confirm`
**Controller:** `RideController.confirmBooking()`
**Service:** `BookingService.confirmBookingByDriver()`

**Process:**
- Driver views pending bookings for their rides
- Reviews passenger details
- Clicks "Confirm" button
- Booking status changes from `PENDING` to `CONFIRMED`
- Email notification sent to passenger
- Passenger can now proceed with payment

**Frontend Code:**
```javascript
const handleBookingAction = async (action, rideId, bookingId) => {
  if (action === 'confirm') {
    response = await apiService.confirmBooking(rideId, bookingId)
  }
}
```

**Backend Response:**
```json
{
  "status": "SUCCESS",
  "message": "Booking confirmed successfully",
  "data": {
    "id": 1,
    "status": "CONFIRMED",
    "updatedAt": "2025-10-13T11:00:00"
  }
}
```

---

### 3. **Passenger Can Cancel Booking**
**Frontend:** `PassengerDashboard.jsx` → `handleCancelBooking()`
**Backend:** `PUT /api/bookings/{bookingId}/cancel`
**Controller:** `PassengerController.cancelBooking()`
**Service:** `BookingService.cancelBooking()`

**Process:**
- Passenger can cancel booking in `PENDING` or `CONFIRMED` status
- Clicks "Cancel" button in booking history
- System checks if cancellation is allowed (at least 2 hours before departure)
- Booking status changes to `CANCELLED`
- Available seats are restored to the ride
- If ride was `FULL`, status changes back to `ACTIVE`

**Frontend Code:**
```javascript
const handleCancelBooking = async (bookingId) => {
  if (!window.confirm('Are you sure you want to cancel this booking?')) {
    return
  }
  const response = await apiService.cancelBooking(bookingId)
  await fetchBookings() // Refresh bookings
}
```

**Business Rules:**
- ✅ Can cancel `PENDING` bookings anytime
- ✅ Can cancel `CONFIRMED` bookings if departure is 2+ hours away
- ❌ Cannot cancel `PAID` bookings
- ❌ Cannot cancel `COMPLETED` bookings
- ❌ Cannot cancel if departure is less than 2 hours away

---

### 4. **Passenger Pays for Confirmed Booking**
**Frontend:** `PaymentModal.jsx` → `handlePayment()`
**Backend:** 
- Create Order: `POST /api/payments/create-order`
- Verify Payment: `POST /api/payments/verify`

**Controller:** `PaymentController`
**Service:** `PaymentService`

**Process:**
1. Passenger clicks "Pay Now" on `CONFIRMED` booking
2. System creates Razorpay payment order
3. Payment modal opens with Razorpay interface
4. Passenger completes payment
5. System verifies payment signature
6. Booking status changes to `PAID`
7. Payment record is created
8. Driver earnings are updated

**Frontend Code:**
```javascript
const handlePayment = async () => {
  // Step 1: Create payment order
  const orderResponse = await apiService.createPaymentOrder({
    bookingId: booking.id,
    amount: booking.totalAmount
  })
  
  // Step 2: Open Razorpay
  const options = {
    key: razorpayKeyId,
    amount: orderResponse.data.amount,
    order_id: orderResponse.data.orderId,
    handler: async (response) => {
      // Step 3: Verify payment
      const verifyResponse = await apiService.verifyPayment({
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature
      })
    }
  }
  const razorpay = new window.Razorpay(options)
  razorpay.open()
}
```

**Payment Response:**
```json
{
  "status": "SUCCESS",
  "message": "Payment verified successfully",
  "data": {
    "paymentId": 123,
    "bookingId": 1,
    "amount": 800.00,
    "status": "COMPLETED",
    "transactionId": "pay_ABC123"
  }
}
```

---

## Booking Status Flow

```
PENDING → CONFIRMED → PAID → COMPLETED
   ↓          ↓
CANCELLED  CANCELLED
```

### Status Descriptions:

1. **PENDING**: Booking created, waiting for driver confirmation
   - Passenger can: Cancel
   - Driver can: Confirm or Cancel

2. **CONFIRMED**: Driver has confirmed the booking
   - Passenger can: Pay or Cancel
   - Driver can: Cancel (with reason)

3. **PAID**: Payment completed successfully
   - Passenger can: View details
   - Driver can: View earnings
   - System: Cannot be cancelled

4. **COMPLETED**: Ride completed successfully
   - Both can: View history, rate experience

5. **CANCELLED**: Booking cancelled by passenger or driver
   - Status is final
   - Seats restored to ride

---

## Frontend Components

### PassengerDashboard.jsx
**Responsibilities:**
- Display available rides
- Create bookings
- Show booking status (PENDING, CONFIRMED, PAID)
- Cancel bookings
- Initiate payments for CONFIRMED bookings
- Display ride history

**Key Functions:**
- `handleBooking(ride, seats)` - Creates new booking
- `handleCancelBooking(bookingId)` - Cancels booking
- `fetchBookings()` - Loads passenger bookings
- `handlePaymentSuccess()` - Refreshes after payment

### DriverDashboard.jsx
**Responsibilities:**
- Display driver's posted rides
- Show pending bookings for each ride
- Confirm or cancel passenger bookings
- View earnings

**Key Functions:**
- `handleBookingAction(action, rideId, bookingId)` - Confirm/Cancel bookings
- `fetchRides()` - Loads driver's rides with bookings

### PaymentModal.jsx
**Responsibilities:**
- Display booking details
- Integrate Razorpay payment gateway
- Handle payment success/failure
- Verify payment with backend

**Key Functions:**
- `handlePayment()` - Initiates payment flow
- `loadRazorpayScript()` - Loads Razorpay SDK
- `onPaymentSuccess(paymentResult)` - Callback after successful payment

---

## Backend API Endpoints

### Booking Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/rides/{rideId}/booking` | Create booking | Passenger |
| GET | `/api/bookings/my-bookings` | Get passenger bookings | Passenger |
| PUT | `/api/bookings/{bookingId}/cancel` | Cancel booking | Passenger |
| GET | `/api/rides/{rideId}/bookings` | Get ride bookings | Driver |
| PUT | `/api/rides/{rideId}/bookings/{bookingId}/confirm` | Confirm booking | Driver |
| PUT | `/api/rides/{rideId}/bookings/{bookingId}/cancel` | Cancel booking | Driver |

### Payment Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/payments/create-order` | Create payment order | Passenger |
| POST | `/api/payments/verify` | Verify payment | Passenger |
| POST | `/api/payments/failure` | Handle payment failure | Passenger |
| GET | `/api/payments/history/passenger/{id}` | Get payment history | Passenger |
| GET | `/api/payments/earnings/{driverId}` | Get driver earnings | Driver |

---

## Testing Checklist

### Passenger Flow
- [ ] Search for available rides
- [ ] Book a ride with multiple seats
- [ ] Verify booking shows as PENDING
- [ ] Cancel PENDING booking
- [ ] Book another ride
- [ ] Wait for driver confirmation
- [ ] Verify booking shows as CONFIRMED
- [ ] Click "Pay Now" button
- [ ] Complete Razorpay payment
- [ ] Verify booking shows as PAID
- [ ] Try to cancel PAID booking (should fail)
- [ ] View payment history

### Driver Flow
- [ ] Post a new ride
- [ ] View pending bookings
- [ ] Confirm a booking
- [ ] Verify passenger receives notification
- [ ] Cancel a booking with reason
- [ ] View confirmed bookings
- [ ] Check earnings after payment
- [ ] Complete a ride
- [ ] View earnings history

### Edge Cases
- [ ] Cancel booking less than 2 hours before departure (should fail)
- [ ] Book more seats than available (should fail)
- [ ] Driver tries to book own ride (should fail)
- [ ] Passenger books same ride twice (should fail)
- [ ] Payment failure handling
- [ ] Network error during booking
- [ ] Concurrent booking attempts

---

## Environment Setup

### Frontend (React)
```bash
cd client
npm install
npm run dev
```

### Backend (Spring Boot)
```bash
cd Ride-Sharing
mvn spring-boot:run -Dspring-boot.run.profiles=mock-payment
```

### Required Environment Variables

**Backend (application.properties):**
```properties
# Database
spring.datasource.url=jdbc:mysql://localhost:3306/ridesharing
spring.datasource.username=root
spring.datasource.password=your_password

# JWT
jwt.secret=your_jwt_secret
jwt.expiration=86400000

# Razorpay
razorpay.key.id=your_razorpay_key_id
razorpay.key.secret=your_razorpay_key_secret

# Email
spring.mail.username=your_email@gmail.com
spring.mail.password=your_app_password
```

**Frontend (Razorpay):**
- Razorpay script loaded in `index.html`
- Key ID passed to Razorpay initialization

---

## Common Issues & Solutions

### Issue 1: Booking not showing in dashboard
**Solution:** Check if `fetchBookings()` is being called after booking creation

### Issue 2: Payment modal not opening
**Solution:** Verify Razorpay script is loaded and key ID is correct

### Issue 3: Driver cannot see bookings
**Solution:** Ensure `getRideBookings()` is called for each ride

### Issue 4: Status not updating after confirmation
**Solution:** Call `fetchBookings()` after successful confirmation

### Issue 5: Cannot cancel booking
**Solution:** Check departure time and booking status constraints

---

## Success Criteria

✅ **Passenger can successfully:**
1. Search and book rides
2. View booking status (PENDING/CONFIRMED/PAID)
3. Cancel bookings before 2 hours
4. Pay for confirmed bookings
5. View payment history

✅ **Driver can successfully:**
1. View pending bookings
2. Confirm passenger bookings
3. Cancel bookings if needed
4. View confirmed bookings
5. Track earnings

✅ **System correctly:**
1. Validates booking constraints
2. Manages seat availability
3. Processes payments securely
4. Sends email notifications
5. Updates booking statuses
6. Records payment transactions

---

## Support & Documentation

- **API Documentation:** Available at `/swagger-ui.html` (if configured)
- **Frontend Components:** See `/client/src/components/`
- **Backend Services:** See `/Ride-Sharing/src/main/java/com/ridesharing/service/`
- **Database Schema:** See entity classes in `/entity/` folder

**For questions or issues, contact the development team.**

---

*Last Updated: October 13, 2025*
