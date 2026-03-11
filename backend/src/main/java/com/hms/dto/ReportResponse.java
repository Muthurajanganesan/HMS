package com.hms.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportResponse {
    private String label;
    private Long count;
    private Double revenue;
}
