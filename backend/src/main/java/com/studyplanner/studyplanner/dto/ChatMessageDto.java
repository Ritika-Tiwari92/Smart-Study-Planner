package com.studyplanner.studyplanner.dto;

import java.time.LocalDateTime;

public class ChatMessageDto {

     private Long id;
     private String sender;
     private String content;
     private LocalDateTime createdAt;

     public ChatMessageDto() {
     }

     public ChatMessageDto(Long id, String sender, String content, LocalDateTime createdAt) {
          this.id = id;
          this.sender = sender;
          this.content = content;
          this.createdAt = createdAt;
     }

     public Long getId() {
          return id;
     }

     public void setId(Long id) {
          this.id = id;
     }

     public String getSender() {
          return sender;
     }

     public void setSender(String sender) {
          this.sender = sender;
     }

     public String getContent() {
          return content;
     }

     public void setContent(String content) {
          this.content = content;
     }

     public LocalDateTime getCreatedAt() {
          return createdAt;
     }

     public void setCreatedAt(LocalDateTime createdAt) {
          this.createdAt = createdAt;
     }
}