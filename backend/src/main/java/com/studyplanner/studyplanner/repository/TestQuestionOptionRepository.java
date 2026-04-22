package com.studyplanner.studyplanner.repository;

import com.studyplanner.studyplanner.model.TestQuestionOption;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TestQuestionOptionRepository extends JpaRepository<TestQuestionOption, Long> {

     List<TestQuestionOption> findByQuestionIdOrderByOptionLabelAsc(Long questionId);

     void deleteByQuestionId(Long questionId);
}