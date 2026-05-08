package com.studyplanner.studyplanner.dto;

public class CreateNotificationRequestDto {

     private Long userId;
     private String targetRole;
     private String title;
     private String message;
     private String type;
     private String priority;
     private String redirectUrl;
     private Long sourceId;
     private String sourceModule;

     public CreateNotificationRequestDto() {
     }

     public Long getUserId() {
          return userId;
     }

     public void setUserId(Long userId) {
          this.userId = userId;
     }

     public String getTargetRole() {
          return targetRole;
     }

     public void setTargetRole(String targetRole) {
          this.targetRole = targetRole;
     }

     public String getTitle() {
          return title;
     }

     public void setTitle(String title) {
          this.title = title;
     }

     public String getMessage() {
          return message;
     }

     public void setMessage(String message) {
          this.message = message;
     }

     public String getType() {
          return type;
     }

     public void setType(String type) {
          this.type = type;
     }

     public String getPriority() {
          return priority;
     }

     public void setPriority(String priority) {
          this.priority = priority;
     }

     public String getRedirectUrl() {
          return redirectUrl;
     }

     public void setRedirectUrl(String redirectUrl) {
          this.redirectUrl = redirectUrl;
     }

     public Long getSourceId() {
          return sourceId;
     }

     public void setSourceId(Long sourceId) {
          this.sourceId = sourceId;
     }

     public String getSourceModule() {
          return sourceModule;
     }

     public void setSourceModule(String sourceModule) {
          this.sourceModule = sourceModule;
     }
}