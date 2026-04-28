package com.studyplanner.studyplanner.controller;

import com.studyplanner.studyplanner.model.Test;
import com.studyplanner.studyplanner.security.JwtUtil;
import com.studyplanner.studyplanner.service.TestService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * TestController — JWT based (no userId in URL/param)
 * All endpoints extract userId from Bearer token.
 */
@RestController
@RequestMapping("/api/tests")
@CrossOrigin(origins = "*")
public class TestController {

     private final TestService testService;
     private final JwtUtil jwtUtil;

     public TestController(TestService testService, JwtUtil jwtUtil) {
          this.testService = testService;
          this.jwtUtil = jwtUtil;
     }

     private Long extractUserId(String authHeader) {
          if (authHeader == null || !authHeader.startsWith("Bearer ")) {
               throw new RuntimeException("Missing or invalid Authorization header");
          }
          return jwtUtil.extractUserId(authHeader.substring(7).trim());
     }

     @GetMapping
     public ResponseEntity<List<Test>> getAllTests(
               @RequestHeader("Authorization") String authHeader) {
          Long userId = extractUserId(authHeader);
          return ResponseEntity.ok(testService.getAllTests(userId));
     }

     @GetMapping("/{id}")
     public ResponseEntity<Test> getTestById(
               @RequestHeader("Authorization") String authHeader,
               @PathVariable Long id) {
          Long userId = extractUserId(authHeader);
          return ResponseEntity.ok(testService.getTestById(userId, id));
     }

     @PostMapping
     public ResponseEntity<Test> createTest(
               @RequestHeader("Authorization") String authHeader,
               @RequestBody Test test) {
          Long userId = extractUserId(authHeader);
          return ResponseEntity.ok(testService.createTest(userId, test));
     }

     @PutMapping("/{id}")
     public ResponseEntity<Test> updateTest(
               @RequestHeader("Authorization") String authHeader,
               @PathVariable Long id,
               @RequestBody Test test) {
          Long userId = extractUserId(authHeader);
          return ResponseEntity.ok(testService.updateTest(userId, id, test));
     }

     @DeleteMapping("/{id}")
     public ResponseEntity<String> deleteTest(
               @RequestHeader("Authorization") String authHeader,
               @PathVariable Long id) {
          Long userId = extractUserId(authHeader);
          testService.deleteTest(userId, id);
          return ResponseEntity.ok("Test deleted successfully");
     }
}