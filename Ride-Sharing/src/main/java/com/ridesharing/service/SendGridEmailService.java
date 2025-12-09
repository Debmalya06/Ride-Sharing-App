package com.ridesharing.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

/**
 * SendGrid Email Service for OTP delivery using HTTP API
 * Works reliably on cloud hosting platforms like Render
 */
@Service
public class SendGridEmailService {

    private static final Logger logger = LoggerFactory.getLogger(SendGridEmailService.class);

    @Value("${sendgrid.api.key:}")
    private String sendGridApiKey;

    @Value("${sendgrid.from.email:noreply@smartride.com}")
    private String fromEmail;

    @Value("${sendgrid.from.name:SmartRide}")
    private String fromName;

    /**
     * Send OTP email using SendGrid HTTP API
     */
    public void sendOtpEmail(String toEmail, String phoneNumber, String otp) {
        try {
            // Check if SendGrid API key is configured
            if (sendGridApiKey == null || sendGridApiKey.isEmpty()) {
                logger.warn("⚠️ SendGrid API key not configured. Skipping email send.");
                return;
            }

            logger.info("📧 Sending OTP via SendGrid HTTP API to: {}", toEmail);

            // Create email content
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
                        .otp-code { font-size: 32px; font-weight: bold; color: #FFC107; letter-spacing: 5px; }
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

            // Create JSON payload for SendGrid API
            // Properly escape the HTML content for JSON
            String escapedHtml = htmlContent
                .replace("\\", "\\\\")  // Escape backslashes first
                .replace("\"", "\\\"")  // Escape quotes
                .replace("\n", "\\n")   // Escape newlines
                .replace("\r", "\\r")   // Escape carriage returns
                .replace("\t", "\\t");  // Escape tabs
            
            String jsonPayload = String.format(
                """
                {
                  "personalizations": [
                    {
                      "to": [{"email": "%s"}]
                    }
                  ],
                  "from": {"email": "%s", "name": "%s"},
                  "subject": "🔐 SmartRide OTP Verification - %s",
                  "content": [
                    {
                      "type": "text/html",
                      "value": "%s"
                    }
                  ]
                }
                """, 
                toEmail,
                fromEmail,
                fromName,
                otp,
                escapedHtml
            );

            // Make HTTP POST request to SendGrid
            URL url = new URL("https://api.sendgrid.com/v3/mail/send");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Authorization", "Bearer " + sendGridApiKey);
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setDoOutput(true);
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(10000);

            // Write request body
            byte[] payload = jsonPayload.getBytes(StandardCharsets.UTF_8);
            try (OutputStream os = conn.getOutputStream()) {
                os.write(payload, 0, payload.length);
            }

            // Get response
            int statusCode = conn.getResponseCode();
            if (statusCode >= 200 && statusCode < 300) {
                logger.info("✅ OTP email sent successfully via SendGrid HTTP API to: {}", toEmail);
            } else {
                try {
                    String errorResponse = conn.getErrorStream() != null ? 
                        new String(conn.getErrorStream().readAllBytes()) : 
                        "No error details";
                    logger.error("❌ SendGrid API error. Status: {}, Body: {}", statusCode, errorResponse);
                } catch (Exception e) {
                    logger.error("❌ SendGrid API error. Status: {}", statusCode);
                }
                throw new RuntimeException("SendGrid API returned status: " + statusCode);
            }

        } catch (Exception e) {
            logger.error("❌ Error sending OTP email via SendGrid: {}", e.getMessage());
            throw new RuntimeException("Failed to send OTP email via SendGrid: " + e.getMessage());
        }
    }

    /**
     * Check if SendGrid is configured
     */
    public boolean isSendGridConfigured() {
        return sendGridApiKey != null && !sendGridApiKey.isEmpty();
    }
}
