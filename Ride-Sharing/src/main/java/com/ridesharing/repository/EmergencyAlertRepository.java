package com.ridesharing.repository;

import com.ridesharing.entity.EmergencyAlert;
import com.ridesharing.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EmergencyAlertRepository extends JpaRepository<EmergencyAlert, Long> {
    List<EmergencyAlert> findByUser(User user);
    List<EmergencyAlert> findByStatus(EmergencyAlert.AlertStatus status);
    List<EmergencyAlert> findByUserAndStatus(User user, EmergencyAlert.AlertStatus status);
    List<EmergencyAlert> findByCreatedAtAfter(LocalDateTime dateTime);
    List<EmergencyAlert> findByStatusAndCreatedAtAfter(EmergencyAlert.AlertStatus status, LocalDateTime dateTime);
}
