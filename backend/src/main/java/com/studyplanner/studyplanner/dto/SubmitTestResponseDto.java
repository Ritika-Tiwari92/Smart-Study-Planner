package com.studyplanner.studyplanner.dto;

public class SubmitTestResponseDto {

     private Long attemptId;
     private Long testId;
     private String title;
     private Integer totalQuestions;
     private Integer answeredQuestions;
     private Integer correctAnswers;
     private Integer totalMarks;
     private Integer score;
     private Integer percentage;
     private String focusArea;
     private String testTip;
     private String status;

     public SubmitTestResponseDto() {
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

     public Integer getTotalQuestions() {
          return totalQuestions;
     }

     public void setTotalQuestions(Integer totalQuestions) {
          this.totalQuestions = totalQuestions;
     }

     public Integer getAnsweredQuestions() {
          return answeredQuestions;
     }

     public void setAnsweredQuestions(Integer answeredQuestions) {
          this.answeredQuestions = answeredQuestions;
     }

     public Integer getCorrectAnswers() {
          return correctAnswers;
     }

     public void setCorrectAnswers(Integer correctAnswers) {
          this.correctAnswers = correctAnswers;
     }

     public Integer getTotalMarks() {
          return totalMarks;
     }

     public void setTotalMarks(Integer totalMarks) {
          this.totalMarks = totalMarks;
     }

     public Integer getScore() {
          return score;
     }

     public void setScore(Integer score) {
          this.score = score;
     }

     public Integer getPercentage() {
          return percentage;
     }

     public void setPercentage(Integer percentage) {
          this.percentage = percentage;
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

     public String getStatus() {
          return status;
     }

     public void setStatus(String status) {
          this.status = status;
     }
}