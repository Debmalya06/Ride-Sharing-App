# Driver Rejection Feature Implementation

## Summary
Implemented a complete driver rejection system with rejection reasons. Admins can now reject drivers with invalid or suspicious details and provide a specific reason that's recorded in the system.

## Changes Overview

### 1. Backend Implementation

#### A. Database Schema Changes
Added new column to `driver_details` table:
```sql
ALTER TABLE driver_details ADD COLUMN rejection_reason VARCHAR(500);
```

#### B. Entity Updates (`DriverDetail.java`)
```java
@Column(name = "rejection_reason", length = 500)
private String rejectionReason;

public String getRejectionReason() {
    return rejectionReason;
}

public void setRejectionReason(String rejectionReason) {
    this.rejectionReason = rejectionReason;
}
```

#### C. Service Layer Updates

**DriverDetailService.java:**
```java
public DriverDetail rejectDriverDetails(Long driverDetailId, String rejectionReason) {
    DriverDetail driverDetail = driverDetailRepository.findById(driverDetailId)
            .orElseThrow(() -> new RuntimeException("Driver details not found"));
    
    driverDetail.setIsVerified(false);
    driverDetail.setRejectionReason(rejectionReason);
    return driverDetailRepository.save(driverDetail);
}
```

**AdminService.java:**
Updated `convertToDriverWithRatingDto()` to include rejection reason:
```java
.rejectionReason(driverDetail.getRejectionReason())
```

#### D. Controller Updates (`AdminController.java`)
```java
@PutMapping("/admin/drivers/{driverDetailId}/reject")
public ResponseEntity<ApiResponse> rejectDriver(
        @PathVariable Long driverDetailId,
        @RequestParam(required = false, defaultValue = "Rejected by admin") String reason) {
    try {
        DriverDetail rejectedDriver = driverDetailService.rejectDriverDetails(driverDetailId, reason);
        ApiResponse response = new ApiResponse("SUCCESS", "Driver rejected successfully", rejectedDriver);
        return ResponseEntity.ok(response);
    } catch (Exception e) {
        return ResponseEntity.badRequest()
                .body(new ApiResponse("ERROR", e.getMessage(), null));
    }
}
```

#### E. DTO Updates (`DriverWithRatingDto.java`)
```java
private String rejectionReason;
```

### 2. Frontend Implementation

#### A. API Service (`api.js`)
Added new rejection method:
```javascript
async adminRejectDriverWithReason(driverDetailId, reason) {
    return this.apiCall(`/admin/drivers/${driverDetailId}/reject?reason=${encodeURIComponent(reason)}`, {
        method: 'PUT'
    })
}
```

#### B. AdminDashboard Component (`AdminDashboard.jsx`)

**i. State Management:**
```javascript
const [showRejectModal, setShowRejectModal] = useState(false)
const [rejectingDriverId, setRejectingDriverId] = useState(null)
const [rejectionReason, setRejectionReason] = useState('')
```

**ii. Verification Status Logic:**
```javascript
const getVerificationStatus = (driver) => {
    // true = Verified (1)
    // false + rejectionReason = Rejected (0)
    // false + no rejectionReason = Pending (null)
    if (driver.isVerified === true) {
        return 1  // Verified
    } else if (driver.isVerified === false && driver.rejectionReason) {
        return 0  // Rejected
    } else {
        return null  // Pending
    }
}
```

**iii. Rejection Function:**
```javascript
const rejectDriverWithReason = async () => {
    if (!rejectionReason.trim()) {
        alert('Please provide a rejection reason')
        return
    }
    
    try {
        const response = await apiService.adminRejectDriverWithReason(
            rejectingDriverId, 
            rejectionReason
        )
        // Handle success...
    } catch (err) {
        // Handle error...
    }
}
```

