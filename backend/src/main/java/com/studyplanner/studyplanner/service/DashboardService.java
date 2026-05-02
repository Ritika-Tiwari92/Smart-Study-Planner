package com.studyplanner.studyplanner.service;

import com.studyplanner.studyplanner.model.PomodoroSession;
import com.studyplanner.studyplanner.model.PomodoroSession.SessionStatus;
import com.studyplanner.studyplanner.model.PomodoroSession.SessionType;
import com.studyplanner.studyplanner.model.Planner;
import com.studyplanner.studyplanner.model.Revision;
import com.studyplanner.studyplanner.model.Subject;
import com.studyplanner.studyplanner.model.Task;
import com.studyplanner.studyplanner.model.Test;
import com.studyplanner.studyplanner.model.User;
import com.studyplanner.studyplanner.repository.PlannerRepository;
import com.studyplanner.studyplanner.repository.PomodoroSessionRepository;
import com.studyplanner.studyplanner.repository.RevisionRepository;
import com.studyplanner.studyplanner.repository.SubjectRepository;
import com.studyplanner.studyplanner.repository.TaskRepository;
import com.studyplanner.studyplanner.repository.TestRepository;
import com.studyplanner.studyplanner.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;

/**
 * DashboardService — Phase 2 (Final Fixed Version)
 *
 * Fix:
 * - completedTests → score != null (Test.java mein status field nahi hai)
 * - Baaki sab unchanged
 */
@Service
public class DashboardService {

     private final UserRepository userRepository;
     private final SubjectRepository subjectRepository;
     private final TaskRepository taskRepository;
     private final PlannerRepository plannerRepository;
     private final RevisionRepository revisionRepository;
     private final TestRepository testRepository;
     private final PomodoroSessionRepository pomodoroRepository;

     public DashboardService(
               UserRepository userRepository,
               SubjectRepository subjectRepository,
               TaskRepository taskRepository,
               PlannerRepository plannerRepository,
               RevisionRepository revisionRepository,
               TestRepository testRepository,
               PomodoroSessionRepository pomodoroRepository) {
          this.userRepository = userRepository;
          this.subjectRepository = subjectRepository;
          this.taskRepository = taskRepository;
          this.plannerRepository = plannerRepository;
          this.revisionRepository = revisionRepository;
          this.testRepository = testRepository;
          this.pomodoroRepository = pomodoroRepository;
     }

     // ─────────────────────────────────────────
     // Helper
     // ─────────────────────────────────────────
     private User getUser(String email) {
          return userRepository.findByEmail(email.toLowerCase())
                    .orElseThrow(() -> new IllegalArgumentException("User not found."));
     }

     // ═══════════════════════════════════════════════════════════
     // 1. DASHBOARD SUMMARY — stats cards
     // ═══════════════════════════════════════════════════════════
     public Map<String, Object> getDashboardSummary(String email) {
          User user = getUser(email);
          Long userId = user.getId();
          LocalDate today = LocalDate.now();

          // Subjects
          List<Subject> subjects = subjectRepository.findByUserId(userId);

          // Tasks — Task is linked to Subject, not directly to User
          List<Task> tasks = taskRepository.findBySubjectUserId(userId);
          long totalTasks = tasks.size();
          long completedTasks = tasks.stream()
                    .filter(t -> t.getStatus() != null &&
                              t.getStatus().equalsIgnoreCase("COMPLETED"))
                    .count();
          long pendingTasks = totalTasks - completedTasks;
          int studyProgress = totalTasks > 0
                    ? (int) Math.round((completedTasks * 100.0) / totalTasks)
                    : 0;

          // Plans
          List<Planner> plans = plannerRepository.findByUserId(userId);
          long todayPlans = plans.stream()
                    .filter(p -> today.equals(p.getDate()))
                    .count();

          // Revisions
          List<Revision> revisions = revisionRepository.findByUserId(userId);
          long pendingRevisions = revisions.stream()
                    .filter(r -> r.getStatus() == null ||
                              !r.getStatus().equalsIgnoreCase("COMPLETED"))
                    .count();

          // Tests — status field nahi hai, score != null = attempted/completed
          List<Test> tests = testRepository.findByUserId(userId);
          long completedTests = tests.stream()
                    .filter(t -> t.getScore() != null) // ← FIX
                    .count();
          double avgScore = tests.stream()
                    .filter(t -> t.getScore() != null)
                    .mapToDouble(Test::getScore)
                    .average()
                    .orElse(0.0);

          Map<String, Object> summary = new LinkedHashMap<>();
          summary.put("totalSubjects", subjects.size());
          summary.put("totalTasks", totalTasks);
          summary.put("pendingTasks", pendingTasks);
          summary.put("completedTasks", completedTasks);
          summary.put("studyProgressPercent", studyProgress);
          summary.put("todayPlans", todayPlans);
          summary.put("pendingRevisions", pendingRevisions);
          summary.put("completedTests", completedTests);
          summary.put("avgTestScore", Math.round(avgScore * 10.0) / 10.0);
          return summary;
     }

