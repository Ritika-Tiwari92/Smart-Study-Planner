package com.studyplanner.studyplanner.service;

import com.studyplanner.studyplanner.model.*;
import com.studyplanner.studyplanner.repository.*;
import org.springframework.stereotype.Service;
import jakarta.annotation.PostConstruct;

import java.time.LocalDate;
import java.util.*;

@Service
public class BadgeService {

     private final BadgeRepository badgeRepository;
     private final UserBadgeRepository userBadgeRepository;
     private final UserRepository userRepository;
     private final StudySessionRepository studySessionRepository;
     private final VideoProgressRepository videoProgressRepository;
     private final DailyActivityRepository dailyActivityRepository;
     private final StudyVideoRepository studyVideoRepository;

     public BadgeService(
               BadgeRepository badgeRepository,
               UserBadgeRepository userBadgeRepository,
               UserRepository userRepository,
               StudySessionRepository studySessionRepository,
               VideoProgressRepository videoProgressRepository,
               DailyActivityRepository dailyActivityRepository,
               StudyVideoRepository studyVideoRepository) {
          this.badgeRepository = badgeRepository;
          this.userBadgeRepository = userBadgeRepository;
          this.userRepository = userRepository;
          this.studySessionRepository = studySessionRepository;
          this.videoProgressRepository = videoProgressRepository;
          this.dailyActivityRepository = dailyActivityRepository;
          this.studyVideoRepository = studyVideoRepository;
     }

     // ════════════════════════════════════════════
     // SEED BADGES ON APP START
     // ════════════════════════════════════════════
     @PostConstruct
     public void seedBadges() {
          seedIfMissing("First Steps",
                    "Complete your first video or topic.",
                    "fa-shoe-prints", "FIRST_VIDEO", 1);

          seedIfMissing("Getting Serious",
                    "Complete 10 videos or topics.",
                    "fa-fire", "TEN_VIDEOS", 10);

          seedIfMissing("Streak Master",
                    "Maintain a 7-day study streak.",
                    "fa-calendar-check", "STREAK_7", 7);

          seedIfMissing("Focus Warrior",
                    "Complete 10 Pomodoro sessions.",
                    "fa-stopwatch", "TEN_SESSIONS", 10);

          seedIfMissing("Deep Learner",
                    "Accumulate 5 hours of total focus time.",
                    "fa-brain", "FOCUS_5H", 18000);

          seedIfMissing("Subject Champion",
                    "Complete all videos in any one subject.",
                    "fa-trophy", "SUBJECT_CHAMPION", 1);

          seedIfMissing("Comeback Learner",
                    "Study again after 3 or more inactive days.",
                    "fa-rotate-left", "COMEBACK", 3);
     }

     private void seedIfMissing(String name, String description,
               String icon, String ruleType, int ruleValue) {
          if (badgeRepository.findByRuleType(ruleType).isEmpty()) {
               Badge badge = new Badge();
               badge.setName(name);
               badge.setDescription(description);
               badge.setIcon(icon);
               badge.setRuleType(ruleType);
               badge.setRuleValue(ruleValue);
               badgeRepository.save(badge);
          }
     }

     // ════════════════════════════════════════════
     // GET ALL BADGES WITH USER STATUS
     // ════════════════════════════════════════════
     public List<Map<String, Object>> getUserBadges(String email) {
          User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("User not found."));

          List<Badge> allBadges = badgeRepository.findAll();
          List<UserBadge> unlockedBadges = userBadgeRepository.findByUserId(user.getId());

          Map<Long, UserBadge> unlockedMap = new HashMap<>();
          for (UserBadge ub : unlockedBadges) {
               unlockedMap.put(ub.getBadge().getId(), ub);
          }

          List<Map<String, Object>> result = new ArrayList<>();
          for (Badge badge : allBadges) {
               Map<String, Object> entry = new LinkedHashMap<>();
               entry.put("id", badge.getId());
               entry.put("name", badge.getName());
               entry.put("description", badge.getDescription());
               entry.put("icon", badge.getIcon());
               entry.put("ruleType", badge.getRuleType());

               UserBadge ub = unlockedMap.get(badge.getId());
               entry.put("unlocked", ub != null);
               entry.put("unlockedAt", ub != null ? ub.getUnlockedAt().toString() : null);
               result.add(entry);
          }

