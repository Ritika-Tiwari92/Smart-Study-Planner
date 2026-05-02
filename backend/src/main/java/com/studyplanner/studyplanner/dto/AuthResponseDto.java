package com.studyplanner.studyplanner.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Auth Response DTO
 *
 * Used for:
 * - Login response
 * - Register response
 * - Profile response
 * - Settings/profile update response
 *
 * Security:
 * - Password is never returned.
 *
 * Role:
 * - STUDENT or ADMIN
 * - Frontend uses this role to redirect:
 * ADMIN -> admin-dashboard.html
 * STUDENT -> dashboard.html
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuthResponseDto {

     private Long id;
     private String fullName;
     private String email;

     // Role field for role-based frontend redirect
     private String role;

     // NO password field — intentional security measure
     private String course;
     private String college;

     private boolean twoFactorEnabled;
     private String preferredStudyTime;
     private String dailyStudyGoal;
     private String preferredSubjectsFocus;

     private boolean taskRemindersEnabled;
     private boolean revisionAlertsEnabled;
     private boolean testNotificationsEnabled;
     private boolean assistantSuggestionsEnabled;

     // JWT access token
     private String token;

     // Refresh token
     private String refreshToken;

     private String message;

     public AuthResponseDto() {
     }

     /**
      * New constructor with role.
      */
     public AuthResponseDto(Long id, String fullName, String email, String role,
               String course, String college,
               boolean twoFactorEnabled, String preferredStudyTime,
               String dailyStudyGoal, String preferredSubjectsFocus,
               boolean taskRemindersEnabled, boolean revisionAlertsEnabled,
               boolean testNotificationsEnabled,
               boolean assistantSuggestionsEnabled,
               String token, String message) {

          this.id = id;
          this.fullName = fullName;
          this.email = email;
          this.role = role;
          this.course = course;
          this.college = college;
          this.twoFactorEnabled = twoFactorEnabled;
          this.preferredStudyTime = preferredStudyTime;
          this.dailyStudyGoal = dailyStudyGoal;
          this.preferredSubjectsFocus = preferredSubjectsFocus;
          this.taskRemindersEnabled = taskRemindersEnabled;
          this.revisionAlertsEnabled = revisionAlertsEnabled;
          this.testNotificationsEnabled = testNotificationsEnabled;
          this.assistantSuggestionsEnabled = assistantSuggestionsEnabled;
          this.token = token;
          this.message = message;
     }

     /**
      * Old constructor kept for backward compatibility.
      * This prevents compile errors if any old service method still uses it.
      */
     public AuthResponseDto(Long id, String fullName, String email,
               String course, String college,
               boolean twoFactorEnabled, String preferredStudyTime,
               String dailyStudyGoal, String preferredSubjectsFocus,
               boolean taskRemindersEnabled, boolean revisionAlertsEnabled,
               boolean testNotificationsEnabled,
               boolean assistantSuggestionsEnabled,
               String token, String message) {

          this.id = id;
          this.fullName = fullName;
          this.email = email;
          this.course = course;
          this.college = college;
          this.twoFactorEnabled = twoFactorEnabled;
          this.preferredStudyTime = preferredStudyTime;
          this.dailyStudyGoal = dailyStudyGoal;
          this.preferredSubjectsFocus = preferredSubjectsFocus;
          this.taskRemindersEnabled = taskRemindersEnabled;
          this.revisionAlertsEnabled = revisionAlertsEnabled;
          this.testNotificationsEnabled = testNotificationsEnabled;
          this.assistantSuggestionsEnabled = assistantSuggestionsEnabled;
          this.token = token;
          this.message = message;
     }

     public Long getId() {
          return id;
     }

     public void setId(Long id) {
          this.id = id;
     }

     public String getFullName() {
          return fullName;
     }

     public void setFullName(String fullName) {
          this.fullName = fullName;
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

     public String getCourse() {
          return course;
     }

     public void setCourse(String course) {
          this.course = course;
     }

     public String getCollege() {
          return college;
     }

     public void setCollege(String college) {
          this.college = college;
     }

     public boolean isTwoFactorEnabled() {
          return twoFactorEnabled;
     }

     public void setTwoFactorEnabled(boolean twoFactorEnabled) {
          this.twoFactorEnabled = twoFactorEnabled;
     }

     public String getPreferredStudyTime() {
          return preferredStudyTime;
     }

     public void setPreferredStudyTime(String preferredStudyTime) {
          this.preferredStudyTime = preferredStudyTime;
     }

     public String getDailyStudyGoal() {
          return dailyStudyGoal;
     }

     public void setDailyStudyGoal(String dailyStudyGoal) {
          this.dailyStudyGoal = dailyStudyGoal;
     }

     public String getPreferredSubjectsFocus() {
          return preferredSubjectsFocus;
     }

     public void setPreferredSubjectsFocus(String preferredSubjectsFocus) {
          this.preferredSubjectsFocus = preferredSubjectsFocus;
     }

     public boolean isTaskRemindersEnabled() {
          return taskRemindersEnabled;
     }

     public void setTaskRemindersEnabled(boolean taskRemindersEnabled) {
          this.taskRemindersEnabled = taskRemindersEnabled;
     }

     public boolean isRevisionAlertsEnabled() {
          return revisionAlertsEnabled;
     }

     public void setRevisionAlertsEnabled(boolean revisionAlertsEnabled) {
          this.revisionAlertsEnabled = revisionAlertsEnabled;
     }

     public boolean isTestNotificationsEnabled() {
          return testNotificationsEnabled;
     }

     public void setTestNotificationsEnabled(boolean testNotificationsEnabled) {
          this.testNotificationsEnabled = testNotificationsEnabled;
     }

     public boolean isAssistantSuggestionsEnabled() {
          return assistantSuggestionsEnabled;
     }

     public void setAssistantSuggestionsEnabled(boolean assistantSuggestionsEnabled) {
          this.assistantSuggestionsEnabled = assistantSuggestionsEnabled;
     }

     public String getToken() {
          return token;
     }

     public void setToken(String token) {
          this.token = token;
     }

     public String getRefreshToken() {
          return refreshToken;
     }

     public void setRefreshToken(String refreshToken) {
          this.refreshToken = refreshToken;
     }

     public String getMessage() {
          return message;
     }

     public void setMessage(String message) {
          this.message = message;
     }
}