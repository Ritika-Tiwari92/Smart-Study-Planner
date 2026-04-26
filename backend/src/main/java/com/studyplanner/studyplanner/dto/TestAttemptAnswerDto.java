package com.studyplanner.studyplanner.dto;

public class TestAttemptAnswerDto {

     private Long questionId;
     private String questionText;
     private String questionType;
     private String focusTopic;
     private Integer questionOrder;
     private Integer totalMarks;
     private String correctAnswer;
     private String submittedAnswer;
     private Boolean isCorrect;
     private Integer marksAwarded;

     public TestAttemptAnswerDto() {
     }

     public Long getQuestionId() {
          return questionId;
     }

     public void setQuestionId(Long questionId) {
          this.questionId = questionId;
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

     public Integer getTotalMarks() {
          return totalMarks;
     }

     public void setTotalMarks(Integer totalMarks) {
          this.totalMarks = totalMarks;
     }

     public String getCorrectAnswer() {
          return correctAnswer;
     }

     public void setCorrectAnswer(String correctAnswer) {
          this.correctAnswer = correctAnswer;
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