          return result;
     }

     // ════════════════════════════════════════════
     // CHECK AND UNLOCK BADGES
     // Call after session complete or video complete
     // ════════════════════════════════════════════
     public List<String> checkAndUnlockBadges(String email) {
          User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("User not found."));

          List<String> newlyUnlocked = new ArrayList<>();

          checkFirstVideo(user, newlyUnlocked);
          checkTenVideos(user, newlyUnlocked);
          checkStreak7(user, newlyUnlocked);
          checkTenSessions(user, newlyUnlocked);
          checkFocus5H(user, newlyUnlocked);
          checkSubjectChampion(user, newlyUnlocked);
          checkComeback(user, newlyUnlocked);

          return newlyUnlocked;
     }

     // ── Rule: Complete 1 video ───────────────────
     private void checkFirstVideo(User user, List<String> unlocked) {
          if (alreadyUnlocked(user, "FIRST_VIDEO"))
               return;
          long count = videoProgressRepository.countByUserIdAndCompletedTrue(user.getId());
          if (count >= 1)
               unlock(user, "FIRST_VIDEO", unlocked);
     }

     // ── Rule: Complete 10 videos ─────────────────
     private void checkTenVideos(User user, List<String> unlocked) {
          if (alreadyUnlocked(user, "TEN_VIDEOS"))
               return;
          long count = videoProgressRepository.countByUserIdAndCompletedTrue(user.getId());
          if (count >= 10)
               unlock(user, "TEN_VIDEOS", unlocked);
     }

     // ── Rule: 7-day streak ───────────────────────
     private void checkStreak7(User user, List<String> unlocked) {
          if (alreadyUnlocked(user, "STREAK_7"))
               return;
          List<DailyActivity> activeDays = dailyActivityRepository
                    .findByUserIdAndActiveDayTrueOrderByActivityDateDesc(user.getId());
          int streak = calculateCurrentStreak(activeDays);
          if (streak >= 7)
               unlock(user, "STREAK_7", unlocked);
     }

     // ── Rule: 10 Pomodoro sessions ───────────────
     private void checkTenSessions(User user, List<String> unlocked) {
          if (alreadyUnlocked(user, "TEN_SESSIONS"))
               return;
          long count = studySessionRepository.countByUserIdAndStatus(
                    user.getId(), StudySession.Status.COMPLETED);
          if (count >= 10)
               unlock(user, "TEN_SESSIONS", unlocked);
     }

     // ── Rule: 5 hours total focus ────────────────
     private void checkFocus5H(User user, List<String> unlocked) {
          if (alreadyUnlocked(user, "FOCUS_5H"))
               return;
          Long totalSeconds = studySessionRepository.sumFocusSecondsByUserId(user.getId());
          if (totalSeconds != null && totalSeconds >= 18000) {
               unlock(user, "FOCUS_5H", unlocked);
          }
     }

     // ── Rule: Complete all videos in a subject ───
     private void checkSubjectChampion(User user, List<String> unlocked) {
          if (alreadyUnlocked(user, "SUBJECT_CHAMPION"))
               return;

          List<VideoProgress> completed = videoProgressRepository
                    .findByUserIdAndCompletedTrue(user.getId());

          if (completed.isEmpty())
               return;

          // Group completed count by subjectId
          Map<Long, Integer> completedPerSubject = new HashMap<>();
          for (VideoProgress vp : completed) {
               Long subjectId = vp.getVideo().getSubject().getId();
               completedPerSubject.merge(subjectId, 1, Integer::sum);
          }

          // Check if any subject has all its videos completed
          for (Map.Entry<Long, Integer> entry : completedPerSubject.entrySet()) {
               long totalVideos = studyVideoRepository.countBySubjectId(entry.getKey());
               if (totalVideos > 0 && entry.getValue() >= totalVideos) {
                    unlock(user, "SUBJECT_CHAMPION", unlocked);
                    return;
               }
          }
     }

     // ── Rule: Comeback after 3 inactive days ─────
     private void checkComeback(User user, List<String> unlocked) {
          if (alreadyUnlocked(user, "COMEBACK"))
               return;

          List<DailyActivity> allActivity = dailyActivityRepository
                    .findByUserIdOrderByActivityDateDesc(user.getId());

          if (allActivity.size() < 2)
               return;

          DailyActivity latest = allActivity.get(0);
          if (!latest.isActiveDay())
               return;

          // Find previous active day
          DailyActivity previousActive = null;
          for (int i = 1; i < allActivity.size(); i++) {
               if (allActivity.get(i).isActiveDay()) {
                    previousActive = allActivity.get(i);
                    break;
               }
          }

          if (previousActive == null)
               return;

          long gap = latest.getActivityDate().toEpochDay()
                    - previousActive.getActivityDate().toEpochDay();

          if (gap >= 3)
               unlock(user, "COMEBACK", unlocked);
     }

     // ── Helper: calculate current streak ─────────
     private int calculateCurrentStreak(List<DailyActivity> activeDays) {
          if (activeDays.isEmpty())
               return 0;

          List<LocalDate> dates = activeDays.stream()
                    .map(DailyActivity::getActivityDate)
                    .sorted(Comparator.reverseOrder())
                    .toList();

          LocalDate today = LocalDate.now();
          LocalDate yesterday = today.minusDays(1);
          LocalDate latest = dates.get(0);

          if (!latest.equals(today) && !latest.equals(yesterday))
               return 0;

          int streak = 0;
          LocalDate expected = latest;
          for (LocalDate date : dates) {
               if (date.equals(expected)) {
                    streak++;
                    expected = expected.minusDays(1);
               } else {
                    break;
               }
          }
          return streak;
     }

     // ── Helper: check if badge already unlocked ──
     private boolean alreadyUnlocked(User user, String ruleType) {
          return userBadgeRepository
                    .existsByUserIdAndBadgeRuleType(user.getId(), ruleType);
     }

     // ── Helper: save unlock record ───────────────
     private void unlock(User user, String ruleType, List<String> unlocked) {
          badgeRepository.findByRuleType(ruleType).ifPresent(badge -> {
               if (userBadgeRepository
                         .findByUserIdAndBadgeId(user.getId(), badge.getId())
                         .isEmpty()) {
                    UserBadge ub = new UserBadge();
                    ub.setUser(user);
                    ub.setBadge(badge);
                    userBadgeRepository.save(ub);
                    unlocked.add(badge.getName());
               }
          });
     }
}