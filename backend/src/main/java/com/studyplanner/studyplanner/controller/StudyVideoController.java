package com.studyplanner.studyplanner.controller;

import com.studyplanner.studyplanner.dto.StudyVideoDto;
import com.studyplanner.studyplanner.service.StudyVideoService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * StudyVideoController
 *
 * POST /api/study-videos → add video
 * GET /api/study-videos → all videos for user
 * GET /api/study-videos/subject/{subjectId} → videos for one subject
 * PUT /api/study-videos/{videoId}/complete → mark completed
 */
@RestController
@RequestMapping("/api/study-videos")
@CrossOrigin(origins = "*")
public class StudyVideoController {

     private final StudyVideoService studyVideoService;

     public StudyVideoController(StudyVideoService studyVideoService) {
          this.studyVideoService = studyVideoService;
     }

     // ── Add new video ────────────────────────────
     @PostMapping
     public ResponseEntity<?> addVideo(
               @AuthenticationPrincipal UserDetails userDetails,
               @RequestBody Map<String, Object> request) {
          try {
               Long subjectId = Long.valueOf(request.get("subjectId").toString());
               String title = (String) request.get("title");
               String videoUrl = (String) request.getOrDefault("videoUrl", null);
               String tag = (String) request.getOrDefault("tag", null);

               Integer durationSeconds = 0;
               Object dur = request.get("durationSeconds");
               if (dur != null) {
                    durationSeconds = Integer.valueOf(dur.toString());
               }

               StudyVideoDto dto = studyVideoService.addVideo(
                         userDetails.getUsername(), subjectId,
                         title, videoUrl, tag, durationSeconds);

               return ResponseEntity.ok(dto);

          } catch (IllegalArgumentException ex) {
               return ResponseEntity.badRequest()
                         .body(Map.of("error", ex.getMessage()));
          }
     }

     // ── Get all videos for user ──────────────────
     @GetMapping
     public ResponseEntity<?> getAllVideos(
               @AuthenticationPrincipal UserDetails userDetails) {
          try {
               List<StudyVideoDto> videos = studyVideoService.getAllVideos(userDetails.getUsername());
               return ResponseEntity.ok(videos);
          } catch (IllegalArgumentException ex) {
               return ResponseEntity.badRequest()
                         .body(Map.of("error", ex.getMessage()));
          }
     }

     // ── Get videos for a subject ─────────────────
     @GetMapping("/subject/{subjectId}")
     public ResponseEntity<?> getVideosBySubject(
               @AuthenticationPrincipal UserDetails userDetails,
               @PathVariable Long subjectId) {
          try {
               List<StudyVideoDto> videos = studyVideoService.getVideosBySubject(
                         userDetails.getUsername(), subjectId);
               return ResponseEntity.ok(videos);
          } catch (IllegalArgumentException ex) {
               return ResponseEntity.badRequest()
                         .body(Map.of("error", ex.getMessage()));
          }
     }

     // ── Mark video as completed ──────────────────
     @PutMapping("/{videoId}/complete")
     public ResponseEntity<?> markVideoCompleted(
               @AuthenticationPrincipal UserDetails userDetails,
               @PathVariable Long videoId) {
          try {
               StudyVideoDto dto = studyVideoService.markVideoCompleted(
                         userDetails.getUsername(), videoId);
               return ResponseEntity.ok(dto);
          } catch (IllegalArgumentException ex) {
               return ResponseEntity.badRequest()
                         .body(Map.of("error", ex.getMessage()));
          }
     }
}