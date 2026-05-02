package com.studyplanner.studyplanner.service;

import com.studyplanner.studyplanner.dto.AuthResponseDto;
import com.studyplanner.studyplanner.dto.ChangePasswordRequestDto;
import com.studyplanner.studyplanner.dto.LoginRequestDto;
import com.studyplanner.studyplanner.dto.ProfileUpdateRequestDto;
import com.studyplanner.studyplanner.dto.RefreshTokenRequestDto;
import com.studyplanner.studyplanner.dto.RefreshTokenResponseDto;
import com.studyplanner.studyplanner.dto.RegisterRequestDto;
import com.studyplanner.studyplanner.dto.ResetPasswordRequestDto;
import com.studyplanner.studyplanner.model.RefreshToken;
import com.studyplanner.studyplanner.model.User;
import com.studyplanner.studyplanner.repository.RefreshTokenRepository;
import com.studyplanner.studyplanner.repository.UserRepository;
import com.studyplanner.studyplanner.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * AuthService
 *
 * Features:
 * 1. Register new user with default STUDENT role.
 * 2. Login with rate limiting.
 * 3. Account lock after multiple failed attempts.
 * 4. Access token + refresh token support.
 * 5. Profile, password, delete account, and 2FA updates.
 * 6. Role included in AuthResponseDto for frontend redirect.
 * 7. Forgot password OTP flow (send OTP, verify OTP, reset password).
 */
@Service
public class AuthService {

     private static final int MAX_FAILED_ATTEMPTS = 5;
     private static final int LOCK_DURATION_MINUTES = 15;

     private static final String STRONG_PASSWORD_REGEX = "^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[@#$%&*!^()_+=\\-]).{8,}$";

     private final UserRepository userRepository;
     private final RefreshTokenRepository refreshTokenRepository;
     private final PasswordEncoder passwordEncoder;
     private final JwtUtil jwtUtil;
     private final OtpService otpService;

     public AuthService(UserRepository userRepository,
               RefreshTokenRepository refreshTokenRepository,
               PasswordEncoder passwordEncoder,
               JwtUtil jwtUtil,
               OtpService otpService) {
          this.userRepository = userRepository;
          this.refreshTokenRepository = refreshTokenRepository;
          this.passwordEncoder = passwordEncoder;
          this.jwtUtil = jwtUtil;
          this.otpService = otpService;
     }

     // ─────────────────────────────────────────
     // REGISTER
     // ─────────────────────────────────────────

     @Transactional
     public AuthResponseDto registerUser(RegisterRequestDto request) {

          if (isBlank(request.getFullName()) || isBlank(request.getEmail())
                    || isBlank(request.getPassword()) || isBlank(request.getCourse())
                    || isBlank(request.getCollege())) {
               throw new IllegalArgumentException("All fields are required.");
          }

          if (!request.getPassword().matches(STRONG_PASSWORD_REGEX)) {
               throw new IllegalArgumentException(
                         "Password must contain uppercase, lowercase, number, and special character.");
          }

          String email = request.getEmail().trim().toLowerCase();

          if (userRepository.existsByEmail(email)) {
               throw new IllegalArgumentException("Email already registered. Please login.");
          }

          User user = new User();
          user.setFullName(request.getFullName().trim());
          user.setEmail(email);
          user.setPassword(passwordEncoder.encode(request.getPassword()));
          user.setCourse(request.getCourse().trim());
          user.setCollege(request.getCollege().trim());
          user.setRole(User.Role.STUDENT);

          User savedUser = userRepository.save(user);

          String accessToken = jwtUtil.generateToken(savedUser.getId(), savedUser.getEmail());
          String refreshTokenValue = createAndSaveRefreshToken(savedUser);

          return mapToAuthResponse(savedUser, accessToken, refreshTokenValue,
                    "Account created successfully.");
     }

     // ─────────────────────────────────────────
     // LOGIN
     // ─────────────────────────────────────────

     @Transactional
     public AuthResponseDto loginUser(LoginRequestDto request) {

          if (isBlank(request.getEmail()) || isBlank(request.getPassword())) {
               throw new IllegalArgumentException("Email and password are required.");
          }

          String email = request.getEmail().trim().toLowerCase();

          User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("Invalid email or password."));

          if (user.isAccountLocked()) {
               LocalDateTime unlockTime = user.getAccountLockedUntil();
               long minutesLeft = java.time.Duration.between(
                         LocalDateTime.now(), unlockTime).toMinutes() + 1;

               throw new AccountLockedException(
                         "Account is locked due to too many failed attempts. " +
                                   "Please try again after " + minutesLeft + " minute(s).");
          }

