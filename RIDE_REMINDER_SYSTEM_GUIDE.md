# Ride Reminder Notification System - Implementation Guide

## Overview
This document provides a comprehensive guide for the newly implemented ride reminder notification system that automatically sends email notifications to passengers based on the time difference between booking and ride departure.

## System Logic

The system follows these intelligent rules:

### Reminder Scheduling Logic
1. **Less than 1 hour**: Send reminder **30 minutes** before ride time
2. **1-24 hours**: Send reminder **1 hour** before ride time  
3. **More than 24 hours**: Send **TWO reminders**:
   - First reminder **24 hours** before ride time
   - Final reminder **1 hour** before ride time

## Implementation Components

### 1. Database Entities
- **RideReminder**: Main entity storing reminder information
- **ReminderType**: Enum for reminder types (30min, 1h, 24h, final 1h)
- **ReminderStatus**: Enum for tracking reminder status (scheduled, sent, failed, cancelled)

### 2. Core Services
- **RideReminderService**: Business logic for scheduling and sending reminders
- **ReminderSchedulerService**: Automated background job processing
- **EmailService**: Enhanced with ride reminder template support

### 3. REST APIs
- **RideReminderController**: Management endpoints for reminders
- **ReminderTestController**: Testing endpoints (development only)

### 4. Integration Points
- **BookingService**: Automatically schedules reminders on booking confirmation
- **BookingService**: Cancels reminders when bookings are cancelled

## API Endpoints

### Production APIs (`/api/reminders`)
```http
# Schedule reminders for a booking
POST /api/reminders/schedule/{bookingId}

# Get reminders for a booking
GET /api/reminders/booking/{bookingId}

# Get reminders for a passenger
GET /api/reminders/passenger/{passengerId}

# Cancel reminders for a booking
DELETE /api/reminders/booking/{bookingId}

# Get reminder statistics (Admin only)
GET /api/reminders/statistics

# Manually process due reminders (Admin only)
POST /api/reminders/process-due

# Retry failed reminders (Admin only)
POST /api/reminders/retry-failed

# Health check
GET /api/reminders/health
```

### Test APIs (`/api/test/reminders`) - Development Only
```http
# Test all predefined scenarios
GET /api/test/reminders/scenarios

# Test custom scenario
POST /api/test/reminders/custom

# Manually trigger processing
POST /api/test/reminders/process

# Clean up test data
DELETE /api/test/reminders/cleanup
```

## Testing Scenarios

### Scenario 1: 30-Minute Booking
```json
{
  "passengerEmail": "passenger@example.com",
  "driverName": "John Driver",
  "driverPhone": "9876543210",
  "source": "Bangalore",
  "destination": "Mysore",
  "bookingTime": "2024-01-15T10:00:00",
  "rideTime": "2024-01-15T10:30:00",
  "seatsBooked": 1,
  "vehicleInfo": "KA-01-1234 (Sedan)",
  "scenario": "30 minutes before ride"
}
```
**Expected**: 1 reminder scheduled for 10:00 AM (30 minutes before ride)

### Scenario 2: 2-Hour Booking
```json
{
  "passengerEmail": "passenger@example.com",
  "driverName": "Jane Driver", 
  "driverPhone": "9876543211",
  "source": "Mumbai",
  "destination": "Pune",
  "bookingTime": "2024-01-15T08:00:00",
  "rideTime": "2024-01-15T10:00:00",
  "seatsBooked": 2,
  "vehicleInfo": "MH-12-5678 (SUV)",
  "scenario": "2 hours before ride"
}
```
**Expected**: 1 reminder scheduled for 9:00 AM (1 hour before ride)

