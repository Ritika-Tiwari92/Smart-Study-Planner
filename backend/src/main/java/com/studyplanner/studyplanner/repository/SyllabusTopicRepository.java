// SyllabusTopicRepository.java
package com.studyplanner.studyplanner.repository;

import com.studyplanner.studyplanner.model.SyllabusTopic;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SyllabusTopicRepository extends JpaRepository<SyllabusTopic, Long> {
     List<SyllabusTopic> findByChapterIdOrderByTopicNumber(Long chapterId);
}