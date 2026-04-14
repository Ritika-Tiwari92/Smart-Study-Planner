package com.studyplanner.studyplanner.dto;

import java.time.LocalDate;

public class TaskRequestDto {

     private String title;
     private String description;
     private LocalDate dueDate;
     private String priority;
     private String status;
     private Long subjectId;

     public TaskRequestDto() {
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

     public LocalDate getDueDate() {
          return dueDate;
     }

     public void setDueDate(LocalDate dueDate) {
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

     public Long getSubjectId() {
          return subjectId;
     }

     public void setSubjectId(Long subjectId) {
          this.subjectId = subjectId;
     }
}