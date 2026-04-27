package com.studyplanner.studyplanner.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * UserBadge — records which badges a specific user has unlocked.
 * user_id + badge_id is UNIQUE — a badge unlocks only once per user.
 */
@Entity
@Table(name = "user_badges", uniqueConstraints = @UniqueConstraint(columnNames = { "user_id", "badge_id" }))
public class UserBadge {

     @Id
     @GeneratedValue(strategy = GenerationType.IDENTITY)
     private Long id;

     @ManyToOne(fetch = FetchType.LAZY)
     @JoinColumn(name = "user_id", nullable = false)
     private User user;

     @ManyToOne(fetch = FetchType.LAZY)
     @JoinColumn(name = "badge_id", nullable = false)
     private Badge badge;

     @Column(nullable = false)
     private LocalDateTime unlockedAt;

     @PrePersist
     public void prePersist() {
          if (this.unlockedAt == null)
               this.unlockedAt = LocalDateTime.now();
     }

     // ── Getters & Setters ──────────────────────

     public Long getId() {
          return id;
     }

     public void setId(Long id) {
          this.id = id;
     }

     public User getUser() {
          return user;
     }

     public void setUser(User user) {
          this.user = user;
     }

     public Badge getBadge() {
          return badge;
     }

     public void setBadge(Badge badge) {
          this.badge = badge;
     }

     public LocalDateTime getUnlockedAt() {
          return unlockedAt;
     }

     public void setUnlockedAt(LocalDateTime unlockedAt) {
          this.unlockedAt = unlockedAt;
     }
}