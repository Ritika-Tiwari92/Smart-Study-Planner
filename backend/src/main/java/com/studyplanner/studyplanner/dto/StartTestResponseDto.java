package com.studyplanner.studyplanner.dto;

import java.util.ArrayList;
import java.util.List;

public class StartTestResponseDto {

     private Long attemptId;
     private Long testId;
     private String title;
     private String subject;
     private String testType;
     private String duration;
     private String description;
     private Integer totalQuestions;
     private List<StartTestQuestionDto> questions = new ArrayList<>();

     public StartTestResponseDto() {
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

     public List<StartTestQuestionDto> getQuestions() {
          return questions;
     }

     public void setQuestions(List<StartTestQuestionDto> questions) {
          this.questions = questions;
     }
}