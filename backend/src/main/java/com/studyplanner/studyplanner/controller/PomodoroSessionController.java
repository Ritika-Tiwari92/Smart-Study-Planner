package com.studyplanner.studyplanner.controller;

import com.studyplanner.studyplanner.model.PomodoroSession;
import com.studyplanner.studyplanner.security.JwtUtil;
import com.studyplanner.studyplanner.service.PomodoroSessionService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
public class PomodoroSessionController {

     private final PomodoroSessionService pomodoroSessionService;
     private final JwtUtil jwtUtil;

     public PomodoroSessionController(PomodoroSessionService pomodoroSessionService, JwtUtil jwtUtil) {
          this.pomodoroSessionService = pomodoroSessionService;
          this.jwtUtil = jwtUtil;
     }

     /*
      * Student: Start Pomodoro/focus session.
      *
      * POST /api/pomodoro/start
      */
     @PostMapping("/api/pomodoro/start")
     public ResponseEntity<?> startSession(
               HttpServletRequest request,
               @RequestBody(required = false) Map<String, Object> requestBody) {
          try {
               Long studentId = extractUserIdFromRequest(request);

               PomodoroSession session = pomodoroSessionService.startSession(studentId, safeBody(requestBody));

               Map<String, Object> response = new LinkedHashMap<>();
               response.put("success", true);
               response.put("message", "Pomodoro session started successfully.");
               response.put("session", session);
               response.put("id", session.getId());

               return ResponseEntity.status(HttpStatus.CREATED).body(response);

          } catch (SecurityException ex) {
               return error(HttpStatus.UNAUTHORIZED, ex.getMessage());
          } catch (IllegalArgumentException ex) {
               return error(HttpStatus.BAD_REQUEST, ex.getMessage());
          } catch (Exception ex) {
               return error(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to start Pomodoro session: " + ex.getMessage());
          }
     }

     /*
      * Student: Complete Pomodoro/focus session.
      *
      * PUT /api/pomodoro/{id}/complete
      */
     @PutMapping("/api/pomodoro/{id}/complete")
     public ResponseEntity<?> completeSession(
               HttpServletRequest request,
               @PathVariable Long id,
               @RequestBody(required = false) Map<String, Object> requestBody) {
          try {
               Long studentId = extractUserIdFromRequest(request);

               PomodoroSession session = pomodoroSessionService.completeSession(id, studentId, safeBody(requestBody));

               Map<String, Object> response = new LinkedHashMap<>();
               response.put("success", true);
               response.put("message", "Pomodoro session completed successfully.");
               response.put("session", session);

               return ResponseEntity.ok(response);

          } catch (SecurityException ex) {
               return error(HttpStatus.UNAUTHORIZED, ex.getMessage());
          } catch (IllegalArgumentException ex) {
               return error(HttpStatus.BAD_REQUEST, ex.getMessage());
          } catch (Exception ex) {
               return error(HttpStatus.INTERNAL_SERVER_ERROR,
                         "Failed to complete Pomodoro session: " + ex.getMessage());
          }
     }

     /*
      * Student: Interrupt/cancel Pomodoro/focus session.
      *
      * PUT /api/pomodoro/{id}/interrupt
      */
     @PutMapping("/api/pomodoro/{id}/interrupt")
     public ResponseEntity<?> interruptSession(
               HttpServletRequest request,
               @PathVariable Long id,
               @RequestBody(required = false) Map<String, Object> requestBody) {
          try {
               Long studentId = extractUserIdFromRequest(request);

               PomodoroSession session = pomodoroSessionService.interruptSession(id, studentId, safeBody(requestBody));

               Map<String, Object> response = new LinkedHashMap<>();
               response.put("success", true);
               response.put("message", "Pomodoro session interrupted successfully.");
               response.put("session", session);

               return ResponseEntity.ok(response);

          } catch (SecurityException ex) {
               return error(HttpStatus.UNAUTHORIZED, ex.getMessage());
          } catch (IllegalArgumentException ex) {
               return error(HttpStatus.BAD_REQUEST, ex.getMessage());
          } catch (Exception ex) {
               return error(HttpStatus.INTERNAL_SERVER_ERROR,
                         "Failed to interrupt Pomodoro session: " + ex.getMessage());
          }
     }

     /*
      * Student: Get logged-in student's Pomodoro/focus sessions.
      *
      * GET /api/pomodoro/my
      */
     @GetMapping("/api/pomodoro/my")
     public ResponseEntity<?> getMySessions(HttpServletRequest request) {
          try {
               Long studentId = extractUserIdFromRequest(request);

               List<PomodoroSession> sessions = pomodoroSessionService.getMySessions(studentId);

               Map<String, Object> response = new LinkedHashMap<>();
               response.put("success", true);
               response.put("message", "My Pomodoro sessions fetched successfully.");
               response.put("sessions", sessions);
               response.put("total", sessions.size());

               return ResponseEntity.ok(response);

          } catch (SecurityException ex) {
               return error(HttpStatus.UNAUTHORIZED, ex.getMessage());
          } catch (IllegalArgumentException ex) {
               return error(HttpStatus.BAD_REQUEST, ex.getMessage());
          } catch (Exception ex) {
               return error(HttpStatus.INTERNAL_SERVER_ERROR,
                         "Failed to fetch my Pomodoro sessions: " + ex.getMessage());
          }
     }

     /*
      * Admin: Get all Pomodoro/focus sessions.
      *
      * GET /api/admin/pomodoro/sessions
      * GET /api/admin/pomodoro/sessions?status=COMPLETED
      * GET /api/admin/pomodoro/sessions?type=POMODORO
      */
     @GetMapping("/api/admin/pomodoro/sessions")
     public ResponseEntity<?> getAdminSessions(
               HttpServletRequest request,
               @RequestParam(required = false) String status,
               @RequestParam(required = false, name = "type") String sessionType) {
          try {
               extractUserIdFromRequest(request);

               List<PomodoroSession> sessions;

               if (status != null && !status.trim().isEmpty() && !"all".equalsIgnoreCase(status)) {
                    sessions = pomodoroSessionService.getSessionsByStatus(status);
               } else if (sessionType != null && !sessionType.trim().isEmpty()
                         && !"all".equalsIgnoreCase(sessionType)) {
                    sessions = pomodoroSessionService.getSessionsByType(sessionType);
               } else {
                    sessions = pomodoroSessionService.getAllSessions();
               }

               Map<String, Object> response = new LinkedHashMap<>();
               response.put("success", true);
               response.put("message", "Admin Pomodoro sessions fetched successfully.");
               response.put("sessions", sessions);
               response.put("total", sessions.size());

               return ResponseEntity.ok(response);

          } catch (SecurityException ex) {
               return error(HttpStatus.UNAUTHORIZED, ex.getMessage());
          } catch (Exception ex) {
               return error(HttpStatus.INTERNAL_SERVER_ERROR,
                         "Failed to fetch admin Pomodoro sessions: " + ex.getMessage());
          }
     }

     /*
      * Admin: Summary cards.
      *
      * GET /api/admin/pomodoro/summary
      */
     @GetMapping("/api/admin/pomodoro/summary")
     public ResponseEntity<?> getAdminSummary(HttpServletRequest request) {
          try {
               extractUserIdFromRequest(request);

               Map<String, Object> summary = pomodoroSessionService.getAdminSummary();

               Map<String, Object> response = new LinkedHashMap<>();
               response.put("success", true);
               response.put("message", "Admin Pomodoro summary fetched successfully.");
               response.put("summary", summary);

               return ResponseEntity.ok(response);

          } catch (SecurityException ex) {
               return error(HttpStatus.UNAUTHORIZED, ex.getMessage());
          } catch (Exception ex) {
               return error(HttpStatus.INTERNAL_SERVER_ERROR,
                         "Failed to fetch admin Pomodoro summary: " + ex.getMessage());
          }
     }

     /*
      * Admin: Student-wise focus ranking.
      *
      * GET /api/admin/pomodoro/ranking
      */
     @GetMapping("/api/admin/pomodoro/ranking")
     public ResponseEntity<?> getStudentFocusRanking(HttpServletRequest request) {
          try {
               extractUserIdFromRequest(request);

               List<Map<String, Object>> ranking = pomodoroSessionService.getStudentFocusRanking();

               Map<String, Object> response = new LinkedHashMap<>();
               response.put("success", true);
               response.put("message", "Student focus ranking fetched successfully.");
               response.put("ranking", ranking);
               response.put("total", ranking.size());

               return ResponseEntity.ok(response);

          } catch (SecurityException ex) {
               return error(HttpStatus.UNAUTHORIZED, ex.getMessage());
          } catch (Exception ex) {
               return error(HttpStatus.INTERNAL_SERVER_ERROR,
                         "Failed to fetch student focus ranking: " + ex.getMessage());
          }
     }

     private Long extractUserIdFromRequest(HttpServletRequest request) {
          String authHeader = request.getHeader("Authorization");

          if (authHeader == null || authHeader.trim().isEmpty()) {
               throw new SecurityException("Authorization header is missing.");
          }

          if (!authHeader.startsWith("Bearer ")) {
               throw new SecurityException("Invalid authorization header. Bearer token is required.");
          }

          String token = authHeader.substring(7).trim();

          if (token.isEmpty()) {
               throw new SecurityException("JWT token is missing.");
          }

          try {
               return Long.valueOf(String.valueOf(jwtUtil.extractUserId(token)));
          } catch (Exception ex) {
               throw new SecurityException("Unable to extract user id from token.");
          }
     }

     private Map<String, Object> safeBody(Map<String, Object> requestBody) {
          if (requestBody == null) {
               return new LinkedHashMap<>();
          }

          return requestBody;
     }

     private ResponseEntity<Map<String, Object>> error(HttpStatus status, String message) {
          Map<String, Object> response = new LinkedHashMap<>();
          response.put("success", false);
          response.put("message", message);
          response.put("status", status.value());

          return ResponseEntity.status(status).body(response);
     }
}