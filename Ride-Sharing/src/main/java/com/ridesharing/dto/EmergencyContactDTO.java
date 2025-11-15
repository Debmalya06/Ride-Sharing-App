package com.ridesharing.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmergencyContactDTO {
    private Long id;
    private Long userId;
    private String contactName;
    private String contactPhone;
    private String contactEmail;
    private String relationship;
    private Boolean isPrimary;
}
