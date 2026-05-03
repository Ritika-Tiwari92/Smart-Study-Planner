package com.studyplanner.studyplanner.service;

import com.studyplanner.studyplanner.model.PomodoroSession;
import com.studyplanner.studyplanner.repository.PomodoroSessionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class PomodoroSessionService {

     private final PomodoroSessionRepository pomodoroSessionRepository;

     public PomodoroSessionService(PomodoroSessionRepository pomodoroSessionRepository) {
          this.pomodoroSessionRepository = pomodoroSessionRepository;
     }

     /*
      * Student: start a new Pomodoro/focus session.
      */
     @Transactional
     public PomodoroSession startSession(Long studentId, Map<String, Object> requestBody) {
          if (studentId == null || studentId <= 0) {
               throw new IllegalArgumentException("Valid student id is required.");
          }

          Map<String, Object> body = safeBody(requestBody);

          PomodoroSession session = new PomodoroSession();

          session.setStudentId(studentId);
          session.setStudentName(getString(body, "studentName", "name", "userName"));
          session.setStudentEmail(getString(body, "studentEmail", "email"));
          session.setSubjectId(getLong(body, "subjectId"));
          session.setSubjectName(getString(body, "subjectName", "subject"));
          session.setTopic(defaultText(getString(body, "topic", "title"), "Focus Session"));
          session.setSessionType(normalizeSessionType(getString(body, "sessionType", "type")));
          session.setStatus("ACTIVE");
          session.setPlannedMinutes(
                    defaultPositiveInt(getInteger(body, "plannedMinutes", "duration", "durationMinutes"), 25));
          session.setBreakMinutes(defaultNonNegativeInt(getInteger(body, "breakMinutes"), 5));
          session.setFocusMinutes(0);
          session.setStartTime(parseDateTime(getString(body, "startTime")));

          if (session.getStartTime() == null) {
               session.setStartTime(LocalDateTime.now());
          }

          session.setNotes(getString(body, "notes"));

          return pomodoroSessionRepository.save(session);
     }

     /*
      * Student: complete session.
      */
     @Transactional
     public PomodoroSession completeSession(Long sessionId, Long studentId, Map<String, Object> requestBody) {
          PomodoroSession session = findSessionById(sessionId);

          validateSessionOwnerIfProvided(session, studentId);

          Map<String, Object> body = safeBody(requestBody);

          LocalDateTime endTime = parseDateTime(getString(body, "endTime"));
          if (endTime == null) {
               endTime = LocalDateTime.now();
          }

          Integer focusMinutes = getInteger(body, "focusMinutes", "actualMinutes", "durationMinutes");

          if (focusMinutes == null || focusMinutes < 0) {
               focusMinutes = calculateMinutes(session.getStartTime(), endTime);
          }

          if (focusMinutes == null || focusMinutes <= 0) {
               focusMinutes = session.getPlannedMinutes() == null ? 25 : session.getPlannedMinutes();
          }

          session.setEndTime(endTime);
          session.setCompletedAt(endTime);
          session.setFocusMinutes(focusMinutes);
          session.setStatus("COMPLETED");

          String notes = getString(body, "notes");
          if (notes != null) {
               session.setNotes(notes);
          }

          return pomodoroSessionRepository.save(session);
     }

     /*
      * Student: interrupt/cancel session.
      */
     @Transactional
     public PomodoroSession interruptSession(Long sessionId, Long studentId, Map<String, Object> requestBody) {
          PomodoroSession session = findSessionById(sessionId);

          validateSessionOwnerIfProvided(session, studentId);

          Map<String, Object> body = safeBody(requestBody);

          LocalDateTime endTime = parseDateTime(getString(body, "endTime"));
          if (endTime == null) {
               endTime = LocalDateTime.now();
          }

          Integer focusMinutes = getInteger(body, "focusMinutes", "actualMinutes", "durationMinutes");

          if (focusMinutes == null || focusMinutes < 0) {
               focusMinutes = calculateMinutes(session.getStartTime(), endTime);
          }

          if (focusMinutes == null || focusMinutes < 0) {
               focusMinutes = 0;
          }

          session.setEndTime(endTime);
          session.setFocusMinutes(focusMinutes);
          session.setStatus("INTERRUPTED");

          String notes = getString(body, "notes", "reason");
          if (notes != null) {
               session.setNotes(notes);
          }

          return pomodoroSessionRepository.save(session);
     }

     /*
      * Student: own session history.
      */
     public List<PomodoroSession> getMySessions(Long studentId) {
          if (studentId == null || studentId <= 0) {
               throw new IllegalArgumentException("Valid student id is required.");
          }

          return pomodoroSessionRepository.findByStudentIdOrderByCreatedAtDesc(studentId);
     }

     /*
      * Admin: all sessions.
      */
     public List<PomodoroSession> getAllSessions() {
          return pomodoroSessionRepository.findAllByOrderByCreatedAtDesc();
     }

     /*
      * Admin: filter by status.
      */
     public List<PomodoroSession> getSessionsByStatus(String status) {
          if (isBlank(status) || status.equalsIgnoreCase("all")) {
               return getAllSessions();
          }

          return pomodoroSessionRepository.findByStatusIgnoreCaseOrderByCreatedAtDesc(status);
     }

     /*
      * Admin: filter by session type.
      */
     public List<PomodoroSession> getSessionsByType(String sessionType) {
          if (isBlank(sessionType) || sessionType.equalsIgnoreCase("all")) {
               return getAllSessions();
          }

          return pomodoroSessionRepository.findBySessionTypeIgnoreCaseOrderByCreatedAtDesc(sessionType);
     }

     /*
      * Admin: summary for cards.
      */
     public Map<String, Object> getAdminSummary() {
          List<PomodoroSession> sessions = getAllSessions();

          long totalSessions = sessions.size();

          int totalFocusMinutes = sessions.stream()
                    .map(PomodoroSession::getFocusMinutes)
                    .filter(minutes -> minutes != null && minutes > 0)
                    .mapToInt(Integer::intValue)
                    .sum();

          long completedSessions = sessions.stream()
                    .filter(session -> equalsText(session.getStatus(), "COMPLETED"))
                    .count();

          long activeSessions = sessions.stream()
                    .filter(session -> equalsText(session.getStatus(), "ACTIVE"))
                    .count();

          long interruptedSessions = sessions.stream()
                    .filter(session -> equalsText(session.getStatus(), "INTERRUPTED"))
                    .count();

          LocalDateTime startOfToday = LocalDateTime.now().toLocalDate().atStartOfDay();

          long activeToday = sessions.stream()
                    .filter(session -> {
                         LocalDateTime time = session.getCreatedAt();
                         return time != null && !time.isBefore(startOfToday);
                    })
                    .count();

          double averageSessionMinutes = completedSessions == 0
                    ? 0
                    : Math.round((totalFocusMinutes * 10.0 / completedSessions)) / 10.0;

          Map<String, Integer> focusByStudent = new LinkedHashMap<>();

          for (PomodoroSession session : sessions) {
               String studentName = defaultText(session.getStudentName(), "Student #" + session.getStudentId());
               int minutes = session.getFocusMinutes() == null ? 0 : session.getFocusMinutes();

               focusByStudent.put(studentName, focusByStudent.getOrDefault(studentName, 0) + minutes);
          }

          Map.Entry<String, Integer> topStudentEntry = focusByStudent.entrySet()
                    .stream()
                    .max(Map.Entry.comparingByValue())
                    .orElse(null);

          String topFocusStudent = topStudentEntry == null ? "-" : topStudentEntry.getKey();
          Integer topFocusMinutes = topStudentEntry == null ? 0 : topStudentEntry.getValue();

          Map<String, Object> summary = new LinkedHashMap<>();
          summary.put("totalSessions", totalSessions);
          summary.put("totalFocusMinutes", totalFocusMinutes);
          summary.put("completedSessions", completedSessions);
          summary.put("activeSessions", activeSessions);
          summary.put("interruptedSessions", interruptedSessions);
          summary.put("activeToday", activeToday);
          summary.put("averageSessionMinutes", averageSessionMinutes);
          summary.put("topFocusStudent", topFocusStudent);
          summary.put("topFocusMinutes", topFocusMinutes);

          return summary;
     }

     /*
      * Admin: student-wise focus ranking.
      */
     public List<Map<String, Object>> getStudentFocusRanking() {
          List<PomodoroSession> sessions = getAllSessions();

          Map<Long, List<PomodoroSession>> grouped = sessions.stream()
                    .filter(session -> session.getStudentId() != null)
                    .collect(Collectors.groupingBy(PomodoroSession::getStudentId));

          return grouped.entrySet()
                    .stream()
                    .map(entry -> {
                         Long studentId = entry.getKey();
                         List<PomodoroSession> studentSessions = entry.getValue();

                         int totalMinutes = studentSessions.stream()
                                   .map(PomodoroSession::getFocusMinutes)
                                   .filter(minutes -> minutes != null && minutes > 0)
                                   .mapToInt(Integer::intValue)
                                   .sum();

                         long completed = studentSessions.stream()
                                   .filter(session -> equalsText(session.getStatus(), "COMPLETED"))
                                   .count();

                         PomodoroSession latest = studentSessions.stream()
                                   .max(Comparator.comparing(
                                             session -> session.getCreatedAt() == null ? LocalDateTime.MIN
                                                       : session.getCreatedAt()))
                                   .orElse(null);

                         Map<String, Object> item = new LinkedHashMap<>();
                         item.put("studentId", studentId);
                         item.put("studentName", latest == null ? "Student #" + studentId
                                   : defaultText(latest.getStudentName(), "Student #" + studentId));
                         item.put("studentEmail", latest == null ? "" : defaultText(latest.getStudentEmail(), ""));
                         item.put("totalSessions", studentSessions.size());
                         item.put("completedSessions", completed);
                         item.put("totalFocusMinutes", totalMinutes);

                         return item;
                    })
                    .sorted((a, b) -> Integer.compare(
                              Integer.parseInt(String.valueOf(b.get("totalFocusMinutes"))),
                              Integer.parseInt(String.valueOf(a.get("totalFocusMinutes")))))
                    .collect(Collectors.toList());
     }

     private PomodoroSession findSessionById(Long sessionId) {
          if (sessionId == null || sessionId <= 0) {
               throw new IllegalArgumentException("Valid session id is required.");
          }

          return pomodoroSessionRepository.findById(sessionId)
                    .orElseThrow(
                              () -> new IllegalArgumentException("Pomodoro session not found with id: " + sessionId));
     }

     private void validateSessionOwnerIfProvided(PomodoroSession session, Long studentId) {
          if (studentId == null || studentId <= 0) {
               return;
          }

          if (session.getStudentId() != null && !session.getStudentId().equals(studentId)) {
               throw new IllegalArgumentException("You are not allowed to update this Pomodoro session.");
          }
     }

     private Integer calculateMinutes(LocalDateTime start, LocalDateTime end) {
          if (start == null || end == null) {
               return null;
          }

          long seconds = java.time.Duration.between(start, end).getSeconds();

          if (seconds <= 0) {
               return 0;
          }

          return Math.max(1, (int) Math.round(seconds / 60.0));
     }

     private String normalizeSessionType(String type) {
          if (isBlank(type)) {
               return "POMODORO";
          }

          String cleaned = type.trim().toUpperCase().replace(" ", "_").replace("-", "_");

          if (cleaned.equals("POMODORO")
                    || cleaned.equals("DEEP_WORK")
                    || cleaned.equals("REVISION")
                    || cleaned.equals("TEST_PREP")) {
               return cleaned;
          }

          return "POMODORO";
     }

     private LocalDateTime parseDateTime(String value) {
          if (isBlank(value)) {
               return null;
          }

          String text = value.trim();

          try {
               return LocalDateTime.parse(text);
          } catch (Exception ignored) {
          }

          try {
               return OffsetDateTime.parse(text).toLocalDateTime();
          } catch (Exception ignored) {
          }

          return null;
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

     private int defaultPositiveInt(Integer value, int fallback) {
          if (value == null || value <= 0) {
               return fallback;
          }

          return value;
     }

     private int defaultNonNegativeInt(Integer value, int fallback) {
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

     private boolean equalsText(String value, String expected) {
          return value != null && value.equalsIgnoreCase(expected);
     }

     private boolean isBlank(String value) {
          return value == null || value.trim().isEmpty();
     }
}