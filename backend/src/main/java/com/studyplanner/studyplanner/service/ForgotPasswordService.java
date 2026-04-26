package com.studyplanner.studyplanner.service;

import com.studyplanner.studyplanner.dto.ForgotPasswordRequestDto;
import com.studyplanner.studyplanner.dto.ResetPasswordRequestDto;
import com.studyplanner.studyplanner.dto.VerifyOtpRequestDto;
import com.studyplanner.studyplanner.model.PasswordResetToken;
import com.studyplanner.studyplanner.model.User;
import com.studyplanner.studyplanner.repository.PasswordResetTokenRepository;
import com.studyplanner.studyplanner.repository.UserRepository;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.mail.internet.MimeMessage;
import java.time.LocalDateTime;
import java.util.Random;

/**
 * ForgotPasswordService
 *
 * Step 1: sendOtp() → generates 6-digit OTP, saves to DB, sends via Gmail
 * Step 2: verifyOtp() → checks OTP is valid and not expired
 * Step 3: resetPassword() → updates password in DB, deletes OTP token
 */
@Service
public class ForgotPasswordService {

     // OTP expires in 10 minutes
     private static final int OTP_EXPIRY_MINUTES = 10;

     // Strong password regex
     private static final String STRONG_PASSWORD_REGEX = "^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[@#$%&*!^()_+=\\-]).{8,}$";

     private final UserRepository userRepository;
     private final PasswordResetTokenRepository tokenRepository;
     private final PasswordEncoder passwordEncoder;
     private final JavaMailSender mailSender;

     public ForgotPasswordService(
               UserRepository userRepository,
               PasswordResetTokenRepository tokenRepository,
               PasswordEncoder passwordEncoder,
               JavaMailSender mailSender) {
          this.userRepository = userRepository;
          this.tokenRepository = tokenRepository;
          this.passwordEncoder = passwordEncoder;
          this.mailSender = mailSender;
     }

     // ─────────────────────────────────────────
     // STEP 1 — Send OTP to email
     // ─────────────────────────────────────────

     @Transactional
     public String sendOtp(ForgotPasswordRequestDto request) {

          String email = request.getEmail().trim().toLowerCase();

          // Check if user exists — vague message for security
          User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException(
                              "If this email is registered, you will receive an OTP shortly."));

          // Delete any existing OTP for this email
          tokenRepository.deleteByEmail(email);

          // Generate 6-digit OTP
          String otp = generateOtp();

