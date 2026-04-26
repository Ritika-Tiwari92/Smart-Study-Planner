package com.studyplanner.studyplanner.dto;

public class StartTestQuestionOptionDto {

     private Long id;
     private String optionLabel;
     private String optionText;

     public StartTestQuestionOptionDto() {
     }

     public Long getId() {
          return id;
     }

     public void setId(Long id) {
          this.id = id;
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