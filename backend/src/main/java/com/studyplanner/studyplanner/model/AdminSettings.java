package com.studyplanner.studyplanner.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "admin_settings")
public class AdminSettings {

     @Id
     @GeneratedValue(strategy = GenerationType.IDENTITY)
     private Long id;

     /*
      * We are storing adminId directly instead of using @ManyToOne User relation.
      * Reason: This keeps the settings module simple and avoids breaking existing
      * User entity.
      * Later, if needed, we can connect it properly with User entity.
      */
     @Column(name = "admin_id", nullable = false, unique = true)
     private Long adminId;

     @Column(name = "admin_name", length = 100)
     private String adminName;

     @Column(name = "admin_email", length = 150)
     private String adminEmail;

     @Column(name = "designation", length = 100)
     private String designation;

     @Column(name = "phone", length = 30)
     private String phone;

     @Column(name = "allow_student_registration", nullable = false)
     private boolean allowStudentRegistration = true;

     @Column(name = "enable_assistant", nullable = false)
     private boolean enableAssistant = true;

     @Column(name = "enable_pomodoro", nullable = false)
     private boolean enablePomodoro = true;

     @Column(name = "auto_submit_tests", nullable = false)
     private boolean autoSubmitTests = true;

     @Column(name = "new_student_alert", nullable = false)
     private boolean newStudentAlert = true;

     @Column(name = "test_submission_alert", nullable = false)
     private boolean testSubmissionAlert = true;

     @Column(name = "low_activity_alert", nullable = false)
     private boolean lowActivityAlert = true;

     @Column(name = "security_alert", nullable = false)
     private boolean securityAlert = true;

     @Column(name = "two_factor_enabled", nullable = false)
     private boolean twoFactorEnabled = false;

     @Column(name = "default_theme", length = 20)
     private String defaultTheme = "dark";

     @Column(name = "compact_sidebar", nullable = false)
     private boolean compactSidebar = false;

     @Column(name = "animated_logo", nullable = false)
     private boolean animatedLogo = true;

     @Column(name = "created_at", updatable = false)
     private LocalDateTime createdAt;

     @Column(name = "updated_at")
     private LocalDateTime updatedAt;

     public AdminSettings() {
     }

     @PrePersist
     protected void onCreate() {
          LocalDateTime now = LocalDateTime.now();

          if (createdAt == null) {
               createdAt = now;
          }

          updatedAt = now;

          if (designation == null || designation.trim().isEmpty()) {
               designation = "System Administrator";
          }

          if (defaultTheme == null || defaultTheme.trim().isEmpty()) {
               defaultTheme = "dark";
          }
     }

     @PreUpdate
     protected void onUpdate() {
          updatedAt = LocalDateTime.now();

          if (designation == null || designation.trim().isEmpty()) {
               designation = "System Administrator";
          }

          if (defaultTheme == null || defaultTheme.trim().isEmpty()) {
               defaultTheme = "dark";
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

     public String getAdminName() {
          return adminName;
     }

     public void setAdminName(String adminName) {
          this.adminName = adminName;
     }

     public String getAdminEmail() {
          return adminEmail;
     }

     public void setAdminEmail(String adminEmail) {
          this.adminEmail = adminEmail;
     }

     public String getDesignation() {
          return designation;
     }

     public void setDesignation(String designation) {
          this.designation = designation;
     }

     public String getPhone() {
          return phone;
     }

     public void setPhone(String phone) {
          this.phone = phone;
     }

     public boolean isAllowStudentRegistration() {
          return allowStudentRegistration;
     }

     public void setAllowStudentRegistration(boolean allowStudentRegistration) {
          this.allowStudentRegistration = allowStudentRegistration;
     }

     public boolean isEnableAssistant() {
          return enableAssistant;
     }

     public void setEnableAssistant(boolean enableAssistant) {
          this.enableAssistant = enableAssistant;
     }

     public boolean isEnablePomodoro() {
          return enablePomodoro;
     }

     public void setEnablePomodoro(boolean enablePomodoro) {
          this.enablePomodoro = enablePomodoro;
     }

     public boolean isAutoSubmitTests() {
          return autoSubmitTests;
     }

     public void setAutoSubmitTests(boolean autoSubmitTests) {
          this.autoSubmitTests = autoSubmitTests;
     }

     public boolean isNewStudentAlert() {
          return newStudentAlert;
     }

     public void setNewStudentAlert(boolean newStudentAlert) {
          this.newStudentAlert = newStudentAlert;
     }

     public boolean isTestSubmissionAlert() {
          return testSubmissionAlert;
     }

     public void setTestSubmissionAlert(boolean testSubmissionAlert) {
          this.testSubmissionAlert = testSubmissionAlert;
     }

     public boolean isLowActivityAlert() {
          return lowActivityAlert;
     }

     public void setLowActivityAlert(boolean lowActivityAlert) {
          this.lowActivityAlert = lowActivityAlert;
     }

     public boolean isSecurityAlert() {
          return securityAlert;
     }

     public void setSecurityAlert(boolean securityAlert) {
          this.securityAlert = securityAlert;
     }

     public boolean isTwoFactorEnabled() {
          return twoFactorEnabled;
     }

     public void setTwoFactorEnabled(boolean twoFactorEnabled) {
          this.twoFactorEnabled = twoFactorEnabled;
     }

     public String getDefaultTheme() {
          return defaultTheme;
     }

     public void setDefaultTheme(String defaultTheme) {
          this.defaultTheme = defaultTheme;
     }

     public boolean isCompactSidebar() {
          return compactSidebar;
     }

     public void setCompactSidebar(boolean compactSidebar) {
          this.compactSidebar = compactSidebar;
     }

     public boolean isAnimatedLogo() {
          return animatedLogo;
     }

     public void setAnimatedLogo(boolean animatedLogo) {
          this.animatedLogo = animatedLogo;
     }

     public LocalDateTime getCreatedAt() {
          return createdAt;
     }

     public LocalDateTime getUpdatedAt() {
          return updatedAt;
     }
}