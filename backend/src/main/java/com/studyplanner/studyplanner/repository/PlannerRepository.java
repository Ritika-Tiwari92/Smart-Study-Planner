package com.studyplanner.studyplanner.repository;

import com.studyplanner.studyplanner.model.Planner;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface PlannerRepository extends JpaRepository<Planner, Long> {

     List<Planner> findByUserId(Long userId);

     Optional<Planner> findByIdAndUserId(Long id, Long userId);

     boolean existsByUserIdAndTitleAndSubjectAndDate(
               Long userId,
               String title,
               String subject,
               LocalDate date);
}