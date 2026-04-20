package com.studyplanner.studyplanner.repository;

import com.studyplanner.studyplanner.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface TaskRepository extends JpaRepository<Task, Long> {

     List<Task> findBySubjectId(Long subjectId);

     List<Task> findByStatus(String status);

     List<Task> findByDueDate(LocalDate dueDate);

     List<Task> findByDueDateAfter(LocalDate date);

     List<Task> findBySubjectUserId(Long userId);

     Optional<Task> findByIdAndSubjectUserId(Long id, Long userId);
}