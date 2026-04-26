package com.studyplanner.studyplanner.repository;

import com.studyplanner.studyplanner.model.TestQuestionOption;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TestQuestionOptionRepository extends JpaRepository<TestQuestionOption, Long> {

     void deleteByQuestionId(Long questionId);
}