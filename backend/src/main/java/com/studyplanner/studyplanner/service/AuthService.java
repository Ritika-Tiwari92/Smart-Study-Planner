package com.studyplanner.studyplanner.service;

import com.studyplanner.studyplanner.dto.AuthResponseDto;
import com.studyplanner.studyplanner.dto.ChangePasswordRequestDto;
import com.studyplanner.studyplanner.dto.LoginRequestDto;
import com.studyplanner.studyplanner.dto.ProfileUpdateRequestDto;
import com.studyplanner.studyplanner.dto.RefreshTokenRequestDto;
import com.studyplanner.studyplanner.dto.RefreshTokenResponseDto;
import com.studyplanner.studyplanner.dto.RegisterRequestDto;
import com.studyplanner.studyplanner.model.RefreshToken;
import com.studyplanner.studyplanner.model.User;
import com.studyplanner.studyplanner.repository.RefreshTokenRepository;
import com.studyplanner.studyplanner.repository.UserRepository;
import com.studyplanner.studyplanner.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * AuthService — updated with:
 *
 * 1. Rate limiting: max 5 failed login attempts
 * 2. Account lock: 15 minutes after 5 failures
 * 3. Refresh token: issued on login, stored in DB
 * 4. Refresh token endpoint: validates DB token, issues new access token
 * 5. Logout: deletes refresh token from DB
 * 6. All existing functionality unchanged
 */
@Service
public class AuthService {

     // Max failed attempts before account lock
     private static final int MAX_FAILED_ATTEMPTS = 5;

     // Lock duration in minutes
     private static final int LOCK_DURATION_MINUTES = 15;

     private final UserRepository userRepository;
     private final RefreshTokenRepository refreshTokenRepository;
     private final PasswordEncoder passwordEncoder;
     private final JwtUtil jwtUtil;

     // Strong password regex — same pattern as DTO and frontend
     private static final String STRONG_PASSWORD_REGEX = "^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[@#$%&*!^()_+=\\-]).{8,}$";

     public AuthService(UserRepository userRepository,
               RefreshTokenRepository refreshTokenRepository,
               PasswordEncoder passwordEncoder,
               JwtUtil jwtUtil) {
          this.userRepository = userRepository;
          this.refreshTokenRepository = refreshTokenRepository;
          this.passwordEncoder = passwordEncoder;
          this.jwtUtil = jwtUtil;
     }

     // ─────────────────────────────────────────
     // REGISTER
     // ─────────────────────────────────────────

     @Transactional
     public AuthResponseDto registerUser(RegisterRequestDto request) {

          // Blank check (second layer — @Valid is first)
          if (isBlank(request.getFullName()) || isBlank(request.getEmail())
                    || isBlank(request.getPassword()) || isBlank(request.getCourse())
                    || isBlank(request.getCollege())) {
               throw new IllegalArgumentException("All fields are required.");
          }

          // Strong password check (second layer)
          if (!request.getPassword().matches(STRONG_PASSWORD_REGEX)) {
               throw new IllegalArgumentException(
                         "Password must contain uppercase, lowercase, number, and special character.");
          }

          // Duplicate email → controller returns 409 for this message
          if (userRepository.existsByEmail(request.getEmail().trim().toLowerCase())) {
               throw new IllegalArgumentException("Email already registered. Please login.");
          }

          // Build and save user
          User user = new User();
          user.setFullName(request.getFullName().trim());
          user.setEmail(request.getEmail().trim().toLowerCase());
          user.setPassword(passwordEncoder.encode(request.getPassword())); // BCrypt
          user.setCourse(request.getCourse().trim());
          user.setCollege(request.getCollege().trim());
          User savedUser = userRepository.save(user);

          // Generate access token
          String accessToken = jwtUtil.generateToken(savedUser.getId(), savedUser.getEmail());

          // Generate and save refresh token
          String refreshTokenValue = createAndSaveRefreshToken(savedUser);

          return mapToAuthResponse(savedUser, accessToken, refreshTokenValue,
                    "Account created successfully.");
     }

     // ─────────────────────────────────────────
     // LOGIN — with rate limiting + account lock
     // ─────────────────────────────────────────

     // @Transactional
     public AuthResponseDto loginUser(LoginRequestDto request) {

          if (isBlank(request.getEmail()) || isBlank(request.getPassword())) {
               throw new IllegalArgumentException("Email and password are required.");
          }

          // Find user
          User user = userRepository
                    .findByEmail(request.getEmail().trim().toLowerCase())
                    .orElseThrow(() -> new IllegalArgumentException(
                              "Invalid email or password."));
          // Vague message — don't reveal if email exists

          // ── STEP 1: Check if account is locked ──
          if (user.isAccountLocked()) {
               LocalDateTime unlockTime = user.getAccountLockedUntil();
               long minutesLeft = java.time.Duration.between(
                         LocalDateTime.now(), unlockTime).toMinutes() + 1;
               throw new AccountLockedException(
                         "Account is locked due to too many failed attempts. " +
                                   "Please try again after " + minutesLeft + " minute(s).");
          }

          // ── STEP 2: Verify password ──
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

          // ── STEP 3: Login success — reset failed attempts ──
          user.resetFailedAttempts();
          userRepository.save(user);

          // Generate short-lived access token (15 min)
          String accessToken = jwtUtil.generateToken(user.getId(), user.getEmail());

          // Generate long-lived refresh token (7 days) and save to DB
          String refreshTokenValue = createAndSaveRefreshToken(user);

          return mapToAuthResponse(user, accessToken, refreshTokenValue, "Login successful.");
     }

