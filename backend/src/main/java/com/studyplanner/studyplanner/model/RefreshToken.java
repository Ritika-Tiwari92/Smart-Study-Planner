package com.studyplanner.studyplanner.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * RefreshToken Entity
 *
 * Stores refresh tokens in database.
 * Each user can have one active refresh token.
 *
 * Flow:
 * Login → access token (15 min) + refresh token (7 days) stored here
 * Refresh → old refresh token validated, new access token issued
 * Logout → refresh token deleted from DB (invalidated)
 *
 * Table: refresh_tokens (auto-created by ddl-auto=update)
 */
@Entity
@Table(name = "refresh_tokens")
public class RefreshToken {

     @Id
     @GeneratedValue(strategy = GenerationType.IDENTITY)
     private Long id;

     /**
      * The actual refresh token string (UUID-based, long random string).
      * Unique — one token per row.
      */
     @Column(nullable = false, unique = true, length = 512)
     private String token;

     /**
      * Which user this token belongs to.
      * One user = one refresh token at a time.
      * Old token is replaced on each new login.
      */
     @OneToOne
     @JoinColumn(name = "user_id", nullable = false, unique = true)
     private User user;

     /**
      * When this refresh token expires.
      * After this time, user must login again.
      */
     @Column(nullable = false)
     private LocalDateTime expiresAt;

     /**
      * When this token was created (for audit/debug).
      */
     @Column(nullable = false, updatable = false)
     private LocalDateTime createdAt;

     public RefreshToken() {
     }

     @PrePersist
     public void prePersist() {
          this.createdAt = LocalDateTime.now();
     }

     // Helper: check if this refresh token is expired
     public boolean isExpired() {
          return LocalDateTime.now().isAfter(this.expiresAt);
     }

     // Getters & Setters
     public Long getId() {
          return id;
     }

     public void setId(Long id) {
          this.id = id;
     }

     public String getToken() {
          return token;
     }

     public void setToken(String token) {
          this.token = token;
     }

     public User getUser() {
          return user;
     }

     public void setUser(User user) {
          this.user = user;
     }

     public LocalDateTime getExpiresAt() {
          return expiresAt;
     }

     public void setExpiresAt(LocalDateTime expiresAt) {
          this.expiresAt = expiresAt;
     }

     public LocalDateTime getCreatedAt() {
          return createdAt;
     }

     public void setCreatedAt(LocalDateTime createdAt) {
          this.createdAt = createdAt;
     }
}