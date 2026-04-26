package com.studyplanner.studyplanner.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Step 3: User submits email + new password to reset.
 * POST /api/auth/reset-password
 */
public class ResetPasswordRequestDto {

     @NotBlank(message = "Email is required.")
     @Email(message = "Please enter a valid email address.")
     private String email;

     @NotBlank(message = "New password is required.")
     @Size(min = 8, message = "Password must be at least 8 characters.")
     @Pattern(regexp = "^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[@#$%&*!^()_+=\\-]).{8,}$", message = "Password must contain uppercase, lowercase, number, and special character.")
     private String newPassword;

     @NotBlank(message = "Confirm password is required.")
     private String confirmPassword;

     public ResetPasswordRequestDto() {
     }

     public String getEmail() {
          return email;
     }

     public void setEmail(String email) {
          this.email = email;
     }

     public String getNewPassword() {
          return newPassword;
     }

     public void setNewPassword(String newPassword) {
          this.newPassword = newPassword;
     }

     public String getConfirmPassword() {
          return confirmPassword;
     }

     public void setConfirmPassword(String confirmPassword) {
          this.confirmPassword = confirmPassword;
     }
}