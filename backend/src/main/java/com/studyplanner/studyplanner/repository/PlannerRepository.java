package com.studyplanner.studyplanner.repository;

import com.studyplanner.studyplanner.model.Planner;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PlannerRepository extends JpaRepository<Planner, Long> {

     List<Planner> findByUserId(Long userId);

     Optional<Planner> findByIdAndUserId(Long id, Long userId);
}