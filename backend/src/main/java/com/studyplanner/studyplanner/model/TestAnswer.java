package com.studyplanner.studyplanner.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "test_answers")
public class TestAnswer {

     @Id
     @GeneratedValue(strategy = GenerationType.IDENTITY)
     private Long id;

     @JsonIgnore
     @ManyToOne(fetch = FetchType.LAZY)
     @JoinColumn(name = "attempt_id", nullable = false)
     private TestAttempt attempt;

     @ManyToOne(fetch = FetchType.LAZY)
     @JoinColumn(name = "question_id", nullable = false)
     private TestQuestion question;

     @Column(name = "submitted_answer", columnDefinition = "TEXT")
     private String submittedAnswer;

     @Column(name = "is_correct")
     private Boolean isCorrect;

     @Column(name = "marks_awarded")
     private Integer marksAwarded = 0;

     public TestAnswer() {
     }

     public Long getId() {
          return id;
     }

     public void setId(Long id) {
          this.id = id;
     }

     public TestAttempt getAttempt() {
          return attempt;
     }

     public void setAttempt(TestAttempt attempt) {
          this.attempt = attempt;
     }

     public TestQuestion getQuestion() {
          return question;
     }

     public void setQuestion(TestQuestion question) {
          this.question = question;
     }

     public String getSubmittedAnswer() {
          return submittedAnswer;
     }

     public void setSubmittedAnswer(String submittedAnswer) {
          this.submittedAnswer = submittedAnswer;
     }

     public Boolean getIsCorrect() {
          return isCorrect;
     }

     public void setIsCorrect(Boolean isCorrect) {
          this.isCorrect = isCorrect;
     }

     public Integer getMarksAwarded() {
          return marksAwarded;
     }

     public void setMarksAwarded(Integer marksAwarded) {
          this.marksAwarded = marksAwarded;
     }
}
