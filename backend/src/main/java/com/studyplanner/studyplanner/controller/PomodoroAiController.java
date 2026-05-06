package com.studyplanner.studyplanner.controller;

import com.studyplanner.studyplanner.dto.PomodoroAiSuggestionRequestDto;
import com.studyplanner.studyplanner.security.JwtUtil;
import com.studyplanner.studyplanner.service.GroqPomodoroAiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai/pomodoro")
@CrossOrigin(origins = "*")
public class PomodoroAiController {

     private final GroqPomodoroAiService groqPomodoroAiService;
     private final JwtUtil jwtUtil;

     public PomodoroAiController(GroqPomodoroAiService groqPomodoroAiService, JwtUtil jwtUtil) {
          this.groqPomodoroAiService = groqPomodoroAiService;
          this.jwtUtil = jwtUtil;
     }

     private Long extractUserId(String authHeader) {
          if (authHeader == null || !authHeader.startsWith("Bearer ")) {
               throw new RuntimeException("Missing or invalid Authorization header");
          }

          return jwtUtil.extractUserId(authHeader.substring(7).trim());
     }

     @GetMapping("/health")
     public ResponseEntity<?> health() {
          return ResponseEntity.ok(Map.of(
                    "message", "Pomodoro AI API is working"));
     }

     @PostMapping("/suggest")
     public ResponseEntity<?> suggest(
               @RequestHeader("Authorization") String authHeader,
               @RequestBody PomodoroAiSuggestionRequestDto request) {
          try {
               extractUserId(authHeader);

               Map<String, Object> result = groqPomodoroAiService.generateSuggestion(request);

               return ResponseEntity.ok(result);

          } catch (Exception ex) {
               return ResponseEntity.badRequest().body(Map.of(
                         "message", ex.getMessage() == null
                                   ? "Unable to generate Pomodoro AI suggestion."
                                   : ex.getMessage()));
          }
     }
}