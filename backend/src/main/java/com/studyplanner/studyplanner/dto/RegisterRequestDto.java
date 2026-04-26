package com.studyplanner.studyplanner.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * DTO for user registration request.
 * All validation annotations here are the REAL security layer.
 * Frontend validation is only for UX — backend must always validate.
 */
public class RegisterRequestDto {

     // ── Full Name ──
     // Only letters and spaces allowed, minimum 2 characters
     @NotBlank(message = "Full name is required.")
     @Size(min = 2, message = "Full name must be at least 2 characters.")
     @Pattern(regexp = "^[A-Za-z\\u00C0-\\u024F ]+$", message = "Name can contain only letters and spaces.")
     private String fullName;

     // ── Email ──
     @NotBlank(message = "Email is required.")
     @Email(message = "Please enter a valid email address.")
     private String email;

     // ── Password ──
     // Min 8 chars, must have uppercase, lowercase, number, special character
     @NotBlank(message = "Password is required.")
     @Size(min = 8, message = "Password must be at least 8 characters.")
     @Pattern(regexp = "^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[@#$%&*!^()_+=\\-]).{8,}$", message = "Password must contain uppercase, lowercase, number, and special character.")
     private String password;

     // ── Course ──
     @NotBlank(message = "Course is required.")
     private String course;

     // ── College ──
     @NotBlank(message = "College is required.")
     private String college;

     // ── Constructors ──
     public RegisterRequestDto() {
     }

     // ── Getters & Setters ──
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