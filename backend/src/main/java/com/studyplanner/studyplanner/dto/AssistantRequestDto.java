package com.studyplanner.studyplanner.dto;

public class AssistantRequestDto {

     private String message;
     private String pageContext;

     public AssistantRequestDto() {
     }

     public String getMessage() {
          return message;
     }

     public void setMessage(String message) {
          this.message = message;
     }

     public String getPageContext() {
          return pageContext;
     }

     public void setPageContext(String pageContext) {
          this.pageContext = pageContext;
     }
}