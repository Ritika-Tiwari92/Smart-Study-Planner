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
     public Task addTask(@Valid @RequestBody TaskRequestDto taskRequestDto) {
          return taskService.addTask(taskRequestDto);
     }

     @GetMapping
     public List<Task> getAllTasks() {
          return taskService.getAllTasks();
     }

     @GetMapping("/{id}")
     public Task getTaskById(@PathVariable Long id) {
          return taskService.getTaskById(id);
     }

     @PutMapping("/{id}")
     public Task updateTask(@PathVariable Long id, @Valid @RequestBody TaskRequestDto taskRequestDto) {
          return taskService.updateTask(id, taskRequestDto);
     }

     @DeleteMapping("/{id}")
     public String deleteTask(@PathVariable Long id) {
          taskService.deleteTask(id);
          return "Task deleted successfully";
     }

     @GetMapping("/subject/{subjectId}")
     public List<Task> getTasksBySubjectId(@PathVariable Long subjectId) {
          return taskService.getTasksBySubjectId(subjectId);
     }

     @GetMapping("/status/{status}")
     public List<Task> getTasksByStatus(@PathVariable String status) {
          return taskService.getTasksByStatus(status);
     }

     @PutMapping("/{id}/status")
     public Task updateTaskStatus(@PathVariable Long id, @RequestParam String status) {
          return taskService.updateTaskStatus(id, status);
     }

     @GetMapping("/today")
     public List<Task> getTodayTasks() {
          return taskService.getTodayTasks();
     }

     @GetMapping("/upcoming")
     public List<Task> getUpcomingTasks() {
          return taskService.getUpcomingTasks();
     }
}