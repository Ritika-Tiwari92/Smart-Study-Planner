package com.studyplanner.studyplanner.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * StudySession — One Pomodoro focus session by a user.
 * Linked to a subject, optionally to a video.
 * Only COMPLETED sessions count toward streaks, badges, and activity.
 */
@Entity
@Table(name = "study_sessions")
public class StudySession {

     public enum Status {
          ACTIVE, PAUSED, COMPLETED, CANCELLED
     }

     @Id
     @GeneratedValue(strategy = GenerationType.IDENTITY)
     private Long id;

     @ManyToOne(fetch = FetchType.LAZY)
     @JoinColumn(name = "user_id", nullable = false)
     private User user;

     @ManyToOne(fetch = FetchType.LAZY)
     @JoinColumn(name = "subject_id", nullable = false)
     private Subject subject;

     // Optional — session may not be tied to a specific video
     @ManyToOne(fetch = FetchType.LAZY)
     @JoinColumn(name = "video_id", nullable = true)
     private StudyVideo video;

     @Column(nullable = false)
     private LocalDateTime startTime;

     @Column(nullable = true)
     private LocalDateTime endTime;

     // Actual focus time accumulated (seconds)
     @Column(nullable = false)
     private Integer focusSeconds = 0;

     @Column(nullable = false)
     private Integer breakSeconds = 0;

     @Enumerated(EnumType.STRING)
     @Column(nullable = false)
     private Status status = Status.ACTIVE;

     @Column(nullable = false, updatable = false)
     private LocalDateTime createdAt;

     @Column(nullable = false)
     private LocalDateTime updatedAt;

     @PrePersist
     public void prePersist() {
          this.createdAt = LocalDateTime.now();
          this.updatedAt = LocalDateTime.now();
          if (this.startTime == null)
               this.startTime = LocalDateTime.now();
     }

     @PreUpdate
     public void preUpdate() {
          this.updatedAt = LocalDateTime.now();
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

     public Subject getSubject() {
          return subject;
     }

     public void setSubject(Subject subject) {
          this.subject = subject;
     }

     public StudyVideo getVideo() {
          return video;
     }

     public void setVideo(StudyVideo video) {
          this.video = video;
     }

     public LocalDateTime getStartTime() {
          return startTime;
     }

     public void setStartTime(LocalDateTime startTime) {
          this.startTime = startTime;
     }

     public LocalDateTime getEndTime() {
          return endTime;
     }

     public void setEndTime(LocalDateTime endTime) {
          this.endTime = endTime;
     }

     public Integer getFocusSeconds() {
          return focusSeconds;
     }

     public void setFocusSeconds(Integer focusSeconds) {
          this.focusSeconds = focusSeconds;
     }

     public Integer getBreakSeconds() {
          return breakSeconds;
     }

     public void setBreakSeconds(Integer breakSeconds) {
          this.breakSeconds = breakSeconds;
     }

     public Status getStatus() {
          return status;
     }

     public void setStatus(Status status) {
          this.status = status;
     }

     public LocalDateTime getCreatedAt() {
          return createdAt;
     }

     public void setCreatedAt(LocalDateTime createdAt) {
          this.createdAt = createdAt;
     }

     public LocalDateTime getUpdatedAt() {
          return updatedAt;
     }

     public void setUpdatedAt(LocalDateTime updatedAt) {
          this.updatedAt = updatedAt;
     }
}