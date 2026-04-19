package com.studyplanner.studyplanner.repository;

import com.studyplanner.studyplanner.model.Test;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TestRepository extends JpaRepository<Test, Long> {
}