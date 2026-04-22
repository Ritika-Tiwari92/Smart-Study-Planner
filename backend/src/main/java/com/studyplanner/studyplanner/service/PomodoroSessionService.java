package com.studyplanner.studyplanner.service;

import com.studyplanner.studyplanner.dto.*;
import com.studyplanner.studyplanner.model.PomodoroSession;
import com.studyplanner.studyplanner.model.PomodoroSession.SessionStatus;
import com.studyplanner.studyplanner.model.PomodoroSession.SessionType;
import com.studyplanner.studyplanner.model.User;
import com.studyplanner.studyplanner.repository.PomodoroSessionRepository;
import com.studyplanner.studyplanner.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class PomodoroSessionService {

     @Autowired
     private PomodoroSessionRepository pomodoroRepo;

     @Autowired
     private UserRepository userRepository;

     // ─── Start Session ────────────────────────────────────────────────────────

     public PomodoroSessionResponse startSession(Long userId, PomodoroSessionRequest req) {

          User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

          PomodoroSession session = new PomodoroSession();
          session.setUser(user);
          session.setSessionType(SessionType.valueOf(req.getSessionType()));
          session.setStatus(SessionStatus.IN_PROGRESS);
          session.setPlannedDurationMinutes(req.getPlannedDurationMinutes());
          session.setLinkedSubjectName(req.getLinkedSubjectName());
          session.setLinkedTaskId(req.getLinkedTaskId());
          session.setLinkedRevisionId(req.getLinkedRevisionId());
          session.setLinkedPlanId(req.getLinkedPlanId());
          session.setCycleNumber(req.getCycleNumber() != null ? req.getCycleNumber() : 1);
          session.setNotes(req.getNotes());
          session.setStartedAt(LocalDateTime.now());
          session.setSessionDate(LocalDate.now());

          PomodoroSession saved = pomodoroRepo.save(session);
          return PomodoroSessionResponse.fromEntity(saved);
     }

     // ─── Complete / Cancel Session ────────────────────────────────────────────

     public PomodoroSessionResponse updateSession(Long sessionId, Long userId,
               PomodoroSessionUpdateRequest req) {

          PomodoroSession session = pomodoroRepo.findByIdAndUserId(sessionId, userId)
                    .orElseThrow(() -> new RuntimeException("Session not found"));

          session.setStatus(SessionStatus.valueOf(req.getStatus()));
          session.setActualDurationMinutes(req.getActualDurationMinutes());
          session.setEndedAt(LocalDateTime.now());

          PomodoroSession updated = pomodoroRepo.save(session);
          return PomodoroSessionResponse.fromEntity(updated);
     }

     // ─── Get All Sessions ─────────────────────────────────────────────────────

     public List<PomodoroSessionResponse> getAllSessions(Long userId) {
          return pomodoroRepo.findByUserIdOrderByCreatedAtDesc(userId)
                    .stream()
                    .map(PomodoroSessionResponse::fromEntity)
                    .collect(Collectors.toList());
     }

     // ─── Analytics ────────────────────────────────────────────────────────────

     public PomodoroAnalyticsResponse getAnalytics(Long userId) {

          PomodoroAnalyticsResponse analytics = new PomodoroAnalyticsResponse();
          LocalDate today = LocalDate.now();
          LocalDate sevenDaysAgo = today.minusDays(6);
          LocalDate thirtyDaysAgo = today.minusDays(29);

          // ── Total focus minutes ──
          long totalFocusMinutes = pomodoroRepo.sumTotalFocusMinutes(userId);
          analytics.setTotalFocusMinutes(totalFocusMinutes);

          // ── Total completed sessions ──
          long completedSessions = pomodoroRepo.countByUserIdAndSessionTypeAndStatus(
                    userId, SessionType.FOCUS, SessionStatus.COMPLETED);
          analytics.setTotalCompletedSessions(completedSessions);

          // ── Total interrupted sessions ──
          long interruptedSessions = pomodoroRepo.countByUserIdAndSessionTypeAndStatusIn(
                    userId, SessionType.FOCUS,
                    Arrays.asList(SessionStatus.INTERRUPTED, SessionStatus.CANCELLED));
          analytics.setTotalInterruptedSessions(interruptedSessions);

          // ── Average daily focus (last 7 days) ──
          List<Object[]> dailyRaw = pomodoroRepo.findDailyFocusMinutes(userId, sevenDaysAgo);
          long totalLast7Days = dailyRaw.stream()
                    .mapToLong(row -> row[1] != null ? ((Number) row[1]).longValue() : 0)
                    .sum();
          analytics.setAverageDailyFocusMinutes(
                    dailyRaw.isEmpty() ? 0 : Math.round((double) totalLast7Days / 7.0 * 10.0) / 10.0);

          // ── Active days this week ──
          LocalDate startOfWeek = today.minusDays(today.getDayOfWeek().getValue() - 1);
          long activeDays = pomodoroRepo.countDistinctActiveDays(userId, startOfWeek, today);
          analytics.setActiveDaysThisWeek(activeDays);

          // ── Most focused subject ──
          List<Object[]> subjectRaw = pomodoroRepo.findSubjectWiseFocusMinutes(userId);
          String topSubject = subjectRaw.isEmpty() ? "None" : (String) subjectRaw.get(0)[0];
          analytics.setMostFocusedSubject(topSubject);

          // ── Break balance ratio ──
          long breakSessions = pomodoroRepo.countCompletedBreakSessions(userId);
          double breakRatio = completedSessions > 0
                    ? Math.round((double) breakSessions / completedSessions * 100.0) / 100.0
                    : 0;
          analytics.setBreakBalanceRatio(breakRatio);

          // ── Daily focus chart data ──
          List<Map<String, Object>> dailyFocusData = buildDailyFocusData(dailyRaw, sevenDaysAgo, today);
          analytics.setDailyFocusData(dailyFocusData);

          // ── Subject focus chart data ──
          List<Map<String, Object>> subjectData = subjectRaw.stream().map(row -> {
               Map<String, Object> map = new LinkedHashMap<>();
               map.put("subject", row[0]);
               map.put("minutes", ((Number) row[1]).longValue());
               return map;
          }).collect(Collectors.toList());
          analytics.setSubjectFocusData(subjectData);

          // ── Weekly sessions chart data ──
          List<Object[]> weeklyRaw = pomodoroRepo.findWeeklySessionCounts(userId, thirtyDaysAgo);
          List<Map<String, Object>> weeklyData = buildWeeklyData(weeklyRaw);
          analytics.setWeeklySessionData(weeklyData);

          // ── Productivity score ──
          long totalAttempted = completedSessions + interruptedSessions;
          long subjectLinked = pomodoroRepo.countSubjectLinkedCompletedSessions(userId);
          int score = calculateProductivityScore(
                    completedSessions, totalAttempted, activeDays, totalLast7Days, subjectLinked, breakRatio);
          analytics.setProductivityScore(score);
          analytics.setProductivityLabel(getProductivityLabel(score));

          // ── Insights ──
          analytics.setInsights(generateInsights(
                    analytics, topSubject, completedSessions,
                    interruptedSessions, activeDays, breakRatio, dailyFocusData));

          return analytics;
     }

     // ─── Productivity Score Formula ───────────────────────────────────────────
     // Score = A(35) + B(25) + C(20) + D(10) + E(10)
     // A = completion rate
     // B = daily consistency this week
     // C = weekly focus volume vs target (100 min/week)
     // D = subject-linked session bonus
     // E = break balance bonus

     private int calculateProductivityScore(long completed, long totalAttempted,
               long activeDays, long focusMinutesLast7,
               long subjectLinked, double breakRatio) {
          double scoreA = totalAttempted > 0 ? ((double) completed / totalAttempted) * 35 : 0;
          double scoreB = (activeDays / 7.0) * 25;
          double scoreC = Math.min((double) focusMinutesLast7 / 100.0, 1.0) * 20;
          double scoreD = completed > 0 ? ((double) subjectLinked / completed) * 10 : 0;

          // Break ratio is healthy between 0.2 and 0.4
          double scoreE;
          if (breakRatio >= 0.2 && breakRatio <= 0.4) {
               scoreE = 10;
          } else if (breakRatio > 0 && breakRatio < 0.2) {
               scoreE = (breakRatio / 0.2) * 10;
          } else if (breakRatio > 0.4) {
               scoreE = Math.max(0, 10 - (breakRatio - 0.4) * 20);
          } else {
               scoreE = 0;
          }

          return (int) Math.round(scoreA + scoreB + scoreC + scoreD + scoreE);
     }

     private String getProductivityLabel(int score) {
          if (score >= 85)
               return "Excellent 🌟";
          if (score >= 65)
               return "Strong 💪";
          if (score >= 45)
               return "Improving 📈";
          return "Low Consistency 🔄";
     }

     // ─── Insight Generator ────────────────────────────────────────────────────

     private List<String> generateInsights(PomodoroAnalyticsResponse analytics,
               String topSubject, long completed,
               long interrupted, long activeDays,
               double breakRatio,
               List<Map<String, Object>> dailyData) {
          List<String> insights = new ArrayList<>();

          // Most productive day
          String mostProductiveDay = findMostProductiveDay(dailyData);
          if (mostProductiveDay != null) {
               insights.add("📅 You were most productive on " + mostProductiveDay + ".");
          }

          // Top subject
          if (!"None".equals(topSubject)) {
               insights.add("📚 Your focus time is highest in " + topSubject + ".");
          }

          // Completed sessions
          if (completed > 0) {
               insights.add("🍅 You completed " + completed + " focus sessions this week.");
          }

          // Break ratio
          if (breakRatio >= 0.2 && breakRatio <= 0.4) {
               insights.add("⚖️ Break ratio is balanced — great study rhythm!");
          } else if (breakRatio < 0.2 && completed > 0) {
               insights.add("☕ You're skipping breaks — take short breaks to stay sharp.");
          } else if (breakRatio > 0.4) {
               insights.add("⏸️ Break time is high compared to focus time — try to balance it.");
          }

          // Interruptions
          if (interrupted > 2) {
               insights.add("⚠️ Interrupted sessions are high — reduce distractions for better focus.");
          }

          // Consistency
          if (activeDays >= 5) {
               insights.add("🔥 Excellent consistency — you studied " + activeDays + " days this week!");
          } else if (activeDays >= 3) {
               insights.add("📈 Good effort — try to be consistent every day for better results.");
          } else if (activeDays > 0) {
               insights.add("💡 Only " + activeDays + " active day(s) this week — set a daily study goal.");
          }

          if (insights.isEmpty()) {
               insights.add("🚀 Start your first Pomodoro session to see insights here!");
          }

          return insights;
     }

     // ─── Helper: Build daily focus data with 0s for missing days ─────────────

     private List<Map<String, Object>> buildDailyFocusData(
               List<Object[]> rawData, LocalDate from, LocalDate to) {

          Map<LocalDate, Long> dbMap = new LinkedHashMap<>();
          for (Object[] row : rawData) {
               dbMap.put((LocalDate) row[0], ((Number) row[1]).longValue());
          }

          List<Map<String, Object>> result = new ArrayList<>();
          LocalDate current = from;
          while (!current.isAfter(to)) {
               Map<String, Object> entry = new LinkedHashMap<>();
               entry.put("date", current.toString());
               entry.put("day", current.getDayOfWeek().name().substring(0, 3)); // "MON"
               entry.put("minutes", dbMap.getOrDefault(current, 0L));
               result.add(entry);
               current = current.plusDays(1);
          }
          return result;
     }

     // ─── Helper: Build weekly data ────────────────────────────────────────────

     private List<Map<String, Object>> buildWeeklyData(List<Object[]> rawData) {
          List<Map<String, Object>> result = new ArrayList<>();
          int weekLabel = 1;
          for (Object[] row : rawData) {
               Map<String, Object> entry = new LinkedHashMap<>();
               entry.put("week", "Week " + weekLabel++);
               entry.put("sessions", ((Number) row[1]).longValue());
               result.add(entry);
          }
          return result;
     }

     // ─── Helper: Most productive day ─────────────────────────────────────────

     private String findMostProductiveDay(List<Map<String, Object>> dailyData) {
          return dailyData.stream()
                    .max(Comparator.comparingLong(m -> ((Number) m.get("minutes")).longValue()))
                    .filter(m -> ((Number) m.get("minutes")).longValue() > 0)
                    .map(m -> {
                         String day = (String) m.get("day");
                         // Convert "MON" → "Monday"
                         Map<String, String> dayNames = new LinkedHashMap<>();
                         dayNames.put("MON", "Monday");
                         dayNames.put("TUE", "Tuesday");
                         dayNames.put("WED", "Wednesday");
                         dayNames.put("THU", "Thursday");
                         dayNames.put("FRI", "Friday");
                         dayNames.put("SAT", "Saturday");
                         dayNames.put("SUN", "Sunday");
                         return dayNames.getOrDefault(day, day);
                    })
                    .orElse(null);
     }

     // ─── Subject-wise stats (dedicated endpoint ke liye) ──────────────────────

     public List<PomodoroSubjectStatResponse> getSubjectStats(Long userId) {

          List<Object[]> rawData = pomodoroRepo.findSubjectWiseFocusMinutes(userId);

          // Pehle total minutes calculate karo percentage ke liye
          long totalMinutes = rawData.stream()
                    .mapToLong(row -> ((Number) row[1]).longValue())
                    .sum();

          // Phir har subject ka data build karo
          List<PomodoroSubjectStatResponse> result = new ArrayList<>();

          for (Object[] row : rawData) {
               String subjectName = (String) row[0];
               long minutes = ((Number) row[1]).longValue();

               // Session count ke liye alag query
               // Simple approach: minutes / avg session length (25 min)
               // Ya alag query bhi likh sakte hain — abhi simple rakhte hain
               long approxSessions = Math.max(1, minutes / 25);

               double percentage = totalMinutes > 0
                         ? Math.round((double) minutes / totalMinutes * 1000.0) / 10.0
                         : 0;

               result.add(new PomodoroSubjectStatResponse(
                         subjectName, minutes, approxSessions, percentage));
          }

          return result;
     }
}