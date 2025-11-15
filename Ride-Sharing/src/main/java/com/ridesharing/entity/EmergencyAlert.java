package com.ridesharing.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "emergency_alerts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmergencyAlert {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @ManyToOne
    @JoinColumn(name = "ride_id")
    private Ride ride;
    
    @Column(name = "latitude")
    private Double latitude;
    
    @Column(name = "longitude")
    private Double longitude;
    
    @Column(name = "location_link", length = 500)
    private String locationLink;
    
    @Column(name = "tracking_link", length = 500)
    private String trackingLink;
    
    @Column(name = "tracking_expiry")
    private LocalDateTime trackingExpiry;
    
    @Column(name = "alert_type")
    @Enumerated(EnumType.STRING)
    private AlertType alertType;
    
    @Column(name = "status")
    @Enumerated(EnumType.STRING)
    private AlertStatus status = AlertStatus.ACTIVE;
    
    @Column(name = "message", length = 1000)
    private String message;
    
    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;
    
    @Column(name = "resolved_by")
    private Long resolvedBy;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    public enum AlertType {
        SOS, EMERGENCY_CALL, PANIC_BUTTON
    }
    
    public enum AlertStatus {
        ACTIVE, RESOLVED, FALSE_ALARM
    }
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = AlertStatus.ACTIVE;
        }
        // Set tracking link expiry to 1 hour from now
        trackingExpiry = LocalDateTime.now().plusHours(1);
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
