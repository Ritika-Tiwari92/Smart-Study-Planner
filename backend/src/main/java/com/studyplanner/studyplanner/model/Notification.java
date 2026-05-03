package com.studyplanner.studyplanner.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
public class Notification {

     @Id
     @GeneratedValue(strategy = GenerationType.IDENTITY)
     private Long id;

     /*
      * Admin who created/sent this notification.
      * We are storing adminId directly to avoid breaking existing User entity.
      */
     @Column(name = "admin_id")
     private Long adminId;

     @Column(name = "title", nullable = false, length = 120)
     private String title;

     @Column(name = "message", nullable = false, columnDefinition = "TEXT")
     private String message;

     /*
      * Example values:
      * General, Study, Test, Revision, Pomodoro
      */
     @Column(name = "type", length = 40)
     private String type = "General";

     /*
      * Example values:
      * all, student
      */
     @Column(name = "target", length = 50)
     private String target = "all";

     /*
      * If notification is for a specific student, store student id here.
      * If target = all, this can remain null.
      */
     @Column(name = "target_student_id")
     private Long targetStudentId;

     /*
      * Human-readable target label like:
      * All Students, Ritika, Student #5
      */
     @Column(name = "target_label", length = 150)
     private String targetLabel = "All Students";

     /*
      * Example values:
      * SENT, DRAFT
      */
     @Column(name = "status", length = 30)
     private String status = "SENT";

     @Column(name = "sent_at")
     private LocalDateTime sentAt;

     @Column(name = "created_at", updatable = false)
     private LocalDateTime createdAt;

     @Column(name = "updated_at")
     private LocalDateTime updatedAt;

     public Notification() {
     }

     @PrePersist
     protected void onCreate() {
          LocalDateTime now = LocalDateTime.now();

          if (createdAt == null) {
               createdAt = now;
          }

          if (sentAt == null) {
               sentAt = now;
          }

          updatedAt = now;

          normalizeDefaults();
     }

     @PreUpdate
     protected void onUpdate() {
          updatedAt = LocalDateTime.now();
          normalizeDefaults();
     }

     private void normalizeDefaults() {
          if (type == null || type.trim().isEmpty()) {
               type = "General";
          }

          if (target == null || target.trim().isEmpty()) {
               target = "all";
          }

          if (targetLabel == null || targetLabel.trim().isEmpty()) {
               targetLabel = "All Students";
          }

          if (status == null || status.trim().isEmpty()) {
               status = "SENT";
          }
     }

     public Long getId() {
          return id;
     }

     public Long getAdminId() {
          return adminId;
     }

     public void setAdminId(Long adminId) {
          this.adminId = adminId;
     }

     public String getTitle() {
          return title;
     }

     public void setTitle(String title) {
          if (title != null) {
               this.title = title.trim();
          } else {
               this.title = null;
          }
     }

     public String getMessage() {
          return message;
     }

     public void setMessage(String message) {
          if (message != null) {
               this.message = message.trim();
          } else {
               this.message = null;
          }
     }

     public String getType() {
          return type;
     }

     public void setType(String type) {
          if (type != null && !type.trim().isEmpty()) {
               this.type = type.trim();
          } else {
               this.type = "General";
          }
     }

     public String getTarget() {
          return target;
     }

     public void setTarget(String target) {
          if (target != null && !target.trim().isEmpty()) {
               this.target = target.trim();
          } else {
               this.target = "all";
          }
     }

     public Long getTargetStudentId() {
          return targetStudentId;
     }

     public void setTargetStudentId(Long targetStudentId) {
          this.targetStudentId = targetStudentId;
     }

     public String getTargetLabel() {
          return targetLabel;
     }

     public void setTargetLabel(String targetLabel) {
          if (targetLabel != null && !targetLabel.trim().isEmpty()) {
               this.targetLabel = targetLabel.trim();
          } else {
               this.targetLabel = "All Students";
          }
     }

     public String getStatus() {
          return status;
     }

     public void setStatus(String status) {
          if (status != null && !status.trim().isEmpty()) {
               this.status = status.trim().toUpperCase();
          } else {
               this.status = "SENT";
          }
     }

     public LocalDateTime getSentAt() {
          return sentAt;
     }

     public void setSentAt(LocalDateTime sentAt) {
          this.sentAt = sentAt;
     }

     public LocalDateTime getCreatedAt() {
          return createdAt;
     }

     public LocalDateTime getUpdatedAt() {
          return updatedAt;
     }
}