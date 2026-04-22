package com.studyplanner.studyplanner.dto;

// Yeh DTO subject-wise focus time dikhane ke liye hai
// Analytics page pe pie/bar chart mein use hoga
// Example: Java -> 120 min, Mathematics -> 85 min

public class PomodoroSubjectStatResponse {

     private String subjectName; // e.g. "Java"
     private long totalFocusMinutes; // e.g. 120
     private long sessionCount; // e.g. 5 sessions
     private double percentageShare; // e.g. 42.5 (% of total focus time)

     public PomodoroSubjectStatResponse() {
     }

     public PomodoroSubjectStatResponse(String subjectName, long totalFocusMinutes,
               long sessionCount, double percentageShare) {
          this.subjectName = subjectName;
          this.totalFocusMinutes = totalFocusMinutes;
          this.sessionCount = sessionCount;
          this.percentageShare = percentageShare;
     }

     // ─── Getters & Setters ────────────────────────────────────────────────────

     public String getSubjectName() {
          return subjectName;
     }

     public void setSubjectName(String subjectName) {
          this.subjectName = subjectName;
     }

     public long getTotalFocusMinutes() {
          return totalFocusMinutes;
     }

     public void setTotalFocusMinutes(long totalFocusMinutes) {
          this.totalFocusMinutes = totalFocusMinutes;
     }

     public long getSessionCount() {
          return sessionCount;
     }

     public void setSessionCount(long sessionCount) {
          this.sessionCount = sessionCount;
     }

     public double getPercentageShare() {
          return percentageShare;
     }

     public void setPercentageShare(double percentageShare) {
          this.percentageShare = percentageShare;
     }
}