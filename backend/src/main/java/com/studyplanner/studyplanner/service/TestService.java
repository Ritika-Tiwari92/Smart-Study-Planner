package com.studyplanner.studyplanner.service;

import com.studyplanner.studyplanner.model.Test;
import com.studyplanner.studyplanner.repository.TestRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TestService {

     private final TestRepository testRepository;

     public TestService(TestRepository testRepository) {
          this.testRepository = testRepository;
     }

     public List<Test> getAllTests() {
          return testRepository.findAll();
     }

     public Test getTestById(Long id) {
          return testRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Test not found with id: " + id));
     }

     public Test createTest(Test test) {
          return testRepository.save(test);
     }

     public Test updateTest(Long id, Test updatedTest) {
          Test existingTest = testRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Test not found with id: " + id));

          existingTest.setTitle(updatedTest.getTitle());
          existingTest.setSubject(updatedTest.getSubject());
          existingTest.setTestDate(updatedTest.getTestDate());
          existingTest.setTestType(updatedTest.getTestType());
          existingTest.setDuration(updatedTest.getDuration());
          existingTest.setDescription(updatedTest.getDescription());
          existingTest.setScore(updatedTest.getScore());
          existingTest.setFocusArea(updatedTest.getFocusArea());
          existingTest.setTestTip(updatedTest.getTestTip());

          return testRepository.save(existingTest);
     }

     public void deleteTest(Long id) {
          Test existingTest = testRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Test not found with id: " + id));

          testRepository.delete(existingTest);
     }
}