package com.studyplanner.studyplanner.repository;

import com.studyplanner.studyplanner.model.TestAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TestAttemptRepository extends JpaRepository<TestAttempt, Long> {

     List<TestAttempt> findByUserIdOrderByStartedAtDesc(Long userId);

     List<TestAttempt> findByUserIdAndStatusOrderBySubmittedAtDesc(Long userId, String status);

     List<TestAttempt> findByTestIdAndUserIdOrderByStartedAtDesc(Long testId, Long userId);

     Optional<TestAttempt> findByIdAndUserId(Long attemptId, Long userId);
}