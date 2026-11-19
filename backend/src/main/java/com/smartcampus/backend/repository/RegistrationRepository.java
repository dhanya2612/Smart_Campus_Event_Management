package com.smartcampus.backend.repository;

import com.smartcampus.backend.model.Registration;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RegistrationRepository
        extends JpaRepository<Registration, Long> {

    boolean existsByStudent_IdAndEvent_Id(
        Long studentId, Long eventId
    );

    long countByEvent_Id(Long eventId);

    List<Registration> findByEvent_Id(Long eventId);

    List<Registration> findByStudent_Id(Long studentId);
}