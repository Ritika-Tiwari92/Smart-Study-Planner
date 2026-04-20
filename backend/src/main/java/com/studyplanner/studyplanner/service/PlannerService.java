package com.studyplanner.studyplanner.service;

import com.studyplanner.studyplanner.exception.ResourceNotFoundException;
import com.studyplanner.studyplanner.model.Planner;
import com.studyplanner.studyplanner.model.User;
import com.studyplanner.studyplanner.repository.PlannerRepository;
import com.studyplanner.studyplanner.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PlannerService {

     private final PlannerRepository plannerRepository;
     private final UserRepository userRepository;

     public PlannerService(PlannerRepository plannerRepository, UserRepository userRepository) {
          this.plannerRepository = plannerRepository;
          this.userRepository = userRepository;
     }

     public List<Planner> getAllPlans(Long userId) {
          return plannerRepository.findByUserId(userId);
     }

     public Planner getPlanById(Long userId, Long id) {
          return plannerRepository.findByIdAndUserId(id, userId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                              "Planner not found with id: " + id + " for userId: " + userId));
     }

     public Planner createPlan(Long userId, Planner planner) {
          User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

          planner.setUser(user);
          return plannerRepository.save(planner);
     }

     public Planner updatePlan(Long userId, Long id, Planner updatedPlanner) {
          Planner existingPlanner = plannerRepository.findByIdAndUserId(id, userId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                              "Planner not found with id: " + id + " for userId: " + userId));

          existingPlanner.setTitle(updatedPlanner.getTitle());
          existingPlanner.setSubject(updatedPlanner.getSubject());
          existingPlanner.setTime(updatedPlanner.getTime());
          existingPlanner.setDate(updatedPlanner.getDate());
          existingPlanner.setStatus(updatedPlanner.getStatus());
          existingPlanner.setDescription(updatedPlanner.getDescription());

          return plannerRepository.save(existingPlanner);
     }

     public void deletePlan(Long userId, Long id) {
          Planner existingPlanner = plannerRepository.findByIdAndUserId(id, userId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                              "Planner not found with id: " + id + " for userId: " + userId));

          plannerRepository.delete(existingPlanner);
     }
}