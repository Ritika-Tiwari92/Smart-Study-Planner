package com.studyplanner.studyplanner.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * OtpService — Handles OTP generation, storage, and email delivery.
 *
 * Two separate OTP stores:
 * 1. twoFactorOtpStore — for 2FA during login (5 min expiry)
 * 2. passwordResetOtpStore — for forgot-password flow (10 min expiry)
 *
 * Keeping them separate prevents any cross-contamination between flows.
 * Uses ConcurrentHashMap (in-memory). Replace with Redis for multi-instance.
 */
@Service
public class OtpService {

     // ── Separate stores for each flow ────────────────────────────────────────

     private final Map<String, OtpEntry> twoFactorOtpStore = new ConcurrentHashMap<>();
     private final Map<String, OtpEntry> passwordResetOtpStore = new ConcurrentHashMap<>();

     @Autowired
     private JavaMailSender mailSender;

     @Value("${spring.mail.username}")
     private String fromEmail;

     private static final int TWO_FACTOR_OTP_EXPIRY_MINUTES = 5;
     private static final int PASSWORD_RESET_OTP_EXPIRY_MINUTES = 10;

     // ── Inner class to hold OTP + expiry ─────────────────────────────────────

     private static class OtpEntry {
          final String otp;
          final LocalDateTime expiresAt;

          OtpEntry(String otp, int expiryMinutes) {
               this.otp = otp;
               this.expiresAt = LocalDateTime.now().plusMinutes(expiryMinutes);
          }

          boolean isExpired() {
               return LocalDateTime.now().isAfter(expiresAt);
          }
     }

     // ═══════════════════════════════════════════════════════════════════════
     // 2FA OTP — unchanged from original, kept for backward compatibility
     // ═══════════════════════════════════════════════════════════════════════

     /**
      * Generates a 6-digit OTP, stores it in the 2FA store,
      * and emails it to the user. Expires in 5 minutes.
      *
      * Used by: 2FA enable/verify flow.
      */
     public void sendOtp(String toEmail, String userName) {
          String otp = generateOtp();
          twoFactorOtpStore.put(toEmail, new OtpEntry(otp, TWO_FACTOR_OTP_EXPIRY_MINUTES));
          sendTwoFactorOtpEmail(toEmail, userName, otp);
     }

     /**
      * Verifies OTP from the 2FA store.
      * Returns true if valid. Throws IllegalArgumentException on failure.
      * OTP is deleted after successful verification (single-use).
      */
     public boolean verifyOtp(String email, String inputOtp) {
          OtpEntry entry = twoFactorOtpStore.get(email);

          if (entry == null) {
               throw new IllegalArgumentException("No OTP found. Please request a new OTP.");
          }
          if (entry.isExpired()) {
               twoFactorOtpStore.remove(email);
               throw new IllegalArgumentException("OTP has expired. Please request a new one.");
          }
          if (!entry.otp.equals(inputOtp.trim())) {
               throw new IllegalArgumentException("Invalid OTP. Please check and try again.");
          }

          twoFactorOtpStore.remove(email); // single-use
          return true;
     }

     // ═══════════════════════════════════════════════════════════════════════
     // PASSWORD RESET OTP — new methods for forgot-password flow
     // ═══════════════════════════════════════════════════════════════════════

     /**
      * Generates a 6-digit OTP, stores it in the password reset store,
      * and emails it to the user. Expires in 10 minutes.
      *
      * Used by: POST /api/auth/forgot-password
      */
     public void sendPasswordResetOtp(String toEmail, String userName) {
          String otp = generateOtp();
          passwordResetOtpStore.put(toEmail, new OtpEntry(otp, PASSWORD_RESET_OTP_EXPIRY_MINUTES));
          sendPasswordResetOtpEmail(toEmail, userName, otp);
     }

