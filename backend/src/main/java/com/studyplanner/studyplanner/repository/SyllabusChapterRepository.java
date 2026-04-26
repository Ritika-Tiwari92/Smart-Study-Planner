
// SyllabusChapterRepository.java
package com.studyplanner.studyplanner.repository;

import com.studyplanner.studyplanner.model.SyllabusChapter;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SyllabusChapterRepository extends JpaRepository<SyllabusChapter, Long> {
     List<SyllabusChapter> findBySyllabusFileIdOrderByChapterNumber(Long syllabusFileId);
}