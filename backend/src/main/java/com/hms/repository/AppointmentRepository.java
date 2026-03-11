package com.hms.repository;

import com.hms.model.Appointment;
import com.hms.model.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByPatientId(Long patientId);

    List<Appointment> findByDoctorId(Long doctorId);

    List<Appointment> findByDoctorIdAndAppointmentDate(Long doctorId, LocalDate date);

    // Check for overlapping appointments for a doctor
    @Query("SELECT a FROM Appointment a WHERE a.doctor.id = :doctorId " +
            "AND a.appointmentDate = :date " +
            "AND a.status != 'CANCELLED' " +
            "AND ((a.startTime < :endTime AND a.endTime > :startTime))")
    List<Appointment> findOverlappingDoctorAppointments(
            @Param("doctorId") Long doctorId,
            @Param("date") LocalDate date,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime);

    // Check for overlapping appointments for a patient
    @Query("SELECT a FROM Appointment a WHERE a.patient.id = :patientId " +
            "AND a.appointmentDate = :date " +
            "AND a.status != 'CANCELLED' " +
            "AND ((a.startTime < :endTime AND a.endTime > :startTime))")
    List<Appointment> findOverlappingPatientAppointments(
            @Param("patientId") Long patientId,
            @Param("date") LocalDate date,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime);

    // Count appointments per doctor
    @Query("SELECT a.doctor.name, COUNT(a) FROM Appointment a GROUP BY a.doctor.id, a.doctor.name")
    List<Object[]> countAppointmentsPerDoctor();

    // Revenue per department
    @Query("SELECT a.doctor.department, COUNT(a), COALESCE(SUM(a.fee), 0) FROM Appointment a " +
            "WHERE a.status != 'CANCELLED' GROUP BY a.doctor.department")
    List<Object[]> revenuePerDepartment();

    // All appointments
    List<Appointment> findByStatus(AppointmentStatus status);

    // Appointments by date range
    @Query("SELECT a FROM Appointment a WHERE a.appointmentDate BETWEEN :startDate AND :endDate")
    List<Appointment> findByDateRange(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}
