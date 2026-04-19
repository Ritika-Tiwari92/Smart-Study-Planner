package com.studyplanner.studyplanner.dto;

public class RegisterRequestDto {

     private String fullName;
     private String email;
     private String password;
     private String course;
     private String college;

     public RegisterRequestDto() {
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
}