**iv. Filter Logic:**
```javascript
const getFilteredDrivers = () => {
    return allDrivers.filter(driver => {
        const status = getVerificationStatus(driver)
        const matchesStatus = driverStatusFilter === 'all' ||
                             (driverStatusFilter === 'pending' && status === null) ||
                             (driverStatusFilter === 'verified' && status === 1) ||
                             (driverStatusFilter === 'rejected' && status === 0)
        return matchesStatus
    })
}
```

**v. UI Components:**

Status Badge with Rejection Reason:
```jsx
<div className="mb-0 lg:mb-4 flex flex-col items-start lg:items-end gap-1">
    <span className={`px-2.5 sm:px-3 py-1 text-xs sm:text-sm rounded-full ${
        getVerificationStatus(driver) === 1
            ? 'bg-green-100 text-green-800'
            : getVerificationStatus(driver) === 0
            ? 'bg-red-100 text-red-800'
            : 'bg-yellow-100 text-yellow-800'
    }`}>
        {getVerificationStatus(driver) === 1 ? 'Verified' : 
         getVerificationStatus(driver) === 0 ? 'Rejected' : 'Pending'}
    </span>
    {getVerificationStatus(driver) === 0 && driver.rejectionReason && (
        <span className="text-xs text-red-600 max-w-xs text-right">
            Reason: {driver.rejectionReason}
        </span>
    )}
</div>
```

Action Buttons:
```jsx
{getVerificationStatus(driver) !== 1 && (
    <div className="flex lg:flex-col gap-2 lg:space-y-2 w-full lg:w-auto">
        <button onClick={() => verifyDriver(...)}>
            ✓ Verify
        </button>
        <button onClick={() => {
            setRejectingDriverId(driver.id)
            setShowRejectModal(true)
        }}>
            ✕ Reject
        </button>
    </div>
)}
```

Rejection Modal:
```jsx
{showRejectModal && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2>Reject Driver</h2>
            <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="E.g., Invalid license number, Suspicious vehicle details..."
                maxLength="500"
            />
            <div className="flex gap-3">
                <button onClick={() => setShowRejectModal(false)}>Cancel</button>
                <button onClick={rejectDriverWithReason}>
                    Confirm Rejection
                </button>
            </div>
        </div>
    </div>
)}
```

Filter Dropdown:
```jsx
<select value={driverStatusFilter} onChange={(e) => setDriverStatusFilter(e.target.value)}>
    <option value="all">All Drivers</option>
    <option value="pending">Pending Verification</option>
    <option value="verified">Verified</option>
    <option value="rejected">Rejected</option>
</select>
```

## Three-State Driver Verification System

| State | isVerified | rejectionReason | Badge | Color | Actions |
|-------|-----------|-----------------|-------|-------|---------|
| Pending | false | null | Pending | Yellow | Verify, Reject |
| Verified | true | null | Verified | Green | None |
| Rejected | false | "<reason>" | Rejected | Red | None |

## User Experience Flow

### Admin Rejection Process:
1. Navigate to Driver Management tab
2. View drivers with yellow "Pending" badge
3. Click "Reject" button on a driver
4. Modal opens for rejection reason
5. Admin types detailed reason (up to 500 characters)
6. Click "Confirm Rejection"
7. Driver status updates to red "Rejected"
8. Reason is visible under the badge

### Viewing Rejected Drivers:
1. Filter by "Rejected"
2. See all rejected drivers with red badge
3. Hover or view to see rejection reason
4. No action buttons shown (no re-verification yet)

## API Endpoints

### Verify Driver
```
PUT /api/admin/drivers/{driverDetailId}/verify
Status: 200
Response: { status: "SUCCESS", data: DriverDetail }
```

### Reject Driver with Reason
```
PUT /api/admin/drivers/{driverDetailId}/reject?reason=<reason>
Status: 200
Response: { 
    status: "SUCCESS", 
    data: DriverDetail { isVerified: false, rejectionReason: "<reason>" }
}
```

