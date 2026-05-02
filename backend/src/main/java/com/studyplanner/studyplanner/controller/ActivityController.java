package com.studyplanner.studyplanner.controller;

import com.studyplanner.studyplanner.service.ActivityService;
import com.studyplanner.studyplanner.service.BadgeService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * ActivityController
 *
 * GET /api/activity/today
 * GET /api/activity/weekly
 * GET /api/activity/calendar?days=30
 * GET /api/activity/streak
 * GET /api/badges/my
 * POST /api/badges/check
 */
@RestController
@CrossOrigin(origins = "*")
public class ActivityController {

     private final ActivityService activityService;
     private final BadgeService badgeService;

     public ActivityController(ActivityService activityService,
               BadgeService badgeService) {
          this.activityService = activityService;
          this.badgeService = badgeService;
     }

     // ── Today summary ────────────────────────────
     @GetMapping("/api/activity/today")
     public ResponseEntity<?> getToday(
               @AuthenticationPrincipal UserDetails userDetails) {
          try {
               return ResponseEntity.ok(
                         activityService.getTodaySummary(userDetails.getUsername()));
          } catch (IllegalArgumentException ex) {
               return ResponseEntity.badRequest()
                         .body(Map.of("error", ex.getMessage()));
          }
     }

     // ── Weekly summary ───────────────────────────
     @GetMapping("/api/activity/weekly")
     public ResponseEntity<?> getWeekly(
               @AuthenticationPrincipal UserDetails userDetails) {
          try {
               return ResponseEntity.ok(
                         activityService.getWeeklySummary(userDetails.getUsername()));
          } catch (IllegalArgumentException ex) {
               return ResponseEntity.badRequest()
                         .body(Map.of("error", ex.getMessage()));
          }
     }

     // ── 30-day calendar ──────────────────────────
     @GetMapping("/api/activity/calendar")
     public ResponseEntity<?> getCalendar(
               @AuthenticationPrincipal UserDetails userDetails,
               @RequestParam(defaultValue = "30") int days) {
          try {
               // Cap between 7 and 90 days
               int safeDays = Math.max(7, Math.min(90, days));
               return ResponseEntity.ok(
                         activityService.getCalendar(userDetails.getUsername(), safeDays));
          } catch (IllegalArgumentException ex) {
               return ResponseEntity.badRequest()
                         .body(Map.of("error", ex.getMessage()));
          }
     }

     // ── Streak ───────────────────────────────────
     @GetMapping("/api/activity/streak")
     public ResponseEntity<?> getStreak(
               @AuthenticationPrincipal UserDetails userDetails) {
          try {
               return ResponseEntity.ok(
                         activityService.getStreak(userDetails.getUsername()));
          } catch (IllegalArgumentException ex) {
               return ResponseEntity.badRequest()
                         .body(Map.of("error", ex.getMessage()));
          }
     }

     // ── My badges ────────────────────────────────
     @GetMapping("/api/badges/my")
     public ResponseEntity<?> getMyBadges(
               @AuthenticationPrincipal UserDetails userDetails) {
          try {
               return ResponseEntity.ok(
                         badgeService.getUserBadges(userDetails.getUsername()));
          } catch (IllegalArgumentException ex) {
               return ResponseEntity.badRequest()
                         .body(Map.of("error", ex.getMessage()));
          }
     }

     // ── Check and unlock badges ──────────────────
     @PostMapping("/api/badges/check")
     public ResponseEntity<?> checkBadges(
               @AuthenticationPrincipal UserDetails userDetails) {
          try {
               List<String> newBadges = badgeService
                         .checkAndUnlockBadges(userDetails.getUsername());
               return ResponseEntity.ok(Map.of(
                         "newlyUnlocked", newBadges,
                         "count", newBadges.size()));
          } catch (IllegalArgumentException ex) {
               return ResponseEntity.badRequest()
                         .body(Map.of("error", ex.getMessage()));
          }
     }

     @GetMapping("/api/activity/best-time")
     public ResponseEntity<?> getBestStudyTime(
               @AuthenticationPrincipal UserDetails userDetails) {
          try {
               return ResponseEntity.ok(
                         activityService.getBestStudyTime(userDetails.getUsername()));
          } catch (IllegalArgumentException ex) {
               return ResponseEntity.badRequest()
                         .body(Map.of("error", ex.getMessage()));
          }
     }

     @PutMapping("/api/activity/target")
     public ResponseEntity<?> updateDailyTarget(
               @AuthenticationPrincipal UserDetails userDetails,
               @RequestBody Map<String, Object> body) {
          try {
               int target = Integer.valueOf(body.get("target").toString());
               return ResponseEntity.ok(
                         activityService.updateDailyTarget(
                                   userDetails.getUsername(), target));
          } catch (IllegalArgumentException ex) {
               return ResponseEntity.badRequest()
                         .body(Map.of("error", ex.getMessage()));
          }
     }
}