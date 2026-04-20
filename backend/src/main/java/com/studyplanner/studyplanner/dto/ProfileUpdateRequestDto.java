package com.studyplanner.studyplanner.dto;

public class ProfileUpdateRequestDto {

     private String fullName;
     private String email;
     private String course;
     private String college;

     private String preferredStudyTime;
     private String dailyStudyGoal;
     private String preferredSubjectsFocus;

     private Boolean taskRemindersEnabled;
     private Boolean revisionAlertsEnabled;
     private Boolean testNotificationsEnabled;
     private Boolean assistantSuggestionsEnabled;

     public ProfileUpdateRequestDto() {
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

     public Boolean getTaskRemindersEnabled() {
          return taskRemindersEnabled;
     }

     public void setTaskRemindersEnabled(Boolean taskRemindersEnabled) {
          this.taskRemindersEnabled = taskRemindersEnabled;
     }

     public Boolean getRevisionAlertsEnabled() {
          return revisionAlertsEnabled;
     }

     public void setRevisionAlertsEnabled(Boolean revisionAlertsEnabled) {
          this.revisionAlertsEnabled = revisionAlertsEnabled;
     }

     public Boolean getTestNotificationsEnabled() {
          return testNotificationsEnabled;
     }

     public void setTestNotificationsEnabled(Boolean testNotificationsEnabled) {
          this.testNotificationsEnabled = testNotificationsEnabled;
     }

     public Boolean getAssistantSuggestionsEnabled() {
          return assistantSuggestionsEnabled;
     }

     public void setAssistantSuggestionsEnabled(Boolean assistantSuggestionsEnabled) {
          this.assistantSuggestionsEnabled = assistantSuggestionsEnabled;
     }
}