package com.studyplanner.studyplanner.dto;

public class AuthResponseDto {

     private Long id;
     private String fullName;
     private String email;
     private String course;
     private String college;
     private String message;

     public AuthResponseDto() {
     }

     public AuthResponseDto(Long id, String fullName, String email, String course, String college, String message) {
          this.id = id;
          this.fullName = fullName;
          this.email = email;
          this.course = course;
          this.college = college;
          this.message = message;
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

     public String getMessage() {
          return message;
     }

     public void setMessage(String message) {
          this.message = message;
     }
}