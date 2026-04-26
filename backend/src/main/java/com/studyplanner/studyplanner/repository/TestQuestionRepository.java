package com.studyplanner.studyplanner.repository;

import com.studyplanner.studyplanner.model.TestQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TestQuestionRepository extends JpaRepository<TestQuestion, Long> {

     List<TestQuestion> findByTestIdOrderByQuestionOrderAsc(Long testId);

     Optional<TestQuestion> findByIdAndTestId(Long id, Long testId);
}