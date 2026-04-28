package com.studyplanner.studyplanner.controller;

import com.studyplanner.studyplanner.model.Revision;
import com.studyplanner.studyplanner.security.JwtUtil;
import com.studyplanner.studyplanner.service.RevisionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * RevisionController — JWT based (no userId in URL/param)
 * All endpoints extract userId from Bearer token.
 */
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

     @GetMapping
     public ResponseEntity<List<Revision>> getAllRevisions(
               @RequestHeader("Authorization") String authHeader) {
          Long userId = extractUserId(authHeader);
          return ResponseEntity.ok(revisionService.getAllRevisions(userId));
     }

     @GetMapping("/{id}")
     public ResponseEntity<Revision> getRevisionById(
               @RequestHeader("Authorization") String authHeader,
               @PathVariable Long id) {
          Long userId = extractUserId(authHeader);
          return ResponseEntity.ok(revisionService.getRevisionById(userId, id));
     }

     @PostMapping
     public ResponseEntity<Revision> createRevision(
               @RequestHeader("Authorization") String authHeader,
               @RequestBody Revision revision) {
          Long userId = extractUserId(authHeader);
          return ResponseEntity.ok(revisionService.createRevision(userId, revision));
     }

     @PutMapping("/{id}")
     public ResponseEntity<Revision> updateRevision(
               @RequestHeader("Authorization") String authHeader,
               @PathVariable Long id,
               @RequestBody Revision revision) {
          Long userId = extractUserId(authHeader);
          return ResponseEntity.ok(revisionService.updateRevision(userId, id, revision));
     }

     @DeleteMapping("/{id}")
     public ResponseEntity<String> deleteRevision(
               @RequestHeader("Authorization") String authHeader,
               @PathVariable Long id) {
          Long userId = extractUserId(authHeader);
          revisionService.deleteRevision(userId, id);
          return ResponseEntity.ok("Revision deleted successfully.");
     }
}