package com.studyplanner.studyplanner.dto;

import java.util.ArrayList;
import java.util.List;

public class StartTestQuestionDto {

     private Long id;
     private String questionText;
     private String questionType;
     private Integer marks;
     private String focusTopic;
     private Integer questionOrder;
     private List<StartTestQuestionOptionDto> options = new ArrayList<>();

     public StartTestQuestionDto() {
     }

     public Long getId() {
          return id;
     }

     public void setId(Long id) {
          this.id = id;
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

     public List<StartTestQuestionOptionDto> getOptions() {
          return options;
     }

     public void setOptions(List<StartTestQuestionOptionDto> options) {
          this.options = options;
     }
}