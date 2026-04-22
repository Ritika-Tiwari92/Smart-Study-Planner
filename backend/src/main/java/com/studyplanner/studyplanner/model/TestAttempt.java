package com.studyplanner.studyplanner.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "test_attempts")
public class TestAttempt {

     @Id
     @GeneratedValue(strategy = GenerationType.IDENTITY)
     private Long id;

     @JsonIgnore
     @ManyToOne(fetch = FetchType.LAZY)
     @JoinColumn(name = "test_id", nullable = false)
     private Test test;

     @JsonIgnore
     @ManyToOne(fetch = FetchType.LAZY)
     @JoinColumn(name = "user_id", nullable = false)
     private User user;

     @Column(name = "started_at", nullable = false)
     private LocalDateTime startedAt;

     @Column(name = "submitted_at")
     private LocalDateTime submittedAt;

     @Column(nullable = false)
     private String status; // STARTED / SUBMITTED

     @Column(name = "total_questions", nullable = false)
     private Integer totalQuestions = 0;

     @Column(name = "answered_questions", nullable = false)
     private Integer answeredQuestions = 0;

     @Column(name = "correct_answers", nullable = false)
     private Integer correctAnswers = 0;

     @Column(nullable = false)
     private Integer score = 0;

     @Column(nullable = false)
     private Integer percentage = 0;

     @Column(name = "focus_area", columnDefinition = "TEXT")
     private String focusArea;

     @Column(name = "test_tip", columnDefinition = "TEXT")
     private String testTip;

     @OneToMany(mappedBy = "attempt", cascade = CascadeType.ALL, orphanRemoval = true)
     private List<TestAnswer> answers = new ArrayList<>();

     public TestAttempt() {
     }

     @PrePersist
     public void prePersist() {
          if (this.startedAt == null) {
               this.startedAt = LocalDateTime.now();
          }
          if (this.status == null || this.status.trim().isEmpty()) {
               this.status = "STARTED";
          }
     }

     public Long getId() {
          return id;
     }

     public void setId(Long id) {
          this.id = id;
     }

     public Test getTest() {
          return test;
     }

     public void setTest(Test test) {
          this.test = test;
     }

     public User getUser() {
          return user;
     }

     public void setUser(User user) {
          this.user = user;
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

     public String getStatus() {
          return status;
     }

     public void setStatus(String status) {
          this.status = status;
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

     public List<TestAnswer> getAnswers() {
          return answers;
     }

     public void setAnswers(List<TestAnswer> answers) {
          this.answers = answers;
     }
}