package com.studyplanner.studyplanner.controller;

import com.studyplanner.studyplanner.dto.RecentTestResultDto;
import com.studyplanner.studyplanner.dto.StartTestResponseDto;
import com.studyplanner.studyplanner.dto.SubmitTestRequestDto;
import com.studyplanner.studyplanner.dto.SubmitTestResponseDto;
import com.studyplanner.studyplanner.dto.TestAttemptDetailsDto;
import com.studyplanner.studyplanner.dto.TestHistoryItemDto;
import com.studyplanner.studyplanner.dto.TestQuestionCreateRequestDto;
import com.studyplanner.studyplanner.model.TestQuestion;
import com.studyplanner.studyplanner.service.TestEngineService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tests")
@CrossOrigin(origins = "*")
public class TestEngineController {

     private final TestEngineService testEngineService;

     public TestEngineController(TestEngineService testEngineService) {
          this.testEngineService = testEngineService;
     }

     @PostMapping("/{testId}/questions")
     public TestQuestion addQuestionToTest(@PathVariable Long testId,
               @RequestParam Long userId,
               @RequestBody TestQuestionCreateRequestDto request) {
          return testEngineService.createQuestion(userId, testId, request);
     }

     @GetMapping("/{testId}/questions")
     public List<TestQuestion> getQuestionsByTest(@PathVariable Long testId,
               @RequestParam Long userId) {
          return testEngineService.getQuestionsByTest(userId, testId);
     }

     @PostMapping("/{testId}/start")
     public StartTestResponseDto startTest(@PathVariable Long testId,
               @RequestParam Long userId) {
          return testEngineService.startTest(userId, testId);
     }

     @PostMapping("/attempts/{attemptId}/submit")
     public SubmitTestResponseDto submitTest(@PathVariable Long attemptId,
               @RequestParam Long userId,
               @RequestBody SubmitTestRequestDto request) {
          return testEngineService.submitTest(userId, attemptId, request);
     }

     @GetMapping("/attempts/recent")
     public List<RecentTestResultDto> getRecentResults(@RequestParam Long userId) {
          return testEngineService.getRecentResults(userId);
     }

     @GetMapping("/attempts/history")
     public List<TestHistoryItemDto> getTestHistory(@RequestParam Long userId) {
          return testEngineService.getTestHistory(userId);
     }

     @GetMapping("/attempts/{attemptId}")
     public TestAttemptDetailsDto getAttemptDetails(@PathVariable Long attemptId,
               @RequestParam Long userId) {
          return testEngineService.getAttemptDetails(userId, attemptId);
     }

     @PutMapping("/{testId}/questions/{questionId}")
     public TestQuestion updateQuestion(@PathVariable Long testId,
               @PathVariable Long questionId,
               @RequestParam Long userId,
               @RequestBody TestQuestionCreateRequestDto request) {
          return testEngineService.updateQuestion(userId, testId, questionId, request);
     }

     @DeleteMapping("/{testId}/questions/{questionId}")
     public String deleteQuestion(@PathVariable Long testId,
               @PathVariable Long questionId,
               @RequestParam Long userId) {
          testEngineService.deleteQuestion(userId, testId, questionId);
          return "Question deleted successfully";
     }
}