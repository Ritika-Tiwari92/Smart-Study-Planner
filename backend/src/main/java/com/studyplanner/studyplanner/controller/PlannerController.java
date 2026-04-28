package com.studyplanner.studyplanner.controller;

import com.studyplanner.studyplanner.model.Planner;
import com.studyplanner.studyplanner.security.JwtUtil;
import com.studyplanner.studyplanner.service.PlannerService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * PlannerController — JWT based (no userId in URL/param)
 * All endpoints extract userId from Bearer token.
 */
@RestController
@RequestMapping("/api/plans")
@CrossOrigin(origins = "*")
public class PlannerController {

     private final PlannerService plannerService;
     private final JwtUtil jwtUtil;

     public PlannerController(PlannerService plannerService, JwtUtil jwtUtil) {
          this.plannerService = plannerService;
          this.jwtUtil = jwtUtil;
     }

     private Long extractUserId(String authHeader) {
          if (authHeader == null || !authHeader.startsWith("Bearer ")) {
               throw new RuntimeException("Missing or invalid Authorization header");
          }
          return jwtUtil.extractUserId(authHeader.substring(7).trim());
     }

     @GetMapping
     public ResponseEntity<List<Planner>> getAllPlans(
               @RequestHeader("Authorization") String authHeader) {
          Long userId = extractUserId(authHeader);
          return ResponseEntity.ok(plannerService.getAllPlans(userId));
     }

     @GetMapping("/{id}")
     public ResponseEntity<Planner> getPlanById(
               @RequestHeader("Authorization") String authHeader,
               @PathVariable Long id) {
          Long userId = extractUserId(authHeader);
          return ResponseEntity.ok(plannerService.getPlanById(userId, id));
     }

     @PostMapping
     public ResponseEntity<Planner> createPlan(
               @RequestHeader("Authorization") String authHeader,
               @RequestBody Planner planner) {
          Long userId = extractUserId(authHeader);
          return ResponseEntity.ok(plannerService.createPlan(userId, planner));
     }

     @PutMapping("/{id}")
     public ResponseEntity<Planner> updatePlan(
               @RequestHeader("Authorization") String authHeader,
               @PathVariable Long id,
               @RequestBody Planner planner) {
          Long userId = extractUserId(authHeader);
          return ResponseEntity.ok(plannerService.updatePlan(userId, id, planner));
     }

     @DeleteMapping("/{id}")
     public ResponseEntity<String> deletePlan(
               @RequestHeader("Authorization") String authHeader,
               @PathVariable Long id) {
          Long userId = extractUserId(authHeader);
          plannerService.deletePlan(userId, id);
          return ResponseEntity.ok("Planner deleted successfully");
     }
}