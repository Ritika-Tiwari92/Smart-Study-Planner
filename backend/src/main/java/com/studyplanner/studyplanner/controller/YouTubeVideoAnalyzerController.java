package com.studyplanner.studyplanner.controller;

import com.studyplanner.studyplanner.dto.YouTubeVideoAnalyzeRequestDto;
import com.studyplanner.studyplanner.dto.YouTubeVideoAnalyzeResponseDto;
import com.studyplanner.studyplanner.security.JwtUtil;
import com.studyplanner.studyplanner.service.YouTubeVideoAnalyzerService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/youtube")
@CrossOrigin(origins = "*")
public class YouTubeVideoAnalyzerController {

     private final YouTubeVideoAnalyzerService youTubeVideoAnalyzerService;
     private final JwtUtil jwtUtil;

     public YouTubeVideoAnalyzerController(
               YouTubeVideoAnalyzerService youTubeVideoAnalyzerService,
               JwtUtil jwtUtil) {
          this.youTubeVideoAnalyzerService = youTubeVideoAnalyzerService;
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
                    "message", "YouTube analyzer API is working"));
     }

     @PostMapping("/analyze")
     public ResponseEntity<?> analyzeVideo(
               @RequestHeader("Authorization") String authHeader,
               @RequestBody YouTubeVideoAnalyzeRequestDto request) {
          try {
               extractUserId(authHeader);

               YouTubeVideoAnalyzeResponseDto response = youTubeVideoAnalyzerService
                         .analyzeVideo(request.getVideoUrl());

               return ResponseEntity.ok(response);

          } catch (Exception ex) {
               return ResponseEntity.badRequest().body(Map.of(
                         "message", ex.getMessage() == null
                                   ? "Unable to analyze YouTube video."
                                   : ex.getMessage()));
          }
     }
}