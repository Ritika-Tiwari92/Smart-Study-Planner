package com.studyplanner.studyplanner.repository;

import com.studyplanner.studyplanner.model.Planner;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlannerRepository extends JpaRepository<Planner, Long> {
}