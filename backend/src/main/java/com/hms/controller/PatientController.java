package com.hms.controller;

import com.hms.dto.*;
import com.hms.model.User;
import com.hms.service.AppointmentService;
import com.hms.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/patient")
@CrossOrigin(origins = "http://localhost:3000")
public class PatientController {

    private final AppointmentService appointmentService;
    private final UserService userService;

    public PatientController(AppointmentService appointmentService, UserService userService) {
        this.appointmentService = appointmentService;
        this.userService = userService;
    }

    @GetMapping("/doctors")
    public ResponseEntity<?> getAllDoctors() {
        return ResponseEntity.ok(userService.getAllDoctors());
    }

    @GetMapping("/doctors/search")
    public ResponseEntity<?> searchDoctors(@RequestParam String query,
            @RequestParam(defaultValue = "name") String type) {
        return ResponseEntity.ok(userService.searchDoctors(query, type));
    }

    @GetMapping("/doctors/{id}")
    public ResponseEntity<?> getDoctorById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(userService.getDoctorById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/appointments")
    public ResponseEntity<?> bookAppointment(@AuthenticationPrincipal User patient,
            @Valid @RequestBody AppointmentRequest request) {
        try {
            return ResponseEntity.ok(appointmentService.bookAppointment(patient.getId(), request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/appointments")
    public ResponseEntity<?> getMyAppointments(@AuthenticationPrincipal User patient) {
        return ResponseEntity.ok(appointmentService.getPatientAppointments(patient.getId()));
    }

    @PatchMapping("/appointments/{id}/cancel")
    public ResponseEntity<?> cancelAppointment(@AuthenticationPrincipal User patient,
            @PathVariable Long id) {
        try {
            return ResponseEntity.ok(appointmentService.cancelAppointment(id, patient));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