     // ═══════════════════════════════════════════════════════════
     // 2. STUDY SUMMARY — study engine
     // ═══════════════════════════════════════════════════════════
     public Map<String, Object> getStudySummary(String email) {
          User user = getUser(email);
          Long userId = user.getId();
          LocalDate today = LocalDate.now();

          Map<String, Object> result = new LinkedHashMap<>();
          result.put("today", buildTodayStats(userId, today));
          result.put("streak", buildStreakData(userId, today));
          result.put("badges", buildBadgesData(userId));
          result.put("calendar", buildCalendarData(userId, today));
          result.put("weekly", buildWeeklyAnalytics(userId, today));
          return result;
     }

     private Map<String, Object> buildTodayStats(Long userId, LocalDate today) {
          List<PomodoroSession> allRecent = pomodoroRepository
                    .findCompletedFocusSessionsFromDate(userId, today);

          List<PomodoroSession> todayOnly = allRecent.stream()
                    .filter(s -> today.equals(s.getSessionDate()))
                    .toList();

          long focusMinutes = todayOnly.stream()
                    .mapToLong(s -> s.getActualDurationMinutes() != null
                              ? s.getActualDurationMinutes()
                              : 0)
                    .sum();
          long sessionsCompleted = todayOnly.size();
          long videosCompleted = sessionsCompleted;
          int targetVideos = 3;
          int progressPercent = targetVideos > 0
                    ? (int) Math.min(100, Math.round((videosCompleted * 100.0) / targetVideos))
                    : 0;

          Map<String, Object> map = new LinkedHashMap<>();
          map.put("focusMinutes", focusMinutes);
          map.put("sessionsCompleted", sessionsCompleted);
          map.put("videosCompleted", videosCompleted);
          map.put("targetVideos", targetVideos);
          map.put("progressPercent", progressPercent);
          return map;
     }

     private Map<String, Object> buildStreakData(Long userId, LocalDate today) {
          LocalDate from90 = today.minusDays(90);
          List<PomodoroSession> sessions = pomodoroRepository
                    .findCompletedFocusSessionsFromDate(userId, from90);

          Set<LocalDate> activeDays = new TreeSet<>();
          sessions.forEach(s -> {
               if (s.getSessionDate() != null)
                    activeDays.add(s.getSessionDate());
          });

          // Current streak — from today going back
          int currentStreak = 0;
          LocalDate checkDay = today;
          while (activeDays.contains(checkDay)) {
               currentStreak++;
               checkDay = checkDay.minusDays(1);
          }
          // If today not active, check from yesterday
          if (currentStreak == 0) {
               checkDay = today.minusDays(1);
               while (activeDays.contains(checkDay)) {
                    currentStreak++;
                    checkDay = checkDay.minusDays(1);
               }
          }

          // Longest streak
          int longestStreak = 0;
          int tempStreak = 0;
          LocalDate prev = null;
          for (LocalDate day : activeDays) {
               if (prev == null || day.equals(prev.plusDays(1))) {
                    tempStreak++;
               } else {
                    longestStreak = Math.max(longestStreak, tempStreak);
                    tempStreak = 1;
               }
               prev = day;
          }
          longestStreak = Math.max(longestStreak, tempStreak);

          Map<String, Object> map = new LinkedHashMap<>();
          map.put("currentStreak", currentStreak);
          map.put("longestStreak", longestStreak);
          return map;
     }

     private Map<String, Object> buildBadgesData(Long userId) {
          long totalFocusMinutes = pomodoroRepository.sumTotalFocusMinutes(userId);
          long totalSessions = pomodoroRepository.countByUserIdAndSessionTypeAndStatus(
                    userId, SessionType.FOCUS, SessionStatus.COMPLETED);
          long subjectLinked = pomodoroRepository
                    .countSubjectLinkedCompletedSessions(userId);

          List<Map<String, Object>> badges = new ArrayList<>();
          badges.add(buildBadge("First Focus", "fa-seedling",
                    "Complete your first Pomodoro session",
                    totalSessions >= 1));
          badges.add(buildBadge("Hour Master", "fa-clock",
                    "Complete 60 minutes of focus time",
                    totalFocusMinutes >= 60));
          badges.add(buildBadge("Deep Learner", "fa-brain",
                    "Complete 10 Pomodoro sessions",
                    totalSessions >= 10));
          badges.add(buildBadge("Subject Hero", "fa-book",
                    "Link 5 sessions to subjects",
                    subjectLinked >= 5));
          badges.add(buildBadge("Focus Champion", "fa-trophy",
                    "Complete 25 Pomodoro sessions",
                    totalSessions >= 25));
          badges.add(buildBadge("Hour Legend", "fa-bolt",
                    "Complete 300 minutes of focus time",
                    totalFocusMinutes >= 300));
          badges.add(buildBadge("Study Legend", "fa-star",
                    "Complete 500 minutes of focus time",
                    totalFocusMinutes >= 500));

          long unlocked = badges.stream()
                    .filter(b -> (boolean) b.get("unlocked"))
                    .count();

          Map<String, Object> map = new LinkedHashMap<>();
          map.put("unlockedBadges", unlocked);
          map.put("totalBadges", badges.size());
          map.put("badges", badges);
          return map;
     }

