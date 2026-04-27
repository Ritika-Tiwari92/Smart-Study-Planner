package com.studyplanner.studyplanner.controller;

import com.studyplanner.studyplanner.model.StudySession;
import com.studyplanner.studyplanner.service.StudySessionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * StudySessionController
 *
 * POST /api/study-sessions/start
 * PUT /api/study-sessions/{id}/pause
 * PUT /api/study-sessions/{id}/resume
 * PUT /api/study-sessions/{id}/complete
 * PUT /api/study-sessions/{id}/cancel
 * GET /api/study-sessions/today
 * GET /api/study-sessions/weekly
 */
@RestController
@RequestMapping("/api/study-sessions")
@CrossOrigin(origins = "*")
public class StudySessionController {

     private final StudySessionService studySessionService;

     public StudySessionController(StudySessionService studySessionService) {
          this.studySessionService = studySessionService;
     }

     // ── START ────────────────────────────────────
     @PostMapping("/start")
     public ResponseEntity<?> startSession(
               @AuthenticationPrincipal UserDetails userDetails,
               @RequestBody Map<String, Object> request) {
          try {
               Long subjectId = Long.valueOf(request.get("subjectId").toString());

               Long videoId = null;
               if (request.get("videoId") != null) {
                    videoId = Long.valueOf(request.get("videoId").toString());
               }

               Integer focusSeconds = 1500;
               if (request.get("focusSeconds") != null) {
                    focusSeconds = Integer.valueOf(request.get("focusSeconds").toString());
               }

               Integer breakSeconds = 300;
               if (request.get("breakSeconds") != null) {
                    breakSeconds = Integer.valueOf(request.get("breakSeconds").toString());
               }

               StudySession session = studySessionService.startSession(
                         userDetails.getUsername(), subjectId,
                         videoId, focusSeconds, breakSeconds);

               return ResponseEntity.ok(toMap(session));

          } catch (IllegalArgumentException ex) {
               return ResponseEntity.badRequest()
                         .body(Map.of("error", ex.getMessage()));
          }
     }

     // ── PAUSE ────────────────────────────────────
     @PutMapping("/{id}/pause")
     public ResponseEntity<?> pauseSession(
               @AuthenticationPrincipal UserDetails userDetails,
               @PathVariable Long id) {
          try {
               StudySession session = studySessionService.pauseSession(
                         userDetails.getUsername(), id);
               return ResponseEntity.ok(toMap(session));
          } catch (IllegalArgumentException ex) {
               return ResponseEntity.badRequest()
                         .body(Map.of("error", ex.getMessage()));
          }
     }

     // ── RESUME ───────────────────────────────────
     @PutMapping("/{id}/resume")
     public ResponseEntity<?> resumeSession(
               @AuthenticationPrincipal UserDetails userDetails,
               @PathVariable Long id) {
          try {
               StudySession session = studySessionService.resumeSession(
                         userDetails.getUsername(), id);
               return ResponseEntity.ok(toMap(session));
          } catch (IllegalArgumentException ex) {
               return ResponseEntity.badRequest()
                         .body(Map.of("error", ex.getMessage()));
          }
     }

     // ── COMPLETE ─────────────────────────────────
     @PutMapping("/{id}/complete")
     public ResponseEntity<?> completeSession(
               @AuthenticationPrincipal UserDetails userDetails,
               @PathVariable Long id) {
          try {
               StudySession session = studySessionService.completeSession(
                         userDetails.getUsername(), id);
               return ResponseEntity.ok(toMap(session));
          } catch (IllegalArgumentException ex) {
               return ResponseEntity.badRequest()
                         .body(Map.of("error", ex.getMessage()));
          }
     }

     // ── CANCEL ───────────────────────────────────
     @PutMapping("/{id}/cancel")
     public ResponseEntity<?> cancelSession(
               @AuthenticationPrincipal UserDetails userDetails,
               @PathVariable Long id) {
          try {
               StudySession session = studySessionService.cancelSession(
                         userDetails.getUsername(), id);
               return ResponseEntity.ok(toMap(session));
          } catch (IllegalArgumentException ex) {
               return ResponseEntity.badRequest()
                         .body(Map.of("error", ex.getMessage()));
          }
     }

     // ── TODAY ─────────────────────────────────────
     @GetMapping("/today")
     public ResponseEntity<?> getTodaySessions(
               @AuthenticationPrincipal UserDetails userDetails) {
          try {
               List<StudySession> sessions = studySessionService
                         .getTodaySessions(userDetails.getUsername());
               return ResponseEntity.ok(sessions.stream()
                         .map(this::toMap).toList());
          } catch (IllegalArgumentException ex) {
               return ResponseEntity.badRequest()
                         .body(Map.of("error", ex.getMessage()));
          }
     }

     // ── WEEKLY ────────────────────────────────────
     @GetMapping("/weekly")
     public ResponseEntity<?> getWeeklySessions(
               @AuthenticationPrincipal UserDetails userDetails) {
          try {
               List<StudySession> sessions = studySessionService
                         .getWeeklySessions(userDetails.getUsername());
               return ResponseEntity.ok(sessions.stream()
                         .map(this::toMap).toList());
          } catch (IllegalArgumentException ex) {
               return ResponseEntity.badRequest()
                         .body(Map.of("error", ex.getMessage()));
          }
     }

     // ── Helper: entity → map (avoids lazy load issues) ──
     private Map<String, Object> toMap(StudySession s) {
          return Map.of(
                    "id", s.getId(),
                    "subjectId", s.getSubject().getId(),
                    "subjectName", s.getSubject().getSubjectName(),
                    "videoId", s.getVideo() != null ? s.getVideo().getId() : "",
                    "videoTitle", s.getVideo() != null ? s.getVideo().getTitle() : "",
                    "focusSeconds", s.getFocusSeconds(),
                    "breakSeconds", s.getBreakSeconds(),
                    "status", s.getStatus().name(),
                    "startTime", s.getStartTime() != null ? s.getStartTime().toString() : "",
                    "endTime", s.getEndTime() != null ? s.getEndTime().toString() : "");
     }
}
