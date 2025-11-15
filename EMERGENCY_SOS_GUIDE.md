# 🚨 Emergency SOS System - User Guide

## 📍 Where to Find Emergency Features in Passenger Dashboard

### 1. **Emergency Tab** (New Tab Added)
- **Location**: Top navigation bar in Passenger Dashboard
- **Icon**: 🚨 Emergency
- **What's Inside**:
  - Emergency Contacts Management
  - Safety information
  - Quick action guide
  - Instructions for using SOS features

### 2. **Floating SOS Button** (Always Visible)
- **Location**: Bottom-right corner of the screen (RED pulsing button)
- **Visibility**: Shows on ALL tabs (Search, Bookings, History, Emergency, Payments, Profile)
- **Icon**: ⚠️ Alert Triangle icon
- **Purpose**: Quick access to emergency alerts from anywhere

---

## 🎯 How to Use Emergency Features

### **Step 1: Add Emergency Contacts**
1. Go to **🚨 Emergency** tab in Passenger Dashboard
2. Scroll to "Manage Emergency Contacts" section
3. Click **"+ Add Emergency Contact"** button
4. Fill in the form:
   - **Name** (required)
   - **Phone Number** (required) - with country code
   - **Email Address** (optional but recommended)
   - **Relationship** (e.g., Family, Friend, Colleague)
   - **Primary Contact** checkbox (for voice calls)
5. Click **"Add Contact"**
6. Add multiple contacts (recommended: 2-3 contacts)

**Important Notes**:
- ✅ Primary contacts will receive **voice calls** during emergencies
- ✅ All contacts receive **SMS and Email** notifications
- ✅ You can delete contacts anytime

---

### **Step 2: Trigger Emergency Alert (SOS)**

#### **Option A: From SOS Button**
1. Look for the **red pulsing button** at bottom-right corner
2. Click the SOS button
3. Modal will open with:
   - 📍 Your current location (auto-detected)
   - 📝 Optional message field
   - 🚗 Active ride info (if in a ride)
4. Choose action:
   - **"Send SOS Alert"** - Email + SMS to all contacts
   - **"Emergency Call Alert"** - Voice calls to primary contacts
5. Click the button to send alert
6. Wait for confirmation message

#### **Option B: From Emergency Tab**
1. Go to **🚨 Emergency** tab
2. Use the floating SOS button (same as Option A)

---

## 📧 What Happens When You Send SOS?

### **Immediate Actions:**
1. ✅ **Email Sent** to all emergency contacts with:
   - Your location coordinates
   - Google Maps link
   - Live tracking link (valid for 1 hour)
   - Ride details (if in active ride)
   - Driver information
   - Timestamp

2. ✅ **SMS Sent** to all emergency contacts with:
   - Brief emergency alert
   - Your location
   - Quick action links

3. ✅ **Voice Calls** to primary contacts (if you chose "Emergency Call Alert")
   - Automated message with your name and location
   - Instructions to check SMS/Email

4. ✅ **Admin Notification**:
   - Alert visible in Admin Dashboard
   - Location tracking enabled
   - Monitoring and support

---

## 🗺️ Location Tracking

### **Live Tracking Features:**
- 📍 Your exact GPS coordinates shared
- 🗺️ Google Maps link for easy navigation
- ⏰ Live tracking link valid for **1 hour**
- 🔄 Location updates in real-time

### **Privacy:**
- ⏱️ Tracking expires after 1 hour automatically
- 🔒 Only shared with emergency contacts and admin
- ✅ You control when to trigger alerts

---

## 🎨 Visual Guide

### **1. Emergency Tab Location:**
```
Passenger Dashboard Header:
┌─────────────────────────────────────────────────┐
│ Search | Bookings | History | 🚨 Emergency | ... │
│                                    ↑              │
│                            Click here for        │
│                            Emergency Center      │
└─────────────────────────────────────────────────┘
```

### **2. Floating SOS Button:**
```
Your Screen:
┌────────────────────────────────┐
│                                │
│  Dashboard Content Here        │
│                                │
│                                │
│                                │
│                                │
│                         ⚠️     │ ← Red pulsing
│                        (SOS)   │   button here
└────────────────────────────────┘
```

---

## 🔔 Notifications Your Contacts Receive

### **Email Example:**
```
Subject: 🚨 EMERGENCY ALERT - [Your Name] needs help!

Body:
- Alert Icon and Header
- Your Name, Phone, Email
- Location: Lat/Long coordinates
- Google Maps Button
- Live Tracking Button (1 hour validity)
- Ride Details (if applicable)
- Driver Info (if in ride)
- Timestamp
```

