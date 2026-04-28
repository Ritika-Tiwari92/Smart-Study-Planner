package com.studyplanner.studyplanner.controller;

import com.studyplanner.studyplanner.model.User;
import com.studyplanner.studyplanner.repository.UserRepository;
import com.studyplanner.studyplanner.service.AuthService;
import com.studyplanner.studyplanner.service.OtpService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * OtpController — 2FA via Email OTP
 *
 * ENDPOINTS (all JWT protected):
 *
 * POST /api/otp/send
 * → Sends 6-digit OTP to logged-in user's email
 * → No request body needed (email taken from JWT)
 *
 * POST /api/otp/verify
 * → Verifies OTP, enables twoFactorEnabled = true in DB
 * → Body: { "otp": "123456" }
 *
 * POST /api/otp/disable
 * → Disables 2FA (no OTP needed, just JWT auth)
 */
@RestController
@RequestMapping("/api/otp")
@CrossOrigin(origins = "*")
public class OtpController {

     @Autowired
     private OtpService otpService;

     @Autowired
     private UserRepository userRepository;

     // ── Send OTP ───────────────────────────────────────────────────────────
     @PostMapping("/send")
     public ResponseEntity<?> sendOtp(
               @AuthenticationPrincipal UserDetails userDetails) {
          try {
               String email = userDetails.getUsername();
               User user = userRepository.findByEmail(email)
                         .orElseThrow(() -> new IllegalArgumentException("User not found."));

               if (user.isTwoFactorEnabled()) {
                    return ResponseEntity.badRequest()
                              .body(Map.of("message", "Two-factor authentication is already enabled."));
               }

               otpService.sendOtp(email, user.getFullName());
               return ResponseEntity.ok(Map.of(
                         "message", "OTP sent to " + maskEmail(email) + ". Valid for 5 minutes.",
                         "maskedEmail", maskEmail(email)));

          } catch (IllegalArgumentException ex) {
               return ResponseEntity.badRequest()
                         .body(Map.of("message", ex.getMessage()));
          } catch (RuntimeException ex) {
               return ResponseEntity.internalServerError()
                         .body(Map.of("message", ex.getMessage()));
          }
     }

     // ── Verify OTP & Enable 2FA ────────────────────────────────────────────
     @PostMapping("/verify")
     public ResponseEntity<?> verifyOtp(
               @AuthenticationPrincipal UserDetails userDetails,
               @RequestBody Map<String, String> body) {
          try {
               String otp = body.get("otp");
               String email = userDetails.getUsername();

               if (otp == null || otp.trim().isEmpty()) {
                    return ResponseEntity.badRequest()
                              .body(Map.of("message", "OTP is required."));
               }

               User user = userRepository.findByEmail(email)
                         .orElseThrow(() -> new IllegalArgumentException("User not found."));

               // Verify — throws IllegalArgumentException if invalid/expired
               otpService.verifyOtp(email, otp);

               // Enable 2FA
               user.setTwoFactorEnabled(true);
               userRepository.save(user);

               return ResponseEntity.ok(Map.of(
                         "message", "Two-factor authentication enabled successfully.",
                         "twoFactorEnabled", true));

          } catch (IllegalArgumentException ex) {
               return ResponseEntity.badRequest()
                         .body(Map.of("message", ex.getMessage()));
          }
     }

     // ── Disable 2FA ────────────────────────────────────────────────────────
     @PostMapping("/disable")
     public ResponseEntity<?> disable2FA(
               @AuthenticationPrincipal UserDetails userDetails) {
          try {
               String email = userDetails.getUsername();
               User user = userRepository.findByEmail(email)
                         .orElseThrow(() -> new IllegalArgumentException("User not found."));

               user.setTwoFactorEnabled(false);
               userRepository.save(user);

               return ResponseEntity.ok(Map.of(
                         "message", "Two-factor authentication disabled successfully.",
                         "twoFactorEnabled", false));

          } catch (IllegalArgumentException ex) {
               return ResponseEntity.badRequest()
                         .body(Map.of("message", ex.getMessage()));
          }
     }

     // ── Helper: mask email for display ─────────────────────────────────────
     private String maskEmail(String email) {
          if (email == null || !email.contains("@"))
               return email;
          String[] parts = email.split("@");
          String local = parts[0];
          String domain = parts[1];
          if (local.length() <= 2)
               return "**@" + domain;
          return local.charAt(0) + "*".repeat(local.length() - 2)
                    + local.charAt(local.length() - 1) + "@" + domain;
     }
}