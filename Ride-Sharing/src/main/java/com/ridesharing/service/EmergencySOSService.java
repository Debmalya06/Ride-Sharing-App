package com.ridesharing.service;

import com.ridesharing.dto.EmergencyAlertResponse;
import com.ridesharing.dto.EmergencySOSRequest;
import com.ridesharing.entity.*;
import com.ridesharing.repository.*;
import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Call;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import jakarta.mail.internet.MimeMessage;
import java.net.URI;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmergencySOSService {
    
    private final EmergencyAlertRepository emergencyAlertRepository;
    private final EmergencyContactService emergencyContactService;
    private final UserRepository userRepository;
    private final RideRepository rideRepository;
    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    
    @Value("${twilio.account.sid:}")
    private String twilioAccountSid;
    
    @Value("${twilio.auth.token:}")
    private String twilioAuthToken;
    
    @Value("${twilio.phone.number:}")
    private String twilioPhoneNumber;
    
    @Value("${spring.mail.username}")
    private String fromEmail;
    
    @Value("${app.base.url:http://localhost:3000}")
    private String appBaseUrl;
    
    @Transactional
    public EmergencyAlertResponse triggerSOS(Long userId, EmergencySOSRequest request) {
        try {
            // Find user
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            // Create emergency alert
            EmergencyAlert alert = new EmergencyAlert();
            alert.setUser(user);
            alert.setLatitude(request.getLatitude());
            alert.setLongitude(request.getLongitude());
            alert.setMessage(request.getMessage());
            
            // Set alert type
            if (request.getAlertType() != null) {
                alert.setAlertType(EmergencyAlert.AlertType.valueOf(request.getAlertType()));
            } else {
                alert.setAlertType(EmergencyAlert.AlertType.SOS);
            }
            
            // Add ride if provided
            if (request.getRideId() != null) {
                Ride ride = rideRepository.findById(request.getRideId())
                        .orElse(null);
                alert.setRide(ride);
            }
            
            // Generate location links
            String googleMapsLink = generateGoogleMapsLink(request.getLatitude(), request.getLongitude());
            alert.setLocationLink(googleMapsLink);
            
            // Generate tracking link (using Google Maps with expiry parameter)
            String trackingLink = generateTrackingLink(userId, request.getLatitude(), request.getLongitude());
            alert.setTrackingLink(trackingLink);
            alert.setTrackingExpiry(LocalDateTime.now().plusHours(1));
            
            // Save alert
            EmergencyAlert savedAlert = emergencyAlertRepository.save(alert);
            
            // Get emergency contacts
            List<EmergencyContact> contacts = emergencyContactService.getAllContactsForUser(user);
            
            boolean emailSent = false;
            boolean smsSent = false;
            boolean callInitiated = false;
            
            // Send notifications to all emergency contacts
            if (!contacts.isEmpty()) {
                for (EmergencyContact contact : contacts) {
                    try {
                        // Send Email
                        if (contact.getContactEmail() != null && !contact.getContactEmail().isEmpty()) {
                            sendEmergencyEmail(user, contact, savedAlert);
                            emailSent = true;
                        }
                        
                        // Send SMS (if Twilio is configured)
                        if (isTwilioConfigured() && contact.getContactPhone() != null) {
                            sendEmergencySMS(user, contact, savedAlert);
                            smsSent = true;
                        }
                        
                        // Initiate call for primary contacts (if it's an emergency call)
                        if (contact.getIsPrimary() && 
                            alert.getAlertType() == EmergencyAlert.AlertType.EMERGENCY_CALL &&
                            isTwilioConfigured()) {
                            initiateEmergencyCall(contact, user, savedAlert);
                            callInitiated = true;
                        }
                    } catch (Exception e) {
                        log.error("Error sending notification to contact: " + contact.getContactName(), e);
                    }
                }
            }
            
            // Create response
            EmergencyAlertResponse response = new EmergencyAlertResponse();
            response.setAlertId(savedAlert.getId());
            response.setStatus("ALERT_TRIGGERED");
            response.setMessage("Emergency alert sent successfully");
            response.setTrackingLink(trackingLink);
            response.setTrackingExpiry(savedAlert.getTrackingExpiry());
            response.setEmailSent(emailSent);
            response.setSmsSent(smsSent);
            response.setCallInitiated(callInitiated);
            
            return response;
            
        } catch (Exception e) {
            log.error("Error triggering SOS", e);
            throw new RuntimeException("Failed to trigger emergency alert: " + e.getMessage());
        }
    }
    
    private void sendEmergencyEmail(User user, EmergencyContact contact, EmergencyAlert alert) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            
            // Create Thymeleaf context
            Context context = new Context();
            context.setVariable("contactName", contact.getContactName());
            context.setVariable("userName", user.getFirstName() + " " + user.getLastName());
            context.setVariable("userPhone", user.getPhoneNumber());
            context.setVariable("alertTime", alert.getCreatedAt().format(DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a")));
            context.setVariable("latitude", alert.getLatitude());
            context.setVariable("longitude", alert.getLongitude());
            context.setVariable("locationLink", alert.getLocationLink());
            context.setVariable("trackingLink", alert.getTrackingLink());
            context.setVariable("message", alert.getMessage() != null ? alert.getMessage() : "Emergency SOS triggered");
            
            // Add ride details if available
            if (alert.getRide() != null) {
                Ride ride = alert.getRide();
                context.setVariable("hasRide", true);
                context.setVariable("rideSource", ride.getSource());
                context.setVariable("rideDestination", ride.getDestination());
                
                User driver = ride.getDriver();
                context.setVariable("driverName", driver.getFirstName() + " " + driver.getLastName());
                context.setVariable("driverPhone", driver.getPhoneNumber());
                
                // Vehicle details - note: these are in DriverDetail entity, not Ride
                context.setVariable("vehicleModel", "Vehicle Details Available");
                context.setVariable("vehiclePlate", "Contact Driver");
            } else {
                context.setVariable("hasRide", false);
            }
            
            // Process template
            String htmlContent = templateEngine.process("emergency-sos-alert", context);
            
            helper.setFrom(fromEmail);
            helper.setTo(contact.getContactEmail());
            helper.setSubject("🚨 EMERGENCY ALERT - " + user.getFirstName() + " needs help!");
            helper.setText(htmlContent, true);
            
            mailSender.send(mimeMessage);
            log.info("Emergency email sent to: " + contact.getContactEmail());
            
        } catch (Exception e) {
            log.error("Failed to send emergency email", e);
            throw new RuntimeException("Failed to send emergency email: " + e.getMessage());
        }
    }
    
    private void sendEmergencySMS(User user, EmergencyContact contact, EmergencyAlert alert) {
        try {
            initializeTwilio();
            
            String messageBody = String.format(
                "🚨 EMERGENCY ALERT!\n\n" +
                "%s needs help!\n" +
                "Time: %s\n" +
                "Location: %s\n" +
                "Track live: %s\n\n" +
                "Contact them: %s",
                user.getFirstName() + " " + user.getLastName(),
                alert.getCreatedAt().format(DateTimeFormatter.ofPattern("dd MMM, hh:mm a")),
                alert.getLocationLink(),
                alert.getTrackingLink(),
                user.getPhoneNumber()
            );
            
            Message message = Message.creator(
                    new PhoneNumber(contact.getContactPhone()),
                    new PhoneNumber(twilioPhoneNumber),
                    messageBody
            ).create();
            
            log.info("Emergency SMS sent to: " + contact.getContactPhone() + ", SID: " + message.getSid());
            
        } catch (Exception e) {
            log.error("Failed to send emergency SMS", e);
        }
    }
    
    private void initiateEmergencyCall(EmergencyContact contact, User user, EmergencyAlert alert) {
        try {
            initializeTwilio();
            
            // TwiML URL that will be played when the call is answered
            String twimlUrl = appBaseUrl + "/api/emergency/twiml?userName=" + 
                            user.getFirstName() + "&location=" + alert.getLocationLink();
            
            Call call = Call.creator(
                    new PhoneNumber(contact.getContactPhone()),
                    new PhoneNumber(twilioPhoneNumber),
                    URI.create(twimlUrl)
            ).create();
            
            log.info("Emergency call initiated to: " + contact.getContactPhone() + ", SID: " + call.getSid());
            
        } catch (Exception e) {
            log.error("Failed to initiate emergency call", e);
        }
    }
    
    private void initializeTwilio() {
        if (twilioAccountSid != null && !twilioAccountSid.isEmpty() && 
            twilioAuthToken != null && !twilioAuthToken.isEmpty()) {
            Twilio.init(twilioAccountSid, twilioAuthToken);
        } else {
            throw new RuntimeException("Twilio credentials not configured");
        }
    }
    
    private boolean isTwilioConfigured() {
        return twilioAccountSid != null && !twilioAccountSid.isEmpty() && 
               twilioAuthToken != null && !twilioAuthToken.isEmpty() &&
               twilioPhoneNumber != null && !twilioPhoneNumber.isEmpty();
    }
    
    private String generateGoogleMapsLink(Double latitude, Double longitude) {
        return String.format("https://www.google.com/maps?q=%f,%f", latitude, longitude);
    }
    
    private String generateTrackingLink(Long userId, Double latitude, Double longitude) {
        // Using a free real-time location sharing service like Google Maps Plus Codes
        // Or you can implement your own tracking page
        return String.format("%s/emergency/track/%d?lat=%f&lng=%f", 
                           appBaseUrl, userId, latitude, longitude);
    }
    
    public List<EmergencyAlert> getActiveAlerts() {
        return emergencyAlertRepository.findByStatus(EmergencyAlert.AlertStatus.ACTIVE);
    }
    
    public List<EmergencyAlert> getRecentAlerts(int hours) {
        LocalDateTime since = LocalDateTime.now().minusHours(hours);
        return emergencyAlertRepository.findByCreatedAtAfter(since);
    }
    
    @Transactional
    public void resolveAlert(Long alertId, Long adminId) {
        EmergencyAlert alert = emergencyAlertRepository.findById(alertId)
                .orElseThrow(() -> new RuntimeException("Alert not found"));
        
        alert.setStatus(EmergencyAlert.AlertStatus.RESOLVED);
        alert.setResolvedAt(LocalDateTime.now());
        alert.setResolvedBy(adminId);
        
        emergencyAlertRepository.save(alert);
    }
    
    public String generateTwiML(String userName, String location) {
        return String.format(
            "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" +
            "<Response>" +
            "  <Say voice=\"alice\">This is an emergency alert from Smart Ride. %s has triggered an S O S. " +
            "Their location is %s. Please check on them immediately.</Say>" +
            "  <Pause length=\"2\"/>" +
            "  <Say>This message will repeat.</Say>" +
            "  <Pause length=\"1\"/>" +
            "  <Say>%s needs help at %s</Say>" +
            "</Response>",
            userName, location, userName, location
        );
    }
}
