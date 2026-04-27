package com.studyplanner.studyplanner.dto;

import java.time.LocalDateTime;

/**
 * StudyVideoDto — returned to frontend.
 * Includes user-specific completion status from VideoProgress.
 */
public class StudyVideoDto {

     private Long id;
     private Long subjectId;
     private String subjectName;
     private String title;
     private String videoUrl;
     private String tag;
     private Integer durationSeconds;
     private LocalDateTime createdAt;

     // User-specific fields — from VideoProgress
     private boolean completed;
     private LocalDateTime completedAt;
     private Integer watchedSeconds;

     // ── Getters & Setters ──────────────────────

     public Long getId() {
          return id;
     }

     public void setId(Long id) {
          this.id = id;
     }

     public Long getSubjectId() {
          return subjectId;
     }

     public void setSubjectId(Long subjectId) {
          this.subjectId = subjectId;
     }

     public String getSubjectName() {
          return subjectName;
     }

     public void setSubjectName(String subjectName) {
          this.subjectName = subjectName;
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

     public Integer getWatchedSeconds() {
          return watchedSeconds;
     }

     public void setWatchedSeconds(Integer watchedSeconds) {
          this.watchedSeconds = watchedSeconds;
     }
}