     // ─────────────────────────────────────────
     // REFRESH TOKEN — issue new access token
     // ─────────────────────────────────────────

     @Transactional
     public RefreshTokenResponseDto refreshAccessToken(RefreshTokenRequestDto request) {

          // Find refresh token in DB
          RefreshToken refreshToken = refreshTokenRepository
                    .findByToken(request.getRefreshToken())
                    .orElseThrow(() -> new IllegalArgumentException(
                              "Invalid refresh token. Please login again."));

          // Check if refresh token is expired
          if (refreshToken.isExpired()) {
               // Delete expired token from DB
               refreshTokenRepository.delete(refreshToken);
               throw new IllegalArgumentException(
                         "Refresh token has expired. Please login again.");
          }

          // Token is valid — issue new access token
          User user = refreshToken.getUser();
          String newAccessToken = jwtUtil.generateToken(user.getId(), user.getEmail());

          return new RefreshTokenResponseDto(newAccessToken, "Token refreshed successfully.");
     }

     // ─────────────────────────────────────────
     // LOGOUT — invalidate refresh token
     // ─────────────────────────────────────────

     @Transactional
     public String logoutUser(String email) {
          User user = findByEmailOrThrow(email);

          // Delete refresh token from DB → token is now invalid
          refreshTokenRepository.deleteByUser(user);

          return "Logged out successfully.";
     }

     // ─────────────────────────────────────────
     // PROFILE (unchanged from previous version)
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
                         throw new IllegalArgumentException(
                                   "Email already in use by another account.");
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

     @Transactional
     public String changeUserPasswordByEmail(String email,
               ChangePasswordRequestDto request) {

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

     @Transactional
     public String deleteUserAccountByEmail(String email) {
          User user = findByEmailOrThrow(email);
          refreshTokenRepository.deleteByUser(user); // delete refresh token first
          userRepository.delete(user);
          return "Account deleted successfully.";
     }

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
     // DEPRECATED (kept for backward compat)
     // ─────────────────────────────────────────

     @Deprecated
     public AuthResponseDto getUserProfile(Long userId) {
          User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found."));
          return mapToAuthResponse(user, null, null, "Profile fetched successfully.");
     }

     @Deprecated
     public AuthResponseDto updateUserProfile(Long userId, ProfileUpdateRequestDto req) {
          return updateUserProfileByEmail(userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found."))
                    .getEmail(), req);
     }

     @Deprecated
     public String changeUserPassword(Long userId, ChangePasswordRequestDto req) {
          return changeUserPasswordByEmail(userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found."))
                    .getEmail(), req);
     }

     @Deprecated
     public String deleteUserAccount(Long userId) {
          return deleteUserAccountByEmail(userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found."))
                    .getEmail());
     }

     @Deprecated
     public AuthResponseDto updateTwoFactorStatus(Long userId, boolean enabled) {
          return updateTwoFactorStatusByEmail(userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found."))
                    .getEmail(), enabled);
     }

     // ─────────────────────────────────────────
     // PRIVATE HELPERS
     // ─────────────────────────────────────────

     /**
      * Creates a new refresh token, deletes old one for this user, saves new one.
      * Returns the token string value to include in response.
      */
     private String createAndSaveRefreshToken(User user) {
          // Delete old refresh token if exists (one per user)
          refreshTokenRepository.deleteByUser(user);

          // Create new refresh token
          RefreshToken rt = new RefreshToken();
          rt.setToken(jwtUtil.generateRefreshTokenValue());
          rt.setUser(user);
          rt.setExpiresAt(LocalDateTime.now().plusDays(JwtUtil.REFRESH_TOKEN_EXPIRY_DAYS));

          refreshTokenRepository.save(rt);
          return rt.getToken();
     }

     private User findByEmailOrThrow(String email) {
          return userRepository.findByEmail(email.toLowerCase())
                    .orElseThrow(() -> new IllegalArgumentException("User not found."));
     }

     private boolean isBlank(String value) {
          return value == null || value.trim().isEmpty();
     }

     /**
      * Maps User to AuthResponseDto.
      * Password is NEVER included.
      * refreshToken is included on login/register, null on other endpoints.
      */
     /**
      * REPLACE karo yeh method AuthService.java mein (line ~290 ke paas)
      * 
      * Fix: refreshToken ab constructor mein pass ho raha hai
      * Pehle sirf token pass hota tha, refreshToken null rehta tha
      * Isliye profile/update endpoints pe 500 aa raha tha
      */
     private AuthResponseDto mapToAuthResponse(User user, String token,
               String refreshToken, String message) {

          AuthResponseDto dto = new AuthResponseDto(
                    user.getId(),
                    user.getFullName(),
                    user.getEmail(),
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

          // refreshToken set karo (null hoga profile endpoints pe — @JsonInclude skip
          // karega)
          dto.setRefreshToken(refreshToken);

          return dto;
     }
     // ─────────────────────────────────────────
     // INNER EXCEPTION CLASS
     // ─────────────────────────────────────────

     /**
      * Custom exception for account lock.
      * GlobalExceptionHandler catches this and returns 423 Locked.
      */
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