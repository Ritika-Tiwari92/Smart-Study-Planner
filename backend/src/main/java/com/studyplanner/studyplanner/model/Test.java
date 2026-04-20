package com.studyplanner.studyplanner.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "tests")
public class Test {

     @Id
     @GeneratedValue(strategy = GenerationType.IDENTITY)
     private Long id;

     @Column(nullable = false)
     private String title;

     private String subject;

     private LocalDate testDate;

     private String testType;

     private String duration;

     @Column(columnDefinition = "TEXT")
     private String description;

     private Integer score;

     @Column(columnDefinition = "TEXT")
     private String focusArea;

     @Column(columnDefinition = "TEXT")
     private String testTip;

     @JsonIgnore
     @ManyToOne(fetch = FetchType.LAZY)
     @JoinColumn(name = "user_id")
     private User user;

     public Test() {
     }

     public Test(Long id, String title, String subject, LocalDate testDate, String testType,
               String duration, String description, Integer score, String focusArea, String testTip) {
          this.id = id;
          this.title = title;
          this.subject = subject;
          this.testDate = testDate;
          this.testType = testType;
          this.duration = duration;
          this.description = description;
          this.score = score;
          this.focusArea = focusArea;
          this.testTip = testTip;
     }

     public Long getId() {
          return id;
     }

     public void setId(Long id) {
          this.id = id;
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

     public LocalDate getTestDate() {
          return testDate;
     }

     public void setTestDate(LocalDate testDate) {
          this.testDate = testDate;
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

     public User getUser() {
          return user;
     }

     public void setUser(User user) {
          this.user = user;
     }
}