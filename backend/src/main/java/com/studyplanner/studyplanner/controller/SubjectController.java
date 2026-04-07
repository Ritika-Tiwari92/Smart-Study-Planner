package com.studyplanner.studyplanner.controller;

import com.studyplanner.studyplanner.model.Subject;
import com.studyplanner.studyplanner.service.SubjectService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/subjects")
@CrossOrigin("*")
public class SubjectController {

     @Autowired
     private SubjectService subjectService;

     @PostMapping
     public Subject addSubject(@RequestBody Subject subject) {
          return subjectService.addSubject(subject);
     }

     @GetMapping
     public List<Subject> getAllSubjects() {
          return subjectService.getAllSubjects();
     }
}