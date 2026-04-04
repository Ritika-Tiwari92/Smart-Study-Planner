package com.studyplanner.studyplanner.model;

import jakarta.persistence.*;
// Task.java ke andar fields change karein
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Entity
@Table(name = "tasks")
public class Task {

     @Id
     @GeneratedValue(strategy = GenerationType.IDENTITY)
     private Long id;

     @NotBlank(message = "Title khali nahi ho sakta")
     @Size(min = 3, message = "Title kam se kam 3 characters ka hona chahiye")
     private String title;

     @NotBlank(message = "Description zaroori hai")

     private String description;
     private String status;
     private boolean completed;

     // Constructors
     public Task() {
     }

     public Task(String title, String description, String status, boolean completed) {
          this.title = title;
          this.description = description;
          this.status = status;
          this.completed = completed;
     }

     // Getters and Setters
     public Long getId() {
          return id;
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

     public String getStatus() {
          return status;
     }

     public void setStatus(String status) {
          this.status = status;
     }

     // Task.java ke andar
     public boolean isCompleted() {
          return completed;
     }

     public void setCompleted(boolean completed) {
          this.completed = completed;
     }
}
