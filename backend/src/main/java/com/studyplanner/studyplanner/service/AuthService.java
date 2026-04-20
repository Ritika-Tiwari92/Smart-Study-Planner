package com.studyplanner.studyplanner.service;

import com.studyplanner.studyplanner.dto.AuthResponseDto;
import com.studyplanner.studyplanner.dto.ChangePasswordRequestDto;
import com.studyplanner.studyplanner.dto.LoginRequestDto;
import com.studyplanner.studyplanner.dto.ProfileUpdateRequestDto;
import com.studyplanner.studyplanner.dto.RegisterRequestDto;
import com.studyplanner.studyplanner.model.User;
import com.studyplanner.studyplanner.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

     private final UserRepository userRepository;

     public AuthService(UserRepository userRepository) {
          this.userRepository = userRepository;
     }

     public AuthResponseDto registerUser(RegisterRequestDto request) {
          if (request.getFullName() == null || request.getFullName().trim().isEmpty()
                    || request.getEmail() == null || request.getEmail().trim().isEmpty()
                    || request.getPassword() == null || request.getPassword().trim().isEmpty()
                    || request.getCourse() == null || request.getCourse().trim().isEmpty()
                    || request.getCollege() == null || request.getCollege().trim().isEmpty()) {
               throw new IllegalArgumentException("All fields are required.");
          }

          if (request.getPassword().trim().length() < 6) {
               throw new IllegalArgumentException("Password must be at least 6 characters long.");
          }

          if (userRepository.existsByEmail(request.getEmail().trim())) {
               throw new IllegalArgumentException("Email already registered.");
          }

          User user = new User();
          user.setFullName(request.getFullName().trim());
          user.setEmail(request.getEmail().trim());
          user.setPassword(request.getPassword().trim());
          user.setCourse(request.getCourse().trim());
          user.setCollege(request.getCollege().trim());

          User savedUser = userRepository.save(user);
          return mapToAuthResponse(savedUser, "Account created successfully.");
     }

     public AuthResponseDto loginUser(LoginRequestDto request) {
          if (request.getEmail() == null || request.getEmail().trim().isEmpty()
                    || request.getPassword() == null || request.getPassword().trim().isEmpty()) {
               throw new IllegalArgumentException("Email and password are required.");
          }

          User user = userRepository.findByEmail(request.getEmail().trim())
                    .orElseThrow(() -> new IllegalArgumentException("No account found with this email."));

          if (!user.getPassword().equals(request.getPassword().trim())) {
               throw new IllegalArgumentException("Invalid email or password.");
          }

          return mapToAuthResponse(user, "Login successful.");
     }

     public AuthResponseDto getUserProfile(Long userId) {
          User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found."));

          return mapToAuthResponse(user, "Profile fetched successfully.");
     }

     public AuthResponseDto updateUserProfile(Long userId, ProfileUpdateRequestDto request) {
          if (request.getFullName() == null || request.getFullName().trim().isEmpty()
                    || request.getEmail() == null || request.getEmail().trim().isEmpty()
                    || request.getCourse() == null || request.getCourse().trim().isEmpty()
                    || request.getCollege() == null || request.getCollege().trim().isEmpty()) {
               throw new IllegalArgumentException("All profile fields are required.");
          }

          User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found."));

          String newEmail = request.getEmail().trim();

          userRepository.findByEmail(newEmail).ifPresent(existingUser -> {
               if (!existingUser.getId().equals(user.getId())) {
                    throw new IllegalArgumentException("Email already in use by another account.");
               }
          });

          user.setFullName(request.getFullName().trim());
          user.setEmail(newEmail);
          user.setCourse(request.getCourse().trim());
          user.setCollege(request.getCollege().trim());

          if (request.getPreferredStudyTime() != null && !request.getPreferredStudyTime().trim().isEmpty()) {
               user.setPreferredStudyTime(request.getPreferredStudyTime().trim());
          }

          if (request.getDailyStudyGoal() != null && !request.getDailyStudyGoal().trim().isEmpty()) {
               user.setDailyStudyGoal(request.getDailyStudyGoal().trim());
          }

          if (request.getPreferredSubjectsFocus() != null) {
               user.setPreferredSubjectsFocus(request.getPreferredSubjectsFocus().trim());
          }

          if (request.getTaskRemindersEnabled() != null) {
               user.setTaskRemindersEnabled(request.getTaskRemindersEnabled());
          }

          if (request.getRevisionAlertsEnabled() != null) {
               user.setRevisionAlertsEnabled(request.getRevisionAlertsEnabled());
          }

          if (request.getTestNotificationsEnabled() != null) {
               user.setTestNotificationsEnabled(request.getTestNotificationsEnabled());
          }

          if (request.getAssistantSuggestionsEnabled() != null) {
               user.setAssistantSuggestionsEnabled(request.getAssistantSuggestionsEnabled());
          }

          User updatedUser = userRepository.save(user);
          return mapToAuthResponse(updatedUser, "Profile updated successfully.");
     }

     public String changeUserPassword(Long userId, ChangePasswordRequestDto request) {
          if (request.getCurrentPassword() == null || request.getCurrentPassword().trim().isEmpty()
                    || request.getNewPassword() == null || request.getNewPassword().trim().isEmpty()
                    || request.getConfirmNewPassword() == null || request.getConfirmNewPassword().trim().isEmpty()) {
               throw new IllegalArgumentException("All password fields are required.");
          }

          User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found."));

          String currentPassword = request.getCurrentPassword().trim();
          String newPassword = request.getNewPassword().trim();
          String confirmNewPassword = request.getConfirmNewPassword().trim();

          if (!user.getPassword().equals(currentPassword)) {
               throw new IllegalArgumentException("Current password is incorrect.");
          }

          if (newPassword.length() < 6) {
               throw new IllegalArgumentException("New password must be at least 6 characters long.");
          }

          if (!newPassword.equals(confirmNewPassword)) {
               throw new IllegalArgumentException("New password and confirm password do not match.");
          }

          if (currentPassword.equals(newPassword)) {
               throw new IllegalArgumentException("New password must be different from current password.");
          }

          user.setPassword(newPassword);
          userRepository.save(user);

          return "Password updated successfully.";
     }

     public String deleteUserAccount(Long userId) {
          User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found."));

          userRepository.delete(user);
          return "Account deleted successfully.";
     }

     public AuthResponseDto updateTwoFactorStatus(Long userId, boolean enabled) {
          User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found."));

          user.setTwoFactorEnabled(enabled);

          User updatedUser = userRepository.save(user);

          return mapToAuthResponse(
                    updatedUser,
                    enabled
                              ? "Two-factor authentication enabled successfully."
                              : "Two-factor authentication disabled successfully.");
     }

     private AuthResponseDto mapToAuthResponse(User user, String message) {
          return new AuthResponseDto(
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
                    message);
     }
}