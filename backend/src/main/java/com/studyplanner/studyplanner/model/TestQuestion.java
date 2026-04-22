package com.studyplanner.studyplanner.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "test_questions")
public class TestQuestion {

     @Id
     @GeneratedValue(strategy = GenerationType.IDENTITY)
     private Long id;

     @JsonIgnore
     @ManyToOne(fetch = FetchType.LAZY)
     @JoinColumn(name = "test_id", nullable = false)
     private Test test;

     @Column(name = "question_text", nullable = false, columnDefinition = "TEXT")
     private String questionText;

     @Column(name = "question_type", nullable = false)
     private String questionType; // MCQ / THEORY

     @Column(name = "correct_answer", columnDefinition = "TEXT")
     private String correctAnswer;

     @Column(nullable = false)
     private Integer marks = 1;

     @Column(name = "focus_topic")
     private String focusTopic;

     @Column(name = "question_order", nullable = false)
     private Integer questionOrder = 1;

     @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true)
     @OrderBy("optionLabel ASC")
     private List<TestQuestionOption> options = new ArrayList<>();

     public TestQuestion() {
     }

     public TestQuestion(Long id, Test test, String questionText, String questionType,
               String correctAnswer, Integer marks, String focusTopic, Integer questionOrder) {
          this.id = id;
          this.test = test;
          this.questionText = questionText;
          this.questionType = questionType;
          this.correctAnswer = correctAnswer;
          this.marks = marks;
          this.focusTopic = focusTopic;
          this.questionOrder = questionOrder;
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

     public String getQuestionText() {
          return questionText;
     }

     public void setQuestionText(String questionText) {
          this.questionText = questionText;
     }

     public String getQuestionType() {
          return questionType;
     }

     public void setQuestionType(String questionType) {
          this.questionType = questionType;
     }

     public String getCorrectAnswer() {
          return correctAnswer;
     }

     public void setCorrectAnswer(String correctAnswer) {
          this.correctAnswer = correctAnswer;
     }

     public Integer getMarks() {
          return marks;
     }

     public void setMarks(Integer marks) {
          this.marks = marks;
     }

     public String getFocusTopic() {
          return focusTopic;
     }

     public void setFocusTopic(String focusTopic) {
          this.focusTopic = focusTopic;
     }

     public Integer getQuestionOrder() {
          return questionOrder;
     }

     public void setQuestionOrder(Integer questionOrder) {
          this.questionOrder = questionOrder;
     }

     public List<TestQuestionOption> getOptions() {
          return options;
     }

     public void setOptions(List<TestQuestionOption> options) {
          this.options = options;
     }
}