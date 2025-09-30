package com.ridesharing.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.ridesharing.dto.AdminLoginDto;
import com.ridesharing.dto.ApiResponse;
import com.ridesharing.security.JwtTokenProvider;
import com.ridesharing.service.AdminService;
import com.ridesharing.service.DriverDetailService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final DriverDetailService driverDetailService;
    private final JwtTokenProvider jwtTokenProvider;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse> adminLogin(@Valid @RequestBody AdminLoginDto loginDto) {
        try {
            ApiResponse response = adminService.authenticateAdmin(loginDto);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse("ERROR", e.getMessage(), null));
        }
    }

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse> getAdminProfile(HttpServletRequest request) {
        try {
            String token = extractTokenFromRequest(request);
            String email = jwtTokenProvider.getSubjectFromJWT(token);
            
            ApiResponse response = adminService.getAdminProfile(email);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse("ERROR", e.getMessage(), null));
        }
    }

    @GetMapping("/drivers")
    public ResponseEntity<ApiResponse> getAllDriverDetails() {
        try {
            ApiResponse response = driverDetailService.getAllDriverDetails();
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse("ERROR", e.getMessage(), null));
        }
    }

    @GetMapping("/drivers/pending")
    public ResponseEntity<ApiResponse> getPendingDriverDetails() {
        try {
            ApiResponse response = driverDetailService.getPendingDriverDetails();
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse("ERROR", e.getMessage(), null));
        }
    }

    private String extractTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        throw new RuntimeException("No valid JWT token found");
    }
}