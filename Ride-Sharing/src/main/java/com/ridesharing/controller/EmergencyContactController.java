package com.ridesharing.controller;

import com.ridesharing.dto.EmergencyContactDTO;
import com.ridesharing.security.JwtTokenProvider;
import com.ridesharing.service.EmergencyContactService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/emergency/contacts")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class EmergencyContactController {
    
    private final EmergencyContactService emergencyContactService;
    private final JwtTokenProvider jwtTokenProvider;
    
    private Long getUserIdFromRequest(HttpServletRequest request) {
        String token = extractTokenFromRequest(request);
        return jwtTokenProvider.getUserIdFromJWT(token);
    }
    
    private String extractTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        throw new RuntimeException("No valid JWT token found in request");
    }
    
    @PostMapping
    public ResponseEntity<?> addEmergencyContact(
            HttpServletRequest request,
            @RequestBody EmergencyContactDTO contactDTO) {
        try {
            Long userId = getUserIdFromRequest(request);
            EmergencyContactDTO created = emergencyContactService.addEmergencyContact(userId, contactDTO);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
    
    @GetMapping
    public ResponseEntity<?> getMyEmergencyContacts(HttpServletRequest request) {
        try {
            Long userId = getUserIdFromRequest(request);
            List<EmergencyContactDTO> contacts = emergencyContactService.getUserEmergencyContacts(userId);
            return ResponseEntity.ok(contacts);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
    
    @PutMapping("/{contactId}")
    public ResponseEntity<?> updateEmergencyContact(
            HttpServletRequest request,
            @PathVariable Long contactId,
            @RequestBody EmergencyContactDTO contactDTO) {
        try {
            Long userId = getUserIdFromRequest(request);
            EmergencyContactDTO updated = emergencyContactService.updateEmergencyContact(userId, contactId, contactDTO);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
    
    @DeleteMapping("/{contactId}")
    public ResponseEntity<?> deleteEmergencyContact(
            HttpServletRequest request,
            @PathVariable Long contactId) {
        try {
            Long userId = getUserIdFromRequest(request);
            emergencyContactService.deleteEmergencyContact(userId, contactId);
            return ResponseEntity.ok("Emergency contact deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
}
