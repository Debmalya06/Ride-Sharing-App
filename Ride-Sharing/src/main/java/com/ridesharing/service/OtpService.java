package com.ridesharing.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class OtpService {

    private final OtpEmailService otpEmailService;

    /**
     * Constructor with dependency injection
     * OtpService now delegates to OtpEmailService for all OTP operations
     * OTP is sent via Email using SMTP
     */
    public OtpService(OtpEmailService otpEmailService) {
        this.otpEmailService = otpEmailService;
    }

    /**
     * Generate a random OTP
     */
    public String generateOtp() {
        return otpEmailService.generateOtp();
    }

    /**
     * Generate and send OTP via Email (SMTP)
     * Also prints OTP to console for development testing
     * @param phoneNumber Phone number in any format (10 digits or international format)
     * @param email Email address to send OTP to
     */
    public void generateAndSendOtp(String phoneNumber, String email) {
        otpEmailService.generateAndSendOtp(phoneNumber, email);
    }

    /**
     * Verify OTP entered by user
     * @param phoneNumber Phone number in any format
     * @param otp 6-digit OTP code
     * @return true if OTP is valid and matches, false otherwise
     */
    public boolean verifyOtp(String phoneNumber, String otp) {
        return otpEmailService.verifyOtp(phoneNumber, otp);
    }

    /**
     * Clean up expired OTPs from database
     * This is typically called by a scheduled task
     */
    public void cleanupExpiredOtps() {
        otpEmailService.cleanupExpiredOtps();
    }

    /**
     * Check if user can send OTP (rate limiting)
     * Prevents abuse by limiting to 5 OTPs per hour
     * @param phoneNumber Phone number in any format
     * @return true if user can send OTP, false if rate limit exceeded
     */
    public boolean canSendOtp(String phoneNumber) {
        return otpEmailService.canSendOtp(phoneNumber);
    }
}