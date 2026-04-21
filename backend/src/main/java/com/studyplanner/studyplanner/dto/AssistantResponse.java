package com.studyplanner.studyplanner.dto;

public class AssistantResponse {

     private String reply;
     private Long sessionId;

     public AssistantResponse() {
     }

     public AssistantResponse(String reply, Long sessionId) {
          this.reply = reply;
          this.sessionId = sessionId;
     }

     public String getReply() {
          return reply;
     }

     public void setReply(String reply) {
          this.reply = reply;
     }

     public Long getSessionId() {
          return sessionId;
     }

     public void setSessionId(Long sessionId) {
          this.sessionId = sessionId;
     }
}