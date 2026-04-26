package com.studyplanner.studyplanner.repository;

import com.studyplanner.studyplanner.model.TestAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TestAttemptRepository extends JpaRepository<TestAttempt, Long> {

     Optional<TestAttempt> findByIdAndUserId(Long id, Long userId);

     List<TestAttempt> findByUserIdOrderByStartedAtDesc(Long userId);

     List<TestAttempt> findByUserIdAndStatusOrderBySubmittedAtDesc(Long userId, String status);

     boolean existsByTestId(Long testId);
}