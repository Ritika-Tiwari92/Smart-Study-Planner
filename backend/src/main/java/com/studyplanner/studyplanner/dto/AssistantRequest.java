package com.studyplanner.studyplanner.dto;

public class AssistantRequest {

     private String message;
     private Long userId;
     private Long sessionId;

     public AssistantRequest() {
     }

     public String getMessage() {
          return message;
     }

     public void setMessage(String message) {
          this.message = message;
     }

     public Long getUserId() {
          return userId;
     }

     public void setUserId(Long userId) {
          this.userId = userId;
     }

     public Long getSessionId() {
          return sessionId;
     }

     public void setSessionId(Long sessionId) {
          this.sessionId = sessionId;
     }
}