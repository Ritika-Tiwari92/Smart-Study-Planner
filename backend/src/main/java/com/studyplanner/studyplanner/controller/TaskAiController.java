package com.studyplanner.studyplanner.controller;

import com.studyplanner.studyplanner.dto.TaskAiRequestDto;
import com.studyplanner.studyplanner.security.JwtUtil;
import com.studyplanner.studyplanner.service.GroqTaskAiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai/tasks")
@CrossOrigin(origins = "*")
public class TaskAiController {

     private final GroqTaskAiService groqTaskAiService;
     private final JwtUtil jwtUtil;

     public TaskAiController(GroqTaskAiService groqTaskAiService, JwtUtil jwtUtil) {
          this.groqTaskAiService = groqTaskAiService;
          this.jwtUtil = jwtUtil;
     }

     private Long extractUserId(String authHeader) {
          if (authHeader == null || !authHeader.startsWith("Bearer ")) {
               throw new RuntimeException("Missing or invalid Authorization header");
          }

          return jwtUtil.extractUserId(authHeader.substring(7).trim());
     }

     @PostMapping("/analyze")
     public ResponseEntity<?> analyzeTask(
               @RequestHeader("Authorization") String authHeader,
               @RequestBody TaskAiRequestDto request) {

          try {
               extractUserId(authHeader);

               Map<String, Object> result = groqTaskAiService.analyzeTask(request);

               return ResponseEntity.ok(result);

          } catch (RuntimeException ex) {
               return ResponseEntity.badRequest().body(Map.of(
                         "message", ex.getMessage()));
          }
     }

     @GetMapping("/health")
     public ResponseEntity<?> health() {
          return ResponseEntity.ok(Map.of(
                    "message", "Task AI API is working"));
     }
}