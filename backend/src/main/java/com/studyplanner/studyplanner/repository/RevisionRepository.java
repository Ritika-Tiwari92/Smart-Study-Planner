package com.studyplanner.studyplanner.repository;

import com.studyplanner.studyplanner.model.Revision;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RevisionRepository extends JpaRepository<Revision, Long> {

     List<Revision> findByUserId(Long userId);

     Optional<Revision> findByIdAndUserId(Long id, Long userId);
}