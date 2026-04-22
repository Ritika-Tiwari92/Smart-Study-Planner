package com.studyplanner.studyplanner.dto;

public class SubmittedAnswerDto {

     private Long questionId;
     private String submittedAnswer;

     public SubmittedAnswerDto() {
     }

     public Long getQuestionId() {
          return questionId;
     }

     public void setQuestionId(Long questionId) {
          this.questionId = questionId;
     }

     public String getSubmittedAnswer() {
          return submittedAnswer;
     }

     public void setSubmittedAnswer(String submittedAnswer) {
          this.submittedAnswer = submittedAnswer;
     }
}