### Scenario 3: 2-Day Booking
```json
{
  "passengerEmail": "passenger@example.com",
  "driverName": "Mike Driver",
  "driverPhone": "9876543212", 
  "source": "Delhi",
  "destination": "Agra",
  "bookingTime": "2024-01-15T10:00:00",
  "rideTime": "2024-01-17T10:00:00",
  "seatsBooked": 1,
  "vehicleInfo": "DL-01-9999 (Hatchback)",
  "scenario": "2 days before ride"
}
```
**Expected**: 2 reminders scheduled:
- 24-hour reminder: Jan 16, 10:00 AM
- Final 1-hour reminder: Jan 17, 9:00 AM

## Configuration

### Application Properties
```properties
# Ride Reminder Configuration
app.reminders.scheduling.enabled=true
app.reminders.retry.maxAttempts=3
app.reminders.email.enabled=true
app.reminders.sms.enabled=false

# Test Controllers (Set to false in production)
app.test.controllers.enabled=true
```

### Scheduled Jobs
- **Process Due Reminders**: Every 5 minutes
- **Retry Failed Reminders**: Every 30 minutes  
- **Log Statistics**: Every hour
- **Cleanup Old Reminders**: Daily at 2 AM

## Testing Instructions

### 1. Test All Scenarios
```bash
curl -X GET "http://localhost:8080/api/test/reminders/scenarios" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

### 2. Test Custom Scenario
```bash
curl -X POST "http://localhost:8080/api/test/reminders/custom" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -d '{
    "passengerEmail": "test@example.com",
    "driverName": "Test Driver",
    "driverPhone": "1234567890",
    "source": "Source City",
    "destination": "Destination City",
    "bookingTime": "2024-01-15T10:00:00",
    "rideTime": "2024-01-17T10:00:00",
    "seatsBooked": 1,
    "scenario": "Custom 2-day test"
  }'
```

### 3. Check Reminder Statistics
```bash
curl -X GET "http://localhost:8080/api/reminders/statistics" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

### 4. Manually Process Reminders
```bash
curl -X POST "http://localhost:8080/api/test/reminders/process" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

### 5. Clean Up Test Data
```bash
curl -X DELETE "http://localhost:8080/api/test/reminders/cleanup" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

## Email Template

The system uses a professional HTML email template (`ride-reminder.html`) with:
- Responsive design
- Ride details section
- Driver contact information
- Important reminders checklist
- Professional branding

## Monitoring & Maintenance

### Health Check
Monitor system health using:
```bash
curl -X GET "http://localhost:8080/api/reminders/health"
```

### Log Monitoring
Watch application logs for:
- Reminder scheduling events
- Email sending success/failures
- Scheduled job executions
- Error conditions

### Database Monitoring
Monitor the `ride_reminders` table for:
- Reminder status distribution
- Failed reminders requiring attention
- Performance metrics

## Production Deployment

### Before Going Live:
1. Set `app.test.controllers.enabled=false`
2. Configure proper email SMTP settings
3. Set up monitoring and alerting
4. Test with real email addresses
5. Verify scheduled jobs are running

### Performance Considerations:
- Scheduled jobs run efficiently with proper indexing
- Email sending is non-blocking (doesn't affect booking flow)
- Failed reminders are automatically retried
- Old reminders can be cleaned up periodically

## Troubleshooting

### Common Issues:
1. **Reminders not being sent**: Check email SMTP configuration
2. **Scheduled jobs not running**: Verify `@EnableScheduling` is present
3. **Test controller not available**: Check `app.test.controllers.enabled` property
4. **Database errors**: Verify proper JPA entity relationships

### Debug Commands:
```bash
# Check reminder statistics
GET /api/reminders/statistics

# View specific booking reminders  
GET /api/reminders/booking/{bookingId}

# Manual processing trigger
POST /api/reminders/process-due
```

## Future Enhancements

Potential improvements:
1. SMS notifications using Twilio
2. Push notifications for mobile apps  
3. WhatsApp integration
4. Customizable reminder times per user
5. Ride tracking integration
6. Weather updates in reminders
7. Multiple language support

This comprehensive ride reminder system ensures passengers never miss their rides while providing a professional, automated communication experience.