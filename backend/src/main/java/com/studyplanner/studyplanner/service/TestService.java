package com.studyplanner.studyplanner.service;

import com.studyplanner.studyplanner.exception.ResourceNotFoundException;
import com.studyplanner.studyplanner.model.Test;
import com.studyplanner.studyplanner.model.User;
import com.studyplanner.studyplanner.repository.TestRepository;
import com.studyplanner.studyplanner.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TestService {

     private final TestRepository testRepository;
     private final UserRepository userRepository;

     public TestService(TestRepository testRepository, UserRepository userRepository) {
          this.testRepository = testRepository;
          this.userRepository = userRepository;
     }

     public List<Test> getAllTests(Long userId) {
          return testRepository.findByUserId(userId);
     }

     public Test getTestById(Long userId, Long id) {
          return testRepository.findByIdAndUserId(id, userId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                              "Test not found with id: " + id + " for userId: " + userId));
     }

     public Test createTest(Long userId, Test test) {
          User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

          test.setUser(user);
          return testRepository.save(test);
     }

     public Test updateTest(Long userId, Long id, Test updatedTest) {
          Test existingTest = testRepository.findByIdAndUserId(id, userId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                              "Test not found with id: " + id + " for userId: " + userId));

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

     public void deleteTest(Long userId, Long id) {
          Test existingTest = testRepository.findByIdAndUserId(id, userId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                              "Test not found with id: " + id + " for userId: " + userId));

          testRepository.delete(existingTest);
     }
}