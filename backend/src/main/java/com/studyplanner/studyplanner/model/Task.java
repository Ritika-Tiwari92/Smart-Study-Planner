package com.studyplanner.studyplanner.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "tasks")
public class Task {

     @Id
     @GeneratedValue(strategy = GenerationType.IDENTITY)
     private Long id;

     @NotBlank(message = "Title is required")
     private String title;

     @NotBlank(message = "Description is required")
     private String description;

     @NotBlank(message = "Status is required")
     private String status;

     @NotNull(message = "Due date is required")
     private LocalDate dueDate;

     @NotBlank(message = "Priority is required")
     private String priority;

     @NotNull(message = "Subject is required")
     @JsonIgnoreProperties("tasks")
     @ManyToOne
     @JoinColumn(name = "subject_id")
     private Subject subject;

     public Task() {
     }

     public Task(Long id, String title, String description, LocalDate dueDate, String priority, String status) {
          this.id = id;
          this.title = title;
          this.description = description;
          this.dueDate = dueDate;
          this.priority = priority;
          this.status = status;
     }

     public Long getId() {
          return id;
     }

     public void setId(Long id) {
          this.id = id;
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

     public Subject getSubject() {
          return subject;
     }

     public void setSubject(Subject subject) {
          this.subject = subject;
     }
}