          if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {

               user.incrementFailedAttempts();

               if (user.getFailedLoginAttempts() >= MAX_FAILED_ATTEMPTS) {
                    user.lockAccount(LOCK_DURATION_MINUTES);
                    userRepository.saveAndFlush(user);

                    throw new AccountLockedException(
                              "Too many failed attempts. Account locked for " +
                                        LOCK_DURATION_MINUTES + " minutes.");
               }

               userRepository.saveAndFlush(user);

               int attemptsLeft = MAX_FAILED_ATTEMPTS - user.getFailedLoginAttempts();

               throw new IllegalArgumentException(
                         "Invalid email or password. " + attemptsLeft + " attempt(s) remaining.");
          }

          user.resetFailedAttempts();
          userRepository.save(user);

          String accessToken = jwtUtil.generateToken(user.getId(), user.getEmail());
          String refreshTokenValue = createAndSaveRefreshToken(user);

          return mapToAuthResponse(user, accessToken, refreshTokenValue, "Login successful.");
     }

     // ─────────────────────────────────────────
     // REFRESH TOKEN
     // ─────────────────────────────────────────

     @Transactional
     public RefreshTokenResponseDto refreshAccessToken(RefreshTokenRequestDto request) {

          RefreshToken refreshToken = refreshTokenRepository
                    .findByToken(request.getRefreshToken())
                    .orElseThrow(() -> new IllegalArgumentException(
                              "Invalid refresh token. Please login again."));

          if (refreshToken.isExpired()) {
               refreshTokenRepository.delete(refreshToken);
               throw new IllegalArgumentException("Refresh token has expired. Please login again.");
          }

          User user = refreshToken.getUser();
          String newAccessToken = jwtUtil.generateToken(user.getId(), user.getEmail());

          return new RefreshTokenResponseDto(newAccessToken, "Token refreshed successfully.");
     }

     // ─────────────────────────────────────────
     // LOGOUT
     // ─────────────────────────────────────────

     @Transactional
     public String logoutUser(String email) {
          User user = findByEmailOrThrow(email);
          refreshTokenRepository.deleteByUser(user);
          return "Logged out successfully.";
     }

     // ─────────────────────────────────────────
     // PROFILE
     // ─────────────────────────────────────────

     public AuthResponseDto getUserProfileByEmail(String email) {
          User user = findByEmailOrThrow(email);
          return mapToAuthResponse(user, null, null, "Profile fetched successfully.");
     }

     @Transactional
     public AuthResponseDto updateUserProfileByEmail(String email,
               ProfileUpdateRequestDto request) {

          if (isBlank(request.getFullName()) || isBlank(request.getEmail())
                    || isBlank(request.getCourse()) || isBlank(request.getCollege())) {
               throw new IllegalArgumentException("All profile fields are required.");
          }

          User user = findByEmailOrThrow(email);
          String newEmail = request.getEmail().trim().toLowerCase();

          if (!newEmail.equals(user.getEmail())) {
               userRepository.findByEmail(newEmail).ifPresent(existing -> {
                    if (!existing.getId().equals(user.getId())) {
                         throw new IllegalArgumentException("Email already in use by another account.");
                    }
               });
          }

          user.setFullName(request.getFullName().trim());
          user.setEmail(newEmail);
          user.setCourse(request.getCourse().trim());
          user.setCollege(request.getCollege().trim());

          if (!isBlank(request.getPreferredStudyTime()))
               user.setPreferredStudyTime(request.getPreferredStudyTime().trim());

          if (!isBlank(request.getDailyStudyGoal()))
               user.setDailyStudyGoal(request.getDailyStudyGoal().trim());

          if (request.getPreferredSubjectsFocus() != null)
               user.setPreferredSubjectsFocus(request.getPreferredSubjectsFocus().trim());

          if (request.getTaskRemindersEnabled() != null)
               user.setTaskRemindersEnabled(request.getTaskRemindersEnabled());

          if (request.getRevisionAlertsEnabled() != null)
               user.setRevisionAlertsEnabled(request.getRevisionAlertsEnabled());

          if (request.getTestNotificationsEnabled() != null)
               user.setTestNotificationsEnabled(request.getTestNotificationsEnabled());

          if (request.getAssistantSuggestionsEnabled() != null)
               user.setAssistantSuggestionsEnabled(request.getAssistantSuggestionsEnabled());

          User updated = userRepository.save(user);
          String newToken = jwtUtil.generateToken(updated.getId(), updated.getEmail());

          return mapToAuthResponse(updated, newToken, null, "Profile updated successfully.");
     }

     // ─────────────────────────────────────────
     // CHANGE PASSWORD
     // ─────────────────────────────────────────

     @Transactional
     public String changeUserPasswordByEmail(String email, ChangePasswordRequestDto request) {

          if (isBlank(request.getCurrentPassword()) || isBlank(request.getNewPassword())
                    || isBlank(request.getConfirmNewPassword())) {
               throw new IllegalArgumentException("All password fields are required.");
          }

          User user = findByEmailOrThrow(email);

          if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
               throw new IllegalArgumentException("Current password is incorrect.");
          }

          if (request.getNewPassword().length() < 8) {
               throw new IllegalArgumentException(
                         "New password must be at least 8 characters long.");
          }

          if (!request.getNewPassword().equals(request.getConfirmNewPassword())) {
               throw new IllegalArgumentException(
                         "New password and confirm password do not match.");
          }

          if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
               throw new IllegalArgumentException(
                         "New password must be different from current password.");
          }

          user.setPassword(passwordEncoder.encode(request.getNewPassword()));
          userRepository.save(user);

          return "Password updated successfully.";
     }

     // ─────────────────────────────────────────
     // DELETE ACCOUNT
     // ─────────────────────────────────────────

     @Transactional
     public String deleteUserAccountByEmail(String email) {
          User user = findByEmailOrThrow(email);
          refreshTokenRepository.deleteByUser(user);
          userRepository.delete(user);
          return "Account deleted successfully.";
     }

     // ─────────────────────────────────────────
     // TWO FACTOR
     // ─────────────────────────────────────────

     @Transactional
     public AuthResponseDto updateTwoFactorStatusByEmail(String email, boolean enabled) {
          User user = findByEmailOrThrow(email);
          user.setTwoFactorEnabled(enabled);
          User updated = userRepository.save(user);

          String msg = enabled
                    ? "Two-factor authentication enabled successfully."
                    : "Two-factor authentication disabled successfully.";

          return mapToAuthResponse(updated, null, null, msg);
     }

     // ─────────────────────────────────────────
     // FORGOT PASSWORD — Step 1: Send OTP
     // ─────────────────────────────────────────

     /**
      * POST /api/auth/forgot-password
      *
      * Sends a password reset OTP to the given email address.
      *
      * Security rule: Always returns the same success message whether or not
      * the email is registered. This prevents email enumeration attacks
      * (an attacker cannot tell if an email exists in the system).
      *
      * If the email is NOT registered, we do nothing but still return success.
      * If the email IS registered, we send the OTP.
      * If email sending fails, we throw a RuntimeException (500).
      */
     public String forgotPassword(String email) {
          if (isBlank(email)) {
               throw new IllegalArgumentException("Email is required.");
          }

          String normalizedEmail = email.trim().toLowerCase();

          // Look up user — if not found, silently do nothing (security)
          Optional<User> userOptional = userRepository.findByEmail(normalizedEmail);

          if (userOptional.isPresent()) {
               User user = userOptional.get();
               // This may throw RuntimeException if email delivery fails
               otpService.sendPasswordResetOtp(normalizedEmail, user.getFullName());
          }

          // Always return the same message regardless of whether email exists
          return "If this email is registered, you will receive an OTP shortly.";
     }

     // ─────────────────────────────────────────
     // FORGOT PASSWORD — Step 2: Verify OTP
     // ─────────────────────────────────────────

     /**
      * POST /api/auth/verify-otp
      *
      * Verifies the 6-digit OTP entered by the user.
      * OTP is NOT cleared here — it is cleared only after successful reset.
      *
      * Throws IllegalArgumentException for:
      * - Invalid OTP
      * - Expired OTP
      * - No OTP found for this email
      */
     public String verifyOtpForPasswordReset(String email, String otp) {
          if (isBlank(email) || isBlank(otp)) {
               throw new IllegalArgumentException("Email and OTP are required.");
          }

          String normalizedEmail = email.trim().toLowerCase();

          // Delegates to OtpService — throws descriptive errors on failure
          otpService.verifyPasswordResetOtp(normalizedEmail, otp);

          return "OTP verified successfully. You may now reset your password.";
     }

     // ─────────────────────────────────────────
     // FORGOT PASSWORD — Step 3: Reset Password
     // ─────────────────────────────────────────

     /**
      * POST /api/auth/reset-password
      *
      * Resets the user's password after OTP has been verified.
      *
      * Validates:
      * - Email exists in database
      * - A valid (non-expired) OTP still exists for this email
      * (prevents direct API calls to /reset-password without going through
      * /verify-otp)
      * - New password meets strength requirements
      * - New password and confirm password match
      * - New password is not the same as current password
      *
      * After success:
      * - Password is updated
      * - OTP is cleared from memory
      * - All refresh tokens are invalidated (force re-login for security)
      */
     @Transactional
     public String resetPassword(ResetPasswordRequestDto request) {

          if (isBlank(request.getEmail())
                    || isBlank(request.getNewPassword())
                    || isBlank(request.getConfirmPassword())) {
               throw new IllegalArgumentException("All fields are required.");
          }

          String normalizedEmail = request.getEmail().trim().toLowerCase();

          // 1. Confirm the user exists
          User user = userRepository.findByEmail(normalizedEmail)
                    .orElseThrow(() -> new IllegalArgumentException(
                              "No account found with this email address."));

          // 2. Confirm a valid OTP still exists for this email
          // (prevents /reset-password being called without /verify-otp)
          if (!otpService.hasValidPasswordResetOtp(normalizedEmail)) {
               throw new IllegalArgumentException(
                         "OTP has expired or was not verified. Please restart the password reset process.");
          }

          // 3. Validate password strength
          if (!request.getNewPassword().matches(STRONG_PASSWORD_REGEX)) {
               throw new IllegalArgumentException(
                         "Password must contain uppercase, lowercase, number, and special character.");
          }

          // 4. Confirm passwords match
          if (!request.getNewPassword().equals(request.getConfirmPassword())) {
               throw new IllegalArgumentException(
                         "New password and confirm password do not match.");
          }

          // 5. Ensure new password is different from current
          if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
               throw new IllegalArgumentException(
                         "New password must be different from your current password.");
          }

          // 6. Update the password
          user.setPassword(passwordEncoder.encode(request.getNewPassword()));
          userRepository.save(user);

          // 7. Clear the OTP (single-use — flow is complete)
          otpService.clearPasswordResetOtp(normalizedEmail);

          // 8. Invalidate all existing refresh tokens for this user (security)
          // This forces a fresh login with the new password.
          refreshTokenRepository.deleteByUser(user);

          return "Password reset successfully. Please login with your new password.";
     }

     // ─────────────────────────────────────────
     // DEPRECATED METHODS
     // Kept for backward compatibility
     // ─────────────────────────────────────────

     @Deprecated
     public AuthResponseDto getUserProfile(Long userId) {
          User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found."));
          return mapToAuthResponse(user, null, null, "Profile fetched successfully.");
     }

     @Deprecated
     public AuthResponseDto updateUserProfile(Long userId, ProfileUpdateRequestDto req) {
          User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found."));
          return updateUserProfileByEmail(user.getEmail(), req);
     }

     @Deprecated
     public String changeUserPassword(Long userId, ChangePasswordRequestDto req) {
          User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found."));
          return changeUserPasswordByEmail(user.getEmail(), req);
     }

     @Deprecated
     public String deleteUserAccount(Long userId) {
          User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found."));
          return deleteUserAccountByEmail(user.getEmail());
     }

     @Deprecated
     public AuthResponseDto updateTwoFactorStatus(Long userId, boolean enabled) {
          User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found."));
          return updateTwoFactorStatusByEmail(user.getEmail(), enabled);
     }

     // ─────────────────────────────────────────
     // PRIVATE HELPERS
     // ─────────────────────────────────────────

     private String createAndSaveRefreshToken(User user) {
          refreshTokenRepository.deleteByUser(user);

          RefreshToken rt = new RefreshToken();
          rt.setToken(jwtUtil.generateRefreshTokenValue());
          rt.setUser(user);
          rt.setExpiresAt(LocalDateTime.now().plusDays(JwtUtil.REFRESH_TOKEN_EXPIRY_DAYS));

          refreshTokenRepository.save(rt);
          return rt.getToken();
     }

     private User findByEmailOrThrow(String email) {
          return userRepository.findByEmail(email.trim().toLowerCase())
                    .orElseThrow(() -> new IllegalArgumentException("User not found."));
     }

     private boolean isBlank(String value) {
          return value == null || value.trim().isEmpty();
     }

     /**
      * Converts User entity into AuthResponseDto.
      * Password is never returned. Role is returned for frontend redirect.
      */
     private AuthResponseDto mapToAuthResponse(User user, String token,
               String refreshToken, String message) {

          AuthResponseDto dto = new AuthResponseDto(
                    user.getId(),
                    user.getFullName(),
                    user.getEmail(),
                    user.getRole().name(),
                    user.getCourse(),
                    user.getCollege(),
                    user.isTwoFactorEnabled(),
                    user.getPreferredStudyTime(),
                    user.getDailyStudyGoal(),
                    user.getPreferredSubjectsFocus(),
                    user.isTaskRemindersEnabled(),
                    user.isRevisionAlertsEnabled(),
                    user.isTestNotificationsEnabled(),
                    user.isAssistantSuggestionsEnabled(),
                    token,
                    message);

          dto.setRefreshToken(refreshToken);
          return dto;
     }

     // ─────────────────────────────────────────
     // CUSTOM EXCEPTION
     // ─────────────────────────────────────────

     public static class AccountLockedException extends RuntimeException {

          public AccountLockedException() {
               super();
          }

          public AccountLockedException(String message) {
               super(message);
          }

          public AccountLockedException(String message, Throwable cause) {
               super(message, cause);
          }
     }
}