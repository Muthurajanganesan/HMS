package com.hms.config;

import com.hms.model.*;
import com.hms.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalTime;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final AvailableSlotRepository slotRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
            DepartmentRepository departmentRepository,
            AvailableSlotRepository slotRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.slotRepository = slotRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0)
            return;

        // Create departments
        departmentRepository.save(Department.builder().name("Cardiology").description("Heart and cardiovascular system")
                .active(true).build());
        departmentRepository.save(
                Department.builder().name("Neurology").description("Brain and nervous system").active(true).build());
        departmentRepository
                .save(Department.builder().name("Orthopedics").description("Bones and joints").active(true).build());
        departmentRepository.save(
                Department.builder().name("Dermatology").description("Skin related treatments").active(true).build());
        departmentRepository
                .save(Department.builder().name("Pediatrics").description("Children healthcare").active(true).build());

        // Create admin
        userRepository.save(User.builder()
                .name("Admin User")
                .email("admin@hms.com")
                .password(passwordEncoder.encode("Admin@123"))
                .role(Role.ADMIN)
                .phone("9876543210")
                .build());

        // Create doctors
        User doc1 = userRepository.save(User.builder()
                .name("Dr. Rajesh Kumar")
                .email("rajesh@hms.com")
                .password(passwordEncoder.encode("Doctor@123"))
                .role(Role.DOCTOR)
                .specialization("Cardiologist")
                .department("Cardiology")
                .phone("9876543211")
                .build());

        User doc2 = userRepository.save(User.builder()
                .name("Dr. Priya Sharma")
                .email("priya@hms.com")
                .password(passwordEncoder.encode("Doctor@123"))
                .role(Role.DOCTOR)
                .specialization("Neurologist")
                .department("Neurology")
                .phone("9876543212")
                .build());

        User doc3 = userRepository.save(User.builder()
                .name("Dr. Arun Patel")
                .email("arun@hms.com")
                .password(passwordEncoder.encode("Doctor@123"))
                .role(Role.DOCTOR)
                .specialization("Orthopedic Surgeon")
                .department("Orthopedics")
                .phone("9876543213")
                .build());

        // Create doctor availability slots for next 7 days
        LocalDate today = LocalDate.now();
        for (int i = 0; i < 7; i++) {
            LocalDate date = today.plusDays(i);

            slotRepository.save(AvailableSlot.builder().doctor(doc1).date(date)
                    .startTime(LocalTime.of(9, 0)).endTime(LocalTime.of(12, 0)).build());
            slotRepository.save(AvailableSlot.builder().doctor(doc1).date(date)
                    .startTime(LocalTime.of(14, 0)).endTime(LocalTime.of(17, 0)).build());

            slotRepository.save(AvailableSlot.builder().doctor(doc2).date(date)
                    .startTime(LocalTime.of(10, 0)).endTime(LocalTime.of(13, 0)).build());
            slotRepository.save(AvailableSlot.builder().doctor(doc2).date(date)
                    .startTime(LocalTime.of(15, 0)).endTime(LocalTime.of(18, 0)).build());

            slotRepository.save(AvailableSlot.builder().doctor(doc3).date(date)
                    .startTime(LocalTime.of(8, 0)).endTime(LocalTime.of(11, 0)).build());
            slotRepository.save(AvailableSlot.builder().doctor(doc3).date(date)
                    .startTime(LocalTime.of(13, 0)).endTime(LocalTime.of(16, 0)).build());
        }

        // Create a patient
        userRepository.save(User.builder()
                .name("Patient Demo")
                .email("patient@hms.com")
                .password(passwordEncoder.encode("Patient@123"))
                .role(Role.PATIENT)
                .phone("9876543220")
                .build());

        System.out.println("=== Sample Data Initialized ===");
        System.out.println("Admin: admin@hms.com / Admin@123");
        System.out.println("Doctor: rajesh@hms.com / Doctor@123");
        System.out.println("Doctor: priya@hms.com / Doctor@123");
        System.out.println("Doctor: arun@hms.com / Doctor@123");
        System.out.println("Patient: patient@hms.com / Patient@123");
    }
}
