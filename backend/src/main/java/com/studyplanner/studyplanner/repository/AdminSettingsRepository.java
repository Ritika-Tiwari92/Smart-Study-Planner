package com.studyplanner.studyplanner.repository;

import com.studyplanner.studyplanner.model.AdminSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AdminSettingsRepository extends JpaRepository<AdminSettings, Long> {

     Optional<AdminSettings> findByAdminId(Long adminId);

     boolean existsByAdminId(Long adminId);
}