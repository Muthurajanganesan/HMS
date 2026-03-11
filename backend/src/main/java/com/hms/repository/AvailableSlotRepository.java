package com.hms.repository;

import com.hms.model.AvailableSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface AvailableSlotRepository extends JpaRepository<AvailableSlot, Long> {
    List<AvailableSlot> findByDoctorId(Long doctorId);

    List<AvailableSlot> findByDoctorIdAndDate(Long doctorId, LocalDate date);

    void deleteByDoctorIdAndId(Long doctorId, Long slotId);
}
