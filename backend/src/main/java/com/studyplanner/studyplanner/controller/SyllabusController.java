package com.studyplanner.studyplanner.controller;

import com.studyplanner.studyplanner.security.JwtUtil;
import com.studyplanner.studyplanner.service.SyllabusService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/syllabus")
@CrossOrigin("*")
public class SyllabusController {

     private final SyllabusService syllabusService;
     private final JwtUtil jwtUtil;

     public SyllabusController(SyllabusService syllabusService, JwtUtil jwtUtil) {
          this.syllabusService = syllabusService;
          this.jwtUtil = jwtUtil;
     }

     private Long extractUserId(String authHeader) {
          if (authHeader == null || !authHeader.startsWith("Bearer ")) {
               throw new RuntimeException("Missing or invalid Authorization header");
          }

          return jwtUtil.extractUserId(authHeader.substring(7).trim());
     }

     @PostMapping(value = { "/analyze/{subjectId}",
               "/upload/{subjectId}" }, consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
     public ResponseEntity<?> analyzeSyllabus(
               @RequestHeader("Authorization") String authHeader,
               @PathVariable Long subjectId,
               @RequestParam("file") MultipartFile file) {

          try {
               Long userId = extractUserId(authHeader);
               Map<String, Object> result = syllabusService.analyzeAndSaveSyllabus(file, subjectId, userId);
               return ResponseEntity.ok(result);
          } catch (RuntimeException ex) {
               return ResponseEntity.badRequest().body(Map.of(
                         "message", ex.getMessage()));
          }
     }

     @GetMapping("/subject/{subjectId}")
     public ResponseEntity<?> getSyllabusAnalysis(
               @RequestHeader("Authorization") String authHeader,
               @PathVariable Long subjectId) {

          try {
               Long userId = extractUserId(authHeader);
               Map<String, Object> result = syllabusService.getAnalysisBySubject(subjectId, userId);
               return ResponseEntity.ok(result);
          } catch (RuntimeException ex) {
               return ResponseEntity.badRequest().body(Map.of(
                         "message", ex.getMessage()));
          }
     }

     @PostMapping("/subject/{subjectId}/create-weekly-plan")
     public ResponseEntity<?> createWeeklyPlan(
               @RequestHeader("Authorization") String authHeader,
               @PathVariable Long subjectId) {

          try {
               Long userId = extractUserId(authHeader);
               Map<String, Object> result = syllabusService.createWeeklyPlanFromAnalysis(subjectId, userId);
               return ResponseEntity.ok(result);
          } catch (RuntimeException ex) {
               return ResponseEntity.badRequest().body(Map.of(
                         "message", ex.getMessage()));
          }
     }

     @GetMapping("/health")
     public ResponseEntity<?> health() {
          return ResponseEntity.ok(Map.of(
                    "message", "Syllabus API is working"));
     }
}