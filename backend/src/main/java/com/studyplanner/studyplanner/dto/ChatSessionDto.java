package com.studyplanner.studyplanner.dto;

import java.time.LocalDateTime;

public class ChatSessionDto {

     private Long id;
     private String title;
     private LocalDateTime createdAt;

     public ChatSessionDto() {
     }

     public ChatSessionDto(Long id, String title, LocalDateTime createdAt) {
          this.id = id;
          this.title = title;
          this.createdAt = createdAt;
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

     public LocalDateTime getCreatedAt() {
          return createdAt;
     }

     public void setCreatedAt(LocalDateTime createdAt) {
          this.createdAt = createdAt;
     }
}