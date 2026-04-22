package com.studyplanner.studyplanner.dto;

import java.util.ArrayList;
import java.util.List;

public class SubmitTestRequestDto {

     private List<SubmittedAnswerDto> answers = new ArrayList<>();

     public SubmitTestRequestDto() {
     }

     public List<SubmittedAnswerDto> getAnswers() {
          return answers;
     }

     public void setAnswers(List<SubmittedAnswerDto> answers) {
          this.answers = answers;
     }
}