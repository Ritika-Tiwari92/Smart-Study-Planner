package com.studyplanner.studyplanner.service;

import com.studyplanner.studyplanner.model.Subject;
import com.studyplanner.studyplanner.repository.SubjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.studyplanner.studyplanner.exception.ResourceNotFoundException;
import java.util.List;

@Service
public class SubjectService {

     @Autowired
     private SubjectRepository subjectRepository;

     public Subject addSubject(Subject subject) {
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
          existing.setDifficultyLevel(updatedSubject.getDifficultyLevel());

          return subjectRepository.save(existing);
     }

     public void deleteSubject(Long id) {
          if (!subjectRepository.existsById(id)) {
               throw new ResourceNotFoundException("Subject not found with id: " + id);
          }
          subjectRepository.deleteById(id);
     }

}