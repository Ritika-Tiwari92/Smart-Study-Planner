package com.studyplanner.studyplanner.controller;

import com.studyplanner.studyplanner.model.Task;
import com.studyplanner.studyplanner.service.TaskService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tasks")
@CrossOrigin("*")
public class TaskController {

     @Autowired
     private TaskService taskService;

     @PostMapping
     public Task addTask(@Valid @RequestBody Task task) {
          return taskService.addTask(task);
     }

     @GetMapping
     public List<Task> getAllTasks() {
          return taskService.getAllTasks();
     }

     @GetMapping("/{id}")
     public ResponseEntity<Task> getTaskById(@PathVariable Long id) {
          return ResponseEntity.ok(taskService.getTaskById(id));
     }

     @PutMapping("/{id}")
     public ResponseEntity<Task> updateTask(@PathVariable Long id, @Valid @RequestBody Task task) {
          return ResponseEntity.ok(taskService.updateTask(id, task));
     }

     @DeleteMapping("/{id}")
     public ResponseEntity<String> deleteTask(@PathVariable Long id) {
          taskService.deleteTask(id);
          return ResponseEntity.ok("Task deleted successfully");
     }

     @GetMapping("/subject/{subjectId}")
     public ResponseEntity<List<Task>> getTasksBySubjectId(@PathVariable Long subjectId) {
          return ResponseEntity.ok(taskService.getTasksBySubjectId(subjectId));
     }

     @GetMapping("/status/{status}")
     public ResponseEntity<List<Task>> getTasksByStatus(@PathVariable String status) {
          return ResponseEntity.ok(taskService.getTasksByStatus(status));
     }

     @PutMapping("/{id}/status")
     public ResponseEntity<Task> updateTaskStatus(@PathVariable Long id, @RequestParam String status) {
          return ResponseEntity.ok(taskService.updateTaskStatus(id, status));
     }

     @GetMapping("/today")
     public ResponseEntity<List<Task>> getTodayTasks() {
          return ResponseEntity.ok(taskService.getTodayTasks());
     }

     @GetMapping("/upcoming")
     public ResponseEntity<List<Task>> getUpcomingTasks() {
          return ResponseEntity.ok(taskService.getUpcomingTasks());
     }
}