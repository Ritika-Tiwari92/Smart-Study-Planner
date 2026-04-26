package com.studyplanner.studyplanner.controller;

import com.studyplanner.studyplanner.dto.ApiErrorResponse;
import com.studyplanner.studyplanner.dto.ForgotPasswordRequestDto;
import com.studyplanner.studyplanner.dto.ResetPasswordRequestDto;
import com.studyplanner.studyplanner.dto.VerifyOtpRequestDto;
import com.studyplanner.studyplanner.service.ForgotPasswordService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * ForgotPasswordController
 *
 * 3 public endpoints (no JWT needed):
 *
 * POST /api/auth/forgot-password → send OTP to email
 * POST /api/auth/verify-otp → verify OTP
 * POST /api/auth/reset-password → set new password
 */
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class ForgotPasswordController {

     private final ForgotPasswordService forgotPasswordService;

     public ForgotPasswordController(ForgotPasswordService forgotPasswordService) {
          this.forgotPasswordService = forgotPasswordService;
     }

     /**
      * POST /api/auth/forgot-password
      * User enters email → OTP sent to that email
      */
     @PostMapping("/forgot-password")
     public ResponseEntity<?> forgotPassword(
               @Valid @RequestBody ForgotPasswordRequestDto request) {
          try {
               String message = forgotPasswordService.sendOtp(request);
               return ResponseEntity.ok(new ApiErrorResponse("success", message));
          } catch (IllegalArgumentException ex) {
               // Always return 200 for security
               // (don't reveal if email exists or not)
               return ResponseEntity.ok(new ApiErrorResponse("success",
                         "If this email is registered, you will receive an OTP shortly."));
          }
     }

     /**
      * POST /api/auth/verify-otp
      * User enters 6-digit OTP → validated
      */
     @PostMapping("/verify-otp")
     public ResponseEntity<?> verifyOtp(
               @Valid @RequestBody VerifyOtpRequestDto request) {
          try {
               String message = forgotPasswordService.verifyOtp(request);
               return ResponseEntity.ok(new ApiErrorResponse("success", message));
          } catch (IllegalArgumentException ex) {
               return ResponseEntity
                         .status(HttpStatus.BAD_REQUEST)
                         .body(new ApiErrorResponse("otp", ex.getMessage()));
          }
     }

     /**
      * POST /api/auth/reset-password
      * User enters new password → updated in DB
      */
     @PostMapping("/reset-password")
     public ResponseEntity<?> resetPassword(
               @Valid @RequestBody ResetPasswordRequestDto request) {
          try {
               String message = forgotPasswordService.resetPassword(request);
               return ResponseEntity.ok(new ApiErrorResponse("success", message));
          } catch (IllegalArgumentException ex) {
               String field = "general";
               String msg = ex.getMessage();
               if (msg != null && msg.toLowerCase().contains("password"))
                    field = "newPassword";
               return ResponseEntity
                         .status(HttpStatus.BAD_REQUEST)
                         .body(new ApiErrorResponse(field, msg));
          }
     }
}