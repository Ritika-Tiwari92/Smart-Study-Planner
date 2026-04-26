package com.studyplanner.studyplanner.controller;

import com.studyplanner.studyplanner.model.Subject;
import com.studyplanner.studyplanner.service.SubjectService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Subject endpoints — all secured.
 * userId is NEVER taken from URL. Always extracted from JWT
 * via @AuthenticationPrincipal.
 * User A cannot access User B's subjects.
 */
@RestController
@RequestMapping("/api/subjects")
@CrossOrigin(origins = "*")
public class SubjectController {

     private final SubjectService subjectService;

     public SubjectController(SubjectService subjectService) {
          this.subjectService = subjectService;
     }

     @GetMapping
     public ResponseEntity<List<Subject>> getMySubjects(
               @AuthenticationPrincipal UserDetails userDetails) {
          List<Subject> subjects = subjectService.getSubjectsByEmail(userDetails.getUsername());
          return ResponseEntity.ok(subjects);
     }

     @PostMapping
     public ResponseEntity<Subject> addSubject(
               @AuthenticationPrincipal UserDetails userDetails,
               @Valid @RequestBody Subject subject) {
          Subject saved = subjectService.addSubjectByEmail(userDetails.getUsername(), subject);
          return ResponseEntity.ok(saved);
     }

     @PutMapping("/{subjectId}")
     public ResponseEntity<Subject> updateSubject(
               @AuthenticationPrincipal UserDetails userDetails,
               @PathVariable Long subjectId,
               @Valid @RequestBody Subject subject) {
          Subject updated = subjectService.updateSubjectByEmail(
                    userDetails.getUsername(), subjectId, subject);
          return ResponseEntity.ok(updated);
     }

     @DeleteMapping("/{subjectId}")
     public ResponseEntity<String> deleteSubject(
               @AuthenticationPrincipal UserDetails userDetails,
               @PathVariable Long subjectId) {
          subjectService.deleteSubjectByEmail(userDetails.getUsername(), subjectId);
          return ResponseEntity.ok("Subject deleted successfully");
     }
}