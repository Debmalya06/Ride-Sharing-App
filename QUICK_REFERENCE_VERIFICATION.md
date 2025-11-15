# Quick Reference: Driver Verification & Rejection

## Three Verification States

### 1. 🟡 PENDING (Yellow Badge)
- **Backend State**: `isVerified = false`, `rejectionReason = null`
- **Meaning**: Driver is waiting for admin verification
- **Actions Available**: ✓ Verify | ✕ Reject
- **Display**: "Pending" in yellow badge

### 2. 🟢 VERIFIED (Green Badge)
- **Backend State**: `isVerified = true`
- **Meaning**: Driver approved, can post rides
- **Actions Available**: None (locked)
- **Display**: "Verified" in green badge

### 3. 🔴 REJECTED (Red Badge)
- **Backend State**: `isVerified = false`, `rejectionReason = "<reason>"`
- **Meaning**: Driver details rejected, cannot post rides
- **Actions Available**: None (need re-application)
- **Display**: "Rejected" in red badge + rejection reason below

## Admin Dashboard Features

### Filter Options
- **All Drivers**: Shows pending, verified, and rejected
- **Pending Verification**: Only yellow pending drivers
- **Verified**: Only green verified drivers
- **Rejected**: Only red rejected drivers

### Driver Card Displays

**For Pending Drivers:**
```
[Pending - Yellow] [Verify] [Reject]
```

**For Verified Drivers:**
```
[Verified - Green]
(No action buttons)
```

**For Rejected Drivers:**
```
[Rejected - Red]
Reason: Invalid license number
(No action buttons)
```

## How to Use

### ✓ Verify a Driver
1. Go to "Driver Management" tab
2. Filter by "Pending Verification"
3. Click [Verify] button
4. Driver moves to "Verified" list
5. Driver can now post rides

### ✕ Reject a Driver
1. Go to "Driver Management" tab
2. See pending driver (yellow badge)
3. Click [Reject] button
4. Modal appears: "Reject Driver"
5. Enter rejection reason (required, 500 chars max)
   - Examples: "Invalid license", "Fake documents", "Duplicate account"
6. Click [Confirm Rejection]
7. Driver moves to "Rejected" list with red badge
8. Reason displays under badge

### 📊 View Statistics
- **Total Users**: All registered users
- **Total Drivers**: All driver accounts
- **Pending Verifications**: Count of pending drivers (yellow)
- **Verified Drivers**: Count of verified drivers (green)

### 🔍 Filter Drivers
1. Click dropdown: "All Drivers"
2. Select:
   - "All Drivers" - See everything
   - "Pending Verification" - Only pending
   - "Verified" - Only approved
   - "Rejected" - Only rejected

## API Endpoints Quick Reference

### Verify Driver
```
PUT /api/admin/drivers/{id}/verify
```
Result: `isVerified = true`

### Reject Driver with Reason
```
PUT /api/admin/drivers/{id}/reject?reason=Your+reason+here
```
Result: `isVerified = false`, `rejectionReason = "Your reason here"`

### Get All Drivers (includes rejection reasons)
```
GET /api/admin/drivers-with-ratings
```
Returns: Array of drivers with `rejectionReason` field

## Common Rejection Reasons

- "Invalid/expired license number"
- "Suspicious vehicle details"
- "Duplicate account detected"
- "Missing required documents"
- "Invalid insurance information"
- "Vehicle not suitable for commercial use"
- "Previous safety violations"
- "Unverifiable documents"

## State Transitions

```
[PENDING] ──[Verify]──> [VERIFIED]
   ↑            ↓
   └─[Reject]──> [REJECTED]
```

- **Verify**: Pending → Verified (permanent, driver active)
- **Reject**: Pending → Rejected (blocked, needs re-application)
- **No Direct Path**: Verified drivers cannot be rejected directly (would need new status)

## Database Values

| State | isVerified | rejectionReason | Query |
|-------|-----------|-----------------|-------|
| Pending | false | NULL | `isVerified = false AND rejectionReason IS NULL` |
| Verified | true | NULL | `isVerified = true` |
| Rejected | false | value | `isVerified = false AND rejectionReason IS NOT NULL` |

## Frontend Component States

```javascript
getVerificationStatus(driver) returns:
  1 (Verified)    ← if isVerified === true
  0 (Rejected)    ← if isVerified === false AND rejectionReason exists
  null (Pending)  ← if isVerified === false AND NO rejectionReason
```

## Troubleshooting

### Q: Why is a pending driver showing as rejected?
**A**: Check if rejection reason got populated. Pending = no reason, Rejected = has reason.

### Q: Can I change a rejection to verified?
**A**: No, current system doesn't support it. Need manual database update or re-implementation.

### Q: Where is rejection reason stored?
**A**: Database column `rejection_reason` in `driver_details` table (500 chars max).

### Q: What if admin doesn't provide rejection reason?
**A**: Modal requires reason - button disabled until text entered. If API called directly, default is "Rejected by admin".

### Q: Can drivers see their rejection reason?
**A**: Not yet - would need frontend dashboard update to show rejection reasons to drivers.

## Statistics Impact

```javascript
// These count toward "Pending Verifications":
- isVerified = false
- rejectionReason = NULL

// These count toward "Verified Drivers":
- isVerified = true

// These are NOT counted:
- Rejected drivers (separate category)
- isVerified = false + rejectionReason = NOT NULL
```

## Next Steps / Future Work

1. **Notify Driver**: Send email when rejected
2. **Re-application**: Let rejected drivers resubmit
3. **Appeal Process**: Allow drivers to contest rejection
4. **Bulk Actions**: Reject multiple drivers at once
5. **Audit Trail**: Log all verification actions
6. **Templates**: Pre-defined rejection reasons
7. **Dashboard**: Show rejection stats/trends