### Get All Drivers
```
GET /api/admin/drivers-with-ratings
Status: 200
Response: { 
    status: "SUCCESS", 
    data: [ DriverWithRatingDto { ..., rejectionReason: "..." } ]
}
```

## Testing Workflow

### Test Case 1: Pending Driver
- [ ] Driver shows yellow "Pending" badge
- [ ] Both "Verify" and "Reject" buttons visible
- [ ] No rejection reason displayed

### Test Case 2: Verify Pending Driver
- [ ] Click "Verify" button
- [ ] Driver status changes to green "Verified"
- [ ] Buttons disappear
- [ ] Can filter by "Verified"

### Test Case 3: Reject Pending Driver
- [ ] Click "Reject" button
- [ ] Modal appears
- [ ] Modal requires reason (can't submit empty)
- [ ] Reason shows character count
- [ ] Click "Confirm Rejection"
- [ ] Status changes to red "Rejected"
- [ ] Rejection reason visible under badge

### Test Case 4: Filter Rejected Drivers
- [ ] Filter dropdown shows "Rejected" option
- [ ] Select "Rejected"
- [ ] Only rejected drivers shown
- [ ] All show red badges with reasons

### Test Case 5: Stats
- [ ] "Pending Verifications" count accurate
- [ ] Rejected drivers NOT counted as pending

## File Changes Summary

### Backend Files Modified:
1. **DriverDetail.java** - Added rejectionReason field
2. **DriverDetailService.java** - Added rejectDriverDetails() method
3. **AdminController.java** - Updated reject endpoint to accept reason
4. **AdminService.java** - Updated DTO mapping to include reason
5. **DriverWithRatingDto.java** - Added rejectionReason field

### Frontend Files Modified:
1. **api.js** - Added adminRejectDriverWithReason() method
2. **AdminDashboard.jsx** - Complete rejection UI implementation

## Future Enhancements

### Priority 1 (High):
- [ ] Send email notification to rejected driver with reason
- [ ] Allow rejected drivers to re-submit application
- [ ] Show rejection reason to driver in their dashboard

### Priority 2 (Medium):
- [ ] Predefined rejection reason templates
- [ ] Bulk rejection action
- [ ] Appeal/Contest rejection feature
- [ ] Audit trail of all verification actions

### Priority 3 (Low):
- [ ] SMS notification for rejection
- [ ] Dashboard stats on rejection rate
- [ ] Rejection reason analytics
- [ ] Re-verification approval workflow

## Known Limitations

1. **No Email Notification**: Driver is not notified when rejected
2. **No Re-verification**: Rejected drivers cannot re-apply yet
3. **No Appeal Process**: No way to contest rejection
4. **No Audit Log**: Rejection actions not logged separately
5. **Manual Reason Input**: No templates or quick reasons

## Deployment Instructions

1. **Database Migration:**
   ```sql
   ALTER TABLE driver_details ADD COLUMN rejection_reason VARCHAR(500);
   ```

2. **Backend Deployment:**
   - Compile and package the updated Java code
   - Deploy new JAR file
   - Restart backend service

3. **Frontend Deployment:**
   - Build React application
   - Deploy new build files
   - Clear browser cache

4. **Testing:**
   - Test rejection flow end-to-end
   - Verify rejection reasons are saved
   - Confirm filter works correctly

## Monitoring & Maintenance

- Monitor rejection reason field size (varchar 500)
- Check for null rejection reasons in rejected drivers
- Monitor API response times for driver listing
- Track rejection rate trends

## Support & Troubleshooting

### Issue: Rejection reason not saving
- Check database column exists
- Verify API parameter is URL encoded
- Check backend logs for errors

### Issue: Old rejected drivers showing as pending
- Rejection reason field will be NULL
- Admin should re-reject with proper reason
- Consider backfilling data

### Issue: Modal not opening
- Check browser console for errors
- Verify state management
- Check modal CSS/visibility