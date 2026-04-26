package com.studyplanner.studyplanner.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * User entity — updated with:
 *
 * NEW FIELDS ADDED:
 * failedLoginAttempts → counts wrong password attempts (reset on success)
 * accountLockedUntil → if set and in future, account is locked
 *
 * All existing fields are UNCHANGED.
 * Spring JPA ddl-auto=update will add new columns automatically.
 */
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

     // ─────────────────────────────────────────
     // NEW: Rate limiting / Account lock fields
     // Added by ddl-auto=update automatically
     // ─────────────────────────────────────────

     /**
      * Counts consecutive failed login attempts.
      * Resets to 0 on successful login.
      * When this reaches MAX_ATTEMPTS (5), account gets locked.
      */
     @Column(nullable = false)
     private int failedLoginAttempts = 0;

     /**
      * When account is locked, this holds the unlock time.
      * null = not locked.
      * If LocalDateTime.now() is before this value → account is locked.
      */
     @Column(nullable = true)
     private LocalDateTime accountLockedUntil;

     // ─────────────────────────────────────────
     // Constructors
     // ─────────────────────────────────────────

     public User() {
     }

     @PrePersist
     public void prePersist() {
          this.createdAt = LocalDateTime.now();
     }

     // ─────────────────────────────────────────
     // Helper methods for account lock logic
     // ─────────────────────────────────────────

     /**
      * Returns true if account is currently locked.
      * Lock expires automatically after lockout duration.
      */
     public boolean isAccountLocked() {
          return accountLockedUntil != null &&
                    LocalDateTime.now().isBefore(accountLockedUntil);
     }

     /**
      * Increments failed attempt counter.
      * Called by AuthService on wrong password.
      */
     public void incrementFailedAttempts() {
          this.failedLoginAttempts++;
     }

     /**
      * Resets counter and clears lock.
      * Called by AuthService on successful login.
      */
     public void resetFailedAttempts() {
          this.failedLoginAttempts = 0;
          this.accountLockedUntil = null;
     }

     /**
      * Locks account for given minutes.
      * Called by AuthService after MAX_ATTEMPTS failures.
      */
     public void lockAccount(int minutes) {
          this.accountLockedUntil = LocalDateTime.now().plusMinutes(minutes);
     }

     // ─────────────────────────────────────────
     // Getters & Setters (all existing + new)
     // ─────────────────────────────────────────

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

     // New fields getters/setters
     public int getFailedLoginAttempts() {
          return failedLoginAttempts;
     }

     public void setFailedLoginAttempts(int failedLoginAttempts) {
          this.failedLoginAttempts = failedLoginAttempts;
     }

     public LocalDateTime getAccountLockedUntil() {
          return accountLockedUntil;
     }

     public void setAccountLockedUntil(LocalDateTime accountLockedUntil) {
          this.accountLockedUntil = accountLockedUntil;
     }
}