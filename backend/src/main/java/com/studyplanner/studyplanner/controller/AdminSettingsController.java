package com.studyplanner.studyplanner.controller;

import com.studyplanner.studyplanner.model.AdminSettings;
import com.studyplanner.studyplanner.security.JwtUtil;
import com.studyplanner.studyplanner.service.AdminSettingsService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/settings")
@CrossOrigin(origins = "*")
public class AdminSettingsController {

     private final AdminSettingsService adminSettingsService;
     private final JwtUtil jwtUtil;

     public AdminSettingsController(AdminSettingsService adminSettingsService, JwtUtil jwtUtil) {
          this.adminSettingsService = adminSettingsService;
          this.jwtUtil = jwtUtil;
     }

     /*
      * GET /api/admin/settings
      * Fetch logged-in admin settings.
      * If settings do not exist, service creates default settings automatically.
      */
     @GetMapping
     public ResponseEntity<?> getSettings(HttpServletRequest request) {
          try {
               Long adminId = extractAdminIdFromRequest(request);
               AdminSettings settings = adminSettingsService.getOrCreateSettings(adminId, "Admin", "");
               return success("Admin settings fetched successfully.", settings);
          } catch (SecurityException ex) {
               return error(HttpStatus.UNAUTHORIZED, ex.getMessage());
          } catch (Exception ex) {
               return error(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to fetch admin settings: " + ex.getMessage());
          }
     }

     /*
      * PUT /api/admin/settings
      * Update all settings in one request.
      */
     @PutMapping
     public ResponseEntity<?> updateAllSettings(
               HttpServletRequest request,
               @RequestBody(required = false) Map<String, Object> requestBody) {
          try {
               Long adminId = extractAdminIdFromRequest(request);
               AdminSettings settings = adminSettingsService.updateAllSettings(adminId, safeBody(requestBody));
               return success("Admin settings updated successfully.", settings);
          } catch (SecurityException ex) {
               return error(HttpStatus.UNAUTHORIZED, ex.getMessage());
          } catch (IllegalArgumentException ex) {
               return error(HttpStatus.BAD_REQUEST, ex.getMessage());
          } catch (Exception ex) {
               return error(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to update admin settings: " + ex.getMessage());
          }
     }

     /*
      * PUT /api/admin/settings/profile
      * Update only profile fields:
      * adminName/name/fullName, adminEmail/email, designation, phone
      */
     @PutMapping("/profile")
     public ResponseEntity<?> updateProfileSettings(
               HttpServletRequest request,
               @RequestBody(required = false) Map<String, Object> requestBody) {
          try {
               Long adminId = extractAdminIdFromRequest(request);
               AdminSettings settings = adminSettingsService.updateProfileSettings(adminId, safeBody(requestBody));
               return success("Admin profile settings updated successfully.", settings);
          } catch (SecurityException ex) {
               return error(HttpStatus.UNAUTHORIZED, ex.getMessage());
          } catch (IllegalArgumentException ex) {
               return error(HttpStatus.BAD_REQUEST, ex.getMessage());
          } catch (Exception ex) {
               return error(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to update profile settings: " + ex.getMessage());
          }
     }

     /*
      * PUT /api/admin/settings/platform
      * Update platform preference fields:
      * allowStudentRegistration, enableAssistant, enablePomodoro, autoSubmitTests
      */
     @PutMapping("/platform")
     public ResponseEntity<?> updatePlatformSettings(
               HttpServletRequest request,
               @RequestBody(required = false) Map<String, Object> requestBody) {
          try {
               Long adminId = extractAdminIdFromRequest(request);
               AdminSettings settings = adminSettingsService.updatePlatformSettings(adminId, safeBody(requestBody));
               return success("Platform settings updated successfully.", settings);
          } catch (SecurityException ex) {
               return error(HttpStatus.UNAUTHORIZED, ex.getMessage());
          } catch (IllegalArgumentException ex) {
               return error(HttpStatus.BAD_REQUEST, ex.getMessage());
          } catch (Exception ex) {
               return error(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to update platform settings: " + ex.getMessage());
          }
     }

     /*
      * PUT /api/admin/settings/security
      * Update security preference fields:
      * twoFactorEnabled, defaultTheme/theme
      */
     @PutMapping("/security")
     public ResponseEntity<?> updateSecuritySettings(
               HttpServletRequest request,
               @RequestBody(required = false) Map<String, Object> requestBody) {
          try {
               Long adminId = extractAdminIdFromRequest(request);
               AdminSettings settings = adminSettingsService.updateSecuritySettings(adminId, safeBody(requestBody));
               return success("Security settings updated successfully.", settings);
          } catch (SecurityException ex) {
               return error(HttpStatus.UNAUTHORIZED, ex.getMessage());
          } catch (IllegalArgumentException ex) {
               return error(HttpStatus.BAD_REQUEST, ex.getMessage());
          } catch (Exception ex) {
               return error(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to update security settings: " + ex.getMessage());
          }
     }

     /*
      * PUT /api/admin/settings/notifications
      * Update notification preference fields:
      * newStudentAlert, testSubmissionAlert, lowActivityAlert, securityAlert
      */
     @PutMapping("/notifications")
     public ResponseEntity<?> updateNotificationSettings(
               HttpServletRequest request,
               @RequestBody(required = false) Map<String, Object> requestBody) {
          try {
               Long adminId = extractAdminIdFromRequest(request);
               AdminSettings settings = adminSettingsService.updateNotificationSettings(adminId, safeBody(requestBody));
               return success("Notification settings updated successfully.", settings);
          } catch (SecurityException ex) {
               return error(HttpStatus.UNAUTHORIZED, ex.getMessage());
          } catch (IllegalArgumentException ex) {
               return error(HttpStatus.BAD_REQUEST, ex.getMessage());
          } catch (Exception ex) {
               return error(HttpStatus.INTERNAL_SERVER_ERROR,
                         "Failed to update notification settings: " + ex.getMessage());
          }
     }

     /*
      * PUT /api/admin/settings/branding
      * Update branding/theme UI fields:
      * compactSidebar, animatedLogo, defaultTheme/theme
      */
     @PutMapping("/branding")
     public ResponseEntity<?> updateBrandingSettings(
               HttpServletRequest request,
               @RequestBody(required = false) Map<String, Object> requestBody) {
          try {
               Long adminId = extractAdminIdFromRequest(request);

               Map<String, Object> body = safeBody(requestBody);

               /*
                * Theme is technically a security/platform preference in service,
                * so update security first if theme/defaultTheme is present.
                */
               if (body.containsKey("theme") || body.containsKey("defaultTheme")) {
                    adminSettingsService.updateSecuritySettings(adminId, body);
               }

               AdminSettings settings = adminSettingsService.updateBrandingSettings(adminId, body);
               return success("Branding settings updated successfully.", settings);
          } catch (SecurityException ex) {
               return error(HttpStatus.UNAUTHORIZED, ex.getMessage());
          } catch (IllegalArgumentException ex) {
               return error(HttpStatus.BAD_REQUEST, ex.getMessage());
          } catch (Exception ex) {
               return error(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to update branding settings: " + ex.getMessage());
          }
     }

     /*
      * POST /api/admin/settings/change-password
      *
      * This endpoint is intentionally not fully implemented yet.
      * Reason:
      * Real password update needs your current User.java, UserRepository.java,
      * and PasswordEncoder setup. We will add it safely in the next backend step.
      */
     @PostMapping("/change-password")
     public ResponseEntity<?> changePassword(
               HttpServletRequest request,
               @RequestBody(required = false) Map<String, Object> requestBody) {
          try {
               extractAdminIdFromRequest(request);

               Map<String, Object> body = safeBody(requestBody);
               String currentPassword = getString(body, "currentPassword");
               String newPassword = getString(body, "newPassword");
               String confirmPassword = getString(body, "confirmPassword");

               if (isBlank(currentPassword) || isBlank(newPassword) || isBlank(confirmPassword)) {
                    return error(HttpStatus.BAD_REQUEST,
                              "Current password, new password and confirm password are required.");
               }

               if (!newPassword.equals(confirmPassword)) {
                    return error(HttpStatus.BAD_REQUEST, "New password and confirm password do not match.");
               }

               if (!isStrongPassword(newPassword)) {
                    return error(HttpStatus.BAD_REQUEST,
                              "Password must contain at least 8 characters, uppercase, lowercase, number and symbol.");
               }

               return error(
                         HttpStatus.NOT_IMPLEMENTED,
                         "Password validation passed, but real password update is not connected yet. Next step needs User.java and UserRepository.java.");

          } catch (SecurityException ex) {
               return error(HttpStatus.UNAUTHORIZED, ex.getMessage());
          } catch (Exception ex) {
               return error(HttpStatus.INTERNAL_SERVER_ERROR, "Password change failed: " + ex.getMessage());
          }
     }

     private Long extractAdminIdFromRequest(HttpServletRequest request) {
          String authHeader = request.getHeader("Authorization");

          if (authHeader == null || authHeader.trim().isEmpty()) {
               throw new SecurityException("Authorization header is missing.");
          }

          if (!authHeader.startsWith("Bearer ")) {
               throw new SecurityException("Invalid authorization header. Bearer token is required.");
          }

          String token = authHeader.substring(7).trim();

          if (token.isEmpty()) {
               throw new SecurityException("JWT token is missing.");
          }

          try {
               /*
                * This assumes your JwtUtil has extractUserId(token).
                * Your project already used JWT userId extraction in earlier modules.
                */
               return Long.valueOf(String.valueOf(jwtUtil.extractUserId(token)));
          } catch (Exception ex) {
               throw new SecurityException("Unable to extract admin id from token.");
          }
     }

     private Map<String, Object> safeBody(Map<String, Object> requestBody) {
          if (requestBody == null) {
               return new LinkedHashMap<>();
          }
          return requestBody;
     }

     private ResponseEntity<Map<String, Object>> success(String message, AdminSettings settings) {
          Map<String, Object> response = new LinkedHashMap<>();
          response.put("success", true);
          response.put("message", message);
          response.put("settings", settings);
          return ResponseEntity.ok(response);
     }

     private ResponseEntity<Map<String, Object>> error(HttpStatus status, String message) {
          Map<String, Object> response = new LinkedHashMap<>();
          response.put("success", false);
          response.put("message", message);
          response.put("status", status.value());
          return ResponseEntity.status(status).body(response);
     }

     private String getString(Map<String, Object> body, String key) {
          if (body == null || !body.containsKey(key) || body.get(key) == null) {
               return null;
          }
          return String.valueOf(body.get(key)).trim();
     }

     private boolean isBlank(String value) {
          return value == null || value.trim().isEmpty();
     }

     private boolean isStrongPassword(String password) {
          if (password == null) {
               return false;
          }

          return password.length() >= 8
                    && password.matches(".*[A-Z].*")
                    && password.matches(".*[a-z].*")
                    && password.matches(".*[0-9].*")
                    && password.matches(".*[^A-Za-z0-9].*");
     }
}