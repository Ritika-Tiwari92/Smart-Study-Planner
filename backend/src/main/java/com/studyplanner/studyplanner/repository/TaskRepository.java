package com.studyplanner.studyplanner.repository;

import com.studyplanner.studyplanner.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TaskRepository extends JpaRepository<Task, Long> {
}