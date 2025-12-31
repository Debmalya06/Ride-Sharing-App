package com.ridesharing.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.ridesharing.dto.ApiResponse;

@RestController
@RequestMapping("/api/health")
public class HealthCheckController {

    @GetMapping("/status")
    public ResponseEntity<ApiResponse> getStatus() {
        try {
            ApiResponse response = new ApiResponse("SUCCESS", "Service is running", "OK");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse("ERROR", e.getMessage(), null));
        }
    }

    @GetMapping("/ping")
    public ResponseEntity<String> ping() {
        return ResponseEntity.ok("pong");
    }

    @GetMapping("/live")
    public ResponseEntity<ApiResponse> liveness() {
        ApiResponse response = new ApiResponse("SUCCESS", "Service is alive", "OK");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/ready")
    public ResponseEntity<ApiResponse> readiness() {
        ApiResponse response = new ApiResponse("SUCCESS", "Service is ready", "OK");
        return ResponseEntity.ok(response);
    }
}
