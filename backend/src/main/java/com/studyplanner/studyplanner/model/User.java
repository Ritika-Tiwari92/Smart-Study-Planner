package com.studyplanner.studyplanner.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {

     @Id
     @GeneratedValue(strategy = GenerationType.IDENTITY)
     private Long id;

     @Column(nullable = false)
     private String fullName;

     @Column(nullable = false, unique = true)
     private String email;

     @Column(nullable = false)
     private String password;

     @Column(nullable = false)
     private String course;

     @Column(nullable = false)
     private String college;

     @Column(nullable = false, updatable = false)
     private LocalDateTime createdAt;

     public User() {
     }

     @PrePersist
     public void prePersist() {
          this.createdAt = LocalDateTime.now();
     }

     public Long getId() {
          return id;
     }

     public void setId(Long id) {
          this.id = id;
     }

     public String getFullName() {
          return fullName;
     }

     public void setFullName(String fullName) {
          this.fullName = fullName;
     }

     public String getEmail() {
          return email;
     }

     public void setEmail(String email) {
          this.email = email;
     }

     public String getPassword() {
          return password;
     }

     public void setPassword(String password) {
          this.password = password;
     }

     public String getCourse() {
          return course;
     }

     public void setCourse(String course) {
          this.course = course;
     }

     public String getCollege() {
          return college;
     }

     public void setCollege(String college) {
          this.college = college;
     }

     public LocalDateTime getCreatedAt() {
          return createdAt;
     }

     public void setCreatedAt(LocalDateTime createdAt) {
          this.createdAt = createdAt;
     }
}