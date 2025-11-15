package com.ridesharing.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmergencyAlertResponse {
    private Long alertId;
    private String status;
    private String message;
    private String trackingLink;
    private LocalDateTime trackingExpiry;
    private Boolean emailSent;
    private Boolean smsSent;
    private Boolean callInitiated;
}
