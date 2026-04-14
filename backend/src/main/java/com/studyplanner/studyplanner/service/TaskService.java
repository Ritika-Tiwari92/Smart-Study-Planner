package com.studyplanner.studyplanner.service;

import com.studyplanner.studyplanner.model.Task;
import com.studyplanner.studyplanner.model.Subject;
import com.studyplanner.studyplanner.repository.SubjectRepository;
import com.studyplanner.studyplanner.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.studyplanner.studyplanner.exception.ResourceNotFoundException;
import java.time.LocalDate;
import java.util.List;

@Service
public class TaskService {

     @Autowired
     private TaskRepository taskRepository;

     public Task addTask(Task task) {
          if (task.getSubject() == null || task.getSubject().getId() == null) {
               throw new IllegalArgumentException("Subject is required");
          }
          Long subjectId = task.getSubject().getId();

          Subject subject = subjectRepository.findById(subjectId)
                    .orElseThrow(() -> new IllegalArgumentException("Subject not found with id: " + subjectId));

          task.setSubject(subject);

          return taskRepository.save(task);
     }

     public List<Task> getTasksBySubjectId(Long subjectId) {
          return taskRepository.findBySubjectId(subjectId);
     }

     public List<Task> getAllTasks() {
          return taskRepository.findAll();
     }

     public void deleteTask(Long id) {
          if (!taskRepository.existsById(id)) {
               throw new ResourceNotFoundException("Task not found with id: " + id);
          }
          taskRepository.deleteById(id);
     }

     private final SubjectRepository subjectRepository;

     public TaskService(TaskRepository taskRepository, SubjectRepository subjectRepository) {
          this.taskRepository = taskRepository;
          this.subjectRepository = subjectRepository;
     }

     public Task getTaskById(Long id) {
          return taskRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));
     }

     public Task updateTask(Long id, Task updatedTask) {
          Task existingTask = taskRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));

          existingTask.setTitle(updatedTask.getTitle());
          existingTask.setDescription(updatedTask.getDescription());
          existingTask.setStatus(updatedTask.getStatus());
          existingTask.setDueDate(updatedTask.getDueDate());
          existingTask.setPriority(updatedTask.getPriority());
          existingTask.setSubject(updatedTask.getSubject());

          return taskRepository.save(existingTask);
     }

     public List<Task> getTasksByStatus(String status) {
          return taskRepository.findByStatus(status);
     }

     public Task updateTaskStatus(Long id, String status) {
          Task existingTask = taskRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));

          existingTask.setStatus(status);
          return taskRepository.save(existingTask);
     }

     public List<Task> getTodayTasks() {
          return taskRepository.findByDueDate(LocalDate.now());
     }

     public List<Task> getUpcomingTasks() {
          return taskRepository.findByDueDateAfter(LocalDate.now());
     }
}