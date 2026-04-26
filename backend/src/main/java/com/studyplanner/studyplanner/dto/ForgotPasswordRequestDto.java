package com.studyplanner.studyplanner.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Step 1: User submits email to receive OTP.
 * POST /api/auth/forgot-password
 */
public class ForgotPasswordRequestDto {

     @NotBlank(message = "Email is required.")
     @Email(message = "Please enter a valid email address.")
     private String email;

     public ForgotPasswordRequestDto() {
     }

     public String getEmail() {
          return email;
     }

     public void setEmail(String email) {
          this.email = email;
     }
}