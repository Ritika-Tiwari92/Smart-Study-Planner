package com.studyplanner.studyplanner.service;


import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import com.studyplanner.studyplanner.repository.TaskRepository;
import org.springframework.stereotype.Service;
import com.studyplanner.studyplanner.exception.ResourceNotFoundException;
import com.studyplanner.studyplanner.model.Task;

@Service
public class TaskService {

     @Autowired
     private TaskRepository taskRepository;

     // Naya task save karne ke liye
     public Task saveTask(Task task) {
          return taskRepository.save(task);
     }

     // Saare tasks dekhne ke liye
     public List<Task> getAllTasks() {
          return taskRepository.findAll();
     }

     // Task delete karne ke liye
     public void deleteTask(Long id) {
          taskRepository.deleteById(id);
     }

     // 1. Ek specific ID waala task dhundne ke liye
     public Task getTaskById(Long id) {
          return taskRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Task not found with id " + id));
     }

     // 2. Task update karne ke liye
     public Task updateTask(Long id, Task updatedTask) {
          Task existingTask = taskRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Task not found with id " + id));

     
               existingTask.setTitle(updatedTask.getTitle());
               existingTask.setDescription(updatedTask.getDescription());
               existingTask.setStatus(updatedTask.getStatus());
               existingTask.setCompleted(updatedTask.isCompleted());

               return taskRepository.save(existingTask);
     }

}
