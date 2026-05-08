package com.studyplanner.studyplanner.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "app_notifications")
public class AppNotification {

     @Id
     @GeneratedValue(strategy = GenerationType.IDENTITY)
     private Long id;

     /*
      * For student notifications, userId will store the logged-in student id.
      * For admin-wide notifications, userId can be null and targetRole = ADMIN.
      */
     @Column(name = "user_id")
     private Long userId;

     /*
      * STUDENT or ADMIN
      */
     @Column(name = "target_role", length = 30, nullable = false)
     private String targetRole = "STUDENT";

     @Column(name = "title", length = 180, nullable = false)
     private String title;

     @Column(name = "message", columnDefinition = "TEXT", nullable = false)
     private String message;

     /*
      * Examples:
      * TASK, TEST, REVISION, POMODORO, SYSTEM, SECURITY, ADMIN_ACTIVITY
      */
     @Column(name = "type", length = 60, nullable = false)
     private String type = "SYSTEM";

     /*
      * LOW, MEDIUM, HIGH
      */
     @Column(name = "priority", length = 30, nullable = false)
     private String priority = "MEDIUM";

     /*
      * Optional frontend page path.
      * Examples:
      * /pages/tasks.html
      * /pages/tests.html
      * /pages/pomodoro.html
      */
     @Column(name = "redirect_url", length = 255)
     private String redirectUrl;

     /*
      * Optional source record id.
      * Example: taskId, testId, revisionId, pomodoroSessionId.
      */
     @Column(name = "source_id")
     private Long sourceId;

     @Column(name = "source_module", length = 80)
     private String sourceModule;

     @Column(name = "is_read", nullable = false)
     private Boolean read = false;

     @Column(name = "created_at", updatable = false)
     private LocalDateTime createdAt;

     @Column(name = "read_at")
     private LocalDateTime readAt;

     @PrePersist
     protected void onCreate() {
          if (createdAt == null) {
               createdAt = LocalDateTime.now();
          }

          normalizeDefaults();
     }

     @PreUpdate
     protected void onUpdate() {
          normalizeDefaults();
     }

     private void normalizeDefaults() {
          if (targetRole == null || targetRole.trim().isEmpty()) {
               targetRole = "STUDENT";
          }

          if (type == null || type.trim().isEmpty()) {
               type = "SYSTEM";
          }

          if (priority == null || priority.trim().isEmpty()) {
               priority = "MEDIUM";
          }

          targetRole = targetRole.trim().toUpperCase();
          type = type.trim().toUpperCase();
          priority = priority.trim().toUpperCase();

          if (read == null) {
               read = false;
          }

          if (Boolean.TRUE.equals(read) && readAt == null) {
               readAt = LocalDateTime.now();
          }

          if (!Boolean.TRUE.equals(read)) {
               readAt = null;
          }

          if (title != null) {
               title = title.trim();
          }

          if (message != null) {
               message = message.trim();
          }

          if (redirectUrl != null) {
               redirectUrl = redirectUrl.trim();
          }

          if (sourceModule != null) {
               sourceModule = sourceModule.trim().toUpperCase();
          }
     }

     public Long getId() {
          return id;
     }

     public void setId(Long id) {
          this.id = id;
     }

     public Long getUserId() {
          return userId;
     }

     public void setUserId(Long userId) {
          this.userId = userId;
     }

     public String getTargetRole() {
          return targetRole;
     }

     public void setTargetRole(String targetRole) {
          this.targetRole = targetRole;
     }

     public String getTitle() {
          return title;
     }

     public void setTitle(String title) {
          this.title = title;
     }

     public String getMessage() {
          return message;
     }

     public void setMessage(String message) {
          this.message = message;
     }

     public String getType() {
          return type;
     }

     public void setType(String type) {
          this.type = type;
     }

     public String getPriority() {
          return priority;
     }

     public void setPriority(String priority) {
          this.priority = priority;
     }

     public String getRedirectUrl() {
          return redirectUrl;
     }

     public void setRedirectUrl(String redirectUrl) {
          this.redirectUrl = redirectUrl;
     }

     public Long getSourceId() {
          return sourceId;
     }

     public void setSourceId(Long sourceId) {
          this.sourceId = sourceId;
     }

     public String getSourceModule() {
          return sourceModule;
     }

     public void setSourceModule(String sourceModule) {
          this.sourceModule = sourceModule;
     }

     public Boolean getRead() {
          return read;
     }

     public void setRead(Boolean read) {
          this.read = read;
     }

     public LocalDateTime getCreatedAt() {
          return createdAt;
     }

     public void setCreatedAt(LocalDateTime createdAt) {
          this.createdAt = createdAt;
     }

     public LocalDateTime getReadAt() {
          return readAt;
     }

     public void setReadAt(LocalDateTime readAt) {
          this.readAt = readAt;
     }
}