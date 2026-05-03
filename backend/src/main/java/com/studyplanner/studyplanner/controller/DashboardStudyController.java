package com.studyplanner.studyplanner.controller;

import com.studyplanner.studyplanner.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * DashboardStudyController
 *
 * GET /api/dashboard/study-summary
 *
 * This endpoint now uses the new Pomodoro-based DashboardService.
 * It returns:
 * - Today's focus minutes
 * - Sessions completed today
 * - Current streak
 * - 30-day activity calendar
 * - Badges
 * - Weekly Pomodoro analytics
 */
@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "*")
public class DashboardStudyController {

     private final DashboardService dashboardService;

     public DashboardStudyController(DashboardService dashboardService) {
          this.dashboardService = dashboardService;
     }

     @GetMapping("/study-summary")
     public ResponseEntity<?> getStudySummary(
               @AuthenticationPrincipal UserDetails userDetails) {

          try {
               if (userDetails == null || userDetails.getUsername() == null) {
                    return ResponseEntity.status(401)
                              .body(Map.of(
                                        "success", false,
                                        "message", "Unauthorized. Please login again."));
               }

               String email = userDetails.getUsername();

               Map<String, Object> summary = dashboardService.getStudySummary(email);

               return ResponseEntity.ok(summary);

          } catch (IllegalArgumentException ex) {
               return ResponseEntity.badRequest()
                         .body(Map.of(
                                   "success", false,
                                   "message", ex.getMessage()));
          } catch (Exception ex) {
               return ResponseEntity.internalServerError()
                         .body(Map.of(
                                   "success", false,
                                   "message", "Failed to load study summary.",
                                   "error", ex.getMessage()));
          }
     }
}