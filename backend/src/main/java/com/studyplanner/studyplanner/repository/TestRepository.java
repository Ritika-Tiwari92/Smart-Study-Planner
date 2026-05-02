package com.studyplanner.studyplanner.repository;

import com.studyplanner.studyplanner.model.Test;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TestRepository extends JpaRepository<Test, Long> {

     List<Test> findByUserId(Long userId);

     Optional<Test> findByIdAndUserId(Long id, Long userId);

     // ADD THIS — published tests for students
     List<Test> findByPublishedTrue();

     // ADD THIS — user's own tests + all published tests
     List<Test> findByUserIdOrPublishedTrue(Long userId);
}