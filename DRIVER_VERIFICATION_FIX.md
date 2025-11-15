# Driver Verification and Rejection System

## Overview
The admin dashboard now supports a complete three-state driver verification system:
- **Pending** (Yellow): Driver awaiting verification
- **Verified** (Green): Driver approved and can post rides
- **Rejected** (Red): Driver rejected with a reason recorded

## Issue Resolution
Previously, pending drivers were incorrectly shown as "Rejected". This has been fixed by implementing a proper rejection tracking system with rejection reasons.

## Architecture

### Backend Changes

#### 1. DriverDetail Entity
Added a new field to track rejection reasons:
```java
@Column(name = "rejection_reason", length = 500)
private String rejectionReason;
```

**Verification States:**
- `isVerified = true` → Verified driver
- `isVerified = false` + `rejectionReason = null` → Pending verification
- `isVerified = false` + `rejectionReason = "<reason>"` → Rejected driver

#### 2. DriverDetailService
Added new method for rejecting drivers with reasons:
```java
public DriverDetail rejectDriverDetails(Long driverDetailId, String rejectionReason) {
    DriverDetail driverDetail = driverDetailRepository.findById(driverDetailId)
            .orElseThrow(() -> new RuntimeException("Driver details not found"));
    
    driverDetail.setIsVerified(false);
    driverDetail.setRejectionReason(rejectionReason);
    return driverDetailRepository.save(driverDetail);
}
```

#### 3. AdminController
Updated reject endpoint to accept rejection reason:
```java
@PutMapping("/admin/drivers/{driverDetailId}/reject")
public ResponseEntity<ApiResponse> rejectDriver(
        @PathVariable Long driverDetailId,
        @RequestParam(required = false, defaultValue = "Rejected by admin") String reason)
```

#### 4. DriverWithRatingDto
Added rejection reason field to the DTO for frontend display:
```java
private String rejectionReason;
```

#### 5. AdminService
Updated to populate rejection reason when fetching drivers:
```java
.rejectionReason(driverDetail.getRejectionReason())
```

### Frontend Changes

#### 1. API Service (api.js)
Added new method for rejection with reason:
```javascript
async adminRejectDriverWithReason(driverDetailId, reason) {
    return this.apiCall(`/admin/drivers/${driverDetailId}/reject?reason=${encodeURIComponent(reason)}`, {
        method: 'PUT'
    })
}
```

#### 2. AdminDashboard Component

**a) Verification Status Logic**
```javascript
const getVerificationStatus = (driver) => {
    if (driver.isVerified === true) {
        return 1  // Verified
    } else if (driver.isVerified === false && driver.rejectionReason) {
        return 0  // Rejected (has reason)
    } else {
        return null  // Pending (no verification, no reason)
    }
}
```

**b) Rejection Modal State**
```javascript
const [showRejectModal, setShowRejectModal] = useState(false)
const [rejectingDriverId, setRejectingDriverId] = useState(null)
const [rejectionReason, setRejectionReason] = useState('')
```

**c) Rejection Function**
```javascript
const rejectDriverWithReason = async () => {
    // Validate and call API with rejection reason
    // Updates driver status and records reason
}
```

**d) UI Components**
- Status badge now displays three colors: green (verified), yellow (pending), red (rejected)
- Both "Verify" and "Reject" buttons shown for pending drivers
- Rejection reason displayed below status badge for rejected drivers
- Modal dialog for entering rejection reason

## User Workflow

### Admin Driver Verification Process

1. **View Pending Drivers**
   - Filter: "Pending Verification"
   - Shows drivers with yellow "Pending" badge
   - Actions: "Verify" and "Reject" buttons

2. **Verify a Driver**
   - Click "Verify" button
   - Immediate update to "Verified" status
   - Driver can now post rides

3. **Reject a Driver**
   - Click "Reject" button
   - Modal opens for rejection reason
   - Admin enters detailed reason (up to 500 characters)
   - Click "Confirm Rejection"
   - Status updates to red "Rejected" with reason visible

4. **View Rejected Drivers**
   - Filter: "Rejected"
   - Shows rejected drivers with red badge
   - Rejection reason visible when hovering/viewing

## API Endpoints

### Verify Driver
```
PUT /api/admin/drivers/{driverDetailId}/verify
Response: DriverDetail with isVerified=true
```

### Reject Driver
```
PUT /api/admin/drivers/{driverDetailId}/reject?reason=<reason>
Response: DriverDetail with isVerified=false, rejectionReason=<reason>
```

### Get All Drivers with Ratings
```
GET /api/admin/drivers-with-ratings
Response: List of DriverWithRatingDto with verification status and rejection reason
```

## Database Migration

The following column needs to be added to the `driver_details` table:
```sql
ALTER TABLE driver_details ADD COLUMN rejection_reason VARCHAR(500);
```

## Testing Checklist

- [ ] Pending drivers show with yellow "Pending" badge
- [ ] Verified drivers show with green "Verified" badge
- [ ] Rejected drivers show with red "Rejected" badge
- [ ] Rejection reason visible for rejected drivers
- [ ] "Verify" button works correctly
- [ ] "Reject" button opens modal
- [ ] Modal requires rejection reason
- [ ] Rejection with reason updates status correctly
- [ ] Filter by "Pending" shows only pending drivers
- [ ] Filter by "Verified" shows only verified drivers
- [ ] Filter by "Rejected" shows only rejected drivers
- [ ] Stats count pending drivers correctly
- [ ] Re-verification button available for rejected drivers (they can re-apply)

## Future Enhancements

1. **Email Notifications**: Send notification to driver when rejected with reason
2. **Re-verification**: Allow rejected drivers to update their details and re-apply
3. **Rejection Appeal**: Allow drivers to appeal rejection decisions
4. **Audit Log**: Track all verification/rejection actions by admin
5. **Bulk Actions**: Reject multiple drivers at once with same reason
6. **Reason Templates**: Pre-defined rejection reasons for quick selection

## Files Modified

### Backend
- `src/main/java/com/ridesharing/entity/DriverDetail.java`
- `src/main/java/com/ridesharing/service/DriverDetailService.java`
- `src/main/java/com/ridesharing/controller/AdminController.java`
- `src/main/java/com/ridesharing/service/AdminService.java`
- `src/main/java/com/ridesharing/dto/DriverWithRatingDto.java`

### Frontend
- `client/src/services/api.js`
- `client/src/components/AdminDashboard.jsx`

## Migration Notes

If you have existing driver records:
- All existing drivers with `isVerified=false` will be in "Pending" state
- No automatic migration needed - rejection reason will be null until explicitly set
- Old rejected drivers (if any stored as false) will now show as "Pending" - admin can re-verify or re-reject them
