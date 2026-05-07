package com.studyplanner.studyplanner.controller;

import com.studyplanner.studyplanner.dto.RecentTestResultDto;
import com.studyplanner.studyplanner.dto.StartTestResponseDto;
import com.studyplanner.studyplanner.dto.SubmitTestRequestDto;
import com.studyplanner.studyplanner.dto.SubmitTestResponseDto;
import com.studyplanner.studyplanner.dto.TestAttemptDetailsDto;
import com.studyplanner.studyplanner.dto.TestHistoryItemDto;
import com.studyplanner.studyplanner.dto.TestQuestionCreateRequestDto;
import com.studyplanner.studyplanner.model.TestQuestion;
import com.studyplanner.studyplanner.security.JwtUtil;
import com.studyplanner.studyplanner.service.TestEngineService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * TestEngineController — JWT based
 *
 * IMPORTANT:
 * userId is no longer accepted from URL/query params.
 * Every endpoint extracts userId from Bearer token.
 *
 * This keeps exam start, submit, result history, and question access user-safe.
 */
@RestController
@RequestMapping("/api/tests")
@CrossOrigin(origins = "*")
public class TestEngineController {

     private final TestEngineService testEngineService;
     private final JwtUtil jwtUtil;

     public TestEngineController(TestEngineService testEngineService, JwtUtil jwtUtil) {
          this.testEngineService = testEngineService;
          this.jwtUtil = jwtUtil;
     }

     private Long extractUserId(String authHeader) {
          if (authHeader == null || !authHeader.startsWith("Bearer ")) {
               throw new RuntimeException("Missing or invalid Authorization header");
          }

          return jwtUtil.extractUserId(authHeader.substring(7).trim());
     }

     /**
      * Add question to a test.
      * Later this can be moved to /api/admin/tests if you want strict admin-only
      * question management.
      */
     @PostMapping("/{testId}/questions")
     public ResponseEntity<TestQuestion> addQuestionToTest(
               @RequestHeader("Authorization") String authHeader,
               @PathVariable Long testId,
               @RequestBody TestQuestionCreateRequestDto request) {

          Long userId = extractUserId(authHeader);
          return ResponseEntity.ok(testEngineService.createQuestion(userId, testId, request));
     }

     /**
      * Get questions for a test.
      */
     @GetMapping("/{testId}/questions")
     public ResponseEntity<List<TestQuestion>> getQuestionsByTest(
               @RequestHeader("Authorization") String authHeader,
               @PathVariable Long testId) {

          Long userId = extractUserId(authHeader);
          return ResponseEntity.ok(testEngineService.getQuestionsByTest(userId, testId));
     }

     /**
      * Start test attempt.
      */
     @PostMapping("/{testId}/start")
     public ResponseEntity<StartTestResponseDto> startTest(
               @RequestHeader("Authorization") String authHeader,
               @PathVariable Long testId) {

          Long userId = extractUserId(authHeader);
          return ResponseEntity.ok(testEngineService.startTest(userId, testId));
     }

     /**
      * Submit test attempt.
      */
     @PostMapping("/attempts/{attemptId}/submit")
     public ResponseEntity<SubmitTestResponseDto> submitTest(
               @RequestHeader("Authorization") String authHeader,
               @PathVariable Long attemptId,
               @RequestBody SubmitTestRequestDto request) {

          Long userId = extractUserId(authHeader);
          return ResponseEntity.ok(testEngineService.submitTest(userId, attemptId, request));
     }

     /**
      * Recent submitted test results.
      */
     @GetMapping("/attempts/recent")
     public ResponseEntity<List<RecentTestResultDto>> getRecentResults(
               @RequestHeader("Authorization") String authHeader) {

          Long userId = extractUserId(authHeader);
          return ResponseEntity.ok(testEngineService.getRecentResults(userId));
     }

     /**
      * Full test history.
      */
     @GetMapping("/attempts/history")
     public ResponseEntity<List<TestHistoryItemDto>> getTestHistory(
               @RequestHeader("Authorization") String authHeader) {

          Long userId = extractUserId(authHeader);
          return ResponseEntity.ok(testEngineService.getTestHistory(userId));
     }

     /**
      * Attempt details for result/review page.
      */
     @GetMapping("/attempts/{attemptId}")
     public ResponseEntity<TestAttemptDetailsDto> getAttemptDetails(
               @RequestHeader("Authorization") String authHeader,
               @PathVariable Long attemptId) {

          Long userId = extractUserId(authHeader);
          return ResponseEntity.ok(testEngineService.getAttemptDetails(userId, attemptId));
     }

     /**
      * Update question.
      */
     @PutMapping("/{testId}/questions/{questionId}")
     public ResponseEntity<TestQuestion> updateQuestion(
               @RequestHeader("Authorization") String authHeader,
               @PathVariable Long testId,
               @PathVariable Long questionId,
               @RequestBody TestQuestionCreateRequestDto request) {

          Long userId = extractUserId(authHeader);
          return ResponseEntity.ok(testEngineService.updateQuestion(userId, testId, questionId, request));
     }

     /**
      * Delete question.
      */
     @DeleteMapping("/{testId}/questions/{questionId}")
     public ResponseEntity<String> deleteQuestion(
               @RequestHeader("Authorization") String authHeader,
               @PathVariable Long testId,
               @PathVariable Long questionId) {

          Long userId = extractUserId(authHeader);
          testEngineService.deleteQuestion(userId, testId, questionId);

          return ResponseEntity.ok("Question deleted successfully");
     }
}