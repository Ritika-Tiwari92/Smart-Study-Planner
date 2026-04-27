package com.studyplanner.studyplanner.repository;

import com.studyplanner.studyplanner.model.DailyActivity;
import org.springframework.data.jpa.repository.JpaRepository;

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
}