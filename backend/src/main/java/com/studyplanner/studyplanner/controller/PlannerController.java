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
     public List<Planner> getAllPlans() {
          return plannerService.getAllPlans();
     }

     @GetMapping("/{id}")
     public ResponseEntity<Planner> getPlanById(@PathVariable Long id) {
          return plannerService.getPlanById(id)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
     }

     @PostMapping
     public ResponseEntity<Planner> createPlan(@RequestBody Planner planner) {
          Planner savedPlan = plannerService.createPlan(planner);
          return ResponseEntity.ok(savedPlan);
     }

     @PutMapping("/{id}")
     public ResponseEntity<Planner> updatePlan(@PathVariable Long id, @RequestBody Planner planner) {
          Planner updatedPlan = plannerService.updatePlan(id, planner);
          return ResponseEntity.ok(updatedPlan);
     }

     @DeleteMapping("/{id}")
     public ResponseEntity<String> deletePlan(@PathVariable Long id) {
          plannerService.deletePlan(id);
          return ResponseEntity.ok("Planner deleted successfully");
     }
}