     /**
      * Verifies OTP from the password reset store.
      * Returns true if valid. Throws IllegalArgumentException on failure.
      *
      * IMPORTANT: OTP is NOT deleted here — it is deleted only after
      * the actual password reset in resetPassword().
      * This prevents the user from being locked out if they navigate back
      * after OTP verification but before submitting their new password.
      *
      * Used by: POST /api/auth/verify-otp
      */
     public boolean verifyPasswordResetOtp(String email, String inputOtp) {
          OtpEntry entry = passwordResetOtpStore.get(email);

          if (entry == null) {
               throw new IllegalArgumentException(
                         "No OTP found for this email. Please request a new OTP.");
          }
          if (entry.isExpired()) {
               passwordResetOtpStore.remove(email);
               throw new IllegalArgumentException(
                         "OTP has expired. Please request a new one.");
          }
          if (!entry.otp.equals(inputOtp.trim())) {
               throw new IllegalArgumentException(
                         "Invalid OTP. Please check and try again.");
          }

          // Do NOT remove here — still needed for reset-password step.
          return true;
     }

     /**
      * Clears the password reset OTP for a given email.
      * Called by AuthService after successful password reset.
      *
      * Used by: POST /api/auth/reset-password (via AuthService)
      */
     public void clearPasswordResetOtp(String email) {
          passwordResetOtpStore.remove(email);
     }

     /**
      * Checks if a valid (non-expired) password reset OTP exists for this email.
      * Used by AuthService before allowing password reset.
      */
     public boolean hasValidPasswordResetOtp(String email) {
          OtpEntry entry = passwordResetOtpStore.get(email);
          if (entry == null)
               return false;
          if (entry.isExpired()) {
               passwordResetOtpStore.remove(email);
               return false;
          }
          return true;
     }

     // ═══════════════════════════════════════════════════════════════════════
     // PRIVATE HELPERS
     // ═══════════════════════════════════════════════════════════════════════

     private String generateOtp() {
          SecureRandom random = new SecureRandom();
          return String.valueOf(100000 + random.nextInt(900000));
     }

     // ── 2FA Email (unchanged) ─────────────────────────────────────────────

     private void sendTwoFactorOtpEmail(String toEmail, String userName, String otp) {
          try {
               MimeMessage message = mailSender.createMimeMessage();
               MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
               helper.setFrom(fromEmail);
               helper.setTo(toEmail);
               helper.setSubject("EduMind AI — Your 2FA Verification Code");
               helper.setText(buildTwoFactorEmailHtml(userName, otp), true);
               mailSender.send(message);
          } catch (Exception e) {
               throw new RuntimeException("Failed to send OTP email. Please try again.");
          }
     }

     private String buildTwoFactorEmailHtml(String userName, String otp) {
          return "<!DOCTYPE html><html><head><meta charset='UTF-8'></head>"
                    + "<body style='margin:0;padding:0;background:#f5f6fa;"
                    + "font-family:Poppins,Arial,sans-serif'>"
                    + "<div style='max-width:480px;margin:40px auto;background:#fff;"
                    + "border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.08)'>"

                    + "<div style='background:linear-gradient(135deg,#6c63ff,#8b7cff);"
                    + "padding:32px 28px;text-align:center'>"
                    + "<h1 style='color:#fff;margin:0;font-size:22px;font-weight:700'>&#127891; EduMind AI</h1>"
                    + "<p style='color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px'>"
                    + "Two-Factor Authentication</p></div>"

                    + "<div style='padding:32px 28px'>"
                    + "<p style='color:#374151;font-size:15px;margin:0 0 8px'>Hi <strong>"
                    + userName + "</strong>,</p>"
                    + "<p style='color:#6b7280;font-size:14px;margin:0 0 28px;line-height:1.6'>"
                    + "Use the code below to verify your identity. "
                    + "This code expires in <strong>5 minutes</strong>.</p>"

                    + "<div style='background:#f3f0ff;border:2px solid #ddd6fe;"
                    + "border-radius:16px;padding:24px;text-align:center;margin-bottom:24px'>"
                    + "<p style='color:#6b7280;font-size:12px;text-transform:uppercase;"
                    + "letter-spacing:0.1em;margin:0 0 10px;font-weight:600'>Verification Code</p>"
                    + "<div style='font-size:40px;font-weight:700;letter-spacing:12px;"
                    + "color:#4f46e5;font-family:Courier New,monospace'>" + otp + "</div>"
                    + "<p style='color:#9ca3af;font-size:12px;margin:12px 0 0'>Expires in 5 minutes</p>"
                    + "</div>"

                    + "<p style='color:#9ca3af;font-size:13px;text-align:center;margin:0'>"
                    + "If you didn't request this, please ignore this email.</p>"
                    + "</div>"

                    + "<div style='background:#f9fafb;padding:16px 28px;text-align:center;"
                    + "border-top:1px solid #e5e7eb'>"
                    + "<p style='color:#9ca3af;font-size:12px;margin:0'>EduMind AI &#8212; Study Smarter &#128218;</p>"
                    + "</div></div></body></html>";
     }

