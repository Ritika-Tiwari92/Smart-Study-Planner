package com.studyplanner.studyplanner.repository;

import com.studyplanner.studyplanner.model.StudySession;
import com.studyplanner.studyplanner.model.StudySession.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface StudySessionRepository extends JpaRepository<StudySession, Long> {

     // All sessions for a user
     List<StudySession> findByUserId(Long userId);

     // Sessions by status
     List<StudySession> findByUserIdAndStatus(Long userId, Status status);

     // Find active/paused session — to prevent duplicate active sessions
     Optional<StudySession> findByUserIdAndStatusIn(Long userId, List<Status> statuses);

     // Sessions within a time range — used for daily/weekly stats
     List<StudySession> findByUserIdAndStartTimeBetween(
               Long userId, LocalDateTime from, LocalDateTime to);

     // Completed sessions within a time range
     List<StudySession> findByUserIdAndStatusAndStartTimeBetween(
               Long userId, Status status, LocalDateTime from, LocalDateTime to);

     // Total focus seconds for a user — used for badge check
     @Query("SELECT COALESCE(SUM(s.focusSeconds), 0) FROM StudySession s " +
               "WHERE s.user.id = :userId AND s.status = 'COMPLETED'")
     Long sumFocusSecondsByUserId(@Param("userId") Long userId);

     // Count completed sessions — used for Focus Warrior badge
     long countByUserIdAndStatus(Long userId, Status status);

     // Single session — verify it belongs to user
     Optional<StudySession> findByIdAndUserId(Long id, Long userId);
}
