package com.ridesharing.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ridesharing.entity.OtpVerification;
import com.ridesharing.repository.OtpVerificationRepository;

import jakarta.mail.internet.MimeMessage;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

@Service
@Transactional
public class OtpEmailService {

    private static final Logger logger = LoggerFactory.getLogger(OtpEmailService.class);
    
    private final OtpVerificationRepository otpRepository;
    private final JavaMailSender mailSender;
    
    private static final int OTP_EXPIRY_MINUTES = 5;
    private static final int OTP_LENGTH = 6;
    private static final int MAX_ATTEMPTS_PER_HOUR = 5;
    private static final String FROM_EMAIL = "debmalyapan4@gmail.com";

    public OtpEmailService(OtpVerificationRepository otpRepository, JavaMailSender mailSender) {
        this.otpRepository = otpRepository;
        this.mailSender = mailSender;
    }

    /**
     * Generate a random 6-digit OTP
     */
    public String generateOtp() {
        Random random = new Random();
        StringBuilder otp = new StringBuilder();
        
        for (int i = 0; i < OTP_LENGTH; i++) {
            otp.append(random.nextInt(10));
        }
        
        return otp.toString();
    }

    /**
     * Generate and send OTP via Email (SMTP)
     * Also prints to console for development testing
     */
    public void generateAndSendOtp(String phoneNumber, String email) {
        try {
            // Validate and format phone number
            phoneNumber = formatPhoneNumber(phoneNumber);

            // Validate email
            if (email == null || email.isEmpty()) {
                throw new RuntimeException("Email address is required");
            }

            // Check rate limiting (max 5 OTPs per hour)
            if (!canSendOtp(phoneNumber)) {
                logger.warn("Rate limit exceeded for phone: {}", phoneNumber);
                throw new RuntimeException("Too many OTP requests. Please try again after 1 hour.");
            }

            // Delete any existing OTPs for this phone number
            otpRepository.deleteByPhoneNumber(phoneNumber);

            // Generate new OTP
            String otp = generateOtp();
            LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES);

            // Save OTP to database
            OtpVerification otpVerification = new OtpVerification(phoneNumber, otp, expiresAt);
            otpRepository.save(otpVerification);

            // Print OTP to console for development/testing
            printMockOtp(phoneNumber, otp, email);
            
            // Send OTP via Email
            sendOtpViaEmail(phoneNumber, otp, email);
            
            logger.info("✅ OTP generated, printed to console, and sent to email: {}", email);

        } catch (Exception e) {
            logger.error("❌ Error generating OTP: ", e);
            throw new RuntimeException("Failed to generate OTP: " + e.getMessage());
        }
    }

    /**
     * Send OTP via Email using SMTP
     */
    private void sendOtpViaEmail(String phoneNumber, String otp, String email) {
        try {
            logger.info("📧 Sending OTP via Email to: {}", email);

            // Create HTML email template
            String htmlContent = String.format(
                """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
                        .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }
                        .header { text-align: center; color: #333; }
                        .otp-box { background-color: #f0f0f0; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0; }
                        .otp-code { font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 5px; }
                        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h2>🚗 SmartRide - OTP Verification</h2>
                        </div>
                        <p>Hello,</p>
                        <p>Your One-Time Password (OTP) for SmartRide is:</p>
                        <div class="otp-box">
                            <div class="otp-code">%s</div>
                        </div>
                        <p><strong>Phone Number:</strong> %s</p>
                        <p><strong>⏰ Expires in:</strong> 5 minutes</p>
                        <p style="color: #d9534f;"><strong>⚠️ Never share this OTP with anyone!</strong></p>
                        <div class="footer">
                            <p>If you didn't request this OTP, please ignore this email.</p>
                            <p>© 2025 SmartRide. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
                """, otp, phoneNumber);

            // Send HTML email
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            
            helper.setFrom(FROM_EMAIL);
            helper.setTo(email);
            helper.setSubject("🔐 SmartRide OTP Verification - " + otp);
            helper.setText(htmlContent, true); // true = HTML email
            
            mailSender.send(mimeMessage);
            
            logger.info("✅ OTP email sent successfully to: {}", email);

        } catch (Exception e) {
            logger.error("❌ Error sending OTP email: {}", e.getMessage());
            throw new RuntimeException("Failed to send OTP email: " + e.getMessage());
        }
    }

    /**
     * Verify OTP from database
     */
    public boolean verifyOtp(String phoneNumber, String otp) {
        try {
            phoneNumber = formatPhoneNumber(phoneNumber);

            Optional<OtpVerification> otpVerificationOpt = 
                otpRepository.findByPhoneNumberAndOtpAndIsUsedFalse(phoneNumber, otp);

            if (otpVerificationOpt.isPresent()) {
                OtpVerification otpVerification = otpVerificationOpt.get();
                
                if (otpVerification.isValid()) {
                    // Mark OTP as used
                    otpVerification.markAsUsed();
                    otpRepository.save(otpVerification);
                    
                    logger.info("✅ OTP verified successfully for phone: {}", phoneNumber);
                    return true;
                } else {
                    logger.warn("⏰ OTP expired for phone: {}", phoneNumber);
                    return false;
                }
            }

            logger.warn("❌ Invalid OTP attempt for phone: {}", phoneNumber);
            return false;

        } catch (Exception e) {
            logger.error("❌ Error verifying OTP: ", e);
            return false;
        }
    }

    /**
     * Check if user can send OTP (rate limiting)
     */
    public boolean canSendOtp(String phoneNumber) {
        try {
            phoneNumber = formatPhoneNumber(phoneNumber);
            LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
            long otpCount = otpRepository.countByPhoneNumberAndCreatedAtAfter(phoneNumber, oneHourAgo);
            return otpCount < MAX_ATTEMPTS_PER_HOUR;
        } catch (Exception e) {
            logger.error("Error checking OTP rate limit: ", e);
            return false;
        }
    }

    /**
     * Clean up expired OTPs (scheduled task)
     */
    public void cleanupExpiredOtps() {
        try {
            otpRepository.deleteByExpiresAtBefore(LocalDateTime.now());
            logger.info("🧹 Expired OTPs cleaned up successfully");
        } catch (Exception e) {
            logger.error("Error cleaning up expired OTPs: ", e);
        }
    }

    /**
     * Format phone number to international format
     */
    private String formatPhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.isEmpty()) {
            throw new RuntimeException("Phone number cannot be empty");
        }

        // Remove any spaces, dashes, or other characters
        phoneNumber = phoneNumber.replaceAll("[^0-9+]", "");

        // If it starts with +, it's already in international format
        if (phoneNumber.startsWith("+")) {
            return phoneNumber;
        }

        // If it's a 10-digit number, assume India (+91)
        if (phoneNumber.length() == 10) {
            return "+91" + phoneNumber;
        }

        // If it's already a 12-digit number (91 + 10 digits), add +
        if (phoneNumber.length() == 12 && phoneNumber.startsWith("91")) {
            return "+" + phoneNumber;
        }

        // Return as-is for other formats
        return phoneNumber;
    }

    /**
     * Print OTP to console for development testing
     */
    private void printMockOtp(String phoneNumber, String otp, String email) {
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES);
        System.out.println("\n" + "=".repeat(60));
        System.out.println("🔐 MOCK OTP FOR DEVELOPMENT");
        System.out.println("=".repeat(60));
        System.out.println("📱 Phone Number: " + phoneNumber);
        System.out.println("📧 Email Address: " + email);
        System.out.println("🔢 OTP Code:     " + otp);
        System.out.println("⏰ Expires At:    " + expiresAt);
        System.out.println("=".repeat(60));
        System.out.println("✅ OTP is also being sent to your email!");
        System.out.println("=".repeat(60) + "\n");
    }
}