### **SMS Example:**
```
🚨 EMERGENCY ALERT
[Your Name] needs help!
Location: https://maps.google.com/...
Track Live: [Tracking Link]
Triggered at: [Time]
```

### **Voice Call Message:**
```
"This is an emergency alert from SmartRide. 
[Your Name] has triggered an emergency SOS. 
Please check your SMS and email for their 
current location and tracking details. 
Immediate assistance may be required."
```

---

## ⚡ Quick Tips

### **Before Your Ride:**
✅ Add at least 2 emergency contacts
✅ Mark one as primary contact (for calls)
✅ Verify phone numbers have country codes
✅ Test that contacts can receive SMS/Email

### **During Emergency:**
✅ Keep calm
✅ Click the red SOS button
✅ Location is auto-detected (ensure GPS is on)
✅ Add a message if possible
✅ Wait for confirmation

### **For Immediate Danger:**
🚨 Call local emergency services:
- Police: 100
- Ambulance: 108
- Use SOS system as additional safety measure

---

## 📱 Component Files (For Developers)

### **Frontend Components:**
1. **EmergencySOSButton.jsx**
   - Location: `client/src/components/EmergencySOSButton.jsx`
   - Purpose: Floating SOS button with modal interface
   - Features: Geolocation, alert triggering, success confirmation

2. **EmergencyContacts.jsx**
   - Location: `client/src/components/EmergencyContacts.jsx`
   - Purpose: Manage emergency contacts (CRUD)
   - Features: Add/delete contacts, primary designation

3. **EmergencyAlertsDashboard.jsx**
   - Location: `client/src/components/EmergencyAlertsDashboard.jsx`
   - Purpose: Admin view of emergency alerts
   - Features: Active alerts, recent alerts, resolution

### **Backend Components:**
1. **EmergencySOSController.java**
   - Endpoints: `/api/emergency/sos`, `/api/emergency/alerts/*`

2. **EmergencyContactController.java**
   - Endpoints: `/api/emergency/contacts/*`

3. **EmergencySOSService.java**
   - Methods: triggerSOS, sendEmail, sendSMS, initiateCall

---

## 🧪 Testing Checklist

### **For Passengers:**
- [ ] Can access Emergency tab
- [ ] Can add emergency contact
- [ ] Can set primary contact
- [ ] Can delete contact
- [ ] Can see floating SOS button
- [ ] Can trigger SOS alert
- [ ] Receives confirmation message

### **For Emergency Contacts:**
- [ ] Receives email notification
- [ ] Receives SMS notification
- [ ] Primary contact receives voice call
- [ ] Can access location links
- [ ] Live tracking link works

### **For Admins:**
- [ ] Alerts appear in admin dashboard
- [ ] Can view alert details
- [ ] Can mark alerts as resolved
- [ ] Can access tracking links

---

## 🛠️ Configuration Required

### **Backend (application.properties):**
```properties
# Twilio Configuration
twilio.account.sid=YOUR_ACCOUNT_SID
twilio.auth.token=YOUR_AUTH_TOKEN
twilio.phone.number=YOUR_TWILIO_PHONE

# SMTP Email Configuration
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=YOUR_EMAIL
spring.mail.password=YOUR_APP_PASSWORD

# App Configuration
app.base.url=http://localhost:3000
```

### **Setup Steps:**
1. Create Twilio account (https://www.twilio.com)
2. Get Account SID, Auth Token, and Phone Number
3. Configure Gmail App Password (or other SMTP)
4. Update `application.properties`
5. Restart backend server

---

## ❓ FAQ

**Q: Will the SOS button work if I'm not in an active ride?**
A: Yes! The SOS button works anytime, with or without an active ride.

**Q: How long is the tracking link valid?**
A: The live tracking link is valid for 1 hour from the time of alert.

**Q: Can I cancel an SOS alert?**
A: Currently, alerts cannot be cancelled, but admins can mark them as "False Alarm".

**Q: What if location services are disabled?**
A: The system will use default coordinates (0,0) and show a warning. Enable GPS for accurate location.

**Q: How many emergency contacts can I add?**
A: You can add unlimited contacts, but we recommend 2-3 for best results.

**Q: Do my contacts need to install the app?**
A: No! Contacts receive SMS and email - no app installation required.

---

## 🆘 Support

For issues or questions:
- Contact admin support
- Check browser console for errors
- Verify Twilio and SMTP configuration
- Ensure emergency contacts have valid phone/email

---

**Remember: Your safety is our priority! 🛡️**

Last Updated: November 9, 2025
