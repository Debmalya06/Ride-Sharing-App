package com.ridesharing.service;

import com.ridesharing.dto.EmergencyContactDTO;
import com.ridesharing.entity.EmergencyContact;
import com.ridesharing.entity.User;
import com.ridesharing.repository.EmergencyContactRepository;
import com.ridesharing.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmergencyContactService {
    
    private final EmergencyContactRepository emergencyContactRepository;
    private final UserRepository userRepository;
    
    @Transactional
    public EmergencyContactDTO addEmergencyContact(Long userId, EmergencyContactDTO dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        EmergencyContact contact = new EmergencyContact();
        contact.setUser(user);
        contact.setContactName(dto.getContactName());
        contact.setContactPhone(dto.getContactPhone());
        contact.setContactEmail(dto.getContactEmail());
        contact.setRelationship(dto.getRelationship());
        contact.setIsPrimary(dto.getIsPrimary() != null ? dto.getIsPrimary() : false);
        
        EmergencyContact saved = emergencyContactRepository.save(contact);
        return toDTO(saved);
    }
    
    public List<EmergencyContactDTO> getUserEmergencyContacts(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        return emergencyContactRepository.findByUser(user)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    public List<EmergencyContact> getPrimaryContacts(User user) {
        return emergencyContactRepository.findByUserAndIsPrimary(user, true);
    }
    
    public List<EmergencyContact> getAllContactsForUser(User user) {
        return emergencyContactRepository.findByUser(user);
    }
    
    @Transactional
    public void deleteEmergencyContact(Long userId, Long contactId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        emergencyContactRepository.deleteByUserAndId(user, contactId);
    }
    
    @Transactional
    public EmergencyContactDTO updateEmergencyContact(Long userId, Long contactId, EmergencyContactDTO dto) {
        userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        EmergencyContact contact = emergencyContactRepository.findById(contactId)
                .orElseThrow(() -> new RuntimeException("Emergency contact not found"));
        
        if (!contact.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized access");
        }
        
        contact.setContactName(dto.getContactName());
        contact.setContactPhone(dto.getContactPhone());
        contact.setContactEmail(dto.getContactEmail());
        contact.setRelationship(dto.getRelationship());
        contact.setIsPrimary(dto.getIsPrimary());
        
        EmergencyContact updated = emergencyContactRepository.save(contact);
        return toDTO(updated);
    }
    
    private EmergencyContactDTO toDTO(EmergencyContact contact) {
        EmergencyContactDTO dto = new EmergencyContactDTO();
        dto.setId(contact.getId());
        dto.setUserId(contact.getUser().getId());
        dto.setContactName(contact.getContactName());
        dto.setContactPhone(contact.getContactPhone());
        dto.setContactEmail(contact.getContactEmail());
        dto.setRelationship(contact.getRelationship());
        dto.setIsPrimary(contact.getIsPrimary());
        return dto;
    }
}
