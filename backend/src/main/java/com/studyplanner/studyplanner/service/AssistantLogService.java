package com.studyplanner.studyplanner.service;

import com.studyplanner.studyplanner.model.AssistantLog;
import com.studyplanner.studyplanner.repository.AssistantLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AssistantLogService {

     private final AssistantLogRepository assistantLogRepository;

     public AssistantLogService(AssistantLogRepository assistantLogRepository) {
          this.assistantLogRepository = assistantLogRepository;
     }

     /*
      * Student: ask assistant.
      * This currently uses LOCAL_FALLBACK response.
      * Later AI provider like GROQ/OPENAI can be connected here safely using backend
      * env variables.
      */
     @Transactional
     public AssistantLog handleStudentQuery(Long studentId, Map<String, Object> requestBody) {
          if (studentId == null || studentId <= 0) {
               throw new IllegalArgumentException("Valid student id is required.");
          }

          Map<String, Object> body = safeBody(requestBody);

          String question = getString(body, "question", "message", "prompt", "query");

          if (isBlank(question)) {
               throw new IllegalArgumentException("Question is required.");
          }

          if (question.trim().length() > 2000) {
               throw new IllegalArgumentException("Question cannot be more than 2000 characters.");
          }

          long startTime = System.currentTimeMillis();

          AssistantLog log = new AssistantLog();
          log.setStudentId(studentId);
          log.setStudentName(getString(body, "studentName", "name", "userName"));
          log.setStudentEmail(getString(body, "studentEmail", "email"));
          log.setQuestion(question.trim());

          String queryType = detectQueryType(question);
          log.setQueryType(queryType);

          try {
               String response = generateLocalFallbackResponse(question, queryType);

               log.setFullResponse(response);
               log.setResponseSummary(buildSummary(response));
               log.setStatus("SUCCESS");
               log.setProvider("LOCAL_FALLBACK");
               log.setModelName("EduMind Local Assistant");
               log.setTokensUsed(estimateTokens(question, response));
               log.setResponseTimeMs(System.currentTimeMillis() - startTime);

               return assistantLogRepository.save(log);
          } catch (Exception ex) {
               log.setStatus("FAILED");
               log.setProvider("LOCAL_FALLBACK");
               log.setModelName("EduMind Local Assistant");
               log.setErrorMessage(ex.getMessage());
               log.setResponseSummary("Assistant failed to generate a response.");
               log.setFullResponse("Sorry, I could not process your request right now.");
               log.setResponseTimeMs(System.currentTimeMillis() - startTime);

               return assistantLogRepository.save(log);
          }
     }

     /*
      * Admin/Internal: create a log manually.
      * Useful for testing or future assistant providers.
      */
     @Transactional
     public AssistantLog createLog(Map<String, Object> requestBody) {
          Map<String, Object> body = safeBody(requestBody);

          String question = getString(body, "question", "message", "prompt", "query");

          if (isBlank(question)) {
               throw new IllegalArgumentException("Question is required.");
          }

          AssistantLog log = new AssistantLog();

          log.setStudentId(getLong(body, "studentId", "userId"));
          log.setStudentName(getString(body, "studentName", "name", "userName"));
          log.setStudentEmail(getString(body, "studentEmail", "email"));
          log.setQuestion(question.trim());

          String queryType = getString(body, "queryType", "type");
          if (isBlank(queryType)) {
               queryType = detectQueryType(question);
          }

          log.setQueryType(normalizeQueryType(queryType));
          log.setStatus(normalizeStatus(getString(body, "status")));

          String fullResponse = getString(body, "fullResponse", "response", "answer");
          String responseSummary = getString(body, "responseSummary", "summary");

          if (isBlank(fullResponse)) {
               fullResponse = generateLocalFallbackResponse(question, queryType);
          }

          if (isBlank(responseSummary)) {
               responseSummary = buildSummary(fullResponse);
          }

          log.setFullResponse(fullResponse);
          log.setResponseSummary(responseSummary);
          log.setErrorMessage(getString(body, "errorMessage", "error"));
          log.setProvider(defaultText(getString(body, "provider"), "LOCAL_FALLBACK"));
          log.setModelName(defaultText(getString(body, "modelName", "model"), "EduMind Local Assistant"));
          log.setTokensUsed(
                    defaultNonNegativeInt(getInteger(body, "tokensUsed"), estimateTokens(question, fullResponse)));
          log.setResponseTimeMs(defaultNonNegativeLong(getLong(body, "responseTimeMs"), 0L));

          return assistantLogRepository.save(log);
     }

     /*
      * Admin: all assistant logs.
      */
     public List<AssistantLog> getAllLogs() {
          return assistantLogRepository.findAllByOrderByCreatedAtDesc();
     }

     /*
      * Student: own assistant logs.
      */
     public List<AssistantLog> getStudentLogs(Long studentId) {
          if (studentId == null || studentId <= 0) {
               throw new IllegalArgumentException("Valid student id is required.");
          }

          return assistantLogRepository.findByStudentIdOrderByCreatedAtDesc(studentId);
     }

     /*
      * Admin: filter by status.
      */
     public List<AssistantLog> getLogsByStatus(String status) {
          if (isBlank(status) || status.equalsIgnoreCase("all")) {
               return getAllLogs();
          }

          return assistantLogRepository.findByStatusIgnoreCaseOrderByCreatedAtDesc(status);
     }

     /*
      * Admin: filter by query type.
      */
     public List<AssistantLog> getLogsByQueryType(String queryType) {
          if (isBlank(queryType) || queryType.equalsIgnoreCase("all")) {
               return getAllLogs();
          }

          return assistantLogRepository.findByQueryTypeIgnoreCaseOrderByCreatedAtDesc(queryType);
     }

     /*
      * Admin: filter by provider.
      */
     public List<AssistantLog> getLogsByProvider(String provider) {
          if (isBlank(provider) || provider.equalsIgnoreCase("all")) {
               return getAllLogs();
          }

          return assistantLogRepository.findByProviderIgnoreCaseOrderByCreatedAtDesc(provider);
     }

     /*
      * Admin: summary cards.
      */
     public Map<String, Object> getSummary() {
          List<AssistantLog> logs = getAllLogs();

          long totalQueries = logs.size();

          LocalDateTime startOfToday = LocalDateTime.now().toLocalDate().atStartOfDay();

          long todayQueries = logs.stream()
                    .filter(log -> log.getCreatedAt() != null && !log.getCreatedAt().isBefore(startOfToday))
                    .count();

          long successQueries = logs.stream()
                    .filter(log -> "SUCCESS".equalsIgnoreCase(log.getStatus()))
                    .count();

          long failedQueries = logs.stream()
                    .filter(log -> "FAILED".equalsIgnoreCase(log.getStatus()))
                    .count();

          long studySuggestionQueries = logs.stream()
                    .filter(log -> "STUDY_SUGGESTION".equalsIgnoreCase(log.getQueryType()))
                    .count();

          double successRate = totalQueries == 0
                    ? 0
                    : Math.round((successQueries * 1000.0 / totalQueries)) / 10.0;

          Map.Entry<String, Long> topStudentEntry = logs.stream()
                    .filter(log -> !isBlank(log.getStudentName()) || !isBlank(log.getStudentEmail()))
                    .collect(Collectors.groupingBy(
                              log -> !isBlank(log.getStudentName())
                                        ? log.getStudentName()
                                        : log.getStudentEmail(),
                              LinkedHashMap::new,
                              Collectors.counting()))
                    .entrySet()
                    .stream()
                    .max(Map.Entry.comparingByValue())
                    .orElse(null);

          String mostActiveStudent = topStudentEntry == null ? "-" : topStudentEntry.getKey();
          Long mostActiveStudentQueries = topStudentEntry == null ? 0L : topStudentEntry.getValue();

          String topQueryType = logs.stream()
                    .filter(log -> !isBlank(log.getQueryType()))
                    .collect(Collectors.groupingBy(
                              AssistantLog::getQueryType,
                              LinkedHashMap::new,
                              Collectors.counting()))
                    .entrySet()
                    .stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElse("-");

          Map<String, Object> summary = new LinkedHashMap<>();
          summary.put("totalQueries", totalQueries);
          summary.put("todayQueries", todayQueries);
          summary.put("successQueries", successQueries);
          summary.put("failedQueries", failedQueries);
          summary.put("studySuggestionQueries", studySuggestionQueries);
          summary.put("successRate", successRate);
          summary.put("mostActiveStudent", mostActiveStudent);
          summary.put("mostActiveStudentQueries", mostActiveStudentQueries);
          summary.put("topQueryType", topQueryType);

          return summary;
     }

     /*
      * Admin: student query ranking.
      */
     public List<Map<String, Object>> getStudentQueryRanking() {
          List<AssistantLog> logs = getAllLogs();

          Map<Long, List<AssistantLog>> grouped = logs.stream()
                    .filter(log -> log.getStudentId() != null)
                    .collect(Collectors.groupingBy(AssistantLog::getStudentId));

          return grouped.entrySet()
                    .stream()
                    .map(entry -> {
                         Long studentId = entry.getKey();
                         List<AssistantLog> studentLogs = entry.getValue();

                         long total = studentLogs.size();

                         long failed = studentLogs.stream()
                                   .filter(log -> "FAILED".equalsIgnoreCase(log.getStatus()))
                                   .count();

                         AssistantLog latest = studentLogs.stream()
                                   .max(Comparator.comparing(
                                             log -> log.getCreatedAt() == null ? LocalDateTime.MIN
                                                       : log.getCreatedAt()))
                                   .orElse(null);

                         Map<String, Object> item = new LinkedHashMap<>();
                         item.put("studentId", studentId);
                         item.put("studentName", latest == null ? "Student #" + studentId
                                   : defaultText(latest.getStudentName(), "Student #" + studentId));
                         item.put("studentEmail", latest == null ? "" : defaultText(latest.getStudentEmail(), ""));
                         item.put("totalQueries", total);
                         item.put("failedQueries", failed);
                         item.put("successQueries", total - failed);

                         return item;
                    })
                    .sorted((a, b) -> Long.compare(
                              Long.parseLong(String.valueOf(b.get("totalQueries"))),
                              Long.parseLong(String.valueOf(a.get("totalQueries")))))
                    .collect(Collectors.toList());
     }

     private String detectQueryType(String question) {
          if (isBlank(question)) {
               return "GENERAL";
          }

          String text = question.toLowerCase();

          if (text.contains("task") || text.contains("todo") || text.contains("assignment")) {
               return "TASK_HELP";
          }

          if (text.contains("test") || text.contains("exam") || text.contains("quiz") || text.contains("mcq")) {
               return "TEST_HELP";
          }

          if (text.contains("revision") || text.contains("revise") || text.contains("repeat")) {
               return "REVISION_HELP";
          }

          if (text.contains("study plan") || text.contains("schedule") || text.contains("planner")
                    || text.contains("time table")) {
               return "STUDY_SUGGESTION";
          }

          if (text.contains("pomodoro") || text.contains("focus") || text.contains("concentration")) {
               return "FOCUS_HELP";
          }

          return "GENERAL";
     }

     private String generateLocalFallbackResponse(String question, String queryType) {
          String cleanQuestion = question == null ? "" : question.trim();

          String intro = "Here is a simple EduMind AI suggestion based on your query: ";

          if ("TASK_HELP".equalsIgnoreCase(queryType)) {
               return intro
                         + "Break your task into smaller steps, set a clear deadline, and complete the most urgent part first. Your question was: "
                         + cleanQuestion;
          }

          if ("TEST_HELP".equalsIgnoreCase(queryType)) {
               return intro
                         + "Revise important concepts first, practice MCQs, and review mistakes after every test. Your question was: "
                         + cleanQuestion;
          }

          if ("REVISION_HELP".equalsIgnoreCase(queryType)) {
               return intro
                         + "Use short revision cycles: read notes, recall without seeing, solve questions, then revise weak topics again. Your question was: "
                         + cleanQuestion;
          }

          if ("STUDY_SUGGESTION".equalsIgnoreCase(queryType)) {
               return intro
                         + "Create a realistic study plan with daily subjects, Pomodoro focus sessions, revision slots, and weekly tests. Your question was: "
                         + cleanQuestion;
          }

          if ("FOCUS_HELP".equalsIgnoreCase(queryType)) {
               return intro
                         + "Use a 25-minute Pomodoro session, keep your phone away, and take a 5-minute break after one focused cycle. Your question was: "
                         + cleanQuestion;
          }

          return intro
                    + "Start with the most important topic, study for 25 minutes, write short notes, and revise once before sleeping. Your question was: "
                    + cleanQuestion;
     }

     private String buildSummary(String response) {
          if (isBlank(response)) {
               return "No response generated.";
          }

          String cleaned = response.trim();

          if (cleaned.length() <= 180) {
               return cleaned;
          }

          return cleaned.substring(0, 180).trim() + "...";
     }

     private Integer estimateTokens(String question, String response) {
          String combined = defaultText(question, "") + " " + defaultText(response, "");
          String[] words = combined.trim().split("\\s+");

          if (combined.trim().isEmpty()) {
               return 0;
          }

          return Math.max(1, (int) Math.round(words.length * 1.3));
     }

     private String normalizeStatus(String status) {
          if (isBlank(status)) {
               return "SUCCESS";
          }

          String cleaned = status.trim().toUpperCase();

          if (cleaned.equals("FAILED")) {
               return "FAILED";
          }

          return "SUCCESS";
     }

     private String normalizeQueryType(String queryType) {
          if (isBlank(queryType)) {
               return "GENERAL";
          }

          return queryType.trim().toUpperCase().replace(" ", "_").replace("-", "_");
     }

     private Map<String, Object> safeBody(Map<String, Object> body) {
          if (body == null) {
               return new LinkedHashMap<>();
          }

          return body;
     }

     private String getString(Map<String, Object> body, String... keys) {
          if (body == null) {
               return null;
          }

          for (String key : keys) {
               if (body.containsKey(key) && body.get(key) != null) {
                    return String.valueOf(body.get(key));
               }
          }

          return null;
     }

     private Integer getInteger(Map<String, Object> body, String... keys) {
          if (body == null) {
               return null;
          }

          for (String key : keys) {
               if (!body.containsKey(key) || body.get(key) == null) {
                    continue;
               }

               Object value = body.get(key);

               if (value instanceof Number) {
                    return ((Number) value).intValue();
               }

               try {
                    return Integer.parseInt(String.valueOf(value).trim());
               } catch (Exception ignored) {
               }
          }

          return null;
     }

     private Long getLong(Map<String, Object> body, String... keys) {
          if (body == null) {
               return null;
          }

          for (String key : keys) {
               if (!body.containsKey(key) || body.get(key) == null) {
                    continue;
               }

               Object value = body.get(key);

               if (value instanceof Number) {
                    return ((Number) value).longValue();
               }

               try {
                    return Long.parseLong(String.valueOf(value).trim());
               } catch (Exception ignored) {
               }
          }

          return null;
     }

     private int defaultNonNegativeInt(Integer value, int fallback) {
          if (value == null || value < 0) {
               return fallback;
          }

          return value;
     }

     private long defaultNonNegativeLong(Long value, long fallback) {
          if (value == null || value < 0) {
               return fallback;
          }

          return value;
     }

     private String defaultText(String value, String fallback) {
          if (value == null || value.trim().isEmpty()) {
               return fallback;
          }

          return value.trim();
     }

     private boolean isBlank(String value) {
          return value == null || value.trim().isEmpty();
     }
}