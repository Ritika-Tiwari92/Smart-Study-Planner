package com.studyplanner.studyplanner.repository;

import com.studyplanner.studyplanner.model.Revision;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RevisionRepository extends JpaRepository<Revision, Long> {
}