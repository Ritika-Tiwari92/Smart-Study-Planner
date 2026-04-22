package com.studyplanner.studyplanner.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "test_question_options")
public class TestQuestionOption {

     @Id
     @GeneratedValue(strategy = GenerationType.IDENTITY)
     private Long id;

     @JsonIgnore
     @ManyToOne(fetch = FetchType.LAZY)
     @JoinColumn(name = "question_id", nullable = false)
     private TestQuestion question;

     @Column(name = "option_label", nullable = false)
     private String optionLabel;

     @Column(name = "option_text", nullable = false, columnDefinition = "TEXT")
     private String optionText;

     public TestQuestionOption() {
     }

     public TestQuestionOption(Long id, TestQuestion question, String optionLabel, String optionText) {
          this.id = id;
          this.question = question;
          this.optionLabel = optionLabel;
          this.optionText = optionText;
     }

     public Long getId() {
          return id;
     }

     public void setId(Long id) {
          this.id = id;
     }

     public TestQuestion getQuestion() {
          return question;
     }

     public void setQuestion(TestQuestion question) {
          this.question = question;
     }

     public String getOptionLabel() {
          return optionLabel;
     }

     public void setOptionLabel(String optionLabel) {
          this.optionLabel = optionLabel;
     }

     public String getOptionText() {
          return optionText;
     }

     public void setOptionText(String optionText) {
          this.optionText = optionText;
     }
}