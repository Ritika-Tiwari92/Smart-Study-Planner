package com.studyplanner.studyplanner.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "chat_messages")
public class ChatMessage {

     @Id
     @GeneratedValue(strategy = GenerationType.IDENTITY)
     private Long id;

     @ManyToOne(fetch = FetchType.LAZY)
     @JoinColumn(name = "session_id", nullable = false)
     private ChatSession session;

     @Column(nullable = false)
     private String sender; // "USER" or "ASSISTANT"

     @Column(nullable = false, columnDefinition = "TEXT")
     private String content;

     @Column(name = "created_at")
     private LocalDateTime createdAt;

     @PrePersist
     public void prePersist() {
          this.createdAt = LocalDateTime.now();
     }

     // ─── Getters & Setters ────────────────────────────────

     public Long getId() {
          return id;
     }

     public ChatSession getSession() {
          return session;
     }

     public void setSession(ChatSession session) {
          this.session = session;
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
}