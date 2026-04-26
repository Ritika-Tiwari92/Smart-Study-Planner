package com.studyplanner.studyplanner.dto;

import java.time.LocalDateTime;

public class RecentTestResultDto {

     private Long attemptId;
     private Long testId;
     private String title;
     private String subject;
     private Integer percentage;
     private Integer score;
     private String focusArea;
     private String testTip;
     private LocalDateTime submittedAt;

     public RecentTestResultDto() {
     }

     public Long getAttemptId() {
          return attemptId;
     }

     public void setAttemptId(Long attemptId) {
          this.attemptId = attemptId;
     }

     public Long getTestId() {
          return testId;
     }

     public void setTestId(Long testId) {
          this.testId = testId;
     }

     public String getTitle() {
          return title;
     }

     public void setTitle(String title) {
          this.title = title;
     }

     public String getSubject() {
          return subject;
     }

     public void setSubject(String subject) {
          this.subject = subject;
     }

     public Integer getPercentage() {
          return percentage;
     }

     public void setPercentage(Integer percentage) {
          this.percentage = percentage;
     }

     public Integer getScore() {
          return score;
     }

     public void setScore(Integer score) {
          this.score = score;
     }

     public String getFocusArea() {
          return focusArea;
     }

     public void setFocusArea(String focusArea) {
          this.focusArea = focusArea;
     }

     public String getTestTip() {
          return testTip;
     }

     public void setTestTip(String testTip) {
          this.testTip = testTip;
     }

     public LocalDateTime getSubmittedAt() {
          return submittedAt;
     }

     public void setSubmittedAt(LocalDateTime submittedAt) {
          this.submittedAt = submittedAt;
     }
}