package com.studyplanner.studyplanner.controller;

import com.studyplanner.studyplanner.dto.TaskRequestDto;
import com.studyplanner.studyplanner.model.Task;
import com.studyplanner.studyplanner.security.JwtUtil;
import com.studyplanner.studyplanner.service.TaskService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * TaskController — JWT based (no userId in URL/param)
 * All endpoints extract userId from Bearer token.
 * Base path changed: /tasks → /api/tasks
 */
@RestController
@RequestMapping("/api/tasks")
@CrossOrigin(origins = "*")
public class TaskController {

     private final TaskService taskService;
     private final JwtUtil jwtUtil;

     public TaskController(TaskService taskService, JwtUtil jwtUtil) {
          this.taskService = taskService;
          this.jwtUtil = jwtUtil;
     }

     private Long extractUserId(String authHeader) {
          if (authHeader == null || !authHeader.startsWith("Bearer ")) {
               throw new RuntimeException("Missing or invalid Authorization header");
          }
          return jwtUtil.extractUserId(authHeader.substring(7).trim());
     }

     @PostMapping
     public ResponseEntity<Task> addTask(
               @RequestHeader("Authorization") String authHeader,
               @Valid @RequestBody TaskRequestDto taskRequestDto) {
          Long userId = extractUserId(authHeader);
          return ResponseEntity.ok(taskService.addTask(userId, taskRequestDto));
     }

     @GetMapping
     public ResponseEntity<List<Task>> getAllTasks(
               @RequestHeader("Authorization") String authHeader) {
          Long userId = extractUserId(authHeader);
          return ResponseEntity.ok(taskService.getAllTasks(userId));
     }

     @GetMapping("/{id}")
     public ResponseEntity<Task> getTaskById(
               @RequestHeader("Authorization") String authHeader,
               @PathVariable Long id) {
          Long userId = extractUserId(authHeader);
          return ResponseEntity.ok(taskService.getTaskById(userId, id));
     }

     @PutMapping("/{id}")
     public ResponseEntity<Task> updateTask(
               @RequestHeader("Authorization") String authHeader,
               @PathVariable Long id,
               @Valid @RequestBody TaskRequestDto taskRequestDto) {
          Long userId = extractUserId(authHeader);
          return ResponseEntity.ok(taskService.updateTask(userId, id, taskRequestDto));
     }

     @DeleteMapping("/{id}")
     public ResponseEntity<String> deleteTask(
               @RequestHeader("Authorization") String authHeader,
               @PathVariable Long id) {
          Long userId = extractUserId(authHeader);
          taskService.deleteTask(userId, id);
          return ResponseEntity.ok("Task deleted successfully");
     }

     @GetMapping("/subject/{subjectId}")
     public ResponseEntity<List<Task>> getTasksBySubjectId(
               @RequestHeader("Authorization") String authHeader,
               @PathVariable Long subjectId) {
          Long userId = extractUserId(authHeader);
          return ResponseEntity.ok(taskService.getTasksBySubjectId(userId, subjectId));
     }

     @GetMapping("/status/{status}")
     public ResponseEntity<List<Task>> getTasksByStatus(
               @RequestHeader("Authorization") String authHeader,
               @PathVariable String status) {
          Long userId = extractUserId(authHeader);
          return ResponseEntity.ok(taskService.getTasksByStatus(userId, status));
     }

     @PutMapping("/{id}/status")
     public ResponseEntity<Task> updateTaskStatus(
               @RequestHeader("Authorization") String authHeader,
               @PathVariable Long id,
               @RequestParam String status) {
          Long userId = extractUserId(authHeader);
          return ResponseEntity.ok(taskService.updateTaskStatus(userId, id, status));
     }

     @GetMapping("/today")
     public ResponseEntity<List<Task>> getTodayTasks(
               @RequestHeader("Authorization") String authHeader) {
          Long userId = extractUserId(authHeader);
          return ResponseEntity.ok(taskService.getTodayTasks(userId));
     }

     @GetMapping("/upcoming")
     public ResponseEntity<List<Task>> getUpcomingTasks(
               @RequestHeader("Authorization") String authHeader) {
          Long userId = extractUserId(authHeader);
          return ResponseEntity.ok(taskService.getUpcomingTasks(userId));
     }
}