package com.studyplanner.studyplanner.service;

import com.studyplanner.studyplanner.exception.ResourceNotFoundException;
import com.studyplanner.studyplanner.model.Subject;
import com.studyplanner.studyplanner.model.User;
import com.studyplanner.studyplanner.repository.SubjectRepository;
import com.studyplanner.studyplanner.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SubjectService {

     @Autowired
     private SubjectRepository subjectRepository;

     @Autowired
     private UserRepository userRepository;

     public Subject addSubject(Long userId, Subject subject) {
          User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

          subject.setUser(user);
          applyDefaults(subject);

          return subjectRepository.save(subject);
     }

     public List<Subject> getAllSubjects(Long userId) {
          return subjectRepository.findByUserId(userId);
     }

     public Subject getSubjectById(Long userId, Long id) {
          return subjectRepository.findByIdAndUserId(id, userId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                              "Subject not found with id: " + id + " for userId: " + userId));
     }

     public Subject updateSubject(Long userId, Long id, Subject updatedSubject) {
          Subject existing = subjectRepository.findByIdAndUserId(id, userId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                              "Subject not found with id: " + id + " for userId: " + userId));

          existing.setSubjectName(updatedSubject.getSubjectName());
          existing.setCode(updatedSubject.getCode());
          existing.setChapters(updatedSubject.getChapters());
          existing.setProgress(updatedSubject.getProgress());
          existing.setIconClass(updatedSubject.getIconClass());
          existing.setDescription(updatedSubject.getDescription());
          existing.setDifficultyLevel(updatedSubject.getDifficultyLevel());

          applyDefaults(existing);

          return subjectRepository.save(existing);
     }

     public void deleteSubject(Long userId, Long id) {
          Subject existing = subjectRepository.findByIdAndUserId(id, userId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                              "Subject not found with id: " + id + " for userId: " + userId));

          subjectRepository.delete(existing);
     }

     private void applyDefaults(Subject subject) {
          if (subject.getCode() == null) {
               subject.setCode("");
          }

          if (subject.getChapters() == null) {
               subject.setChapters(0);
          }

          if (subject.getProgress() == null) {
               subject.setProgress(0);
          }

          if (subject.getIconClass() == null || subject.getIconClass().isBlank()) {
               subject.setIconClass("fa-code");
          }

          if (subject.getDescription() == null) {
               subject.setDescription("");
          }
     }
}