package com.studyplanner.studyplanner.repository;

import com.studyplanner.studyplanner.model.Subject;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SubjectRepository extends JpaRepository<Subject, Long> {

     List<Subject> findByUserId(Long userId);

     Optional<Subject> findByIdAndUserId(Long id, Long userId);
}