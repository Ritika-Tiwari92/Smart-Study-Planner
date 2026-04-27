package com.studyplanner.studyplanner.model;

import jakarta.persistence.*;
import java.time.LocalDate;

/**
 * DailyActivity — one record per user per day.
 * Updated automatically when sessions/videos are completed.
 * Used for the 30-day calendar and streak calculation.
 */
@Entity
@Table(name = "daily_activity", uniqueConstraints = @UniqueConstraint(columnNames = { "user_id", "activity_date" }))
public class DailyActivity {

     @Id
     @GeneratedValue(strategy = GenerationType.IDENTITY)
     private Long id;

     @ManyToOne(fetch = FetchType.LAZY)
     @JoinColumn(name = "user_id", nullable = false)
     private User user;

     @Column(name = "activity_date", nullable = false)
     private LocalDate activityDate;

     // Total focus time for this day in seconds
     @Column(nullable = false)
     private Integer focusSeconds = 0;

     // Videos marked completed on this day
     @Column(nullable = false)
     private Integer videosCompleted = 0;

     // Pomodoro sessions completed on this day
     @Column(nullable = false)
     private Integer sessionsCompleted = 0;

     // Daily target — default 3, configurable later
     @Column(nullable = false)
     private Integer targetVideos = 3;

     // True if user had at least 1 session OR 1 video completed
     @Column(nullable = false)
     private boolean activeDay = false;

     // ── Getters & Setters ──────────────────────

     public Long getId() {
          return id;
     }

     public void setId(Long id) {
          this.id = id;
     }

     public User getUser() {
          return user;
     }

     public void setUser(User user) {
          this.user = user;
     }

     public LocalDate getActivityDate() {
          return activityDate;
     }

     public void setActivityDate(LocalDate activityDate) {
          this.activityDate = activityDate;
     }

     public Integer getFocusSeconds() {
          return focusSeconds;
     }

     public void setFocusSeconds(Integer focusSeconds) {
          this.focusSeconds = focusSeconds;
     }

     public Integer getVideosCompleted() {
          return videosCompleted;
     }

     public void setVideosCompleted(Integer videosCompleted) {
          this.videosCompleted = videosCompleted;
     }

     public Integer getSessionsCompleted() {
          return sessionsCompleted;
     }

     public void setSessionsCompleted(Integer sessionsCompleted) {
          this.sessionsCompleted = sessionsCompleted;
     }

     public Integer getTargetVideos() {
          return targetVideos;
     }

     public void setTargetVideos(Integer targetVideos) {
          this.targetVideos = targetVideos;
     }

     public boolean isActiveDay() {
          return activeDay;
     }

     public void setActiveDay(boolean activeDay) {
          this.activeDay = activeDay;
     }
}