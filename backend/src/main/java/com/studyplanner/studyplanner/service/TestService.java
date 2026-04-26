package com.studyplanner.studyplanner.service;

import com.studyplanner.studyplanner.exception.ResourceNotFoundException;
import com.studyplanner.studyplanner.model.Test;
import com.studyplanner.studyplanner.model.User;
import com.studyplanner.studyplanner.repository.TestAttemptRepository;
import com.studyplanner.studyplanner.repository.TestRepository;
import com.studyplanner.studyplanner.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TestService {

     private final TestRepository testRepository;
     private final UserRepository userRepository;
     private final TestAttemptRepository testAttemptRepository;

     public TestService(TestRepository testRepository,
               UserRepository userRepository,
               TestAttemptRepository testAttemptRepository) {
          this.testRepository = testRepository;
          this.userRepository = userRepository;
          this.testAttemptRepository = testAttemptRepository;
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

          if (test.getPublished() == null) {
               test.setPublished(false);
          }

          if (test.getAdminStatus() == null || test.getAdminStatus().trim().isEmpty()) {
               test.setAdminStatus(Boolean.TRUE.equals(test.getPublished()) ? "PUBLISHED" : "DRAFT");
          }

          if (test.getNegativeMarking() == null) {
               test.setNegativeMarking(false);
          }

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

          existingTest.setPublished(
                    updatedTest.getPublished() != null ? updatedTest.getPublished() : existingTest.getPublished());

          existingTest.setAdminStatus(
                    normalizeAdminStatus(updatedTest.getAdminStatus(), existingTest.getPublished()));

          existingTest.setInstructions(updatedTest.getInstructions());

          existingTest.setNegativeMarking(
                    updatedTest.getNegativeMarking() != null
                              ? updatedTest.getNegativeMarking()
                              : existingTest.getNegativeMarking());

          return testRepository.save(existingTest);
     }

     public void deleteTest(Long userId, Long id) {
          Test existingTest = testRepository.findByIdAndUserId(id, userId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                              "Test not found with id: " + id + " for userId: " + userId));

          if (testAttemptRepository.existsByTestId(existingTest.getId())) {
               throw new IllegalStateException(
                         "This test already has attempts/results. Unpublish or archive it instead of deleting.");
          }

          testRepository.delete(existingTest);
     }

     private String normalizeAdminStatus(String adminStatus, Boolean published) {
          if (adminStatus == null || adminStatus.trim().isEmpty()) {
               return Boolean.TRUE.equals(published) ? "PUBLISHED" : "DRAFT";
          }

          String normalized = adminStatus.trim().toUpperCase();

          if ("PUBLISHED".equals(normalized)) {
               return "PUBLISHED";
          }

          return "DRAFT";
     }
}