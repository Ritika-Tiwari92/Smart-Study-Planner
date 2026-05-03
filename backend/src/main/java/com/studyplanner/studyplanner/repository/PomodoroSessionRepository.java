package com.studyplanner.studyplanner.repository;

import com.studyplanner.studyplanner.model.PomodoroSession;
import com.studyplanner.studyplanner.model.PomodoroSession.SessionStatus;
import com.studyplanner.studyplanner.model.PomodoroSession.SessionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public interface PomodoroSessionRepository extends JpaRepository<PomodoroSession, Long> {

     /*
      * Admin: latest sessions first.
      */
     List<PomodoroSession> findAllByOrderByCreatedAtDesc();

     /*
      * Student: logged-in student's sessions.
      */
     List<PomodoroSession> findByStudentIdOrderByCreatedAtDesc(Long studentId);

     /*
      * Admin: filter sessions by status.
      */
     List<PomodoroSession> findByStatusIgnoreCaseOrderByCreatedAtDesc(String status);

     /*
      * Admin: filter sessions by session type.
      */
     List<PomodoroSession> findBySessionTypeIgnoreCaseOrderByCreatedAtDesc(String sessionType);

     /*
      * Admin: filter sessions by subject.
      */
     List<PomodoroSession> findBySubjectNameIgnoreCaseOrderByCreatedAtDesc(String subjectName);

     /*
      * Admin/student: sessions within date range.
      */
     List<PomodoroSession> findByCreatedAtBetweenOrderByCreatedAtDesc(
               LocalDateTime startDate,
               LocalDateTime endDate);

     /*
      * Admin: sessions for one student in date range.
      */
     List<PomodoroSession> findByStudentIdAndCreatedAtBetweenOrderByCreatedAtDesc(
               Long studentId,
               LocalDateTime startDate,
               LocalDateTime endDate);

     long countByStatusIgnoreCase(String status);

     long countByStudentId(Long studentId);

     /*
      * DashboardService support:
      * Completed focus sessions from a date.
      *
      * Supports both:
      * FOCUS = old dashboard naming
      * POMODORO = new admin pomodoro naming
      */
     @Query("""
               SELECT p
               FROM PomodoroSession p
               WHERE p.studentId = :userId
                 AND UPPER(p.status) = 'COMPLETED'
                 AND (
                       UPPER(p.sessionType) = 'FOCUS'
                       OR UPPER(p.sessionType) = 'POMODORO'
                       OR UPPER(p.sessionType) = 'DEEP_WORK'
                     )
                 AND p.sessionDate >= :fromDate
               ORDER BY p.createdAt DESC
               """)
     List<PomodoroSession> findCompletedFocusSessionsFromDate(
               @Param("userId") Long userId,
               @Param("fromDate") LocalDate fromDate);

     /*
      * DashboardService support:
      * Total completed focus minutes.
      */
     @Query("""
               SELECT COALESCE(SUM(p.focusMinutes), 0)
               FROM PomodoroSession p
               WHERE p.studentId = :userId
                 AND UPPER(p.status) = 'COMPLETED'
               """)
     long sumTotalFocusMinutes(@Param("userId") Long userId);

     /*
      * DashboardService support:
      * Old service passes enum values. Entity stores them as String,
      * so we compare enum.name() with stored string.
      */
     @Query("""
               SELECT COUNT(p)
               FROM PomodoroSession p
               WHERE p.studentId = :userId
                 AND UPPER(p.sessionType) = UPPER(:#{#sessionType.name()})
                 AND UPPER(p.status) = UPPER(:#{#status.name()})
               """)
     long countByUserIdAndSessionTypeAndStatus(
               @Param("userId") Long userId,
               @Param("sessionType") SessionType sessionType,
               @Param("status") SessionStatus status);

     /*
      * DashboardService support:
      * Count completed sessions linked with subjects.
      */
     @Query("""
               SELECT COUNT(p)
               FROM PomodoroSession p
               WHERE p.studentId = :userId
                 AND UPPER(p.status) = 'COMPLETED'
                 AND (
                       p.subjectId IS NOT NULL
                       OR p.subjectName IS NOT NULL
                     )
               """)
     long countSubjectLinkedCompletedSessions(@Param("userId") Long userId);

     /*
      * DashboardService support:
      * Daily focus minutes from a date.
      */
     @Query("""
               SELECT p.sessionDate, COALESCE(SUM(p.focusMinutes), 0)
               FROM PomodoroSession p
               WHERE p.studentId = :userId
                 AND UPPER(p.status) = 'COMPLETED'
                 AND p.sessionDate >= :fromDate
               GROUP BY p.sessionDate
               ORDER BY p.sessionDate ASC
               """)
     List<Object[]> findDailyFocusMinutes(
               @Param("userId") Long userId,
               @Param("fromDate") LocalDate fromDate);

     /*
      * DashboardService support:
      * Count active focus days.
      */
     @Query("""
               SELECT COUNT(DISTINCT p.sessionDate)
               FROM PomodoroSession p
               WHERE p.studentId = :userId
                 AND UPPER(p.status) = 'COMPLETED'
                 AND p.sessionDate BETWEEN :fromDate AND :toDate
               """)
     long countDistinctActiveDays(
               @Param("userId") Long userId,
               @Param("fromDate") LocalDate fromDate,
               @Param("toDate") LocalDate toDate);
}