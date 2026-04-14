package com.studyplanner.studyplanner.controller;

import com.studyplanner.studyplanner.model.Subject;
import com.studyplanner.studyplanner.service.SubjectService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/subjects")
@CrossOrigin("*")
public class SubjectController {

     @Autowired
     private SubjectService subjectService;

     @PostMapping
     public Subject addSubject(@Valid @RequestBody Subject subject) {
          return subjectService.addSubject(subject);
     }

     @PutMapping("/{id}")
     public ResponseEntity<Subject> updateSubject(@PathVariable Long id, @Valid @RequestBody Subject subject) {
          return ResponseEntity.ok(subjectService.updateSubject(id, subject));
     }

     @GetMapping
     public List<Subject> getAllSubjects() {
          return subjectService.getAllSubjects();
     }

     @GetMapping("/{id}")
     public ResponseEntity<Subject> getSubjectById(@PathVariable Long id) {
          return ResponseEntity.ok(subjectService.getSubjectById(id));
     }

     @DeleteMapping("/{id}")
     public ResponseEntity<String> deleteSubject(@PathVariable Long id) {
          subjectService.deleteSubject(id);
          return ResponseEntity.ok("Subject deleted successfully");
     }

}