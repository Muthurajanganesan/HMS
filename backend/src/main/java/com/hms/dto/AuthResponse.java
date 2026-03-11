package com.hms.dto;

import com.hms.model.Role;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {
    private String token;
    private Long userId;
    private String name;
    private String email;
    private Role role;
    private long expiresIn;
    private long issuedAt;
}
