package com.hms.service;

import com.hms.dto.*;
import com.hms.model.*;
import com.hms.repository.UserRepository;
import com.hms.repository.AvailableSlotRepository;
import com.hms.security.JwtUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final AvailableSlotRepository slotRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    // Brute-force protection: track failed login attempts per email
    private final Map<String, Integer> failedAttempts = new ConcurrentHashMap<>();
    private final Map<String, Long> lockoutTime = new ConcurrentHashMap<>();
    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final long LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

    public UserService(UserRepository userRepository, AvailableSlotRepository slotRepository,
            PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.slotRepository = slotRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        // Sanitize input
        String sanitizedName = sanitizeInput(request.getName());
        String sanitizedEmail = request.getEmail().toLowerCase().trim();

        User user = User.builder()
                .name(sanitizedName)
                .email(sanitizedEmail)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .specialization(request.getSpecialization() != null ? sanitizeInput(request.getSpecialization()) : null)
                .department(request.getDepartment() != null ? sanitizeInput(request.getDepartment()) : null)
                .phone(request.getPhone())
                .build();

        user = userRepository.save(user);

        long now = System.currentTimeMillis();
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name(), user.getId());

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .expiresIn(jwtExpiration)
                .issuedAt(now)
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().toLowerCase().trim();

        // Check if account is locked out
        if (isAccountLocked(email)) {
            long remainingMs = lockoutTime.get(email) + LOCKOUT_DURATION_MS - System.currentTimeMillis();
            long remainingMin = (remainingMs / 60000) + 1;
            throw new RuntimeException("Account temporarily locked due to too many failed attempts. Try again in " + remainingMin + " minutes.");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    recordFailedAttempt(email);
                    return new RuntimeException("Invalid email or password");
                });

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            recordFailedAttempt(email);
            int remaining = MAX_FAILED_ATTEMPTS - failedAttempts.getOrDefault(email, 0);
            if (remaining <= 0) {
                throw new RuntimeException("Account temporarily locked due to too many failed attempts. Try again in 15 minutes.");
            }
            throw new RuntimeException("Invalid email or password. " + remaining + " attempts remaining.");
        }

        // Successful login - clear failed attempts
        clearFailedAttempts(email);

        long now = System.currentTimeMillis();
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name(), user.getId());

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .expiresIn(jwtExpiration)
                .issuedAt(now)
                .build();
    }

    public Map<String, Object> validateToken(String token) {
        if (jwtUtil.validateToken(token)) {
            String email = jwtUtil.extractEmail(token);
            String role = jwtUtil.extractRole(token);
            Long userId = jwtUtil.extractUserId(token);
            return Map.of(
                    "valid", true,
                    "email", email,
                    "role", role,
                    "userId", userId
            );
        }
        return Map.of("valid", false);
    }

    // --- Brute force protection helpers ---

    private boolean isAccountLocked(String email) {
        Long lockedAt = lockoutTime.get(email);
        if (lockedAt == null) return false;
        if (System.currentTimeMillis() - lockedAt > LOCKOUT_DURATION_MS) {
            // Lockout expired
            lockoutTime.remove(email);
            failedAttempts.remove(email);
            return false;
        }
        return true;
    }

    private void recordFailedAttempt(String email) {
        int attempts = failedAttempts.getOrDefault(email, 0) + 1;
        failedAttempts.put(email, attempts);
        if (attempts >= MAX_FAILED_ATTEMPTS) {
            lockoutTime.put(email, System.currentTimeMillis());
        }
    }

    private void clearFailedAttempts(String email) {
        failedAttempts.remove(email);
        lockoutTime.remove(email);
    }

    // --- Input sanitization ---

    private String sanitizeInput(String input) {
        if (input == null) return null;
        return input.replaceAll("[<>\"'&]", "").trim();
    }

    // --- Doctor methods (unchanged) ---

    public List<DoctorResponse> getAllDoctors() {
        return userRepository.findByRole(Role.DOCTOR).stream()
                .map(this::toDoctorResponse)
                .collect(Collectors.toList());
    }

    public List<DoctorResponse> searchDoctors(String query, String type) {
        List<User> doctors;
        switch (type.toLowerCase()) {
            case "specialization":
                doctors = userRepository.findByRoleAndSpecializationContainingIgnoreCase(Role.DOCTOR, query);
                break;
            case "department":
                doctors = userRepository.findByRoleAndDepartmentContainingIgnoreCase(Role.DOCTOR, query);
                break;
            case "name":
            default:
                doctors = userRepository.findByRoleAndNameContainingIgnoreCase(Role.DOCTOR, query);
                break;
        }
        return doctors.stream().map(this::toDoctorResponse).collect(Collectors.toList());
    }

    public DoctorResponse getDoctorById(Long id) {
        User doctor = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        if (doctor.getRole() != Role.DOCTOR) {
            throw new RuntimeException("User is not a doctor");
        }
        return toDoctorResponse(doctor);
    }

    @Transactional
    public DoctorResponse addSlot(Long doctorId, SlotRequest slotRequest) {
        User doctor = userRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        if (slotRequest.getStartTime().isAfter(slotRequest.getEndTime()) ||
                slotRequest.getStartTime().equals(slotRequest.getEndTime())) {
            throw new RuntimeException("Start time must be before end time");
        }

        AvailableSlot slot = AvailableSlot.builder()
                .date(slotRequest.getDate())
                .startTime(slotRequest.getStartTime())
                .endTime(slotRequest.getEndTime())
                .doctor(doctor)
                .build();

        slotRepository.save(slot);
        return toDoctorResponse(userRepository.findById(doctorId).get());
    }

    @Transactional
    public void removeSlot(Long doctorId, Long slotId) {
        slotRepository.deleteById(slotId);
    }

    public List<SlotRequest> getDoctorSlots(Long doctorId) {
        return slotRepository.findByDoctorId(doctorId).stream()
                .map(slot -> SlotRequest.builder()
                        .date(slot.getDate())
                        .startTime(slot.getStartTime())
                        .endTime(slot.getEndTime())
                        .build())
                .collect(Collectors.toList());
    }

    private DoctorResponse toDoctorResponse(User doctor) {
        List<SlotRequest> slots = slotRepository.findByDoctorId(doctor.getId()).stream()
                .map(slot -> SlotRequest.builder()
                        .date(slot.getDate())
                        .startTime(slot.getStartTime())
                        .endTime(slot.getEndTime())
                        .build())
                .collect(Collectors.toList());

        return DoctorResponse.builder()
                .id(doctor.getId())
                .name(doctor.getName())
                .email(doctor.getEmail())
                .specialization(doctor.getSpecialization())
                .department(doctor.getDepartment())
                .phone(doctor.getPhone())
                .availableSlots(slots)
                .build();
    }
}
