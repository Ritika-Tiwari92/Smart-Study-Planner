package com.studyplanner.studyplanner.service;

import com.studyplanner.studyplanner.model.Subject;
import com.studyplanner.studyplanner.model.User;
import com.studyplanner.studyplanner.repository.SubjectRepository;
import com.studyplanner.studyplanner.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Subject business logic.
 * All methods take email (from JWT) instead of userId (from frontend).
 * This guarantees users only touch their own data.
 */
@Service
public class SubjectService {

     private final SubjectRepository subjectRepository;
     private final UserRepository userRepository;

     public SubjectService(SubjectRepository subjectRepository, UserRepository userRepository) {
          this.subjectRepository = subjectRepository;
          this.userRepository = userRepository;
     }

     // Helper — find user by email or throw
     private User getUserByEmail(String email) {
          return userRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));
     }

     public List<Subject> getSubjectsByEmail(String email) {
          User user = getUserByEmail(email);
          return subjectRepository.findByUserId(user.getId());
     }

     public Subject addSubjectByEmail(String email, Subject subject) {
          User user = getUserByEmail(email);

          // Check duplicate subject name for this user
          boolean exists = subjectRepository.findByUserId(user.getId())
                    .stream()
                    .anyMatch(s -> s.getSubjectName()
                              .equalsIgnoreCase(subject.getSubjectName()));
          if (exists) {
               throw new IllegalArgumentException(
                         "Subject '" + subject.getSubjectName() + "' already exists");
          }

          subject.setUser(user);
          return subjectRepository.save(subject);
     }

     public Subject updateSubjectByEmail(String email, Long subjectId, Subject updated) {
          User user = getUserByEmail(email);
          Subject existing = subjectRepository.findById(subjectId)
                    .orElseThrow(() -> new IllegalArgumentException("Subject not found"));

          // Security check — make sure this subject belongs to the requesting user
          if (!existing.getUser().getId().equals(user.getId())) {
               throw new IllegalArgumentException("Access denied: subject belongs to another user");
          }

          existing.setSubjectName(updated.getSubjectName());
          existing.setCode(updated.getCode());
          existing.setChapters(updated.getChapters());
          existing.setProgress(updated.getProgress());
          existing.setIconClass(updated.getIconClass());
          existing.setDescription(updated.getDescription());
          existing.setDifficultyLevel(updated.getDifficultyLevel());
          return subjectRepository.save(existing);
     }

     public void deleteSubjectByEmail(String email, Long subjectId) {
          User user = getUserByEmail(email);
          Subject existing = subjectRepository.findById(subjectId)
                    .orElseThrow(() -> new IllegalArgumentException("Subject not found"));

          // Security check — user can only delete their own subjects
          if (!existing.getUser().getId().equals(user.getId())) {
               throw new IllegalArgumentException("Access denied: subject belongs to another user");
          }

          subjectRepository.deleteById(subjectId);
     }
}