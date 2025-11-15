package com.ridesharing.controller;

import com.ridesharing.dto.EmergencyAlertResponse;
import com.ridesharing.dto.EmergencySOSRequest;
import com.ridesharing.entity.EmergencyAlert;
import com.ridesharing.security.JwtTokenProvider;
import com.ridesharing.service.EmergencySOSService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/emergency")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class EmergencySOSController {
    
    private final EmergencySOSService emergencySOSService;
    private final JwtTokenProvider jwtTokenProvider;
    
    @PostMapping("/sos")
    public ResponseEntity<?> triggerSOS(
            HttpServletRequest request,
            @RequestBody EmergencySOSRequest sosRequest) {
        try {
            // Extract JWT token from Authorization header
            String token = extractTokenFromRequest(request);
            Long userId = jwtTokenProvider.getUserIdFromJWT(token);
            
            EmergencyAlertResponse response = emergencySOSService.triggerSOS(userId, sosRequest);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", e.getMessage(),
                "message", "Failed to trigger emergency alert: " + e.getMessage(),
                "status", "FAILED"
            ));
        }
    }
    
    private String extractTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        throw new RuntimeException("No valid JWT token found in request");
    }
    
    @GetMapping("/alerts/active")
    public ResponseEntity<?> getActiveAlerts(Authentication authentication) {
        try {
            // Only admins should access this - add role check if needed
            List<EmergencyAlert> alerts = emergencySOSService.getActiveAlerts();
            return ResponseEntity.ok(alerts);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
    
    @GetMapping("/alerts/recent")
    public ResponseEntity<?> getRecentAlerts(
            Authentication authentication,
            @RequestParam(defaultValue = "24") int hours) {
        try {
            List<EmergencyAlert> alerts = emergencySOSService.getRecentAlerts(hours);
            return ResponseEntity.ok(alerts);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
    
    @PostMapping("/alerts/{alertId}/resolve")
    public ResponseEntity<?> resolveAlert(
            Authentication authentication,
            @PathVariable Long alertId) {
        try {
            Long adminId = Long.parseLong(authentication.getName());
            emergencySOSService.resolveAlert(alertId, adminId);
            return ResponseEntity.ok(Map.of("message", "Alert resolved successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
    
    // TwiML endpoint for Twilio voice calls
    @GetMapping(value = "/twiml", produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<String> getTwiML(
            @RequestParam String userName,
            @RequestParam String location) {
        String twiml = emergencySOSService.generateTwiML(userName, location);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_XML)
                .body(twiml);
    }
}
