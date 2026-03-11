package com.hms.dto;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DoctorResponse {
    private Long id;
    private String name;
    private String email;
    private String specialization;
    private String department;
    private String phone;
    private List<SlotRequest> availableSlots;
}
