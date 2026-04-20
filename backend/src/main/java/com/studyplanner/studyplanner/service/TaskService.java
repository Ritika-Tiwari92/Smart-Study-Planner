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
import java.util.stream.Collectors;

@Service
public class TaskService {

     private final TaskRepository taskRepository;
     private final SubjectRepository subjectRepository;

     public TaskService(TaskRepository taskRepository, SubjectRepository subjectRepository) {
          this.taskRepository = taskRepository;
          this.subjectRepository = subjectRepository;
     }

     public Task addTask(Long userId, Task task) {
          if (task.getSubject() == null || task.getSubject().getId() == null) {
               throw new IllegalArgumentException("Subject is required");
          }

          Subject subject = getSubjectByIdForUser(task.getSubject().getId(), userId);
          task.setSubject(subject);

          return taskRepository.save(task);
     }

     public Task addTask(Long userId, TaskRequestDto dto) {
          if (dto.getSubjectId() == null) {
               throw new IllegalArgumentException("Subject is required");
          }

          Subject subject = getSubjectByIdForUser(dto.getSubjectId(), userId);

          Task task = new Task();
          task.setTitle(dto.getTitle());
          task.setDescription(dto.getDescription());
          task.setDueDate(dto.getDueDate());
          task.setPriority(dto.getPriority());
          task.setStatus(dto.getStatus());
          task.setSubject(subject);

          return taskRepository.save(task);
     }

     public List<Task> getAllTasks(Long userId) {
          return taskRepository.findBySubjectUserId(userId);
     }

     public Task getTaskById(Long userId, Long id) {
          return taskRepository.findByIdAndSubjectUserId(id, userId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                              "Task not found with id: " + id + " for userId: " + userId));
     }

     public List<Task> getTasksBySubjectId(Long userId, Long subjectId) {
          getSubjectByIdForUser(subjectId, userId);
          return taskRepository.findBySubjectId(subjectId);
     }

     public List<Task> getTasksByStatus(Long userId, String status) {
          return taskRepository.findBySubjectUserId(userId)
                    .stream()
                    .filter(task -> task.getStatus() != null && task.getStatus().equalsIgnoreCase(status))
                    .collect(Collectors.toList());
     }

     public List<Task> getTodayTasks(Long userId) {
          LocalDate today = LocalDate.now();

          return taskRepository.findBySubjectUserId(userId)
                    .stream()
                    .filter(task -> today.equals(task.getDueDate()))
                    .collect(Collectors.toList());
     }

     public List<Task> getUpcomingTasks(Long userId) {
          LocalDate today = LocalDate.now();

          return taskRepository.findBySubjectUserId(userId)
                    .stream()
                    .filter(task -> task.getDueDate() != null && task.getDueDate().isAfter(today))
                    .collect(Collectors.toList());
     }

     public Task updateTask(Long userId, Long id, Task updatedTask) {
          Task existingTask = getTaskById(userId, id);

          if (updatedTask.getSubject() == null || updatedTask.getSubject().getId() == null) {
               throw new IllegalArgumentException("Subject is required");
          }

          Subject subject = getSubjectByIdForUser(updatedTask.getSubject().getId(), userId);

          existingTask.setTitle(updatedTask.getTitle());
          existingTask.setDescription(updatedTask.getDescription());
          existingTask.setStatus(updatedTask.getStatus());
          existingTask.setDueDate(updatedTask.getDueDate());
          existingTask.setPriority(updatedTask.getPriority());
          existingTask.setSubject(subject);

          return taskRepository.save(existingTask);
     }

     public Task updateTask(Long userId, Long id, TaskRequestDto dto) {
          Task existingTask = getTaskById(userId, id);

          if (dto.getSubjectId() == null) {
               throw new IllegalArgumentException("Subject is required");
          }

          Subject subject = getSubjectByIdForUser(dto.getSubjectId(), userId);

          existingTask.setTitle(dto.getTitle());
          existingTask.setDescription(dto.getDescription());
          existingTask.setDueDate(dto.getDueDate());
          existingTask.setPriority(dto.getPriority());
          existingTask.setStatus(dto.getStatus());
          existingTask.setSubject(subject);

          return taskRepository.save(existingTask);
     }

     public Task updateTaskStatus(Long userId, Long id, String status) {
          Task existingTask = getTaskById(userId, id);
          existingTask.setStatus(status);
          return taskRepository.save(existingTask);
     }

     public void deleteTask(Long userId, Long id) {
          Task existingTask = getTaskById(userId, id);
          taskRepository.delete(existingTask);
     }

     private Subject getSubjectByIdForUser(Long subjectId, Long userId) {
          return subjectRepository.findByIdAndUserId(subjectId, userId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                              "Subject not found with id: " + subjectId + " for userId: " + userId));
     }
}