package com.studyplanner.studyplanner.dto;

public class RevisionAiRequestDto {

     private String title;
     private String subject;
     private String priority;
     private String revisionDate;
     private String status;
     private String description;

     public RevisionAiRequestDto() {
     }

     public String getTitle() {
          return title;
     }

     public void setTitle(String title) {
          this.title = title;
     }

     public String getSubject() {
          return subject;
     }

     public void setSubject(String subject) {
          this.subject = subject;
     }

     public String getPriority() {
          return priority;
     }

     public void setPriority(String priority) {
          this.priority = priority;
     }

     public String getRevisionDate() {
          return revisionDate;
     }

     public void setRevisionDate(String revisionDate) {
          this.revisionDate = revisionDate;
     }

     public String getStatus() {
          return status;
     }

     public void setStatus(String status) {
          this.status = status;
     }

     public String getDescription() {
          return description;
     }

     public void setDescription(String description) {
          this.description = description;
     }
}