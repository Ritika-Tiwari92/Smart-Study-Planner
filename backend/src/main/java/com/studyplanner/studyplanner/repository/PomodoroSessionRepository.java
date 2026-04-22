package com.studyplanner.studyplanner.repository;

import com.studyplanner.studyplanner.model.PomodoroSession;
import com.studyplanner.studyplanner.model.PomodoroSession.SessionStatus;
import com.studyplanner.studyplanner.model.PomodoroSession.SessionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PomodoroSessionRepository extends JpaRepository<PomodoroSession, Long> {

     // ─── Basic Fetch ──────────────────────────────────────────────────────────

     // Sare sessions ek user ke
     List<PomodoroSession> findByUserIdOrderByCreatedAtDesc(Long userId);

     // Ek specific session (user-owned check ke saath)
     Optional<PomodoroSession> findByIdAndUserId(Long id, Long userId);

     // ─── Analytics Queries ────────────────────────────────────────────────────

     // Last N days ke completed FOCUS sessions
     @Query("SELECT p FROM PomodoroSession p WHERE p.user.id = :userId " +
               "AND p.sessionType = 'FOCUS' " +
               "AND p.status = 'COMPLETED' " +
               "AND p.sessionDate >= :fromDate " +
               "ORDER BY p.sessionDate ASC")
     List<PomodoroSession> findCompletedFocusSessionsFromDate(
               @Param("userId") Long userId,
               @Param("fromDate") LocalDate fromDate);

     // Daily focus minutes — last 7 days grouped by date
     @Query("SELECT p.sessionDate, SUM(p.actualDurationMinutes) FROM PomodoroSession p " +
               "WHERE p.user.id = :userId " +
               "AND p.sessionType = 'FOCUS' " +
               "AND p.status = 'COMPLETED' " +
               "AND p.sessionDate >= :fromDate " +
               "GROUP BY p.sessionDate " +
               "ORDER BY p.sessionDate ASC")
     List<Object[]> findDailyFocusMinutes(
               @Param("userId") Long userId,
               @Param("fromDate") LocalDate fromDate);

     // Subject-wise focus time
     @Query("SELECT p.linkedSubjectName, SUM(p.actualDurationMinutes) FROM PomodoroSession p " +
               "WHERE p.user.id = :userId " +
               "AND p.sessionType = 'FOCUS' " +
               "AND p.status = 'COMPLETED' " +
               "AND p.linkedSubjectName IS NOT NULL " +
               "GROUP BY p.linkedSubjectName " +
               "ORDER BY SUM(p.actualDurationMinutes) DESC")
     List<Object[]> findSubjectWiseFocusMinutes(@Param("userId") Long userId);

     // Total completed focus sessions count
     long countByUserIdAndSessionTypeAndStatus(
               Long userId, SessionType sessionType, SessionStatus status);

     // Total interrupted sessions count
     long countByUserIdAndSessionTypeAndStatusIn(
               Long userId, SessionType sessionType, List<SessionStatus> statuses);

     // Distinct active days in a date range (for consistency score)
     @Query("SELECT COUNT(DISTINCT p.sessionDate) FROM PomodoroSession p " +
               "WHERE p.user.id = :userId " +
               "AND p.sessionType = 'FOCUS' " +
               "AND p.status = 'COMPLETED' " +
               "AND p.sessionDate >= :fromDate AND p.sessionDate <= :toDate")
     long countDistinctActiveDays(
               @Param("userId") Long userId,
               @Param("fromDate") LocalDate fromDate,
               @Param("toDate") LocalDate toDate);

     // Weekly sessions — last 4 weeks
     @Query("SELECT WEEK(p.sessionDate), COUNT(p) FROM PomodoroSession p " +
               "WHERE p.user.id = :userId " +
               "AND p.sessionType = 'FOCUS' " +
               "AND p.status = 'COMPLETED' " +
               "AND p.sessionDate >= :fromDate " +
               "GROUP BY WEEK(p.sessionDate) " +
               "ORDER BY WEEK(p.sessionDate) ASC")
     List<Object[]> findWeeklySessionCounts(
               @Param("userId") Long userId,
               @Param("fromDate") LocalDate fromDate);

     // Subject-linked sessions count (for productivity score bonus)
     @Query("SELECT COUNT(p) FROM PomodoroSession p " +
               "WHERE p.user.id = :userId " +
               "AND p.sessionType = 'FOCUS' " +
               "AND p.status = 'COMPLETED' " +
               "AND p.linkedSubjectName IS NOT NULL")
     long countSubjectLinkedCompletedSessions(@Param("userId") Long userId);

     // Total focus minutes (all time)
     @Query("SELECT COALESCE(SUM(p.actualDurationMinutes), 0) FROM PomodoroSession p " +
               "WHERE p.user.id = :userId " +
               "AND p.sessionType = 'FOCUS' " +
               "AND p.status = 'COMPLETED'")
     long sumTotalFocusMinutes(@Param("userId") Long userId);

     // Break sessions count
     @Query("SELECT COUNT(p) FROM PomodoroSession p " +
               "WHERE p.user.id = :userId " +
               "AND p.sessionType IN ('SHORT_BREAK', 'LONG_BREAK') " +
               "AND p.status = 'COMPLETED'")
     long countCompletedBreakSessions(@Param("userId") Long userId);
}