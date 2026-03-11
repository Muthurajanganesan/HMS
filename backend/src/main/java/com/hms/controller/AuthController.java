package com.hms.controller;

import com.hms.dto.*;
import com.hms.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            AuthResponse response = userService.register(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            AuthResponse response = userService.login(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/validate")
    public ResponseEntity<?> validateToken(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("valid", false, "error", "No token provided"));
        }
        String token = authHeader.substring(7);
        Map<String, Object> result = userService.validateToken(token);
        if ((boolean) result.get("valid")) {
            return ResponseEntity.ok(result);
        }
        return ResponseEntity.status(401).body(Map.of("valid", false, "error", "Token expired or invalid"));
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

    // Handle validation errors globally for this controller
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidationErrors(MethodArgumentNotValidException ex) {
        Map<String, Object> errors = new HashMap<>();
        String firstError = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(Collectors.joining(", "));
        errors.put("error", firstError);
        errors.put("validationErrors", ex.getBindingResult().getFieldErrors().stream()
                .collect(Collectors.toMap(
                        error -> error.getField(),
                        error -> error.getDefaultMessage(),
                        (a, b) -> a
                )));
        return ResponseEntity.badRequest().body(errors);
    }
}
