package com.studyplanner.studyplanner.controller;

import com.studyplanner.studyplanner.model.Planner;
import com.studyplanner.studyplanner.service.PlannerService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/plans")
@CrossOrigin(origins = "*")
public class PlannerController {

     private final PlannerService plannerService;

     public PlannerController(PlannerService plannerService) {
          this.plannerService = plannerService;
     }

     @GetMapping
     public List<Planner> getAllPlans(@RequestParam Long userId) {
          return plannerService.getAllPlans(userId);
     }

     @GetMapping("/{id}")
     public ResponseEntity<Planner> getPlanById(@PathVariable Long id, @RequestParam Long userId) {
          return ResponseEntity.ok(plannerService.getPlanById(userId, id));
     }

     @PostMapping
     public ResponseEntity<Planner> createPlan(@RequestParam Long userId, @RequestBody Planner planner) {
          Planner savedPlan = plannerService.createPlan(userId, planner);
          return ResponseEntity.ok(savedPlan);
     }

     @PutMapping("/{id}")
     public ResponseEntity<Planner> updatePlan(
               @PathVariable Long id,
               @RequestParam Long userId,
               @RequestBody Planner planner) {
          Planner updatedPlan = plannerService.updatePlan(userId, id, planner);
          return ResponseEntity.ok(updatedPlan);
     }

     @DeleteMapping("/{id}")
     public ResponseEntity<String> deletePlan(@PathVariable Long id, @RequestParam Long userId) {
          plannerService.deletePlan(userId, id);
          return ResponseEntity.ok("Planner deleted successfully");
     }
}