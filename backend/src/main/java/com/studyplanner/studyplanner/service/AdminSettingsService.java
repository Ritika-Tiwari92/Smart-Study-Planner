package com.studyplanner.studyplanner.service;

import com.studyplanner.studyplanner.model.AdminSettings;
import com.studyplanner.studyplanner.repository.AdminSettingsRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
public class AdminSettingsService {

     private final AdminSettingsRepository adminSettingsRepository;

     public AdminSettingsService(AdminSettingsRepository adminSettingsRepository) {
          this.adminSettingsRepository = adminSettingsRepository;
     }

     /**
      * Fetch settings for logged-in admin.
      * If settings do not exist, create default settings automatically.
      */
     @Transactional
     public AdminSettings getOrCreateSettings(Long adminId, String adminName, String adminEmail) {
          validateAdminId(adminId);

          return adminSettingsRepository.findByAdminId(adminId)
                    .orElseGet(() -> {
                         AdminSettings settings = new AdminSettings();
                         settings.setAdminId(adminId);
                         settings.setAdminName(safeText(adminName, "Admin"));
                         settings.setAdminEmail(safeText(adminEmail, ""));
                         settings.setDesignation("System Administrator");
                         settings.setPhone("");

                         settings.setAllowStudentRegistration(true);
                         settings.setEnableAssistant(true);
                         settings.setEnablePomodoro(true);
                         settings.setAutoSubmitTests(true);

                         settings.setNewStudentAlert(true);
                         settings.setTestSubmissionAlert(true);
                         settings.setLowActivityAlert(true);
                         settings.setSecurityAlert(true);

                         settings.setTwoFactorEnabled(false);
                         settings.setDefaultTheme("dark");
                         settings.setCompactSidebar(false);
                         settings.setAnimatedLogo(true);

                         return adminSettingsRepository.save(settings);
                    });
     }

     /**
      * Update all settings in one request.
      * This will be useful for PUT /api/admin/settings.
      */
     @Transactional
     public AdminSettings updateAllSettings(Long adminId, Map<String, Object> requestBody) {
          AdminSettings settings = getOrCreateSettings(adminId, null, null);

          applyProfileFields(settings, requestBody);
          applyPlatformFields(settings, requestBody);
          applyNotificationFields(settings, requestBody);
          applySecurityFields(settings, requestBody);
          applyBrandingFields(settings, requestBody);

          return adminSettingsRepository.save(settings);
     }

     /**
      * Update only admin profile section.
      */
     @Transactional
     public AdminSettings updateProfileSettings(Long adminId, Map<String, Object> requestBody) {
          AdminSettings settings = getOrCreateSettings(adminId, null, null);
          applyProfileFields(settings, requestBody);
          return adminSettingsRepository.save(settings);
     }

     /**
      * Update platform preference section.
      */
     @Transactional
     public AdminSettings updatePlatformSettings(Long adminId, Map<String, Object> requestBody) {
          AdminSettings settings = getOrCreateSettings(adminId, null, null);
          applyPlatformFields(settings, requestBody);
          return adminSettingsRepository.save(settings);
     }

     /**
      * Update notification preference section.
      */
     @Transactional
     public AdminSettings updateNotificationSettings(Long adminId, Map<String, Object> requestBody) {
          AdminSettings settings = getOrCreateSettings(adminId, null, null);
          applyNotificationFields(settings, requestBody);
          return adminSettingsRepository.save(settings);
     }

     /**
      * Update security preference section.
      * Real password update will be handled separately after checking your User
      * entity/UserRepository.
      */
     @Transactional
     public AdminSettings updateSecuritySettings(Long adminId, Map<String, Object> requestBody) {
          AdminSettings settings = getOrCreateSettings(adminId, null, null);
          applySecurityFields(settings, requestBody);
          return adminSettingsRepository.save(settings);
     }

     /**
      * Update theme and branding preference section.
      */
     @Transactional
     public AdminSettings updateBrandingSettings(Long adminId, Map<String, Object> requestBody) {
          AdminSettings settings = getOrCreateSettings(adminId, null, null);
          applyBrandingFields(settings, requestBody);
          return adminSettingsRepository.save(settings);
     }

     private void applyProfileFields(AdminSettings settings, Map<String, Object> body) {
          if (body == null) {
               return;
          }

          String adminName = getString(body, "adminName", "name", "fullName");
          if (adminName != null) {
               if (adminName.trim().isEmpty()) {
                    throw new IllegalArgumentException("Admin name cannot be empty.");
               }
               settings.setAdminName(adminName.trim());
          }

          String adminEmail = getString(body, "adminEmail", "email");
          if (adminEmail != null) {
               String cleanedEmail = adminEmail.trim();
               if (!cleanedEmail.isEmpty() && !isValidEmail(cleanedEmail)) {
                    throw new IllegalArgumentException("Please enter a valid email address.");
               }
               settings.setAdminEmail(cleanedEmail);
          }

          String designation = getString(body, "designation");
          if (designation != null) {
               settings.setDesignation(safeText(designation, "System Administrator"));
          }

          String phone = getString(body, "phone", "contact", "contactNumber");
          if (phone != null) {
               settings.setPhone(phone.trim());
          }
     }

