package com.studyplanner.studyplanner.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * StudyVideo — A video or topic under a subject.
 * Global resource: not user-specific.
 * User-specific completion is tracked in VideoProgress.
 */
@Entity
@Table(name = "study_videos")
public class StudyVideo {

     @Id
     @GeneratedValue(strategy = GenerationType.IDENTITY)
     private Long id;

     @ManyToOne(fetch = FetchType.LAZY)
     @JoinColumn(name = "subject_id", nullable = false)
     private Subject subject;

     @Column(nullable = false)
     private String title;

     @Column(length = 2000)
     private String videoUrl;

     @Column
     private String tag;

     // Duration in seconds (e.g. 1500 = 25 minutes)
     @Column(nullable = false)
     private Integer durationSeconds = 0;

     @Column(nullable = false, updatable = false)
     private LocalDateTime createdAt;

     @Column(nullable = false)
     private LocalDateTime updatedAt;

     @PrePersist
     public void prePersist() {
          this.createdAt = LocalDateTime.now();
          this.updatedAt = LocalDateTime.now();
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

     public Subject getSubject() {
          return subject;
     }

     public void setSubject(Subject subject) {
          this.subject = subject;
     }

     public String getTitle() {
          return title;
     }

     public void setTitle(String title) {
          this.title = title;
     }

     public String getVideoUrl() {
          return videoUrl;
     }

     public void setVideoUrl(String videoUrl) {
          this.videoUrl = videoUrl;
     }

     public String getTag() {
          return tag;
     }

     public void setTag(String tag) {
          this.tag = tag;
     }

     public Integer getDurationSeconds() {
          return durationSeconds;
     }

     public void setDurationSeconds(Integer durationSeconds) {
          this.durationSeconds = durationSeconds;
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