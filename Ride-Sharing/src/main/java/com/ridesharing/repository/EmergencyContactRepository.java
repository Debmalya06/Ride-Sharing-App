package com.ridesharing.repository;

import com.ridesharing.entity.EmergencyContact;
import com.ridesharing.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmergencyContactRepository extends JpaRepository<EmergencyContact, Long> {
    List<EmergencyContact> findByUser(User user);
    List<EmergencyContact> findByUserAndIsPrimary(User user, Boolean isPrimary);
    void deleteByUserAndId(User user, Long id);
}
