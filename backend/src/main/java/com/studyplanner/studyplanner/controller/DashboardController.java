package com.studyplanner.studyplanner.controller;

import com.studyplanner.studyplanner.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * DashboardController
 *
 * APIs:
 * GET /api/dashboard/summary
 * GET /api/dashboard/weekly-overview
 *
 * NOTE:
 * GET /api/dashboard/study-summary is already handled by
 * DashboardStudyController.
 * Do not add study-summary here, otherwise ambiguous mapping error will come.
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
      */
     @GetMapping("/summary")
     public ResponseEntity<?> getDashboardSummary(
               @AuthenticationPrincipal UserDetails userDetails) {

          try {
               if (userDetails == null) {
                    return ResponseEntity.status(401).body("Unauthorized. Please login again.");
               }

               return ResponseEntity.ok(
                         dashboardService.getDashboardSummary(userDetails.getUsername()));

          } catch (Exception e) {
               e.printStackTrace();
               return ResponseEntity.internalServerError()
                         .body("Failed to load dashboard summary.");
          }
     }

     /**
      * GET /api/dashboard/weekly-overview
      */
     @GetMapping("/weekly-overview")
     public ResponseEntity<?> getWeeklyOverview(
               @AuthenticationPrincipal UserDetails userDetails) {

          try {
               if (userDetails == null) {
                    return ResponseEntity.status(401).body("Unauthorized. Please login again.");
               }

               return ResponseEntity.ok(
                         dashboardService.getWeeklyOverview(userDetails.getUsername()));

          } catch (Exception e) {
               e.printStackTrace();
               return ResponseEntity.internalServerError()
                         .body("Failed to load weekly overview.");
          }
     }
}