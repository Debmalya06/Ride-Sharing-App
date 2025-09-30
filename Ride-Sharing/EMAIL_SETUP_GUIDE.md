# Email Configuration Setup Guide

## SMTP Configuration for Gmail

To enable email notifications in the SmartRide application, you need to configure your Gmail SMTP settings:

### 1. Gmail App Password Setup
1. Go to your Google Account settings
2. Navigate to Security → 2-Step Verification (enable if not already enabled)
3. Go to Security → App passwords
4. Generate a new app password for "Mail"
5. Copy the 16-character app password

### 2. Update application.properties
Replace the following values in `src/main/resources/application.properties`:

```properties
# Email Configuration (SMTP)
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your-actual-email@gmail.com
spring.mail.password=your-16-character-app-password
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
spring.mail.properties.mail.smtp.starttls.required=true
spring.mail.properties.mail.smtp.ssl.protocols=TLSv1.2

# Email Settings
app.email.from=SmartRide <your-actual-email@gmail.com>
app.email.support=support@smartride.com
```

### 3. Alternative SMTP Providers

#### For Outlook/Hotmail:
```properties
spring.mail.host=smtp-mail.outlook.com
spring.mail.port=587
spring.mail.username=your-email@outlook.com
spring.mail.password=your-password
```

#### For Yahoo:
```properties
spring.mail.host=smtp.mail.yahoo.com
spring.mail.port=587
spring.mail.username=your-email@yahoo.com
spring.mail.password=your-app-password
```

### 4. Email Templates
The application includes three professional email templates:
- `booking-confirmed.html` - Sent when driver confirms a booking
- `booking-cancelled.html` - Sent when driver cancels a booking  
- `booking-status-update.html` - Generic template for status updates

### 5. Testing Email Functionality
1. Update the email configuration with your credentials
2. Restart the Spring Boot application
3. Register a new user with a valid email address
4. Create a ride as a driver
5. Book the ride as a passenger
6. Confirm/cancel the booking as the driver
7. Check the passenger's email for notifications

### 6. Email Features
- **Professional Templates**: Beautiful HTML email templates with SmartRide branding
- **Comprehensive Information**: Includes booking details, ride information, and driver contact
- **Status-based Styling**: Different colors and messaging based on booking status
- **Error Handling**: Emails are sent asynchronously; failures don't block the booking process
- **Responsive Design**: Email templates work well on mobile and desktop clients

### 7. Security Notes
- Never commit real email credentials to version control
- Use environment variables in production
- Enable 2-factor authentication on your email account
- Use app-specific passwords instead of your main account password

### 8. Production Setup
For production, consider using environment variables:
```properties
spring.mail.username=${EMAIL_USERNAME}
spring.mail.password=${EMAIL_PASSWORD}
app.email.from=${EMAIL_FROM}
```

Then set these as environment variables:
```bash
export EMAIL_USERNAME=your-email@gmail.com
export EMAIL_PASSWORD=your-app-password
export EMAIL_FROM="SmartRide <your-email@gmail.com>"
```

## Troubleshooting
- Ensure 2-step verification is enabled for Gmail
- Use app passwords, not your regular Gmail password
- Check spam/junk folder for test emails
- Verify SMTP settings are correct for your provider
- Check application logs for email sending errors