package com.studyplanner.studyplanner.service;

import com.studyplanner.studyplanner.dto.PomodoroAnalyticsResponse;
import com.studyplanner.studyplanner.model.PomodoroSession;
import com.studyplanner.studyplanner.model.User;
import com.studyplanner.studyplanner.repository.PomodoroSessionRepository;
import com.studyplanner.studyplanner.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.WeekFields;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

     private final UserRepository userRepository;
     private final PomodoroSessionRepository pomodoroSessionRepository;

     public AnalyticsService(
               UserRepository userRepository,
               PomodoroSessionRepository pomodoroSessionRepository) {
          this.userRepository = userRepository;
          this.pomodoroSessionRepository = pomodoroSessionRepository;
     }

     public PomodoroAnalyticsResponse getPomodoroAnalytics(String email) {
          User user = getUser(email);
          Long userId = user.getId();

          LocalDate today = LocalDate.now();
          LocalDate last7Start = today.minusDays(6);

          List<PomodoroSession> allSessions = pomodoroSessionRepository.findByStudentIdOrderByCreatedAtDesc(userId);

          List<PomodoroSession> completedFocusSessions = allSessions.stream()
                    .filter(this::isCompleted)
                    .filter(this::isFocusSession)
                    .toList();

          List<PomodoroSession> interruptedSessions = allSessions.stream()
                    .filter(this::isInterrupted)
                    .filter(this::isFocusSession)
                    .toList();

          List<PomodoroSession> last7CompletedFocusSessions = completedFocusSessions.stream()
                    .filter(session -> {
                         LocalDate date = getSessionDate(session);
                         return date != null &&
                                   !date.isBefore(last7Start) &&
                                   !date.isAfter(today);
                    })
                    .toList();

          PomodoroAnalyticsResponse response = new PomodoroAnalyticsResponse();

          long totalFocusMinutes = last7CompletedFocusSessions.stream()
                    .mapToLong(this::getFocusMinutes)
                    .sum();

          long totalCompletedSessions = last7CompletedFocusSessions.size();

          long totalInterruptedSessions = interruptedSessions.stream()
                    .filter(session -> {
                         LocalDate date = getSessionDate(session);
                         return date != null &&
                                   !date.isBefore(last7Start) &&
                                   !date.isAfter(today);
                    })
                    .count();

          double averageDailyFocusMinutes = Math.round((totalFocusMinutes / 7.0) * 10.0) / 10.0;

          long activeDaysThisWeek = countActiveDaysThisWeek(completedFocusSessions, today);

          String mostFocusedSubject = findMostFocusedSubject(last7CompletedFocusSessions);

          double breakBalanceRatio = calculateBreakBalanceRatio(allSessions, last7Start, today);

          int productivityScore = calculateProductivityScore(
                    totalFocusMinutes,
                    totalCompletedSessions,
                    totalInterruptedSessions,
                    activeDaysThisWeek);

          response.setTotalFocusMinutes(totalFocusMinutes);
          response.setTotalCompletedSessions(totalCompletedSessions);
          response.setTotalInterruptedSessions(totalInterruptedSessions);
          response.setAverageDailyFocusMinutes(averageDailyFocusMinutes);
          response.setActiveDaysThisWeek(activeDaysThisWeek);
          response.setMostFocusedSubject(mostFocusedSubject);
          response.setBreakBalanceRatio(breakBalanceRatio);
          response.setProductivityScore(productivityScore);
          response.setProductivityLabel(getProductivityLabel(productivityScore));
          response.setDailyFocusData(buildDailyFocusData(last7CompletedFocusSessions, last7Start, today));
          response.setSubjectFocusData(buildSubjectFocusData(last7CompletedFocusSessions));
          response.setWeeklySessionData(buildWeeklySessionData(completedFocusSessions, today));
          response.setInsights(buildInsights(
                    totalFocusMinutes,
                    totalCompletedSessions,
                    totalInterruptedSessions,
                    activeDaysThisWeek,
                    mostFocusedSubject,
                    productivityScore));

          return response;
     }

     private User getUser(String email) {
          if (email == null || email.trim().isEmpty()) {
               throw new IllegalArgumentException("Logged-in user email is required.");
          }

          return userRepository.findByEmail(email.toLowerCase().trim())
                    .orElseThrow(() -> new IllegalArgumentException("User not found."));
     }

     private boolean isCompleted(PomodoroSession session) {
          return session != null &&
                    session.getStatus() != null &&
                    session.getStatus().equalsIgnoreCase("COMPLETED");
     }

     private boolean isInterrupted(PomodoroSession session) {
          return session != null &&
                    session.getStatus() != null &&
                    (session.getStatus().equalsIgnoreCase("INTERRUPTED") ||
                              session.getStatus().equalsIgnoreCase("CANCELLED") ||
                              session.getStatus().equalsIgnoreCase("CANCELED"));
     }

     private boolean isFocusSession(PomodoroSession session) {
          if (session == null) {
               return false;
          }

          String type = session.getSessionType();

          if (type == null || type.trim().isEmpty()) {
               return true;
          }

          String normalized = type.trim().toUpperCase();

          return !normalized.equals("SHORT_BREAK") &&
                    !normalized.equals("LONG_BREAK") &&
                    !normalized.equals("BREAK");
     }

     private LocalDate getSessionDate(PomodoroSession session) {
          if (session == null) {
               return null;
          }

          if (session.getSessionDate() != null) {
               return session.getSessionDate();
          }

          if (session.getStartTime() != null) {
               return session.getStartTime().toLocalDate();
          }

          if (session.getCreatedAt() != null) {
               return session.getCreatedAt().toLocalDate();
          }

          return null;
     }

     private long getFocusMinutes(PomodoroSession session) {
          if (session == null || session.getFocusMinutes() == null) {
               return 0;
          }

          return Math.max(0, session.getFocusMinutes());
     }

     private String getSubjectName(PomodoroSession session) {
          if (session == null) {
               return "General Focus";
          }

          if (session.getSubjectName() != null && !session.getSubjectName().trim().isEmpty()) {
               return session.getSubjectName().trim();
          }

          if (session.getTopic() != null && !session.getTopic().trim().isEmpty()) {
               return session.getTopic().trim();
          }

          return "General Focus";
     }

     private long countActiveDaysThisWeek(List<PomodoroSession> sessions, LocalDate today) {
          LocalDate weekStart = today.with(DayOfWeek.MONDAY);
          LocalDate weekEnd = weekStart.plusDays(6);

          return sessions.stream()
                    .map(this::getSessionDate)
                    .filter(Objects::nonNull)
                    .filter(date -> !date.isBefore(weekStart) && !date.isAfter(weekEnd))
                    .collect(Collectors.toSet())
                    .size();
     }

     private String findMostFocusedSubject(List<PomodoroSession> sessions) {
          Map<String, Long> subjectMinutes = new LinkedHashMap<>();

          for (PomodoroSession session : sessions) {
               String subject = getSubjectName(session);
               long minutes = getFocusMinutes(session);

               subjectMinutes.put(subject, subjectMinutes.getOrDefault(subject, 0L) + minutes);
          }

          return subjectMinutes.entrySet()
                    .stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElse("No subject yet");
     }

     private double calculateBreakBalanceRatio(
               List<PomodoroSession> allSessions,
               LocalDate fromDate,
               LocalDate toDate) {

          long focusMinutes = allSessions.stream()
                    .filter(this::isCompleted)
                    .filter(this::isFocusSession)
                    .filter(session -> {
                         LocalDate date = getSessionDate(session);
                         return date != null &&
                                   !date.isBefore(fromDate) &&
                                   !date.isAfter(toDate);
                    })
                    .mapToLong(this::getFocusMinutes)
                    .sum();

          long breakMinutes = allSessions.stream()
                    .filter(this::isCompleted)
                    .filter(session -> !isFocusSession(session))
                    .filter(session -> {
                         LocalDate date = getSessionDate(session);
                         return date != null &&
                                   !date.isBefore(fromDate) &&
                                   !date.isAfter(toDate);
                    })
                    .mapToLong(session -> session.getBreakMinutes() == null ? 0 : session.getBreakMinutes())
                    .sum();

          if (focusMinutes <= 0) {
               return 0.0;
          }

          return Math.round((breakMinutes * 1.0 / focusMinutes) * 100.0) / 100.0;
     }

     private int calculateProductivityScore(
               long totalFocusMinutes,
               long completedSessions,
               long interruptedSessions,
               long activeDaysThisWeek) {

          int score = 0;

          score += Math.min(35, (int) Math.round(totalFocusMinutes / 20.0));
          score += Math.min(25, (int) completedSessions * 4);
          score += Math.min(25, (int) activeDaysThisWeek * 4);

          if (interruptedSessions == 0 && completedSessions > 0) {
               score += 15;
          } else {
               score += Math.max(0, 15 - ((int) interruptedSessions * 4));
          }

          return Math.max(0, Math.min(100, score));
     }

     private String getProductivityLabel(int score) {
          if (score >= 85) {
               return "Excellent";
          }

          if (score >= 65) {
               return "Strong";
          }

          if (score >= 40) {
               return "Improving";
          }

          return "Low Consistency";
     }

     private List<Map<String, Object>> buildDailyFocusData(
               List<PomodoroSession> sessions,
               LocalDate fromDate,
               LocalDate toDate) {

          Map<LocalDate, Long> minutesByDate = new LinkedHashMap<>();

          LocalDate cursor = fromDate;
          while (!cursor.isAfter(toDate)) {
               minutesByDate.put(cursor, 0L);
               cursor = cursor.plusDays(1);
          }

          for (PomodoroSession session : sessions) {
               LocalDate date = getSessionDate(session);

               if (date == null || date.isBefore(fromDate) || date.isAfter(toDate)) {
                    continue;
               }

               minutesByDate.put(date, minutesByDate.getOrDefault(date, 0L) + getFocusMinutes(session));
          }

          List<Map<String, Object>> result = new ArrayList<>();

          for (Map.Entry<LocalDate, Long> entry : minutesByDate.entrySet()) {
               Map<String, Object> item = new LinkedHashMap<>();
               item.put("date", entry.getKey().toString());
               item.put("day", entry.getKey().getDayOfWeek().toString().substring(0, 3));
               item.put("minutes", entry.getValue());
               result.add(item);
          }

          return result;
     }

     private List<Map<String, Object>> buildSubjectFocusData(List<PomodoroSession> sessions) {
          Map<String, Long> subjectMinutes = new LinkedHashMap<>();

          for (PomodoroSession session : sessions) {
               String subject = getSubjectName(session);
               long minutes = getFocusMinutes(session);

               subjectMinutes.put(subject, subjectMinutes.getOrDefault(subject, 0L) + minutes);
          }

          return subjectMinutes.entrySet()
                    .stream()
                    .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                    .map(entry -> {
                         Map<String, Object> item = new LinkedHashMap<>();
                         item.put("subject", entry.getKey());
                         item.put("minutes", entry.getValue());
                         return item;
                    })
                    .toList();
     }

     private List<Map<String, Object>> buildWeeklySessionData(
               List<PomodoroSession> sessions,
               LocalDate today) {

          WeekFields weekFields = WeekFields.ISO;
          LocalDate start = today.minusWeeks(3).with(DayOfWeek.MONDAY);
          LocalDate end = today.with(DayOfWeek.SUNDAY);

          Map<String, Long> weekCounts = new LinkedHashMap<>();

          LocalDate cursor = start;
          while (!cursor.isAfter(end)) {
               String label = "Week " + cursor.get(weekFields.weekOfWeekBasedYear());
               weekCounts.put(label, 0L);
               cursor = cursor.plusWeeks(1);
          }

          for (PomodoroSession session : sessions) {
               LocalDate date = getSessionDate(session);

               if (date == null || date.isBefore(start) || date.isAfter(end)) {
                    continue;
               }

               String label = "Week " + date.get(weekFields.weekOfWeekBasedYear());
               weekCounts.put(label, weekCounts.getOrDefault(label, 0L) + 1);
          }

          List<Map<String, Object>> result = new ArrayList<>();

          for (Map.Entry<String, Long> entry : weekCounts.entrySet()) {
               Map<String, Object> item = new LinkedHashMap<>();
               item.put("week", entry.getKey());
               item.put("sessions", entry.getValue());
               result.add(item);
          }

          return result;
     }

     private List<String> buildInsights(
               long totalFocusMinutes,
               long completedSessions,
               long interruptedSessions,
               long activeDaysThisWeek,
               String mostFocusedSubject,
               int productivityScore) {

          List<String> insights = new ArrayList<>();

          if (completedSessions == 0) {
               insights.add("Start your first Pomodoro session to generate real productivity insights.");
               insights.add("Try one 25-minute focused session today to build your study streak.");
               insights.add("Link sessions with subjects to see subject-wise focus analytics.");
               return insights;
          }

          insights.add("You completed " + completedSessions + " focus sessions in the last 7 days.");
          insights.add("Your total focused study time is " + totalFocusMinutes + " minutes.");
          insights.add("Your most focused subject is " + mostFocusedSubject + ".");

          if (activeDaysThisWeek >= 5) {
               insights.add("Great consistency! You were active on " + activeDaysThisWeek + " days this week.");
          } else {
               insights.add("Try to reach at least 5 active study days this week for stronger consistency.");
          }

          if (interruptedSessions > 0) {
               insights.add("You had " + interruptedSessions
                         + " interrupted sessions. Reduce distractions before starting.");
          }

          if (productivityScore >= 70) {
               insights.add("Your productivity score is strong. Keep following the same study rhythm.");
          } else {
               insights.add("Your productivity score can improve with regular short focus sessions.");
          }

          return insights;
     }
}