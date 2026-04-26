package com.studyplanner.studyplanner.service;

import com.studyplanner.studyplanner.dto.RecentTestResultDto;
import com.studyplanner.studyplanner.dto.StartTestQuestionDto;
import com.studyplanner.studyplanner.dto.StartTestQuestionOptionDto;
import com.studyplanner.studyplanner.dto.StartTestResponseDto;
import com.studyplanner.studyplanner.dto.SubmitTestRequestDto;
import com.studyplanner.studyplanner.dto.SubmitTestResponseDto;
import com.studyplanner.studyplanner.dto.SubmittedAnswerDto;
import com.studyplanner.studyplanner.dto.TestAttemptAnswerDto;
import com.studyplanner.studyplanner.dto.TestAttemptDetailsDto;
import com.studyplanner.studyplanner.dto.TestHistoryItemDto;
import com.studyplanner.studyplanner.dto.TestQuestionCreateRequestDto;
import com.studyplanner.studyplanner.dto.TestQuestionOptionDto;
import com.studyplanner.studyplanner.exception.ResourceNotFoundException;
import com.studyplanner.studyplanner.model.Test;
import com.studyplanner.studyplanner.model.TestAnswer;
import com.studyplanner.studyplanner.model.TestAttempt;
import com.studyplanner.studyplanner.model.TestQuestion;
import com.studyplanner.studyplanner.model.TestQuestionOption;
import com.studyplanner.studyplanner.repository.TestAnswerRepository;
import com.studyplanner.studyplanner.repository.TestAttemptRepository;
import com.studyplanner.studyplanner.repository.TestQuestionRepository;
import com.studyplanner.studyplanner.repository.TestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class TestEngineService {

     private static final Set<String> STOP_WORDS = new HashSet<>(Arrays.asList(
               "the", "is", "are", "was", "were", "a", "an", "and", "or", "of", "to", "in", "on",
               "for", "with", "by", "as", "at", "from", "that", "this", "it", "be", "into", "than"));

     private final TestRepository testRepository;
     private final TestQuestionRepository testQuestionRepository;
     private final TestAttemptRepository testAttemptRepository;
     private final TestAnswerRepository testAnswerRepository;

     public TestEngineService(TestRepository testRepository,
               TestQuestionRepository testQuestionRepository,
               TestAttemptRepository testAttemptRepository,
               TestAnswerRepository testAnswerRepository) {
          this.testRepository = testRepository;
          this.testQuestionRepository = testQuestionRepository;
          this.testAttemptRepository = testAttemptRepository;
          this.testAnswerRepository = testAnswerRepository;
     }

     public TestQuestion createQuestion(Long userId, Long testId, TestQuestionCreateRequestDto request) {
          Test test = getOwnedTest(userId, testId);

          validateQuestionRequest(request);

          TestQuestion question = new TestQuestion();
          question.setTest(test);
          question.setQuestionText(request.getQuestionText().trim());
          question.setQuestionType(normalizeQuestionType(request.getQuestionType()));
          question.setCorrectAnswer(normalizeNullableText(request.getCorrectAnswer()));
          question.setMarks(normalizeMarks(request.getMarks()));
          question.setFocusTopic(normalizeNullableText(request.getFocusTopic()));
          question.setQuestionOrder(resolveQuestionOrder(testId, request.getQuestionOrder()));

          List<TestQuestionOption> optionEntities = buildOptionEntities(question, request.getOptions());
          question.setOptions(optionEntities);

          return testQuestionRepository.save(question);
     }

     @Transactional(readOnly = true)
     public List<TestQuestion> getQuestionsByTest(Long userId, Long testId) {
          Test test = getOwnedTest(userId, testId);
          return testQuestionRepository.findByTestIdOrderByQuestionOrderAsc(test.getId());
     }

     @Transactional
     public TestQuestion updateQuestion(Long userId, Long testId, Long questionId,
               TestQuestionCreateRequestDto request) {

          Test test = getOwnedTest(userId, testId);
          validateQuestionRequest(request);

          TestQuestion existingQuestion = testQuestionRepository.findByIdAndTestId(questionId, test.getId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                              "Question not found with id: " + questionId + " for testId: " + testId));

          existingQuestion.setQuestionText(request.getQuestionText().trim());
          existingQuestion.setQuestionType(normalizeQuestionType(request.getQuestionType()));
          existingQuestion.setCorrectAnswer(normalizeNullableText(request.getCorrectAnswer()));
          existingQuestion.setMarks(normalizeMarks(request.getMarks()));
          existingQuestion.setFocusTopic(normalizeNullableText(request.getFocusTopic()));

          if (request.getQuestionOrder() != null && request.getQuestionOrder() > 0) {
               existingQuestion.setQuestionOrder(request.getQuestionOrder());
          }

          if (existingQuestion.getOptions() == null) {
               existingQuestion.setOptions(new ArrayList<>());
          } else {
               existingQuestion.getOptions().clear();
          }

          if ("MCQ".equalsIgnoreCase(request.getQuestionType())
                    && request.getOptions() != null
                    && !request.getOptions().isEmpty()) {

               for (TestQuestionOptionDto optionDto : request.getOptions()) {
                    if (optionDto == null) {
                         continue;
                    }

                    String optionLabel = optionDto.getOptionLabel() == null
                              ? ""
                              : optionDto.getOptionLabel().trim();

                    String optionText = optionDto.getOptionText() == null
                              ? ""
                              : optionDto.getOptionText().trim();

                    if (optionLabel.isEmpty() || optionText.isEmpty()) {
                         continue;
                    }

                    TestQuestionOption option = new TestQuestionOption();
                    option.setQuestion(existingQuestion);
                    option.setOptionLabel(optionLabel.toUpperCase());
                    option.setOptionText(optionText);

                    existingQuestion.getOptions().add(option);
               }
          }

          return testQuestionRepository.save(existingQuestion);
     }

     @Transactional
     public StartTestResponseDto startTest(Long userId, Long testId) {
          Test test = getOwnedTest(userId, testId);

          List<TestQuestion> questions = testQuestionRepository.findByTestIdOrderByQuestionOrderAsc(testId);
          if (questions.isEmpty()) {
               throw new IllegalArgumentException("Cannot start test because no questions were found for this test.");
          }

          TestAttempt attempt = new TestAttempt();
          attempt.setTest(test);
          attempt.setUser(test.getUser());
          attempt.setStatus("STARTED");
          attempt.setTotalQuestions(questions.size());
          attempt.setAnsweredQuestions(0);
          attempt.setCorrectAnswers(0);
          attempt.setScore(0);
          attempt.setPercentage(0);

          TestAttempt savedAttempt = testAttemptRepository.save(attempt);

          StartTestResponseDto response = new StartTestResponseDto();
          response.setAttemptId(savedAttempt.getId());
          response.setTestId(test.getId());
          response.setTitle(test.getTitle());
          response.setSubject(test.getSubject());
          response.setTestType(test.getTestType());
          response.setDuration(test.getDuration());
          response.setDescription(test.getDescription());
          response.setTotalQuestions(questions.size());
          response.setQuestions(mapQuestionsForStart(questions));

          return response;
     }

     @Transactional
     public SubmitTestResponseDto submitTest(Long userId, Long attemptId, SubmitTestRequestDto request) {
          TestAttempt attempt = getOwnedAttempt(userId, attemptId);

          if ("SUBMITTED".equalsIgnoreCase(attempt.getStatus())) {
               throw new IllegalArgumentException("This test attempt has already been submitted.");
          }

          Test test = attempt.getTest();
          List<TestQuestion> questions = testQuestionRepository.findByTestIdOrderByQuestionOrderAsc(test.getId());

          if (questions.isEmpty()) {
               throw new IllegalArgumentException("Cannot submit test because no questions were found.");
          }

          Map<Long, String> submittedAnswerMap = extractSubmittedAnswers(questions, request);

          int totalQuestions = questions.size();
          int answeredQuestions = 0;
          int correctAnswers = 0;
          int totalMarks = 0;
          int earnedMarks = 0;

          Map<String, Integer> weakTopicCounts = new HashMap<>();
          List<TestAnswer> answersToSave = new ArrayList<>();

          testAnswerRepository.deleteByAttemptId(attemptId);

          for (TestQuestion question : questions) {
               int questionMarks = normalizeMarks(question.getMarks());
               totalMarks += questionMarks;

               String submittedAnswer = normalizeNullableText(submittedAnswerMap.get(question.getId()));
               if (submittedAnswer != null) {
                    answeredQuestions++;
               }

               ScoreResult scoreResult = evaluateQuestion(question, submittedAnswer);

               TestAnswer answer = new TestAnswer();
               answer.setAttempt(attempt);
               answer.setQuestion(question);
               answer.setSubmittedAnswer(submittedAnswer);
               answer.setIsCorrect(scoreResult.isCorrect());
               answer.setMarksAwarded(scoreResult.getMarksAwarded());
               answersToSave.add(answer);

               earnedMarks += scoreResult.getMarksAwarded();

               if (scoreResult.isCorrect()) {
                    correctAnswers++;
               } else {
                    incrementWeakTopic(weakTopicCounts, question.getFocusTopic());
               }
          }

          testAnswerRepository.saveAll(answersToSave);

          int percentage = totalMarks > 0
                    ? (int) Math.round((earnedMarks * 100.0) / totalMarks)
                    : 0;

          String focusArea = buildFocusArea(weakTopicCounts);
          String testTip = buildTestTip(percentage, focusArea);

          attempt.setSubmittedAt(LocalDateTime.now());
          attempt.setStatus("SUBMITTED");
          attempt.setTotalQuestions(totalQuestions);
          attempt.setAnsweredQuestions(answeredQuestions);
          attempt.setCorrectAnswers(correctAnswers);
          attempt.setScore(earnedMarks);
          attempt.setPercentage(percentage);
          attempt.setFocusArea(focusArea);
          attempt.setTestTip(testTip);

          testAttemptRepository.save(attempt);

          test.setScore(percentage);
          test.setFocusArea(focusArea);
          test.setTestTip(testTip);
          test.setTestType("Completed");
          testRepository.save(test);

          SubmitTestResponseDto response = new SubmitTestResponseDto();
          response.setAttemptId(attempt.getId());
          response.setTestId(test.getId());
          response.setTitle(test.getTitle());
          response.setTotalQuestions(totalQuestions);
          response.setAnsweredQuestions(answeredQuestions);
          response.setCorrectAnswers(correctAnswers);
          response.setTotalMarks(totalMarks);
          response.setScore(earnedMarks);
          response.setPercentage(percentage);
          response.setFocusArea(focusArea);
          response.setTestTip(testTip);
          response.setStatus(attempt.getStatus());

          return response;
     }

     @Transactional(readOnly = true)
     public List<RecentTestResultDto> getRecentResults(Long userId) {
          List<TestAttempt> submittedAttempts = testAttemptRepository
                    .findByUserIdAndStatusOrderBySubmittedAtDesc(userId, "SUBMITTED");

          List<RecentTestResultDto> results = new ArrayList<>();

          for (TestAttempt attempt : submittedAttempts) {
               if (attempt.getSubmittedAt() == null) {
                    continue;
               }

               RecentTestResultDto dto = new RecentTestResultDto();
               dto.setAttemptId(attempt.getId());
               dto.setTestId(attempt.getTest().getId());
               dto.setTitle(attempt.getTest().getTitle());
               dto.setSubject(attempt.getTest().getSubject());
               dto.setPercentage(attempt.getPercentage());
               dto.setScore(attempt.getScore());
               dto.setFocusArea(attempt.getFocusArea());
               dto.setTestTip(attempt.getTestTip());
               dto.setSubmittedAt(attempt.getSubmittedAt());

               results.add(dto);

               if (results.size() == 5) {
                    break;
               }
          }

          return results;
     }

     @Transactional(readOnly = true)
     public List<TestHistoryItemDto> getTestHistory(Long userId) {
          List<TestAttempt> attempts = testAttemptRepository.findByUserIdOrderByStartedAtDesc(userId);
          List<TestHistoryItemDto> history = new ArrayList<>();

          for (TestAttempt attempt : attempts) {
               TestHistoryItemDto dto = new TestHistoryItemDto();
               dto.setAttemptId(attempt.getId());
               dto.setTestId(attempt.getTest().getId());
               dto.setTitle(attempt.getTest().getTitle());
               dto.setSubject(attempt.getTest().getSubject());
               dto.setTestType(attempt.getTest().getTestType());
               dto.setDuration(attempt.getTest().getDuration());
               dto.setTotalQuestions(attempt.getTotalQuestions());
               dto.setAnsweredQuestions(attempt.getAnsweredQuestions());
               dto.setCorrectAnswers(attempt.getCorrectAnswers());
               dto.setScore(attempt.getScore());
               dto.setPercentage(attempt.getPercentage());
               dto.setFocusArea(attempt.getFocusArea());
               dto.setTestTip(attempt.getTestTip());
               dto.setStatus(attempt.getStatus());
               dto.setStartedAt(attempt.getStartedAt());
               dto.setSubmittedAt(attempt.getSubmittedAt());

               history.add(dto);
          }

          return history;
     }

     @Transactional(readOnly = true)
     public TestAttemptDetailsDto getAttemptDetails(Long userId, Long attemptId) {
          TestAttempt attempt = getOwnedAttempt(userId, attemptId);
          List<TestAnswer> answers = testAnswerRepository.findByAttemptId(attemptId);

          answers.sort(Comparator.comparingInt(
                    answer -> answer.getQuestion() != null && answer.getQuestion().getQuestionOrder() != null
                              ? answer.getQuestion().getQuestionOrder()
                              : Integer.MAX_VALUE));

          TestAttemptDetailsDto dto = new TestAttemptDetailsDto();
          dto.setAttemptId(attempt.getId());
          dto.setTestId(attempt.getTest().getId());
          dto.setTitle(attempt.getTest().getTitle());
          dto.setSubject(attempt.getTest().getSubject());
          dto.setTestType(attempt.getTest().getTestType());
          dto.setDuration(attempt.getTest().getDuration());
          dto.setDescription(attempt.getTest().getDescription());
          dto.setTotalQuestions(attempt.getTotalQuestions());
          dto.setAnsweredQuestions(attempt.getAnsweredQuestions());
          dto.setCorrectAnswers(attempt.getCorrectAnswers());
          dto.setScore(attempt.getScore());
          dto.setPercentage(attempt.getPercentage());
          dto.setFocusArea(attempt.getFocusArea());
          dto.setTestTip(attempt.getTestTip());
          dto.setStatus(attempt.getStatus());
          dto.setStartedAt(attempt.getStartedAt());
          dto.setSubmittedAt(attempt.getSubmittedAt());

          List<TestAttemptAnswerDto> answerDtos = new ArrayList<>();
          for (TestAnswer answer : answers) {
               TestQuestion question = answer.getQuestion();

               TestAttemptAnswerDto answerDto = new TestAttemptAnswerDto();
               answerDto.setQuestionId(question != null ? question.getId() : null);
               answerDto.setQuestionText(question != null ? question.getQuestionText() : null);
               answerDto.setQuestionType(question != null ? question.getQuestionType() : null);
               answerDto.setFocusTopic(question != null ? question.getFocusTopic() : null);
               answerDto.setQuestionOrder(question != null ? question.getQuestionOrder() : null);
               answerDto.setTotalMarks(question != null ? question.getMarks() : null);
               answerDto.setCorrectAnswer(question != null ? question.getCorrectAnswer() : null);
               answerDto.setSubmittedAnswer(answer.getSubmittedAnswer());
               answerDto.setIsCorrect(answer.getIsCorrect());
               answerDto.setMarksAwarded(answer.getMarksAwarded());

               answerDtos.add(answerDto);
          }

          dto.setAnswers(answerDtos);
          return dto;
     }

     private Map<Long, String> extractSubmittedAnswers(List<TestQuestion> questions, SubmitTestRequestDto request) {
          Map<Long, TestQuestion> questionMap = new HashMap<>();
          for (TestQuestion question : questions) {
               questionMap.put(question.getId(), question);
          }

          Map<Long, String> answersMap = new HashMap<>();
          if (request == null || request.getAnswers() == null) {
               return answersMap;
          }

          for (SubmittedAnswerDto answerDto : request.getAnswers()) {
               if (answerDto == null || answerDto.getQuestionId() == null) {
                    continue;
               }

               if (!questionMap.containsKey(answerDto.getQuestionId())) {
                    throw new IllegalArgumentException(
                              "Submitted answer contains invalid questionId: " + answerDto.getQuestionId());
               }

               if (answersMap.containsKey(answerDto.getQuestionId())) {
                    throw new IllegalArgumentException(
                              "Duplicate answer submitted for questionId: " + answerDto.getQuestionId());
               }

               answersMap.put(answerDto.getQuestionId(), answerDto.getSubmittedAnswer());
          }

          return answersMap;
     }

     private ScoreResult evaluateQuestion(TestQuestion question, String submittedAnswer) {
          int marks = normalizeMarks(question.getMarks());

          if (submittedAnswer == null) {
               return new ScoreResult(0, false);
          }

          if ("MCQ".equalsIgnoreCase(question.getQuestionType())) {
               boolean correct = safeEqualsIgnoreCase(submittedAnswer, question.getCorrectAnswer());
               return new ScoreResult(correct ? marks : 0, correct);
          }

          int theoryMarks = calculateTheoryMarks(question.getCorrectAnswer(), submittedAnswer, marks);
          boolean correct = theoryMarks >= marks;
          return new ScoreResult(theoryMarks, correct);
     }

     private int calculateTheoryMarks(String expectedAnswer, String submittedAnswer, int marks) {
          String expected = normalizeNullableText(expectedAnswer);
          String submitted = normalizeNullableText(submittedAnswer);

          if (expected == null || submitted == null) {
               return 0;
          }

          if (safeEqualsIgnoreCase(expected, submitted)) {
               return marks;
          }

          Set<String> expectedKeywords = extractKeywords(expected);
          Set<String> submittedKeywords = extractKeywords(submitted);

          if (expectedKeywords.isEmpty() || submittedKeywords.isEmpty()) {
               return 0;
          }

          int matches = 0;
          for (String keyword : expectedKeywords) {
               if (submittedKeywords.contains(keyword)) {
                    matches++;
               }
          }

          double ratio = matches / (double) expectedKeywords.size();

          if (ratio >= 0.75) {
               return marks;
          }

          if (ratio >= 0.45) {
               return Math.max(1, (int) Math.round(marks * 0.5));
          }

          return 0;
     }

     private Set<String> extractKeywords(String text) {
          Set<String> keywords = new HashSet<>();

          String normalized = text == null
                    ? ""
                    : text.toLowerCase().replaceAll("[^a-z0-9 ]", " ");

          String[] parts = normalized.split("\\s+");
          for (String part : parts) {
               String word = part.trim();
               if (word.length() <= 2) {
                    continue;
               }
               if (STOP_WORDS.contains(word)) {
                    continue;
               }
               keywords.add(word);
          }

          return keywords;
     }

     private void incrementWeakTopic(Map<String, Integer> weakTopicCounts, String topic) {
          String normalizedTopic = normalizeNullableText(topic);
          String key = normalizedTopic == null ? "General concepts" : normalizedTopic;
          weakTopicCounts.put(key, weakTopicCounts.getOrDefault(key, 0) + 1);
     }

     private String buildFocusArea(Map<String, Integer> weakTopicCounts) {
          if (weakTopicCounts.isEmpty()) {
               return "No major weak area detected.";
          }

          List<Map.Entry<String, Integer>> entries = new ArrayList<>(weakTopicCounts.entrySet());
          entries.sort((a, b) -> Integer.compare(b.getValue(), a.getValue()));

          List<String> topTopics = new ArrayList<>();
          for (int i = 0; i < entries.size() && i < 3; i++) {
               topTopics.add(entries.get(i).getKey());
          }

          return String.join(", ", topTopics);
     }

     private String buildTestTip(int percentage, String focusArea) {
          if (percentage >= 85) {
               return "Great work. Keep revising consistently and reattempt one mixed practice test before your next exam.";
          }

          if (percentage >= 60) {
               return "Good attempt. Revise these areas: " + focusArea
                         + ". Practice similar questions and review mistakes once.";
          }

          return "Focus first on these areas: " + focusArea
                    + ". Re-study concepts and solve a short practice set before reattempting.";
     }

     private List<StartTestQuestionDto> mapQuestionsForStart(List<TestQuestion> questions) {
          List<StartTestQuestionDto> result = new ArrayList<>();

          for (TestQuestion question : questions) {
               StartTestQuestionDto dto = new StartTestQuestionDto();
               dto.setId(question.getId());
               dto.setQuestionText(question.getQuestionText());
               dto.setQuestionType(question.getQuestionType());
               dto.setMarks(question.getMarks());
               dto.setFocusTopic(question.getFocusTopic());
               dto.setQuestionOrder(question.getQuestionOrder());

               List<StartTestQuestionOptionDto> optionDtos = new ArrayList<>();
               if (question.getOptions() != null) {
                    for (TestQuestionOption option : question.getOptions()) {
                         StartTestQuestionOptionDto optionDto = new StartTestQuestionOptionDto();
                         optionDto.setId(option.getId());
                         optionDto.setOptionLabel(option.getOptionLabel());
                         optionDto.setOptionText(option.getOptionText());
                         optionDtos.add(optionDto);
                    }
               }

               dto.setOptions(optionDtos);
               result.add(dto);
          }

          return result;
     }

     private Test getOwnedTest(Long userId, Long testId) {
          return testRepository.findByIdAndUserId(testId, userId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                              "Test not found with id: " + testId + " for userId: " + userId));
     }

     private TestAttempt getOwnedAttempt(Long userId, Long attemptId) {
          return testAttemptRepository.findByIdAndUserId(attemptId, userId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                              "Test attempt not found with id: " + attemptId + " for userId: " + userId));
     }

     private void validateQuestionRequest(TestQuestionCreateRequestDto request) {
          if (request == null) {
               throw new IllegalArgumentException("Question request body is required.");
          }

          if (request.getQuestionText() == null || request.getQuestionText().trim().isEmpty()) {
               throw new IllegalArgumentException("Question text is required.");
          }

          String normalizedType = normalizeQuestionType(request.getQuestionType());

          if ("MCQ".equals(normalizedType)) {
               if (request.getOptions() == null || request.getOptions().size() < 2) {
                    throw new IllegalArgumentException("MCQ question must have at least 2 options.");
               }

               if (request.getCorrectAnswer() == null || request.getCorrectAnswer().trim().isEmpty()) {
                    throw new IllegalArgumentException("Correct answer is required for MCQ question.");
               }

               boolean matchingOptionExists = request.getOptions().stream()
                         .anyMatch(option -> option != null
                                   && option.getOptionLabel() != null
                                   && option.getOptionLabel().trim()
                                             .equalsIgnoreCase(request.getCorrectAnswer().trim()));

               if (!matchingOptionExists) {
                    throw new IllegalArgumentException("Correct answer must match one option label for MCQ question.");
               }
          }
     }

     private String normalizeQuestionType(String questionType) {
          String value = questionType == null ? "" : questionType.trim().toUpperCase();

          if ("MCQ".equals(value)) {
               return "MCQ";
          }

          if ("THEORY".equals(value)) {
               return "THEORY";
          }

          throw new IllegalArgumentException("Question type must be either MCQ or THEORY.");
     }

     private Integer normalizeMarks(Integer marks) {
          if (marks == null || marks < 1) {
               return 1;
          }
          return marks;
     }

     private Integer resolveQuestionOrder(Long testId, Integer requestedOrder) {
          if (requestedOrder != null && requestedOrder > 0) {
               return requestedOrder;
          }

          List<TestQuestion> existingQuestions = testQuestionRepository.findByTestIdOrderByQuestionOrderAsc(testId);
          return existingQuestions.size() + 1;
     }

     private String normalizeNullableText(String value) {
          if (value == null) {
               return null;
          }

          String trimmed = value.trim();
          return trimmed.isEmpty() ? null : trimmed;
     }

     private boolean safeEqualsIgnoreCase(String a, String b) {
          if (a == null || b == null) {
               return false;
          }
          return a.trim().equalsIgnoreCase(b.trim());
     }

     private List<TestQuestionOption> buildOptionEntities(TestQuestion question,
               List<TestQuestionOptionDto> optionDtos) {
          List<TestQuestionOption> options = new ArrayList<>();

          if (optionDtos == null) {
               return options;
          }

          for (TestQuestionOptionDto dto : optionDtos) {
               if (dto == null) {
                    continue;
               }

               String optionLabel = dto.getOptionLabel() == null ? "" : dto.getOptionLabel().trim();
               String optionText = dto.getOptionText() == null ? "" : dto.getOptionText().trim();

               if (optionLabel.isEmpty() || optionText.isEmpty()) {
                    continue;
               }

               TestQuestionOption option = new TestQuestionOption();
               option.setQuestion(question);
               option.setOptionLabel(optionLabel.toUpperCase());
               option.setOptionText(optionText);

               options.add(option);
          }

          return options;
     }

     private static class ScoreResult {
          private final int marksAwarded;
          private final boolean correct;

          public ScoreResult(int marksAwarded, boolean correct) {
               this.marksAwarded = marksAwarded;
               this.correct = correct;
          }

          public int getMarksAwarded() {
               return marksAwarded;
          }

          public boolean isCorrect() {
               return correct;
          }
     }
}