     // ── Password Reset Email (new) ────────────────────────────────────────

     private void sendPasswordResetOtpEmail(String toEmail, String userName, String otp) {
          try {
               MimeMessage message = mailSender.createMimeMessage();
               MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
               helper.setFrom(fromEmail);
               helper.setTo(toEmail);
               helper.setSubject("EduMind AI — Password Reset OTP");
               helper.setText(buildPasswordResetEmailHtml(userName, otp), true);
               mailSender.send(message);
          } catch (Exception e) {
               throw new RuntimeException("Failed to send password reset email. Please try again.");
          }
     }

     private String buildPasswordResetEmailHtml(String userName, String otp) {
          return "<!DOCTYPE html><html><head><meta charset='UTF-8'></head>"
                    + "<body style='margin:0;padding:0;background:#f5f6fa;"
                    + "font-family:Poppins,Arial,sans-serif'>"
                    + "<div style='max-width:480px;margin:40px auto;background:#fff;"
                    + "border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.08)'>"

                    // Header — teal/blue gradient for reset (different from 2FA purple)
                    + "<div style='background:linear-gradient(135deg,#0ea5e9,#6366f1);"
                    + "padding:32px 28px;text-align:center'>"
                    + "<h1 style='color:#fff;margin:0;font-size:22px;font-weight:700'>&#127891; EduMind AI</h1>"
                    + "<p style='color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px'>"
                    + "Password Reset Request</p></div>"

                    // Body
                    + "<div style='padding:32px 28px'>"
                    + "<p style='color:#374151;font-size:15px;margin:0 0 8px'>Hi <strong>"
                    + userName + "</strong>,</p>"
                    + "<p style='color:#6b7280;font-size:14px;margin:0 0 8px;line-height:1.6'>"
                    + "We received a request to reset your EduMind AI password.</p>"
                    + "<p style='color:#6b7280;font-size:14px;margin:0 0 28px;line-height:1.6'>"
                    + "Use the code below to proceed. "
                    + "This code expires in <strong>10 minutes</strong>.</p>"

                    // OTP box
                    + "<div style='background:#f0f9ff;border:2px solid #bae6fd;"
                    + "border-radius:16px;padding:24px;text-align:center;margin-bottom:24px'>"
                    + "<p style='color:#0369a1;font-size:12px;text-transform:uppercase;"
                    + "letter-spacing:0.1em;margin:0 0 10px;font-weight:600'>Password Reset Code</p>"
                    + "<div style='font-size:40px;font-weight:700;letter-spacing:12px;"
                    + "color:#0284c7;font-family:Courier New,monospace'>" + otp + "</div>"
                    + "<p style='color:#9ca3af;font-size:12px;margin:12px 0 0'>Expires in 10 minutes</p>"
                    + "</div>"

                    // Security warning
                    + "<div style='background:#fefce8;border:1px solid #fde68a;"
                    + "border-radius:12px;padding:16px;margin-bottom:20px'>"
                    + "<p style='color:#92400e;font-size:13px;margin:0;line-height:1.6'>"
                    + "&#9888; If you did not request a password reset, "
                    + "please ignore this email. Your password will remain unchanged.</p>"
                    + "</div>"

                    + "<p style='color:#9ca3af;font-size:13px;text-align:center;margin:0'>"
                    + "For security, never share this code with anyone.</p>"
                    + "</div>"

                    // Footer
                    + "<div style='background:#f9fafb;padding:16px 28px;text-align:center;"
                    + "border-top:1px solid #e5e7eb'>"
                    + "<p style='color:#9ca3af;font-size:12px;margin:0'>EduMind AI &#8212; Study Smarter &#128218;</p>"
                    + "</div></div></body></html>";
     }
}