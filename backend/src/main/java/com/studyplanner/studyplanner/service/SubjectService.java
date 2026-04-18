package com.studyplanner.studyplanner.service;

import com.studyplanner.studyplanner.exception.ResourceNotFoundException;
import com.studyplanner.studyplanner.model.Subject;
import com.studyplanner.studyplanner.repository.SubjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SubjectService {

     @Autowired
     private SubjectRepository subjectRepository;

     public Subject addSubject(Subject subject) {
          applyDefaults(subject);
          return subjectRepository.save(subject);
     }

     public List<Subject> getAllSubjects() {
          return subjectRepository.findAll();
     }

     public Subject getSubjectById(Long id) {
          return subjectRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Subject not found with id: " + id));
     }

     public Subject updateSubject(Long id, Subject updatedSubject) {
          Subject existing = subjectRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Subject not found with id: " + id));

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

     public void deleteSubject(Long id) {
          if (!subjectRepository.existsById(id)) {
               throw new ResourceNotFoundException("Subject not found with id: " + id);
          }
          subjectRepository.deleteById(id);
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