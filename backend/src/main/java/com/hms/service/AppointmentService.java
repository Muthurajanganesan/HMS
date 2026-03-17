package com.hms.service;

import com.hms.dto.*;
import com.hms.model.*;
import com.hms.repository.AppointmentRepository;
import com.hms.repository.AvailableSlotRepository;
import com.hms.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final AvailableSlotRepository slotRepository;

    public AppointmentService(AppointmentRepository appointmentRepository,
            UserRepository userRepository,
            AvailableSlotRepository slotRepository) {
        this.appointmentRepository = appointmentRepository;
        this.userRepository = userRepository;
        this.slotRepository = slotRepository;
    }

    @Transactional
    public AppointmentResponse bookAppointment(Long patientId, AppointmentRequest request) {
        // Validate patient
        User patient = userRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found"));
        if (patient.getRole() != Role.PATIENT) {
            throw new RuntimeException("Only patients can book appointments");
        }

        // Validate doctor
        User doctor = userRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        if (doctor.getRole() != Role.DOCTOR) {
            throw new RuntimeException("Selected user is not a doctor");
        }

        // Validate time
        if (request.getStartTime().isAfter(request.getEndTime()) ||
                request.getStartTime().equals(request.getEndTime())) {
            throw new RuntimeException("Start time must be before end time");
        }

        // Check doctor availability
        List<AvailableSlot> doctorSlots = slotRepository.findByDoctorIdAndDate(
                request.getDoctorId(), request.getAppointmentDate());
        boolean isAvailable = doctorSlots.stream()
                .anyMatch(slot -> !request.getStartTime().isBefore(slot.getStartTime()) &&
                        !request.getEndTime().isAfter(slot.getEndTime()));
        if (!isAvailable) {
            throw new RuntimeException("Doctor is not available at the requested time");
        }

        // Check overlapping doctor appointments
        List<Appointment> doctorOverlaps = appointmentRepository.findOverlappingDoctorAppointments(
                request.getDoctorId(), request.getAppointmentDate(),
                request.getStartTime(), request.getEndTime());
        if (!doctorOverlaps.isEmpty()) {
            throw new RuntimeException("Doctor has a conflicting appointment at this time");
        }

        // Check overlapping patient appointments
        List<Appointment> patientOverlaps = appointmentRepository.findOverlappingPatientAppointments(
                patientId, request.getAppointmentDate(),
                request.getStartTime(), request.getEndTime());
        if (!patientOverlaps.isEmpty()) {
            throw new RuntimeException("You already have an appointment at this time");
        }

        // Create appointment
        Appointment appointment = Appointment.builder()
                .patient(patient)
                .doctor(doctor)
                .appointmentDate(request.getAppointmentDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .status(AppointmentStatus.BOOKED)
                .fee(request.getFee() != null ? request.getFee() : 500.0)
                .build();

        appointment = appointmentRepository.save(appointment);
        return toResponse(appointment);
    }

    // Only DOCTOR can confirm
    @Transactional
    public AppointmentResponse confirmAppointment(Long doctorId, Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        if (!appointment.getDoctor().getId().equals(doctorId)) {
            throw new RuntimeException("Only the assigned doctor can confirm this appointment");
        }

        if (appointment.getStatus() != AppointmentStatus.BOOKED) {
            throw new RuntimeException("Only BOOKED appointments can be confirmed");
        }

        appointment.setStatus(AppointmentStatus.CONFIRMED);
        appointment = appointmentRepository.save(appointment);
        return toResponse(appointment);
    }

    // DOCTOR can complete
    @Transactional
    public AppointmentResponse completeAppointment(Long doctorId, Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        if (!appointment.getDoctor().getId().equals(doctorId)) {
            throw new RuntimeException("Only the assigned doctor can complete this appointment");
        }

        if (appointment.getStatus() != AppointmentStatus.CONFIRMED) {
            throw new RuntimeException("Only CONFIRMED appointments can be completed");
        }

        appointment.setStatus(AppointmentStatus.COMPLETED);
        appointment = appointmentRepository.save(appointment);
        return toResponse(appointment);
    }

    // Only ADMIN can cancel after confirmation
    @Transactional
    public AppointmentResponse cancelAppointment(Long appointmentId, User currentUser) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        if (appointment.getStatus() == AppointmentStatus.CONFIRMED &&
                currentUser.getRole() != Role.ADMIN) {
            throw new RuntimeException("Only ADMIN can cancel confirmed appointments");
        }

        if (appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new RuntimeException("Cannot cancel completed appointments");
        }

        // Patients can cancel their own BOOKED appointments
        if (currentUser.getRole() == Role.PATIENT &&
                !appointment.getPatient().getId().equals(currentUser.getId())) {
            throw new RuntimeException("You can only cancel your own appointments");
        }

        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointment = appointmentRepository.save(appointment);
        return toResponse(appointment);
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getPatientAppointments(Long patientId) {
        return appointmentRepository.findByPatientId(patientId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getDoctorAppointments(Long doctorId) {
        return appointmentRepository.findByDoctorId(doctorId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getDoctorAppointmentsByDate(Long doctorId, LocalDate date) {
        return appointmentRepository.findByDoctorIdAndAppointmentDate(doctorId, date).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getAllAppointments() {
        return appointmentRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // Aggregation: Appointments per doctor
    public List<ReportResponse> getAppointmentsPerDoctor() {
        return appointmentRepository.countAppointmentsPerDoctor().stream()
                .map(row -> ReportResponse.builder()
                        .label((String) row[0])
                        .count((Long) row[1])
                        .build())
                .collect(Collectors.toList());
    }

    // Aggregation: Revenue per department
    public List<ReportResponse> getRevenuePerDepartment() {
        return appointmentRepository.revenuePerDepartment().stream()
                .map(row -> ReportResponse.builder()
                        .label((String) row[0])
                        .count((Long) row[1])
                        .revenue(((Number) row[2]).doubleValue())
                        .build())
                .collect(Collectors.toList());
    }

    private AppointmentResponse toResponse(Appointment a) {
        return AppointmentResponse.builder()
                .id(a.getId())
                .patientId(a.getPatient().getId())
                .patientName(a.getPatient().getName())
                .doctorId(a.getDoctor().getId())
                .doctorName(a.getDoctor().getName())
                .doctorSpecialization(a.getDoctor().getSpecialization())
                .department(a.getDoctor().getDepartment())
                .appointmentDate(a.getAppointmentDate())
                .startTime(a.getStartTime())
                .endTime(a.getEndTime())
                .status(a.getStatus())
                .createdAt(a.getCreatedAt())
                .fee(a.getFee())
                .build();
    }
}
