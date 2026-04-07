package com.studyplanner.studyplanner.controller;

import com.studyplanner.studyplanner.model.Task;
import com.studyplanner.studyplanner.service.TaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tasks")
@CrossOrigin("*")
public class TaskController {

     @Autowired
     private TaskService taskService;

     @PostMapping
     public Task addTask(@RequestBody Task task) {
          return taskService.addTask(task);
     }

     @GetMapping
     public List<Task> getAllTasks() {
          return taskService.getAllTasks();
     }

     @PutMapping("/{id}/status")
     public Task updateTaskStatus(@PathVariable Long id, @RequestParam String status) {
          return taskService.updateTaskStatus(id, status);
     }

     @DeleteMapping("/{id}")
     public String deleteTask(@PathVariable Long id) {
          taskService.deleteTask(id);
          return "Task deleted successfully";
     }
}