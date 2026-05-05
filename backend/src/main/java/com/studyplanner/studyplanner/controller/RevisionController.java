package com.studyplanner.studyplanner.controller;

import com.studyplanner.studyplanner.model.Revision;
import com.studyplanner.studyplanner.security.JwtUtil;
import com.studyplanner.studyplanner.service.RevisionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/revisions")
@CrossOrigin(origins = "*")
public class RevisionController {

     private final RevisionService revisionService;
     private final JwtUtil jwtUtil;

     public RevisionController(RevisionService revisionService, JwtUtil jwtUtil) {
          this.revisionService = revisionService;
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
                    "message", "Revision API is working"));
     }

     @GetMapping
     public ResponseEntity<?> getAllRevisions(
               @RequestHeader("Authorization") String authHeader) {
          try {
               Long userId = extractUserId(authHeader);
               List<Revision> revisions = revisionService.getAllRevisions(userId);
               return ResponseEntity.ok(revisions);

          } catch (Exception ex) {
               ex.printStackTrace();

               return ResponseEntity.status(500).body(Map.of(
                         "error", "REVISION_GET_FAILED",
                         "exception", ex.getClass().getSimpleName(),
                         "message", ex.getMessage() == null ? "No message" : ex.getMessage()));
          }
     }

     @GetMapping("/{id}")
     public ResponseEntity<?> getRevisionById(
               @RequestHeader("Authorization") String authHeader,
               @PathVariable Long id) {
          try {
               Long userId = extractUserId(authHeader);
               Revision revision = revisionService.getRevisionById(userId, id);
               return ResponseEntity.ok(revision);

          } catch (Exception ex) {
               ex.printStackTrace();

               return ResponseEntity.status(500).body(Map.of(
                         "error", "REVISION_GET_BY_ID_FAILED",
                         "exception", ex.getClass().getSimpleName(),
                         "message", ex.getMessage() == null ? "No message" : ex.getMessage()));
          }
     }

     @PostMapping
     public ResponseEntity<?> createRevision(
               @RequestHeader("Authorization") String authHeader,
               @RequestBody Revision revision) {
          try {
               Long userId = extractUserId(authHeader);
               Revision savedRevision = revisionService.createRevision(userId, revision);
               return ResponseEntity.ok(savedRevision);

          } catch (Exception ex) {
               ex.printStackTrace();

               return ResponseEntity.status(500).body(Map.of(
                         "error", "REVISION_CREATE_FAILED",
                         "exception", ex.getClass().getSimpleName(),
                         "message", ex.getMessage() == null ? "No message" : ex.getMessage()));
          }
     }

     @PutMapping("/{id}")
     public ResponseEntity<?> updateRevision(
               @RequestHeader("Authorization") String authHeader,
               @PathVariable Long id,
               @RequestBody Revision revision) {
          try {
               Long userId = extractUserId(authHeader);
               Revision updatedRevision = revisionService.updateRevision(userId, id, revision);
               return ResponseEntity.ok(updatedRevision);

          } catch (Exception ex) {
               ex.printStackTrace();

               return ResponseEntity.status(500).body(Map.of(
                         "error", "REVISION_UPDATE_FAILED",
                         "exception", ex.getClass().getSimpleName(),
                         "message", ex.getMessage() == null ? "No message" : ex.getMessage()));
          }
     }

     @DeleteMapping("/{id}")
     public ResponseEntity<?> deleteRevision(
               @RequestHeader("Authorization") String authHeader,
               @PathVariable Long id) {
          try {
               Long userId = extractUserId(authHeader);
               revisionService.deleteRevision(userId, id);

               return ResponseEntity.ok(Map.of(
                         "message", "Revision deleted successfully."));

          } catch (Exception ex) {
               ex.printStackTrace();

               return ResponseEntity.status(500).body(Map.of(
                         "error", "REVISION_DELETE_FAILED",
                         "exception", ex.getClass().getSimpleName(),
                         "message", ex.getMessage() == null ? "No message" : ex.getMessage()));
          }
     }
}