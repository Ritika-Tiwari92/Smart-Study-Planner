package com.studyplanner.studyplanner.controller;

import com.studyplanner.studyplanner.service.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * AnalyticsController
 *
 * Student Analytics APIs:
 *
 * GET /api/analytics/pomodoro
 * → Real Pomodoro analytics for logged-in student.
 *
 * Uses JWT authenticated email from UserDetails.
 * No userId is accepted from frontend to keep user-specific data safe.
 */
@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "*")
public class AnalyticsController {

     private final AnalyticsService analyticsService;

     public AnalyticsController(AnalyticsService analyticsService) {
          this.analyticsService = analyticsService;
     }

     /**
      * GET /api/analytics/pomodoro
      */
     @GetMapping("/pomodoro")
     public ResponseEntity<?> getPomodoroAnalytics(
               @AuthenticationPrincipal UserDetails userDetails) {

          try {
               if (userDetails == null) {
                    return ResponseEntity.status(401)
                              .body("Unauthorized. Please login again.");
               }

               return ResponseEntity.ok(
                         analyticsService.getPomodoroAnalytics(userDetails.getUsername()));

          } catch (Exception e) {
               e.printStackTrace();
               return ResponseEntity.internalServerError()
                         .body("Failed to load Pomodoro analytics.");
          }
     }
}