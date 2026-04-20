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
     public Subject addSubject(@RequestParam Long userId, @Valid @RequestBody Subject subject) {
          return subjectService.addSubject(userId, subject);
     }

     @PutMapping("/{id}")
     public ResponseEntity<Subject> updateSubject(
               @PathVariable Long id,
               @RequestParam Long userId,
               @Valid @RequestBody Subject subject) {
          return ResponseEntity.ok(subjectService.updateSubject(userId, id, subject));
     }

     @GetMapping
     public List<Subject> getAllSubjects(@RequestParam Long userId) {
          return subjectService.getAllSubjects(userId);
     }

     @GetMapping("/{id}")
     public ResponseEntity<Subject> getSubjectById(@PathVariable Long id, @RequestParam Long userId) {
          return ResponseEntity.ok(subjectService.getSubjectById(userId, id));
     }

     @DeleteMapping("/{id}")
     public ResponseEntity<String> deleteSubject(@PathVariable Long id, @RequestParam Long userId) {
          subjectService.deleteSubject(userId, id);
          return ResponseEntity.ok("Subject deleted successfully");
     }
}