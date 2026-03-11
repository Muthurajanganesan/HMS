package com.hms.dto;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SlotRequest {
    private LocalDate date;
    private LocalTime startTime;
    private LocalTime endTime;
}
