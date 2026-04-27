package com.studyplanner.studyplanner.repository;

import com.studyplanner.studyplanner.model.VideoProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface VideoProgressRepository extends JpaRepository<VideoProgress, Long> {

     // Find one user's progress on one video
     Optional<VideoProgress> findByUserIdAndVideoId(Long userId, Long videoId);

     // All progress records for a user
     List<VideoProgress> findByUserId(Long userId);

     // All completed videos for a user
     List<VideoProgress> findByUserIdAndCompletedTrue(Long userId);

     // Count completed videos for a user
     long countByUserIdAndCompletedTrue(Long userId);

     // Completed videos for a user under a specific subject
     // Used for "Subject Champion" badge check
     List<VideoProgress> findByUserIdAndCompletedTrueAndVideoSubjectId(Long userId, Long subjectId);

     // Count completions within a time window — used for daily activity
     long countByUserIdAndCompletedTrueAndCompletedAtBetween(
               Long userId, LocalDateTime from, LocalDateTime to);
}