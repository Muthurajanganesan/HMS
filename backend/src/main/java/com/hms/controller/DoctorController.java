package com.hms.controller;

import com.hms.dto.*;
import com.hms.model.User;
import com.hms.service.AppointmentService;
import com.hms.service.UserService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/doctor")
@CrossOrigin(origins = "http://localhost:3000")
public class DoctorController {

    private final AppointmentService appointmentService;
    private final UserService userService;

    public DoctorController(AppointmentService appointmentService, UserService userService) {
        this.appointmentService = appointmentService;
        this.userService = userService;
    }

    @GetMapping("/appointments")
    public ResponseEntity<?> getMyAppointments(@AuthenticationPrincipal User doctor) {
        return ResponseEntity.ok(appointmentService.getDoctorAppointments(doctor.getId()));
    }

    @GetMapping("/appointments/date")
    public ResponseEntity<?> getAppointmentsByDate(@AuthenticationPrincipal User doctor,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(appointmentService.getDoctorAppointmentsByDate(doctor.getId(), date));
    }

    @PatchMapping("/appointments/{id}/confirm")
    public ResponseEntity<?> confirmAppointment(@AuthenticationPrincipal User doctor,
            @PathVariable Long id) {
        try {
            return ResponseEntity.ok(appointmentService.confirmAppointment(doctor.getId(), id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/appointments/{id}/complete")
    public ResponseEntity<?> completeAppointment(@AuthenticationPrincipal User doctor,
            @PathVariable Long id) {
        try {
            return ResponseEntity.ok(appointmentService.completeAppointment(doctor.getId(), id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/slots")
    public ResponseEntity<?> addSlot(@AuthenticationPrincipal User doctor,
            @Valid @RequestBody SlotRequest request) {
        try {
            return ResponseEntity.ok(userService.addSlot(doctor.getId(), request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/slots")
    public ResponseEntity<?> getMySlots(@AuthenticationPrincipal User doctor) {
        return ResponseEntity.ok(userService.getDoctorSlots(doctor.getId()));
    }

    @DeleteMapping("/slots/{slotId}")
    public ResponseEntity<?> removeSlot(@AuthenticationPrincipal User doctor,
            @PathVariable Long slotId) {
        try {
            userService.removeSlot(doctor.getId(), slotId);
            return ResponseEntity.ok(Map.of("message", "Slot removed successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
