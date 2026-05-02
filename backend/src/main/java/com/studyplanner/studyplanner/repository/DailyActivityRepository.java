package com.studyplanner.studyplanner.repository;

import com.studyplanner.studyplanner.model.DailyActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface DailyActivityRepository extends JpaRepository<DailyActivity, Long> {

     // Find activity for a specific day
     Optional<DailyActivity> findByUserIdAndActivityDate(Long userId, LocalDate date);

     // Get last N days of activity — for calendar
     List<DailyActivity> findByUserIdAndActivityDateBetween(
               Long userId, LocalDate from, LocalDate to);

     // All activity records for user — for streak calculation
     List<DailyActivity> findByUserIdOrderByActivityDateDesc(Long userId);

     // Only active days — for streak
     List<DailyActivity> findByUserIdAndActiveDayTrueOrderByActivityDateDesc(Long userId);

     // Target update karna
     @org.springframework.data.jpa.repository.Modifying
     @org.springframework.transaction.annotation.Transactional
     @org.springframework.data.jpa.repository.Query("UPDATE DailyActivity d SET d.targetVideos = :target WHERE d.user.id = :userId")
     void updateTargetForUser(@Param("userId") Long userId, @Param("target") int target);
}