     private Map<String, Object> buildBadge(
               String name, String icon, String description, boolean unlocked) {
          Map<String, Object> badge = new LinkedHashMap<>();
          badge.put("name", name);
          badge.put("icon", icon);
          badge.put("description", description);
          badge.put("unlocked", unlocked);
          return badge;
     }

     private List<Map<String, Object>> buildCalendarData(Long userId, LocalDate today) {
          LocalDate from30 = today.minusDays(29);

          List<Object[]> dailyFocus = pomodoroRepository
                    .findDailyFocusMinutes(userId, from30);

          Map<LocalDate, Long> focusMap = new HashMap<>();
          for (Object[] row : dailyFocus) {
               LocalDate date = (LocalDate) row[0];
               Long mins = ((Number) row[1]).longValue();
               focusMap.put(date, mins);
          }

          List<PomodoroSession> sessions = pomodoroRepository
                    .findCompletedFocusSessionsFromDate(userId, from30);
          Map<LocalDate, Long> sessionMap = new HashMap<>();
          sessions.forEach(s -> {
               if (s.getSessionDate() != null)
                    sessionMap.merge(s.getSessionDate(), 1L, Long::sum);
          });

          List<Map<String, Object>> calendar = new ArrayList<>();
          for (int i = 29; i >= 0; i--) {
               LocalDate day = today.minusDays(i);
               long focusMins = focusMap.getOrDefault(day, 0L);
               long sessionCount = sessionMap.getOrDefault(day, 0L);
               boolean active = focusMins > 0 || sessionCount > 0;

               Map<String, Object> dayMap = new LinkedHashMap<>();
               dayMap.put("date", day.toString());
               dayMap.put("active", active);
               dayMap.put("focusMinutes", focusMins);
               dayMap.put("sessionsCompleted", sessionCount);
               dayMap.put("videosCompleted", sessionCount);
               calendar.add(dayMap);
          }
          return calendar;
     }

     private Map<String, Object> buildWeeklyAnalytics(Long userId, LocalDate today) {
          LocalDate from7 = today.minusDays(6);

          List<Object[]> dailyFocus = pomodoroRepository
                    .findDailyFocusMinutes(userId, from7);

          long totalFocusMinutes = 0;
          long bestDayMins = 0;
          String bestDay = "—";

          for (Object[] row : dailyFocus) {
               LocalDate date = (LocalDate) row[0];
               long mins = ((Number) row[1]).longValue();
               totalFocusMinutes += mins;
               if (mins > bestDayMins) {
                    bestDayMins = mins;
                    String raw = date.getDayOfWeek().toString();
                    bestDay = raw.charAt(0) + raw.substring(1).toLowerCase();
               }
          }

          long sessionsThisWeek = pomodoroRepository
                    .findCompletedFocusSessionsFromDate(userId, from7)
                    .stream()
                    .filter(s -> !s.getSessionDate().isBefore(from7))
                    .count();

          long activeDays = pomodoroRepository
                    .countDistinctActiveDays(userId, from7, today);

          Map<String, Object> map = new LinkedHashMap<>();
          map.put("totalFocusMinutes", totalFocusMinutes);
          map.put("videosWatched", sessionsThisWeek);
          map.put("sessionsCompleted", sessionsThisWeek);
          map.put("activeDays", activeDays);
          map.put("bestDay", bestDay);
          return map;
     }

     // ═══════════════════════════════════════════════════════════
     // 3. WEEKLY OVERVIEW — chart data
     // ═══════════════════════════════════════════════════════════
     public List<Map<String, Object>> getWeeklyOverview(String email) {
          User user = getUser(email);
          Long userId = user.getId();
          LocalDate today = LocalDate.now();

          List<Task> tasks = taskRepository.findBySubjectUserId(userId);
          List<Planner> plans = plannerRepository.findByUserId(userId);
          List<Revision> revisions = revisionRepository.findByUserId(userId);
          List<Test> tests = testRepository.findByUserId(userId);

          List<Map<String, Object>> result = new ArrayList<>();

          for (int i = 6; i >= 0; i--) {
               LocalDate day = today.minusDays(i);
               String raw = day.getDayOfWeek().toString();
               String dayLabel = raw.charAt(0) + raw.substring(1).toLowerCase();

               long taskCount = tasks.stream()
                         .filter(t -> day.equals(t.getDueDate())).count();
               long planCount = plans.stream()
                         .filter(p -> day.equals(p.getDate())).count();
               long revisionCount = revisions.stream()
                         .filter(r -> day.equals(r.getRevisionDate())).count();
               long testCount = tests.stream()
                         .filter(t -> day.equals(t.getTestDate())).count();

               Map<String, Object> dayMap = new LinkedHashMap<>();
               dayMap.put("date", day.toString());
               dayMap.put("label", dayLabel);
               dayMap.put("tasks", taskCount);
               dayMap.put("plans", planCount);
               dayMap.put("revisions", revisionCount);
               dayMap.put("tests", testCount);
               dayMap.put("total", taskCount + planCount + revisionCount + testCount);
               result.add(dayMap);
          }

          return result;

     }
}
