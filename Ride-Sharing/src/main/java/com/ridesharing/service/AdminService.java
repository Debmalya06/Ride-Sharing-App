package com.ridesharing.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ridesharing.dto.AdminLoginDto;
import com.ridesharing.dto.AdminProfileDto;
import com.ridesharing.dto.ApiResponse;
import com.ridesharing.entity.Admin;
import com.ridesharing.exception.UserNotFoundException;
import com.ridesharing.repository.AdminRepository;
import com.ridesharing.security.JwtTokenProvider;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final AdminRepository adminRepository;
    private final JwtTokenProvider jwtTokenProvider;

    @Transactional
    public ApiResponse authenticateAdmin(AdminLoginDto loginDto) {
        try {
            // Find admin by email
            Admin admin = adminRepository.findByEmailAndIsActiveTrue(loginDto.getEmail())
                    .orElseThrow(() -> new UserNotFoundException("Invalid admin credentials"));

            // Verify password (plain text comparison)
            if (!loginDto.getPassword().equals(admin.getPassword())) {
                throw new UserNotFoundException("Invalid admin credentials");
            }

            // Update last login
            adminRepository.updateLastLogin(admin.getId(), LocalDateTime.now());

            // Generate tokens
            String accessToken = jwtTokenProvider.generateAdminToken(admin.getEmail(), admin.getId());
            String refreshToken = jwtTokenProvider.generateAdminRefreshToken(admin.getEmail());

            // Prepare response
            Map<String, Object> response = new HashMap<>();
            response.put("accessToken", accessToken);
            response.put("refreshToken", refreshToken);
            response.put("tokenType", "Bearer");
            response.put("expiresIn", jwtTokenProvider.getJwtExpirationInMs() / 1000);
            response.put("admin", convertToDto(admin));

            log.info("Admin login successful for email: {}", admin.getEmail());
            return new ApiResponse("SUCCESS", "Admin login successful", response);

        } catch (Exception e) {
            log.error("Admin login failed: {}", e.getMessage());
            throw new UserNotFoundException("Invalid admin credentials");
        }
    }

    public ApiResponse getAdminProfile(String email) {
        Admin admin = adminRepository.findByEmailAndIsActiveTrue(email)
                .orElseThrow(() -> new UserNotFoundException("Admin not found"));

        return new ApiResponse("SUCCESS", "Admin profile retrieved successfully", convertToDto(admin));
    }

    private AdminProfileDto convertToDto(Admin admin) {
        AdminProfileDto dto = new AdminProfileDto();
        dto.setId(admin.getId());
        dto.setEmail(admin.getEmail());
        dto.setFirstName(admin.getFirstName());
        dto.setLastName(admin.getLastName());
        dto.setIsActive(admin.getIsActive());
        dto.setCreatedAt(admin.getCreatedAt());
        dto.setLastLogin(admin.getLastLogin());
        return dto;
    }
}