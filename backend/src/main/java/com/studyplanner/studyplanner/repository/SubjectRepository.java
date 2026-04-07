package com.studyplanner.studyplanner.repository;

import com.studyplanner.studyplanner.model.Subject;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SubjectRepository extends JpaRepository<Subject, Long> {
}
