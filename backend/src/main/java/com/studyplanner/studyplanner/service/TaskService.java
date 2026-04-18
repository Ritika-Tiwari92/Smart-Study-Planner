package com.studyplanner.studyplanner.service;

import com.studyplanner.studyplanner.dto.TaskRequestDto;
import com.studyplanner.studyplanner.exception.ResourceNotFoundException;
import com.studyplanner.studyplanner.model.Subject;
import com.studyplanner.studyplanner.model.Task;
import com.studyplanner.studyplanner.repository.SubjectRepository;
import com.studyplanner.studyplanner.repository.TaskRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class TaskService {

     private final TaskRepository taskRepository;
     private final SubjectRepository subjectRepository;

     public TaskService(TaskRepository taskRepository, SubjectRepository subjectRepository) {
          this.taskRepository = taskRepository;
          this.subjectRepository = subjectRepository;
     }

     public Task addTask(Task task) {
          if (task.getSubject() == null || task.getSubject().getId() == null) {
               throw new IllegalArgumentException("Subject is required");
          }

          Subject subject = getSubjectById(task.getSubject().getId());
          task.setSubject(subject);

          return taskRepository.save(task);
     }

     public Task addTask(TaskRequestDto dto) {
          if (dto.getSubjectId() == null) {
               throw new IllegalArgumentException("Subject is required");
          }

          Subject subject = getSubjectById(dto.getSubjectId());

          Task task = new Task();
          task.setTitle(dto.getTitle());
          task.setDescription(dto.getDescription());
          task.setDueDate(dto.getDueDate());
          task.setPriority(dto.getPriority());
          task.setStatus(dto.getStatus());
          task.setSubject(subject);

          return taskRepository.save(task);
     }

     public List<Task> getAllTasks() {
          return taskRepository.findAll();
     }

     public Task getTaskById(Long id) {
          return taskRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));
     }

     public List<Task> getTasksBySubjectId(Long subjectId) {
          return taskRepository.findBySubjectId(subjectId);
     }

     public List<Task> getTasksByStatus(String status) {
          return taskRepository.findByStatus(status);
     }

     public List<Task> getTodayTasks() {
          return taskRepository.findByDueDate(LocalDate.now());
     }

     public List<Task> getUpcomingTasks() {
          return taskRepository.findByDueDateAfter(LocalDate.now());
     }

     public Task updateTask(Long id, Task updatedTask) {
          Task existingTask = getTaskById(id);

          if (updatedTask.getSubject() == null || updatedTask.getSubject().getId() == null) {
               throw new IllegalArgumentException("Subject is required");
          }

          Subject subject = getSubjectById(updatedTask.getSubject().getId());

          existingTask.setTitle(updatedTask.getTitle());
          existingTask.setDescription(updatedTask.getDescription());
          existingTask.setStatus(updatedTask.getStatus());
          existingTask.setDueDate(updatedTask.getDueDate());
          existingTask.setPriority(updatedTask.getPriority());
          existingTask.setSubject(subject);

          return taskRepository.save(existingTask);
     }

     public Task updateTask(Long id, TaskRequestDto dto) {
          Task existingTask = getTaskById(id);

          if (dto.getSubjectId() == null) {
               throw new IllegalArgumentException("Subject is required");
          }

          Subject subject = getSubjectById(dto.getSubjectId());

          existingTask.setTitle(dto.getTitle());
          existingTask.setDescription(dto.getDescription());
          existingTask.setDueDate(dto.getDueDate());
          existingTask.setPriority(dto.getPriority());
          existingTask.setStatus(dto.getStatus());
          existingTask.setSubject(subject);

          return taskRepository.save(existingTask);
     }

     public Task updateTaskStatus(Long id, String status) {
          Task existingTask = getTaskById(id);
          existingTask.setStatus(status);
          return taskRepository.save(existingTask);
     }

     public void deleteTask(Long id) {
          if (!taskRepository.existsById(id)) {
               throw new ResourceNotFoundException("Task not found with id: " + id);
          }
          taskRepository.deleteById(id);
     }

     private Subject getSubjectById(Long subjectId) {
          return subjectRepository.findById(subjectId)
                    .orElseThrow(() -> new ResourceNotFoundException("Subject not found with id: " + subjectId));
     }
}