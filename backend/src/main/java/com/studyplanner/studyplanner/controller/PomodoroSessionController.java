package com.studyplanner.studyplanner.controller;

import com.studyplanner.studyplanner.dto.*;
import com.studyplanner.studyplanner.service.PomodoroSessionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pomodoro")
@CrossOrigin(origins = "*")
public class PomodoroSessionController {

     @Autowired
     private PomodoroSessionService pomodoroService;

     // ─── Start Session ────────────────────────────────────────────────────────
     @PostMapping("/sessions/start/{userId}")
     public ResponseEntity<?> startSession(
               @PathVariable Long userId,
               @RequestBody PomodoroSessionRequest request) {
          try {
               PomodoroSessionResponse response = pomodoroService.startSession(userId, request);
               return ResponseEntity.ok(response);
          } catch (Exception ex) {
               return ResponseEntity.badRequest().body(ex.getMessage());
          }
     }

     // ─── Complete / Cancel Session ────────────────────────────────────────────
     @PutMapping("/sessions/{sessionId}/update/{userId}")
     public ResponseEntity<?> updateSession(
               @PathVariable Long sessionId,
               @PathVariable Long userId,
               @RequestBody PomodoroSessionUpdateRequest request) {
          try {
               PomodoroSessionResponse response = pomodoroService.updateSession(sessionId, userId, request);
               return ResponseEntity.ok(response);
          } catch (Exception ex) {
               return ResponseEntity.badRequest().body(ex.getMessage());
          }
     }

     // ─── Get All Sessions ─────────────────────────────────────────────────────
     @GetMapping("/sessions/{userId}")
     public ResponseEntity<?> getAllSessions(@PathVariable Long userId) {
          try {
               return ResponseEntity.ok(pomodoroService.getAllSessions(userId));
          } catch (Exception ex) {
               return ResponseEntity.badRequest().body(ex.getMessage());
          }
     }

     // ─── Get Analytics ────────────────────────────────────────────────────────
     @GetMapping("/analytics/{userId}")
     public ResponseEntity<?> getAnalytics(@PathVariable Long userId) {
          try {
               return ResponseEntity.ok(pomodoroService.getAnalytics(userId));
          } catch (Exception ex) {
               return ResponseEntity.badRequest().body(ex.getMessage());
          }
     }

     // ─── Get Subject Stats ────────────────────────────────────────────────────
     @GetMapping("/analytics/subjects/{userId}")
     public ResponseEntity<?> getSubjectStats(@PathVariable Long userId) {
          try {
               return ResponseEntity.ok(pomodoroService.getSubjectStats(userId));
          } catch (Exception ex) {
               return ResponseEntity.badRequest().body(ex.getMessage());
          }
     }

     // ─── Health Check ─────────────────────────────────────────────────────────
     @GetMapping("/ping")
     public ResponseEntity<Map<String, String>> ping() {
          return ResponseEntity.ok(Map.of("status", "Pomodoro API is running ✅"));
     }
}