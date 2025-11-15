package com.ridesharing.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmergencySOSRequest {
    private Long rideId;
    private Double latitude;
    private Double longitude;
    private String message;
    private String alertType; // "SOS", "EMERGENCY_CALL", "PANIC_BUTTON"
}