     private void applyPlatformFields(AdminSettings settings, Map<String, Object> body) {
          if (body == null) {
               return;
          }

          Boolean allowStudentRegistration = getBoolean(body, "allowStudentRegistration");
          if (allowStudentRegistration != null) {
               settings.setAllowStudentRegistration(allowStudentRegistration);
          }

          Boolean enableAssistant = getBoolean(body, "enableAssistant", "assistantEnabled");
          if (enableAssistant != null) {
               settings.setEnableAssistant(enableAssistant);
          }

          Boolean enablePomodoro = getBoolean(body, "enablePomodoro", "pomodoroEnabled");
          if (enablePomodoro != null) {
               settings.setEnablePomodoro(enablePomodoro);
          }

          Boolean autoSubmitTests = getBoolean(body, "autoSubmitTests", "testAutoSubmit");
          if (autoSubmitTests != null) {
               settings.setAutoSubmitTests(autoSubmitTests);
          }
     }

     private void applyNotificationFields(AdminSettings settings, Map<String, Object> body) {
          if (body == null) {
               return;
          }

          Boolean newStudentAlert = getBoolean(body, "newStudentAlert");
          if (newStudentAlert != null) {
               settings.setNewStudentAlert(newStudentAlert);
          }

          Boolean testSubmissionAlert = getBoolean(body, "testSubmissionAlert");
          if (testSubmissionAlert != null) {
               settings.setTestSubmissionAlert(testSubmissionAlert);
          }

          Boolean lowActivityAlert = getBoolean(body, "lowActivityAlert");
          if (lowActivityAlert != null) {
               settings.setLowActivityAlert(lowActivityAlert);
          }

          Boolean securityAlert = getBoolean(body, "securityAlert");
          if (securityAlert != null) {
               settings.setSecurityAlert(securityAlert);
          }
     }

     private void applySecurityFields(AdminSettings settings, Map<String, Object> body) {
          if (body == null) {
               return;
          }

          Boolean twoFactorEnabled = getBoolean(body, "twoFactorEnabled", "enableTwoFactor");
          if (twoFactorEnabled != null) {
               settings.setTwoFactorEnabled(twoFactorEnabled);
          }

          String defaultTheme = getString(body, "defaultTheme", "theme");
          if (defaultTheme != null) {
               String cleanedTheme = defaultTheme.trim().toLowerCase();

               if (!cleanedTheme.equals("dark") && !cleanedTheme.equals("light")) {
                    throw new IllegalArgumentException("Theme must be either dark or light.");
               }

               settings.setDefaultTheme(cleanedTheme);
          }
     }

     private void applyBrandingFields(AdminSettings settings, Map<String, Object> body) {
          if (body == null) {
               return;
          }

          Boolean compactSidebar = getBoolean(body, "compactSidebar", "sidebarCollapsed");
          if (compactSidebar != null) {
               settings.setCompactSidebar(compactSidebar);
          }

          Boolean animatedLogo = getBoolean(body, "animatedLogo");
          if (animatedLogo != null) {
               settings.setAnimatedLogo(animatedLogo);
          }
     }

     private String getString(Map<String, Object> body, String... keys) {
          for (String key : keys) {
               if (body.containsKey(key) && body.get(key) != null) {
                    return String.valueOf(body.get(key));
               }
          }
          return null;
     }

     private Boolean getBoolean(Map<String, Object> body, String... keys) {
          for (String key : keys) {
               if (!body.containsKey(key) || body.get(key) == null) {
                    continue;
               }

               Object value = body.get(key);

               if (value instanceof Boolean) {
                    return (Boolean) value;
               }

               if (value instanceof String) {
                    String text = ((String) value).trim().toLowerCase();

                    if (text.equals("true") || text.equals("yes") || text.equals("1")) {
                         return true;
                    }

                    if (text.equals("false") || text.equals("no") || text.equals("0")) {
                         return false;
                    }
               }

               if (value instanceof Number) {
                    return ((Number) value).intValue() == 1;
               }
          }

          return null;
     }

     private String safeText(String value, String fallback) {
          if (value == null || value.trim().isEmpty()) {
               return fallback;
          }
          return value.trim();
     }

     private void validateAdminId(Long adminId) {
          if (adminId == null || adminId <= 0) {
               throw new IllegalArgumentException("Valid admin id is required.");
          }
     }

     private boolean isValidEmail(String email) {
          return email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
     }
}