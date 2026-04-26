package com.studyplanner.studyplanner.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * PasswordResetToken Entity
 *
 * Stores OTP for forgot password flow.
 * Flow:
 * 1. User enters email → 6-digit OTP generated → saved here → email sent
 * 2. User enters OTP → validated against this table
 * 3. User enters new password → password updated → token deleted
 *
 * Table: password_reset_tokens (auto-created by ddl-auto=update)
 */
@Entity
@Table(name = "password_reset_tokens")
public class PasswordResetToken {

     @Id
     @GeneratedValue(strategy = GenerationType.IDENTITY)
     private Long id;

     /**
      * 6-digit OTP sent to user's email.
      */
     @Column(nullable = false, length = 6)
     private String otp;

     /**
      * Email of the user who requested password reset.
      */
     @Column(nullable = false)
     private String email;

     /**
      * OTP expires in 10 minutes.
      */
     @Column(nullable = false)
     private LocalDateTime expiresAt;

     /**
      * Whether OTP has been verified (used once only).
      */
     @Column(nullable = false)
     private boolean verified = false;

     /**
      * When this token was created.
      */
     @Column(nullable = false, updatable = false)
     private LocalDateTime createdAt;

     public PasswordResetToken() {
     }

     @PrePersist
     public void prePersist() {
          this.createdAt = LocalDateTime.now();
     }

     // Helper: check if OTP is expired
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

     public String getOtp() {
          return otp;
     }

     public void setOtp(String otp) {
          this.otp = otp;
     }

     public String getEmail() {
          return email;
     }

     public void setEmail(String email) {
          this.email = email;
     }

     public LocalDateTime getExpiresAt() {
          return expiresAt;
     }

     public void setExpiresAt(LocalDateTime expiresAt) {
          this.expiresAt = expiresAt;
     }

     public boolean isVerified() {
          return verified;
     }

     public void setVerified(boolean verified) {
          this.verified = verified;
     }

     public LocalDateTime getCreatedAt() {
          return createdAt;
     }

     public void setCreatedAt(LocalDateTime createdAt) {
          this.createdAt = createdAt;
     }
}