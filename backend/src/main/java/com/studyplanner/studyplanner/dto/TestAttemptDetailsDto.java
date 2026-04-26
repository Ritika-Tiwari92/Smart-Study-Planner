package com.studyplanner.studyplanner.dto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class TestAttemptDetailsDto {

     private Long attemptId;
     private Long testId;
     private String title;
     private String subject;
     private String testType;
     private String duration;
     private String description;
     private Integer totalQuestions;
     private Integer answeredQuestions;
     private Integer correctAnswers;
     private Integer score;
     private Integer percentage;
     private String focusArea;
     private String testTip;
     private String status;
     private LocalDateTime startedAt;
     private LocalDateTime submittedAt;
     private List<TestAttemptAnswerDto> answers = new ArrayList<>();

     public TestAttemptDetailsDto() {
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

     public String getTestType() {
          return testType;
     }

     public void setTestType(String testType) {
          this.testType = testType;
     }

     public String getDuration() {
          return duration;
     }

     public void setDuration(String duration) {
          this.duration = duration;
     }

     public String getDescription() {
          return description;
     }

     public void setDescription(String description) {
          this.description = description;
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

     public LocalDateTime getStartedAt() {
          return startedAt;
     }

     public void setStartedAt(LocalDateTime startedAt) {
          this.startedAt = startedAt;
     }

     public LocalDateTime getSubmittedAt() {
          return submittedAt;
     }

     public void setSubmittedAt(LocalDateTime submittedAt) {
          this.submittedAt = submittedAt;
     }

     public List<TestAttemptAnswerDto> getAnswers() {
          return answers;
     }

     public void setAnswers(List<TestAttemptAnswerDto> answers) {
          this.answers = answers;
     }
}