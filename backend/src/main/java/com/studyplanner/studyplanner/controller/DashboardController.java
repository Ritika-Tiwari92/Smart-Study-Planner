package com.studyplanner.studyplanner.controller;

import com.studyplanner.studyplanner.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * DashboardController — Phase 2
 *
 * APIs:
 * GET /api/dashboard/summary → stats cards (subjects, tasks, progress)
 * GET /api/dashboard/weekly-overview → weekly chart (tasks, plans, revisions,
 * tests)
 *
 * NOTE: /api/dashboard/study-summary is handled by DashboardStudyController
 * (already exists with ActivityService, BadgeService, StudySessionService)
 */
@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "*")
public class DashboardController {

     private final DashboardService dashboardService;

     public DashboardController(DashboardService dashboardService) {
          this.dashboardService = dashboardService;
     }

     /**
      * GET /api/dashboard/summary
      * Stats cards: total subjects, pending tasks, completed tasks, study progress
      */
     @GetMapping("/summary")
     public ResponseEntity<?> getDashboardSummary(
               @AuthenticationPrincipal UserDetails userDetails) {
          try {
               return ResponseEntity.ok(
                         dashboardService.getDashboardSummary(userDetails.getUsername()));
          } catch (Exception e) {
               return ResponseEntity.internalServerError()
                         .body("Failed to load dashboard summary.");
          }
     }

     /**
      * GET /api/dashboard/weekly-overview
      * Weekly chart: tasks, plans, revisions, tests per day (last 7 days)
      */
     @GetMapping("/weekly-overview")
     public ResponseEntity<?> getWeeklyOverview(
               @AuthenticationPrincipal UserDetails userDetails) {
          try {
               return ResponseEntity.ok(
                         dashboardService.getWeeklyOverview(userDetails.getUsername()));
          } catch (Exception e) {
               return ResponseEntity.internalServerError()
                         .body("Failed to load weekly overview.");
          }
     }
}