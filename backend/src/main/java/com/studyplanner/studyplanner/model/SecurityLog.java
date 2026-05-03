package com.studyplanner.studyplanner.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "security_logs")
public class SecurityLog {

     @Id
     @GeneratedValue(strategy = GenerationType.IDENTITY)
     private Long id;

     /*
      * User/Admin id who performed the action.
      * We store id directly to avoid breaking existing User entity.
      */
     @Column(name = "user_id")
     private Long userId;

     @Column(name = "user_name", length = 120)
     private String userName;

     @Column(name = "email", length = 150)
     private String email;

     /*
      * Example:
      * ADMIN, STUDENT
      */
     @Column(name = "role", length = 40)
     private String role = "ADMIN";

     /*
      * Example:
      * LOGIN, LOGOUT, FAILED_LOGIN, ADMIN_ACTION, SETTINGS_UPDATE, NOTIFICATION_SENT
      */
     @Column(name = "action", nullable = false, length = 80)
     private String action;

     /*
      * Example:
      * INFO, SUCCESS, WARNING, CRITICAL
      */
     @Column(name = "severity", length = 30)
     private String severity = "INFO";

     /*
      * Example:
      * SUCCESS, FAILED, PENDING
      */
     @Column(name = "status", length = 30)
     private String status = "SUCCESS";

     @Column(name = "description", columnDefinition = "TEXT")
     private String description;

     @Column(name = "ip_address", length = 80)
     private String ipAddress;

     @Column(name = "device_info", length = 255)
     private String deviceInfo;

     @Column(name = "created_at", updatable = false)
     private LocalDateTime createdAt;

     public SecurityLog() {
     }

     @PrePersist
     protected void onCreate() {
          if (createdAt == null) {
               createdAt = LocalDateTime.now();
          }

          normalizeDefaults();
     }

     private void normalizeDefaults() {
          if (role == null || role.trim().isEmpty()) {
               role = "ADMIN";
          }

          if (severity == null || severity.trim().isEmpty()) {
               severity = "INFO";
          }

          if (status == null || status.trim().isEmpty()) {
               status = "SUCCESS";
          }

          role = role.trim().toUpperCase();
          severity = severity.trim().toUpperCase();
          status = status.trim().toUpperCase();

          if (action != null) {
               action = action.trim().toUpperCase();
          }

          if (userName != null) {
               userName = userName.trim();
          }

          if (email != null) {
               email = email.trim();
          }

          if (description != null) {
               description = description.trim();
          }

          if (ipAddress != null) {
               ipAddress = ipAddress.trim();
          }

          if (deviceInfo != null) {
               deviceInfo = deviceInfo.trim();
          }
     }

     public Long getId() {
          return id;
     }

     public Long getUserId() {
          return userId;
     }

     public void setUserId(Long userId) {
          this.userId = userId;
     }

     public String getUserName() {
          return userName;
     }

     public void setUserName(String userName) {
          this.userName = userName;
     }

     public String getEmail() {
          return email;
     }

     public void setEmail(String email) {
          this.email = email;
     }

     public String getRole() {
          return role;
     }

     public void setRole(String role) {
          this.role = role;
     }

     public String getAction() {
          return action;
     }

     public void setAction(String action) {
          this.action = action;
     }

     public String getSeverity() {
          return severity;
     }

     public void setSeverity(String severity) {
          this.severity = severity;
     }

     public String getStatus() {
          return status;
     }

     public void setStatus(String status) {
          this.status = status;
     }

     public String getDescription() {
          return description;
     }

     public void setDescription(String description) {
          this.description = description;
     }

     public String getIpAddress() {
          return ipAddress;
     }

     public void setIpAddress(String ipAddress) {
          this.ipAddress = ipAddress;
     }

     public String getDeviceInfo() {
          return deviceInfo;
     }

     public void setDeviceInfo(String deviceInfo) {
          this.deviceInfo = deviceInfo;
     }

     public LocalDateTime getCreatedAt() {
          return createdAt;
     }
}