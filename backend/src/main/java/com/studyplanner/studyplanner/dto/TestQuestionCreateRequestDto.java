package com.studyplanner.studyplanner.dto;

import java.util.ArrayList;
import java.util.List;

public class TestQuestionCreateRequestDto {

     private String questionText;
     private String questionType;
     private String correctAnswer;
     private Integer marks;
     private String focusTopic;
     private Integer questionOrder;
     private List<TestQuestionOptionDto> options = new ArrayList<>();

     public TestQuestionCreateRequestDto() {
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

     public List<TestQuestionOptionDto> getOptions() {
          return options;
     }

     public void setOptions(List<TestQuestionOptionDto> options) {
          this.options = options;
     }
}
