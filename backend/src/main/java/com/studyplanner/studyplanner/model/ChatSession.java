package com.studyplanner.studyplanner.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "chat_sessions")
public class ChatSession {

     @Id
     @GeneratedValue(strategy = GenerationType.IDENTITY)
     private Long id;

     @ManyToOne(fetch = FetchType.LAZY)
     @JoinColumn(name = "user_id", nullable = false)
     private User user;

     @Column(nullable = false)
     private String title;

     @Column(name = "created_at")
     private LocalDateTime createdAt;

     @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
     @OrderBy("createdAt ASC")
     private List<ChatMessage> messages = new ArrayList<>();

     @PrePersist
     public void prePersist() {
          this.createdAt = LocalDateTime.now();
     }

     // ─── Getters & Setters ────────────────────────────────

     public Long getId() {
          return id;
     }

     public User getUser() {
          return user;
     }

     public void setUser(User user) {
          this.user = user;
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

     public List<ChatMessage> getMessages() {
          return messages;
     }
}