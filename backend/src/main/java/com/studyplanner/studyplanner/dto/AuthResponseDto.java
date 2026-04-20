package com.studyplanner.studyplanner.dto;

public class AuthResponseDto {

     private Long id;
     private String fullName;
     private String email;
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

     private String message;

     public AuthResponseDto() {
     }

     public AuthResponseDto(Long id,
               String fullName,
               String email,
               String course,
               String college,
               boolean twoFactorEnabled,
               String preferredStudyTime,
               String dailyStudyGoal,
               String preferredSubjectsFocus,
               boolean taskRemindersEnabled,
               boolean revisionAlertsEnabled,
               boolean testNotificationsEnabled,
               boolean assistantSuggestionsEnabled,
               String message) {
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

     public String getMessage() {
          return message;
     }

     public void setMessage(String message) {
          this.message = message;
     }
}