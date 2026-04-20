package com.studyplanner.studyplanner.controller;

import com.studyplanner.studyplanner.dto.TaskRequestDto;
import com.studyplanner.studyplanner.model.Task;
import com.studyplanner.studyplanner.service.TaskService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tasks")
@CrossOrigin("*")
public class TaskController {

     private final TaskService taskService;

     public TaskController(TaskService taskService) {
          this.taskService = taskService;
     }

     @PostMapping
     public Task addTask(@RequestParam Long userId, @Valid @RequestBody TaskRequestDto taskRequestDto) {
          return taskService.addTask(userId, taskRequestDto);
     }

     @GetMapping
     public List<Task> getAllTasks(@RequestParam Long userId) {
          return taskService.getAllTasks(userId);
     }

     @GetMapping("/{id}")
     public Task getTaskById(@PathVariable Long id, @RequestParam Long userId) {
          return taskService.getTaskById(userId, id);
     }

     @PutMapping("/{id}")
     public Task updateTask(@PathVariable Long id,
               @RequestParam Long userId,
               @Valid @RequestBody TaskRequestDto taskRequestDto) {
          return taskService.updateTask(userId, id, taskRequestDto);
     }

     @DeleteMapping("/{id}")
     public String deleteTask(@PathVariable Long id, @RequestParam Long userId) {
          taskService.deleteTask(userId, id);
          return "Task deleted successfully";
     }

     @GetMapping("/subject/{subjectId}")
     public List<Task> getTasksBySubjectId(@PathVariable Long subjectId, @RequestParam Long userId) {
          return taskService.getTasksBySubjectId(userId, subjectId);
     }

     @GetMapping("/status/{status}")
     public List<Task> getTasksByStatus(@PathVariable String status, @RequestParam Long userId) {
          return taskService.getTasksByStatus(userId, status);
     }

     @PutMapping("/{id}/status")
     public Task updateTaskStatus(@PathVariable Long id, @RequestParam Long userId, @RequestParam String status) {
          return taskService.updateTaskStatus(userId, id, status);
     }

     @GetMapping("/today")
     public List<Task> getTodayTasks(@RequestParam Long userId) {
          return taskService.getTodayTasks(userId);
     }

     @GetMapping("/upcoming")
     public List<Task> getUpcomingTasks(@RequestParam Long userId) {
          return taskService.getUpcomingTasks(userId);
     }
}