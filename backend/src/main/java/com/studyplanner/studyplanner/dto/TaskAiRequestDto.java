package com.studyplanner.studyplanner.dto;

public class TaskAiRequestDto {

     private String title;
     private String description;
     private String subjectName;
     private String dueDate;
     private String priority;
     private String status;

     public TaskAiRequestDto() {
     }

     public String getTitle() {
          return title;
     }

     public void setTitle(String title) {
          this.title = title;
     }

     public String getDescription() {
          return description;
     }

     public void setDescription(String description) {
          this.description = description;
     }

     public String getSubjectName() {
          return subjectName;
     }

     public void setSubjectName(String subjectName) {
          this.subjectName = subjectName;
     }

     public String getDueDate() {
          return dueDate;
     }

     public void setDueDate(String dueDate) {
          this.dueDate = dueDate;
     }

     public String getPriority() {
          return priority;
     }

     public void setPriority(String priority) {
          this.priority = priority;
     }

     public String getStatus() {
          return status;
     }

     public void setStatus(String status) {
          this.status = status;
     }
}