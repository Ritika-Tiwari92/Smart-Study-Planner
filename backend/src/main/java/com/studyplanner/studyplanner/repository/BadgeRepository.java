package com.studyplanner.studyplanner.repository;

import com.studyplanner.studyplanner.model.Badge;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BadgeRepository extends JpaRepository<Badge, Long> {

     Optional<Badge> findByRuleType(String ruleType);
}