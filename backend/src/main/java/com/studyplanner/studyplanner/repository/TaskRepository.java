package com.studyplanner.studyplanner.repository;

import com.studyplanner.studyplanner.model.Task; // Ye line Task ko dhoondne mein madad karegi
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
}