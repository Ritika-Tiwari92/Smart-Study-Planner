package com.studyplanner.studyplanner.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {

     @Id
     @GeneratedValue(strategy = GenerationType.IDENTITY)
     private Long id;

     @Column(nullable = false)
     private String fullName;

     @Column(nullable = false, unique = true)
     private String email;

     @Column(nullable = false)
     private String password;

     @Column(nullable = false)
     private String course;

     @Column(nullable = false)
     private String college;

     @Column(nullable = false)
     private boolean twoFactorEnabled = false;

     @Column(nullable = false)
     private String preferredStudyTime = "Morning";

     @Column(nullable = false)
     private String dailyStudyGoal = "2 Hours";

     @Column(length = 1000)
     private String preferredSubjectsFocus;

     @Column(nullable = false)
     private boolean taskRemindersEnabled = true;

     @Column(nullable = false)
     private boolean revisionAlertsEnabled = true;

     @Column(nullable = false)
     private boolean testNotificationsEnabled = true;

     @Column(nullable = false)
     private boolean assistantSuggestionsEnabled = false;

     @Column(nullable = false, updatable = false)
     private LocalDateTime createdAt;

     public User() {
     }

     @PrePersist
     public void prePersist() {
          this.createdAt = LocalDateTime.now();
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

     public String getPassword() {
          return password;
     }

     public void setPassword(String password) {
          this.password = password;
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

     public LocalDateTime getCreatedAt() {
          return createdAt;
     }

     public void setCreatedAt(LocalDateTime createdAt) {
          this.createdAt = createdAt;
     }
}