
// SyllabusFileRepository.java
package com.studyplanner.studyplanner.repository;

import com.studyplanner.studyplanner.model.SyllabusFile;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface SyllabusFileRepository extends JpaRepository<SyllabusFile, Long> {
     Optional<SyllabusFile> findBySubjectId(Long subjectId);

     void deleteBySubjectId(Long subjectId);
}