package com.studyplanner.studyplanner.repository;

import com.studyplanner.studyplanner.model.TestAnswer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TestAnswerRepository extends JpaRepository<TestAnswer, Long> {

     List<TestAnswer> findByAttemptId(Long attemptId);

     void deleteByAttemptId(Long attemptId);
}
