package com.studyplanner.studyplanner.repository;

import com.studyplanner.studyplanner.model.StudyVideo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudyVideoRepository extends JpaRepository<StudyVideo, Long> {

     // All videos under a subject
     List<StudyVideo> findBySubjectId(Long subjectId);

     // All videos under a subject that belongs to this user (security check)
     List<StudyVideo> findBySubjectIdAndSubjectUserId(Long subjectId, Long userId);

     // Single video — also verify it belongs to user's subject
     Optional<StudyVideo> findByIdAndSubjectUserId(Long id, Long userId);

     // Count videos under a subject
     long countBySubjectId(Long subjectId);
}