package com.studyplanner.studyplanner.service;

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
          return subjectRepository.save(subject);
     }

     public List<Subject> getAllSubjects() {
          return subjectRepository.findAll();
     }
}