          // Save OTP to DB
          PasswordResetToken token = new PasswordResetToken();
          token.setEmail(email);
          token.setOtp(otp);
          token.setExpiresAt(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES));
          token.setVerified(false);
          tokenRepository.save(token);

          // Send OTP email
          sendOtpEmail(email, user.getFullName(), otp);

          return "OTP sent successfully. Please check your email.";
     }

     // ─────────────────────────────────────────
     // STEP 2 — Verify OTP
     // ─────────────────────────────────────────

     @Transactional
     public String verifyOtp(VerifyOtpRequestDto request) {

          String email = request.getEmail().trim().toLowerCase();
          String otp = request.getOtp().trim();

          // Find token by email and OTP
          PasswordResetToken token = tokenRepository
                    .findByEmailAndOtp(email, otp)
                    .orElseThrow(() -> new IllegalArgumentException(
                              "Invalid OTP. Please check and try again."));

          // Check if expired
          if (token.isExpired()) {
               tokenRepository.deleteByEmail(email);
               throw new IllegalArgumentException(
                         "OTP has expired. Please request a new one.");
          }

          // Check if already used
          if (token.isVerified()) {
               throw new IllegalArgumentException(
                         "OTP has already been used. Please request a new one.");
          }

          // Mark as verified
          token.setVerified(true);
          tokenRepository.save(token);

          return "OTP verified successfully. You can now reset your password.";
     }

     // ─────────────────────────────────────────
     // STEP 3 — Reset Password
     // ─────────────────────────────────────────

     @Transactional
     public String resetPassword(ResetPasswordRequestDto request) {

          String email = request.getEmail().trim().toLowerCase();
          String newPass = request.getNewPassword();
          String confirmPass = request.getConfirmPassword();

          // Passwords must match
          if (!newPass.equals(confirmPass)) {
               throw new IllegalArgumentException("Passwords do not match.");
          }

          // Strong password check
          if (!newPass.matches(STRONG_PASSWORD_REGEX)) {
               throw new IllegalArgumentException(
                         "Password must contain uppercase, lowercase, number, and special character.");
          }

          // Check verified OTP exists for this email
          PasswordResetToken token = tokenRepository
                    .findTopByEmailOrderByCreatedAtDesc(email)
                    .orElseThrow(() -> new IllegalArgumentException(
                              "No verified OTP found. Please start the process again."));

          // Must be verified
          if (!token.isVerified()) {
               throw new IllegalArgumentException(
                         "OTP not verified. Please verify your OTP first.");
          }

          // Must not be expired
          if (token.isExpired()) {
               tokenRepository.deleteByEmail(email);
               throw new IllegalArgumentException(
                         "Session expired. Please start the process again.");
          }

          // Find user
          User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("User not found."));

          // New password must be different from current
          if (passwordEncoder.matches(newPass, user.getPassword())) {
               throw new IllegalArgumentException(
                         "New password must be different from your current password.");
          }

          // Update password with BCrypt hash
          user.setPassword(passwordEncoder.encode(newPass));
          user.resetFailedAttempts(); // also reset any account lock
          userRepository.save(user);

          // Delete OTP token — one time use
          tokenRepository.deleteByEmail(email);

          // Send confirmation email
          sendPasswordChangedEmail(email, user.getFullName());

          return "Password reset successfully. You can now login with your new password.";
     }

     // ─────────────────────────────────────────
     // PRIVATE HELPERS
     // ─────────────────────────────────────────

     /**
      * Generates a random 6-digit OTP.
      */
     private String generateOtp() {
          Random random = new Random();
          int otp = 100000 + random.nextInt(900000);
          return String.valueOf(otp);
     }

     /**
      * Sends OTP email via Gmail SMTP.
      * Beautiful HTML email template.
      */
     private void sendOtpEmail(String toEmail, String fullName, String otp) {
          try {
               MimeMessage message = mailSender.createMimeMessage();
               MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

               helper.setFrom("edumind14ai@gmail.com", "EduMind AI");
               helper.setTo(toEmail);
               helper.setSubject("🔐 Your EduMind AI Password Reset OTP");

               String htmlContent = """
                         <!DOCTYPE html>
                         <html>
                         <head>
                           <meta charset="UTF-8">
                           <meta name="viewport" content="width=device-width, initial-scale=1.0">
                         </head>
                         <body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;
                                      background:#f0f4f8;">
                           <table width="100%%" cellpadding="0" cellspacing="0"
                                  style="background:#f0f4f8;padding:40px 0;">
                             <tr>
                               <td align="center">
                                 <table width="600" cellpadding="0" cellspacing="0"
                                        style="background:#ffffff;border-radius:16px;
                                               box-shadow:0 4px 24px rgba(0,0,0,0.08);
                                               overflow:hidden;max-width:600px;width:100%%;">

                                   <!-- Header -->
                                   <tr>
                                     <td style="background:linear-gradient(135deg,#071A1F,#0D2D35);
                                                padding:36px 40px;text-align:center;">
                                       <div style="font-size:28px;font-weight:700;color:#00E5FF;
                                                   letter-spacing:-0.5px;">
                                         🎓 EduMind AI
                                       </div>
                                       <div style="color:#94A3B8;font-size:14px;margin-top:6px;">
                                         Smart Study Planner
                                       </div>
                                     </td>
                                   </tr>

                                   <!-- Body -->
                                   <tr>
                                     <td style="padding:40px;">

                                       <p style="color:#1e293b;font-size:16px;margin:0 0 8px;">
                                         Hello, <strong>%s</strong> 👋
                                       </p>

                                       <p style="color:#475569;font-size:15px;line-height:1.6;
                                                 margin:0 0 28px;">
                                         We received a request to reset your EduMind AI password.
                                         Use the OTP below to proceed. This OTP is valid for
                                         <strong>10 minutes</strong> only.
                                       </p>

                                       <!-- OTP Box -->
                                       <div style="background:linear-gradient(135deg,#071A1F,#0D2D35);
                                                   border-radius:12px;padding:28px;text-align:center;
                                                   margin:0 0 28px;">
                                         <div style="color:#94A3B8;font-size:13px;
                                                     text-transform:uppercase;letter-spacing:2px;
                                                     margin-bottom:12px;">
                                           Your OTP Code
                                         </div>
                                         <div style="color:#00E5FF;font-size:44px;font-weight:700;
                                                     letter-spacing:12px;font-family:monospace;">
                                           %s
                                         </div>
                                         <div style="color:#64748B;font-size:12px;margin-top:12px;">
                                           ⏰ Expires in 10 minutes
                                         </div>
                                       </div>

                                       <!-- Warning -->
                                       <div style="background:#fef9c3;border:1px solid #fde047;
                                                   border-radius:8px;padding:14px 16px;
                                                   margin:0 0 24px;">
                                         <p style="color:#854d0e;font-size:13px;margin:0;">
                                           ⚠️ <strong>Do not share this OTP</strong> with anyone.
                                           EduMind AI will never ask for your OTP.
                                           If you did not request this, please ignore this email.
                                         </p>
                                       </div>

                                       <p style="color:#94A3B8;font-size:13px;margin:0;">
                                         If you did not request a password reset, no action is
                                         required. Your account is safe.
                                       </p>

                                     </td>
                                   </tr>

                                   <!-- Footer -->
                                   <tr>
                                     <td style="background:#f8fafc;padding:24px 40px;
                                                border-top:1px solid #e2e8f0;text-align:center;">
                                       <p style="color:#94A3B8;font-size:12px;margin:0;">
                                         © 2024 EduMind AI · Smart Study Planner<br>
                                         This is an automated email. Please do not reply.
                                       </p>
                                     </td>
                                   </tr>

                                 </table>
                               </td>
                             </tr>
                           </table>
                         </body>
                         </html>
                         """.formatted(fullName, otp);

               helper.setText(htmlContent, true);
               mailSender.send(message);

          } catch (Exception e) {
               System.err.println("Email send error: " + e.getMessage());
               throw new IllegalArgumentException(
                         "Failed to send OTP email. Please try again.");
          }
     }

     /**
      * Sends password changed confirmation email.
      */
     private void sendPasswordChangedEmail(String toEmail, String fullName) {
          try {
               MimeMessage message = mailSender.createMimeMessage();
               MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

               helper.setFrom("edumind14ai@gmail.com", "EduMind AI");
               helper.setTo(toEmail);
               helper.setSubject("✅ EduMind AI — Password Changed Successfully");

               String htmlContent = """
                         <!DOCTYPE html>
                         <html>
                         <body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;
                                      background:#f0f4f8;">
                           <table width="100%%" cellpadding="0" cellspacing="0"
                                  style="background:#f0f4f8;padding:40px 0;">
                             <tr>
                               <td align="center">
                                 <table width="600" cellpadding="0" cellspacing="0"
                                        style="background:#ffffff;border-radius:16px;
                                               box-shadow:0 4px 24px rgba(0,0,0,0.08);
                                               overflow:hidden;max-width:600px;width:100%%;">

                                   <tr>
                                     <td style="background:linear-gradient(135deg,#071A1F,#0D2D35);
                                                padding:36px 40px;text-align:center;">
                                       <div style="font-size:28px;font-weight:700;color:#00E5FF;">
                                         🎓 EduMind AI
                                       </div>
                                     </td>
                                   </tr>

                                   <tr>
                                     <td style="padding:40px;">
                                       <div style="text-align:center;margin-bottom:24px;">
                                         <div style="width:64px;height:64px;background:#dcfce7;
                                                     border-radius:50%;display:inline-flex;
                                                     align-items:center;justify-content:center;
                                                     font-size:32px;">
                                           ✅
                                         </div>
                                       </div>

                                       <p style="color:#1e293b;font-size:16px;margin:0 0 8px;">
                                         Hello, <strong>%s</strong>
                                       </p>

                                       <p style="color:#475569;font-size:15px;line-height:1.6;
                                                 margin:0 0 24px;">
                                         Your EduMind AI password has been successfully changed.
                                         You can now login with your new password.
                                       </p>

                                       <div style="background:#fef2f2;border:1px solid #fecaca;
                                                   border-radius:8px;padding:14px 16px;">
                                         <p style="color:#991b1b;font-size:13px;margin:0;">
                                           🔒 If you did not make this change, please contact us
                                           immediately and secure your account.
                                         </p>
                                       </div>
                                     </td>
                                   </tr>

                                   <tr>
                                     <td style="background:#f8fafc;padding:24px 40px;
                                                border-top:1px solid #e2e8f0;text-align:center;">
                                       <p style="color:#94A3B8;font-size:12px;margin:0;">
                                         © 2024 EduMind AI · Smart Study Planner
                                       </p>
                                     </td>
                                   </tr>

                                 </table>
                               </td>
                             </tr>
                           </table>
                         </body>
                         </html>
                         """.formatted(fullName);

               helper.setText(htmlContent, true);
               mailSender.send(message);

          } catch (Exception e) {
               // Don't throw — password is already reset, email failure is non-critical
               System.err.println("Confirmation email error: " + e.getMessage());
          }
     }
}