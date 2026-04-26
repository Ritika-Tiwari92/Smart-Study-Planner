package com.studyplanner.studyplanner.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * Step 2: User submits email + OTP to verify.
 * POST /api/auth/verify-otp
 */
public class VerifyOtpRequestDto {

     @NotBlank(message = "Email is required.")
     @Email(message = "Please enter a valid email address.")
     private String email;

     @NotBlank(message = "OTP is required.")
     @Pattern(regexp = "^[0-9]{6}$", message = "OTP must be 6 digits.")
     private String otp;

     public VerifyOtpRequestDto() {
     }

     public String getEmail() {
          return email;
     }

     public void setEmail(String email) {
          this.email = email;
     }

     public String getOtp() {
          return otp;
     }

     public void setOtp(String otp) {
          this.otp = otp;
     }
}