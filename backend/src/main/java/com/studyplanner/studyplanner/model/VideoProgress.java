package com.studyplanner.studyplanner.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * VideoProgress — tracks one user's progress on one video.
 * user_id + video_id combination is UNIQUE.
 * This ensures two users watching the same video have separate records.
 */
@Entity
@Table(name = "video_progress", uniqueConstraints = @UniqueConstraint(columnNames = { "user_id", "video_id" }))
public class VideoProgress {

     @Id
     @GeneratedValue(strategy = GenerationType.IDENTITY)
     private Long id;

     @ManyToOne(fetch = FetchType.LAZY)
     @JoinColumn(name = "user_id", nullable = false)
     private User user;

     @ManyToOne(fetch = FetchType.LAZY)
     @JoinColumn(name = "video_id", nullable = false)
     private StudyVideo video;

     @Column(nullable = false)
     private Integer watchedSeconds = 0;

     @Column(nullable = false)
     private boolean completed = false;

     @Column(nullable = true)
     private LocalDateTime completedAt;

     @Column(nullable = true)
     private LocalDateTime lastWatchedAt;

     @PrePersist
     public void prePersist() {
          this.lastWatchedAt = LocalDateTime.now();
     }

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

     public StudyVideo getVideo() {
          return video;
     }

     public void setVideo(StudyVideo video) {
          this.video = video;
     }

     public Integer getWatchedSeconds() {
          return watchedSeconds;
     }

     public void setWatchedSeconds(Integer watchedSeconds) {
          this.watchedSeconds = watchedSeconds;
     }

     public boolean isCompleted() {
          return completed;
     }

     public void setCompleted(boolean completed) {
          this.completed = completed;
     }

     public LocalDateTime getCompletedAt() {
          return completedAt;
     }

     public void setCompletedAt(LocalDateTime completedAt) {
          this.completedAt = completedAt;
     }

     public LocalDateTime getLastWatchedAt() {
          return lastWatchedAt;
     }

     public void setLastWatchedAt(LocalDateTime lastWatchedAt) {
          this.lastWatchedAt = lastWatchedAt;
     }
}