package com.hms.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Email is required")
    @Column(unique = true)
    private String email;

    @NotBlank(message = "Password is required")
    private String password;

    @NotNull(message = "Role is required")
    @Enumerated(EnumType.STRING)
    private Role role;

    private String specialization;

    private String department;

    private String phone;

    @OneToMany(mappedBy = "doctor", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<AvailableSlot> availableSlots = new ArrayList<>();

    public void addSlot(AvailableSlot slot) {
        availableSlots.add(slot);
        slot.setDoctor(this);
    }

    public void removeSlot(AvailableSlot slot) {
        availableSlots.remove(slot);
        slot.setDoctor(null);
    }
}
