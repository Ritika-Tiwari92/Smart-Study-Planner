package com.studyplanner.studyplanner.service;

import com.studyplanner.studyplanner.model.DailyActivity;
import com.studyplanner.studyplanner.model.User;
import com.studyplanner.studyplanner.repository.DailyActivityRepository;
import com.studyplanner.studyplanner.repository.StudySessionRepository;
import com.studyplanner.studyplanner.repository.UserRepository;
import com.studyplanner.studyplanner.repository.VideoProgressRepository;
import com.studyplanner.studyplanner.model.StudySession.Status;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.DayOfWeek;
import java.util.*;

@Service
public class ActivityService {

     private final DailyActivityRepository dailyActivityRepository;
     private final StudySessionRepository studySessionRepository;
     private final VideoProgressRepository videoProgressRepository;
     private final UserRepository userRepository;

     public ActivityService(
               DailyActivityRepository dailyActivityRepository,
               StudySessionRepository studySessionRepository,
               VideoProgressRepository videoProgressRepository,
               UserRepository userRepository) {
          this.dailyActivityRepository = dailyActivityRepository;
          this.studySessionRepository = studySessionRepository;
          this.videoProgressRepository = videoProgressRepository;
          this.userRepository = userRepository;
     }

     // ── Get user ─────────────────────────────────
     private User getUser(String email) {
          return userRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("User not found."));
     }

     // ════════════════════════════════════════════
     // TODAY SUMMARY
     // ════════════════════════════════════════════
     public Map<String, Object> getTodaySummary(String email) {
          User user = getUser(email);
          LocalDate today = LocalDate.now();

          // Get or create today's activity
          DailyActivity activity = dailyActivityRepository
                    .findByUserIdAndActivityDate(user.getId(), today)
                    .orElse(null);

          int focusSeconds = activity != null ? activity.getFocusSeconds() : 0;
          int videosCompleted = activity != null ? activity.getVideosCompleted() : 0;
          int sessionsCompleted = activity != null ? activity.getSessionsCompleted() : 0;
          int targetVideos = activity != null ? activity.getTargetVideos() : 3;

          int progressPct = targetVideos > 0
                    ? Math.min(100, (videosCompleted * 100) / targetVideos)
                    : 0;

          Map<String, Object> result = new LinkedHashMap<>();
          result.put("focusSeconds", focusSeconds);
          result.put("focusMinutes", focusSeconds / 60);
          result.put("videosCompleted", videosCompleted);
          result.put("sessionsCompleted", sessionsCompleted);
          result.put("targetVideos", targetVideos);
          result.put("progressPercent", progressPct);
          result.put("activeDay", activity != null && activity.isActiveDay());
          return result;
     }

     // ════════════════════════════════════════════
     // WEEKLY SUMMARY
     // ════════════════════════════════════════════
     public Map<String, Object> getWeeklySummary(String email) {
          User user = getUser(email);

          LocalDate today = LocalDate.now();
          LocalDate weekStart = today.minusDays(6);

          List<DailyActivity> weekActivity = dailyActivityRepository
                    .findByUserIdAndActivityDateBetween(user.getId(), weekStart, today);

          int totalFocusSeconds = 0;
          int totalVideos = 0;
          int totalSessions = 0;
          String bestDay = "—";
          int bestDayCount = 0;

          for (DailyActivity da : weekActivity) {
               totalFocusSeconds += da.getFocusSeconds();
               totalVideos += da.getVideosCompleted();
               totalSessions += da.getSessionsCompleted();

               // Best day = day with most sessions + videos
               int dayScore = da.getSessionsCompleted() + da.getVideosCompleted();
               if (dayScore > bestDayCount) {
                    bestDayCount = dayScore;
                    bestDay = da.getActivityDate()
                              .getDayOfWeek()
                              .getDisplayName(
                                        java.time.format.TextStyle.FULL,
                                        Locale.ENGLISH);
               }
          }

          Map<String, Object> result = new LinkedHashMap<>();
          result.put("totalFocusSeconds", totalFocusSeconds);
          result.put("totalFocusMinutes", totalFocusSeconds / 60);
          result.put("videosWatched", totalVideos);
          result.put("sessionsCompleted", totalSessions);
          result.put("bestDay", bestDay);
          result.put("activeDays", weekActivity.stream()
                    .filter(DailyActivity::isActiveDay).count());
          return result;
     }

     // ════════════════════════════════════════════
     // 30-DAY CALENDAR
     // ════════════════════════════════════════════
     public List<Map<String, Object>> getCalendar(String email, int days) {
          User user = getUser(email);

          LocalDate today = LocalDate.now();
          LocalDate from = today.minusDays(days - 1);

          List<DailyActivity> activityList = dailyActivityRepository
                    .findByUserIdAndActivityDateBetween(user.getId(), from, today);

          // Index by date for quick lookup
          Map<LocalDate, DailyActivity> activityMap = new HashMap<>();
          for (DailyActivity da : activityList) {
               activityMap.put(da.getActivityDate(), da);
          }

          // Build one entry per day
          List<Map<String, Object>> calendar = new ArrayList<>();

          for (int i = days - 1; i >= 0; i--) {
               LocalDate date = today.minusDays(i);
               DailyActivity da = activityMap.get(date);

               Map<String, Object> entry = new LinkedHashMap<>();
               entry.put("date", date.toString());
               entry.put("focusMinutes", da != null ? da.getFocusSeconds() / 60 : 0);
               entry.put("focusSeconds", da != null ? da.getFocusSeconds() : 0);
               entry.put("videosCompleted", da != null ? da.getVideosCompleted() : 0);
               entry.put("sessionsCompleted", da != null ? da.getSessionsCompleted() : 0);
               entry.put("active", da != null && da.isActiveDay());

               calendar.add(entry);
          }

          return calendar;
     }

     // ════════════════════════════════════════════
     // STREAK CALCULATION
     // ════════════════════════════════════════════
     public Map<String, Object> getStreak(String email) {
          User user = getUser(email);

          // Get all active days sorted newest first
          List<DailyActivity> activeDays = dailyActivityRepository
                    .findByUserIdAndActiveDayTrueOrderByActivityDateDesc(user.getId());

          if (activeDays.isEmpty()) {
               Map<String, Object> result = new LinkedHashMap<>();
               result.put("currentStreak", 0);
               result.put("longestStreak", 0);
               result.put("lastActiveDate", null);
               return result;
          }

          LocalDate today = LocalDate.now();
          LocalDate yesterday = today.minusDays(1);

          // Extract just the dates
          List<LocalDate> dates = activeDays.stream()
                    .map(DailyActivity::getActivityDate)
                    .sorted(Comparator.reverseOrder())
                    .toList();

          // ── Current streak ───────────────────────
          int currentStreak = 0;
          LocalDate lastActiveDate = dates.get(0);

          // Streak is valid only if user was active today or yesterday
          if (lastActiveDate.equals(today) || lastActiveDate.equals(yesterday)) {
               LocalDate expected = lastActiveDate;
               for (LocalDate date : dates) {
                    if (date.equals(expected)) {
                         currentStreak++;
                         expected = expected.minusDays(1);
                    } else {
                         break;
                    }
               }
          }

          // ── Longest streak ───────────────────────
          int longestStreak = 0;
          int runningStreak = 1;

          // Sort ascending for longest streak calc
          List<LocalDate> ascending = new ArrayList<>(dates);
          Collections.sort(ascending);

          for (int i = 1; i < ascending.size(); i++) {
               LocalDate prev = ascending.get(i - 1);
               LocalDate curr = ascending.get(i);

               if (curr.equals(prev.plusDays(1))) {
                    runningStreak++;
               } else {
                    longestStreak = Math.max(longestStreak, runningStreak);
                    runningStreak = 1;
               }
          }
          longestStreak = Math.max(longestStreak, runningStreak);

          Map<String, Object> result = new LinkedHashMap<>();
          result.put("currentStreak", currentStreak);
          result.put("longestStreak", longestStreak);
          result.put("lastActiveDate", lastActiveDate.toString());
          return result;
     }
}
