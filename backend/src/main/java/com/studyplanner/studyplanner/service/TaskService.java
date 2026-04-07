package com.studyplanner.studyplanner.service;

import com.studyplanner.studyplanner.model.Task;
import com.studyplanner.studyplanner.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TaskService {

     @Autowired
     private TaskRepository taskRepository;

     public Task addTask(Task task) {
          return taskRepository.save(task);
     }

     public List<Task> getAllTasks() {
          return taskRepository.findAll();
     }

     public Task updateTaskStatus(Long id, String status) {
          Task task = taskRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Task not found"));

          task.setStatus(status);
          return taskRepository.save(task);
     }

     public void deleteTask(Long id) {
          Task task = taskRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Task not found"));

          taskRepository.delete(task);
     }
}