package com.studyplanner.studyplanner.controller;

import com.studyplanner.studyplanner.service.ActivityService;
import com.studyplanner.studyplanner.service.BadgeService;
import com.studyplanner.studyplanner.service.StudySessionService;
import com.studyplanner.studyplanner.service.StudyVideoService;
import com.studyplanner.studyplanner.model.StudySession;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * DashboardStudyController
 *
 * GET /api/dashboard/study-summary
 *
 * Returns everything the dashboard needs in one call:
 * - Today's focus time
 * - Daily target progress
 * - Current streak
 * - Weekly analytics
 * - Badge summary
 * - Today's sessions
 */
@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "*")
public class DashboardStudyController {

     private final ActivityService activityService;
     private final BadgeService badgeService;
     private final StudySessionService studySessionService;
     private final StudyVideoService studyVideoService;

     public DashboardStudyController(
               ActivityService activityService,
               BadgeService badgeService,
               StudySessionService studySessionService,
               StudyVideoService studyVideoService) {
          this.activityService = activityService;
          this.badgeService = badgeService;
          this.studySessionService = studySessionService;
          this.studyVideoService = studyVideoService;
     }

     // ── Full dashboard study summary ─────────────
     @GetMapping("/study-summary")
     public ResponseEntity<?> getStudySummary(
               @AuthenticationPrincipal UserDetails userDetails) {
          try {
               String email = userDetails.getUsername();

               // Today's activity
               Map<String, Object> today = activityService.getTodaySummary(email);

               // Weekly analytics
               Map<String, Object> weekly = activityService.getWeeklySummary(email);

               // Streak
               Map<String, Object> streak = activityService.getStreak(email);

               // 30-day calendar
               List<Map<String, Object>> calendar = activityService.getCalendar(email, 30);

               // Badges — count unlocked
               List<Map<String, Object>> allBadges = badgeService.getUserBadges(email);

               long unlockedCount = allBadges.stream()
                         .filter(b -> Boolean.TRUE.equals(b.get("unlocked")))
                         .count();

               Map<String, Object> badgeSummary = new LinkedHashMap<>();
               badgeSummary.put("totalBadges", allBadges.size());
               badgeSummary.put("unlockedBadges", unlockedCount);
               badgeSummary.put("badges", allBadges);

               // Today's sessions list
               List<StudySession> todaySessions = studySessionService.getTodaySessions(email);

               List<Map<String, Object>> sessionList = todaySessions.stream()
                         .map(s -> {
                              Map<String, Object> m = new LinkedHashMap<>();
                              m.put("id", s.getId());
                              m.put("subjectName", s.getSubject().getSubjectName());
                              m.put("videoTitle",
                                        s.getVideo() != null ? s.getVideo().getTitle() : null);
                              m.put("focusSeconds", s.getFocusSeconds());
                              m.put("status", s.getStatus().name());
                              m.put("startTime",
                                        s.getStartTime() != null
                                                  ? s.getStartTime().toString()
                                                  : null);
                              return m;
                         })
                         .toList();

               // Combine everything
               Map<String, Object> summary = new LinkedHashMap<>();
               summary.put("today", today);
               summary.put("weekly", weekly);
               summary.put("streak", streak);
               summary.put("calendar", calendar);
               summary.put("badges", badgeSummary);
               summary.put("todaySessions", sessionList);

               return ResponseEntity.ok(summary);

          } catch (IllegalArgumentException ex) {
               return ResponseEntity.badRequest()
                         .body(Map.of("error", ex.getMessage()));
          }
     }
}