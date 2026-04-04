package com.studyplanner.studyplanner.controller; // Ab ye 'controller' folder ke andar hai

import com.studyplanner.studyplanner.model.Task;
import com.studyplanner.studyplanner.service.TaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;

@CrossOrigin(origins = "*") // Isse kisi bhi frontend se request allow ho jayegi

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

     @Autowired
     private TaskService taskService;

     @PostMapping("/add")
     public Task addTask(@Valid @RequestBody Task task) {
          // Direct save karne ki jagah service ko bola save karne
          return taskService.saveTask(task);
     }

     @GetMapping("/all")
     public List<Task> getAllTasks() {
          return taskService.getAllTasks();
     }

     @DeleteMapping("/delete/{id}")
     public String deleteTask(@PathVariable Long id) {
          taskService.deleteTask(id);
          return "Task with ID " + id + " deleted successfully!";
     }

     // GET single task
     @GetMapping("/{id}")
     public Task getTaskById(@PathVariable Long id) {
          return taskService.getTaskById(id);
     }

     // UPDATE task
     @PutMapping("/update/{id}")
     public Task updateTask(@PathVariable Long id, @Valid @RequestBody Task task) {
          return taskService.updateTask(id, task);
     }
}