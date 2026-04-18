package com.studyplanner.studyplanner.service;

import com.studyplanner.studyplanner.model.Planner;
import com.studyplanner.studyplanner.repository.PlannerRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PlannerService {

     private final PlannerRepository plannerRepository;

     public PlannerService(PlannerRepository plannerRepository) {
          this.plannerRepository = plannerRepository;
     }

     public List<Planner> getAllPlans() {
          return plannerRepository.findAll();
     }

     public Optional<Planner> getPlanById(Long id) {
          return plannerRepository.findById(id);
     }

     public Planner createPlan(Planner planner) {
          return plannerRepository.save(planner);
     }

     public Planner updatePlan(Long id, Planner updatedPlanner) {
          Planner existingPlanner = plannerRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Planner not found with id: " + id));

          existingPlanner.setTitle(updatedPlanner.getTitle());
          existingPlanner.setSubject(updatedPlanner.getSubject());
          existingPlanner.setTime(updatedPlanner.getTime());
          existingPlanner.setDate(updatedPlanner.getDate());
          existingPlanner.setStatus(updatedPlanner.getStatus());
          existingPlanner.setDescription(updatedPlanner.getDescription());

          return plannerRepository.save(existingPlanner);
     }

     public void deletePlan(Long id) {
          if (!plannerRepository.existsById(id)) {
               throw new RuntimeException("Planner not found with id: " + id);
          }
          plannerRepository.deleteById(id);
     }
}