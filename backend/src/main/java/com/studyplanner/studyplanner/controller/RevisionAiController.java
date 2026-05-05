package com.studyplanner.studyplanner.controller;

import com.studyplanner.studyplanner.dto.RevisionAiRequestDto;
import com.studyplanner.studyplanner.security.JwtUtil;
import com.studyplanner.studyplanner.service.GroqRevisionAiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai/revisions")
@CrossOrigin(origins = "*")
public class RevisionAiController {

     private final GroqRevisionAiService groqRevisionAiService;
     private final JwtUtil jwtUtil;

     public RevisionAiController(GroqRevisionAiService groqRevisionAiService, JwtUtil jwtUtil) {
          this.groqRevisionAiService = groqRevisionAiService;
          this.jwtUtil = jwtUtil;
     }

     private Long extractUserId(String authHeader) {
          if (authHeader == null || !authHeader.startsWith("Bearer ")) {
               throw new RuntimeException("Missing or invalid Authorization header");
          }

          return jwtUtil.extractUserId(authHeader.substring(7).trim());
     }

     @PostMapping("/analyze")
     public ResponseEntity<?> analyzeRevision(
               @RequestHeader("Authorization") String authHeader,
               @RequestBody RevisionAiRequestDto request) {

          try {
               extractUserId(authHeader);

               Map<String, Object> result = groqRevisionAiService.analyzeRevision(request);

               return ResponseEntity.ok(result);

          } catch (RuntimeException ex) {
               return ResponseEntity.badRequest().body(Map.of(
                         "message", ex.getMessage()));
          }
     }

     @GetMapping("/health")
     public ResponseEntity<?> health() {
          return ResponseEntity.ok(Map.of(
                    "message", "Revision AI API is working"));
     }
}