package com.hms.controller;

import com.hms.dto.*;
import com.hms.model.Department;
import com.hms.model.User;
import com.hms.repository.DepartmentRepository;
import com.hms.service.AppointmentService;
import com.hms.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")

public class AdminController {

    private final AppointmentService appointmentService;
    private final UserService userService;
    private final DepartmentRepository departmentRepository;

    public AdminController(AppointmentService appointmentService,
            UserService userService,
            DepartmentRepository departmentRepository) {
        this.appointmentService = appointmentService;
        this.userService = userService;
        this.departmentRepository = departmentRepository;
    }

    // ====== APPOINTMENT MANAGEMENT ======
    @GetMapping("/appointments")
    public ResponseEntity<?> getAllAppointments() {
        return ResponseEntity.ok(appointmentService.getAllAppointments());
    }

    @PatchMapping("/appointments/{id}/cancel")
    public ResponseEntity<?> cancelAppointment(@AuthenticationPrincipal User admin,
            @PathVariable Long id) {
        try {
            return ResponseEntity.ok(appointmentService.cancelAppointment(id, admin));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ====== REPORTS ======
    @GetMapping("/reports/appointments-per-doctor")
    public ResponseEntity<?> appointmentsPerDoctor() {
        return ResponseEntity.ok(appointmentService.getAppointmentsPerDoctor());
    }

    @GetMapping("/reports/revenue-per-department")
    public ResponseEntity<?> revenuePerDepartment() {
        return ResponseEntity.ok(appointmentService.getRevenuePerDepartment());
    }

    // ====== DEPARTMENT MANAGEMENT ======
    @GetMapping("/departments")
    public ResponseEntity<?> getAllDepartments() {
        return ResponseEntity.ok(departmentRepository.findAll());
    }

    @PostMapping("/departments")
    public ResponseEntity<?> createDepartment(@RequestBody Department department) {
        try {
            if (departmentRepository.existsByName(department.getName())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Department already exists"));
            }
            return ResponseEntity.ok(departmentRepository.save(department));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/departments/{id}")
    public ResponseEntity<?> updateDepartment(@PathVariable Long id, @RequestBody Department dept) {
        try {
            Department existing = departmentRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Department not found"));
            existing.setName(dept.getName());
            existing.setDescription(dept.getDescription());
            existing.setActive(dept.getActive());
            return ResponseEntity.ok(departmentRepository.save(existing));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/departments/{id}")
    public ResponseEntity<?> deleteDepartment(@PathVariable Long id) {
        try {
            departmentRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Department deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ====== DOCTOR MANAGEMENT ======
    @GetMapping("/doctors")
    public ResponseEntity<?> getAllDoctors() {
        return ResponseEntity.ok(userService.getAllDoctors());
    }
}
