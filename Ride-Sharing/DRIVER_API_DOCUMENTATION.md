# Driver Detail APIs

This document describes the APIs available for drivers to manage their vehicle and license details.

## Base URL
```
http://localhost:8080/api/driver
```

## Authentication
All driver APIs require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### 1. Add Driver Details
**POST** `/details`

Add driver details for the authenticated user (must be a driver).

**Request Body:**
```json
{
    "licenseNumber": "DL1420110012345",
    "licenseExpiry": "2030-12-31",
    "carNumber": "DL01AB1234",
    "carModel": "Maruti Swift",
    "carColor": "White",
    "carYear": 2020,
    "insuranceNumber": "INS123456789",
    "insuranceExpiry": "2025-12-31"
}
```

**Response:**
```json
{
    "status": "SUCCESS",
    "message": "Driver details added successfully",
    "data": {
        "id": 1,
        "licenseNumber": "DL1420110012345",
        "licenseExpiry": "2030-12-31",
        "carNumber": "DL01AB1234",
        "carModel": "Maruti Swift",
        "carColor": "White",
        "carYear": 2020,
        "insuranceNumber": "INS123456789",
        "insuranceExpiry": "2025-12-31",
        "isVerified": false,
        "createdAt": "2024-01-15T10:30:00",
        "updatedAt": "2024-01-15T10:30:00"
    }
}
```

### 2. Update Driver Details
**PUT** `/details`

Update existing driver details for the authenticated user.

**Request Body:** Same as Add Driver Details

**Response:** Same as Add Driver Details

### 3. Get Driver Details
**GET** `/details`

Retrieve driver details for the authenticated user.

**Response:**
```json
{
    "status": "SUCCESS",
    "message": "Driver details retrieved successfully",
    "data": {
        "id": 1,
        "licenseNumber": "DL1420110012345",
        "licenseExpiry": "2030-12-31",
        "carNumber": "DL01AB1234",
        "carModel": "Maruti Swift",
        "carColor": "White",
        "carYear": 2020,
        "insuranceNumber": "INS123456789",
        "insuranceExpiry": "2025-12-31",
        "isVerified": false,
        "createdAt": "2024-01-15T10:30:00",
        "updatedAt": "2024-01-15T10:30:00"
    }
}
```

### 4. Delete Driver Details
**DELETE** `/details`

Delete driver details for the authenticated user.

**Response:**
```json
{
    "status": "SUCCESS",
    "message": "Driver details deleted successfully",
    "data": null
}
```

### 5. Check if Driver Has Details
**GET** `/details/check`

Check if the authenticated driver has added their details.

**Response:**
```json
{
    "status": "SUCCESS",
    "message": "Driver details check completed",
    "data": true
}
```

### 6. Verify Driver Details (Admin Only)
**PUT** `/verify/{driverDetailId}?verified=true`

Verify or unverify driver details (typically used by admin users).

**Path Parameters:**
- `driverDetailId`: ID of the driver details to verify

**Query Parameters:**
- `verified`: boolean value (true/false)

**Response:**
```json
{
    "status": "SUCCESS",
    "message": "Driver details verified successfully",
    "data": {
        // Updated driver details with isVerified = true
    }
}
```

## Field Validations

### Driver Detail Fields
- **licenseNumber**: Required, unique, pattern must match valid license format
- **licenseExpiry**: Required, must be a future date
- **carNumber**: Required, unique, pattern must match valid car number format  
- **carModel**: Required, minimum 2 characters
- **carColor**: Required, minimum 3 characters
- **carYear**: Required, between 1990 and current year + 1
- **insuranceNumber**: Required, unique
- **insuranceExpiry**: Required, must be a future date

## Error Responses

### 400 Bad Request
```json
{
    "status": "ERROR",
    "message": "Only drivers can add driver details",
    "data": null
}
```

### 400 Bad Request - Duplicate Data
```json
{
    "status": "ERROR",
    "message": "License number already exists",
    "data": null
}
```

### 404 Not Found
```json
{
    "status": "ERROR",
    "message": "Driver details not found",
    "data": null
}
```

### 500 Internal Server Error
```json
{
    "status": "ERROR",
    "message": "An error occurred while adding driver details",
    "data": null
}
```

## Usage Notes

1. **Driver Role Required**: Only users with DRIVER role can add/update/get/delete their driver details.
2. **Unique Constraints**: License numbers and car numbers must be unique across the system.
3. **Verification**: Driver details are created with `isVerified = false` by default and need admin verification.
4. **Authentication**: All endpoints require valid JWT token in Authorization header.
5. **Data Persistence**: All date fields are stored in `yyyy-MM-dd` format.
6. **Future Dates**: License and insurance expiry dates must be in the future.

## Testing

You can test these APIs using tools like Postman or curl. Make sure to:
1. Register as a DRIVER user first
2. Login to get JWT token
3. Use the token in Authorization header for all driver detail APIs
4. Follow the JSON request format exactly as shown in examples