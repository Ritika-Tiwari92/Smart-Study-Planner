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
 * OtpService — Email OTP for 2FA
 *
 * Flow:
 * 1. POST /api/otp/send → generates 6-digit OTP, emails it to user
 * 2. User enters OTP in modal
 * 3. POST /api/otp/verify → verifies OTP, backend enables twoFactorEnabled =
 * true
 *
 * OTP expires in 5 minutes. Single-use (deleted after successful verify).
 * Uses ConcurrentHashMap (in-memory). Replace with Redis for multi-instance.
 */
@Service
public class OtpService {

     private final Map<String, OtpEntry> otpStore = new ConcurrentHashMap<>();

     @Autowired
     private JavaMailSender mailSender;

     @Value("${spring.mail.username}")
     private String fromEmail;

     private static final int OTP_EXPIRY_MINUTES = 5;

     // ── Inner record to hold OTP + expiry ──────────────────────────────────
     private static class OtpEntry {
          final String otp;
          final LocalDateTime expiresAt;

          OtpEntry(String otp) {
               this.otp = otp;
               this.expiresAt = LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES);
          }

          boolean isExpired() {
               return LocalDateTime.now().isAfter(expiresAt);
          }
     }

     // ── Generate & Send OTP ────────────────────────────────────────────────
     public void sendOtp(String toEmail, String userName) {
          String otp = generateOtp();
          otpStore.put(toEmail, new OtpEntry(otp));
          sendOtpEmail(toEmail, userName, otp);
     }

     // ── Verify OTP ─────────────────────────────────────────────────────────
     // Returns true if valid. Throws IllegalArgumentException on failure.
     public boolean verifyOtp(String email, String inputOtp) {
          OtpEntry entry = otpStore.get(email);

          if (entry == null) {
               throw new IllegalArgumentException("No OTP found. Please request a new OTP.");
          }
          if (entry.isExpired()) {
               otpStore.remove(email);
               throw new IllegalArgumentException("OTP has expired. Please request a new one.");
          }
          if (!entry.otp.equals(inputOtp.trim())) {
               throw new IllegalArgumentException("Invalid OTP. Please check and try again.");
          }

          otpStore.remove(email); // one-time use
          return true;
     }

     // ── Helpers ────────────────────────────────────────────────────────────
     private String generateOtp() {
          SecureRandom random = new SecureRandom();
          return String.valueOf(100000 + random.nextInt(900000));
     }

     private void sendOtpEmail(String toEmail, String userName, String otp) {
          try {
               MimeMessage message = mailSender.createMimeMessage();
               MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
               helper.setFrom(fromEmail);
               helper.setTo(toEmail);
               helper.setSubject("EduMind AI — Your 2FA Verification Code");
               helper.setText(buildEmailHtml(userName, otp), true);
               mailSender.send(message);
          } catch (Exception e) {
               throw new RuntimeException("Failed to send OTP email. Please try again.");
          }
     }

     private String buildEmailHtml(String userName, String otp) {
          return "<!DOCTYPE html><html><head><meta charset='UTF-8'></head>"
                    + "<body style='margin:0;padding:0;background:#f5f6fa;"
                    + "font-family:Poppins,Arial,sans-serif'>"
                    + "<div style='max-width:480px;margin:40px auto;background:#fff;"
                    + "border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.08)'>"

                    // Header
                    + "<div style='background:linear-gradient(135deg,#6c63ff,#8b7cff);"
                    + "padding:32px 28px;text-align:center'>"
                    + "<h1 style='color:#fff;margin:0;font-size:22px;font-weight:700'>🎓 EduMind AI</h1>"
                    + "<p style='color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px'>"
                    + "Two-Factor Authentication</p></div>"

                    // Body
                    + "<div style='padding:32px 28px'>"
                    + "<p style='color:#374151;font-size:15px;margin:0 0 8px'>Hi <strong>"
                    + userName + "</strong>,</p>"
                    + "<p style='color:#6b7280;font-size:14px;margin:0 0 28px;line-height:1.6'>"
                    + "Use the code below to verify your identity. "
                    + "This code expires in <strong>5 minutes</strong>.</p>"

                    // OTP box
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

                    // Footer
                    + "<div style='background:#f9fafb;padding:16px 28px;text-align:center;"
                    + "border-top:1px solid #e5e7eb'>"
                    + "<p style='color:#9ca3af;font-size:12px;margin:0'>EduMind AI — Study Smarter 📚</p>"
                    + "</div></div></body></html>";
     }
}