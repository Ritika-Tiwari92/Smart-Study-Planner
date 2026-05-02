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

     /*
      * =====================================================
      * Student/User Test APIs
      * Used by: /api/tests
      * =====================================================
      */

     public List<Test> getAllTests(Long userId) {
          return testRepository.findByUserIdOrPublishedTrue(userId);
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
          prepareTestBeforeSave(test);

          return testRepository.save(test);
     }

     public Test updateTest(Long userId, Long id, Test updatedTest) {
          Test existingTest = testRepository.findByIdAndUserId(id, userId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                              "Test not found with id: " + id + " for userId: " + userId));

          copyEditableFields(existingTest, updatedTest);
          prepareTestBeforeSave(existingTest);

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

     /*
      * =====================================================
      * Admin Test APIs
      * Used by: /api/admin/tests
      * =====================================================
      */

     public List<Test> getAllAdminTests() {
          return testRepository.findAll();
     }

     public Test createAdminTest(Long adminUserId, Test test) {
          User adminUser = userRepository.findById(adminUserId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                              "Admin user not found with id: " + adminUserId));

          test.setId(null);
          test.setUser(adminUser);

          prepareTestBeforeSave(test);

          return testRepository.save(test);
     }

     public Test updateAdminTest(Long id, Test updatedTest) {
          Test existingTest = testRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException(
                              "Admin test not found with id: " + id));

          copyEditableFields(existingTest, updatedTest);
          prepareTestBeforeSave(existingTest);

          return testRepository.save(existingTest);
     }

     public void deleteAdminTest(Long id) {
          Test existingTest = testRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException(
                              "Admin test not found with id: " + id));

          if (testAttemptRepository.existsByTestId(existingTest.getId())) {
               throw new IllegalStateException(
                         "This test already has attempts/results. Unpublish or archive it instead of deleting.");
          }

          testRepository.delete(existingTest);
     }

     /*
      * =====================================================
      * Common Helpers
      * =====================================================
      */

     private void copyEditableFields(Test existingTest, Test updatedTest) {
          existingTest.setTitle(updatedTest.getTitle());
          existingTest.setSubject(updatedTest.getSubject());
          existingTest.setTestDate(updatedTest.getTestDate());
          existingTest.setTestType(updatedTest.getTestType());
          existingTest.setDuration(updatedTest.getDuration());
          existingTest.setDescription(updatedTest.getDescription());

          existingTest.setPublished(updatedTest.getPublished());
          existingTest.setAdminStatus(updatedTest.getAdminStatus());
          existingTest.setInstructions(updatedTest.getInstructions());
          existingTest.setNegativeMarking(updatedTest.getNegativeMarking());

          existingTest.setScore(updatedTest.getScore());
          existingTest.setFocusArea(updatedTest.getFocusArea());
          existingTest.setTestTip(updatedTest.getTestTip());
     }

     private void prepareTestBeforeSave(Test test) {
          if (test.getTitle() == null || test.getTitle().trim().isEmpty()) {
               throw new IllegalArgumentException("Test title is required");
          }

          test.setTitle(test.getTitle().trim());

          if (test.getSubject() != null) {
               test.setSubject(test.getSubject().trim());
          }

          if (test.getTestType() == null || test.getTestType().trim().isEmpty()) {
               test.setTestType("Upcoming");
          } else {
               test.setTestType(test.getTestType().trim());
          }

          if (test.getDuration() == null) {
               test.setDuration("");
          }

          if (test.getDescription() == null || test.getDescription().trim().isEmpty()) {
               test.setDescription("Admin managed test draft.");
          }

          if (test.getPublished() == null) {
               test.setPublished(false);
          }

          test.setAdminStatus(normalizeAdminStatus(test.getAdminStatus(), test.getPublished()));

          if (test.getNegativeMarking() == null) {
               test.setNegativeMarking(false);
          }

          /*
           * Safe default:
           * Some old database schemas keep score as NOT NULL.
           * So we store 0 instead of null to prevent save crash.
           */
          if (test.getScore() == null) {
               test.setScore(0);
          }
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