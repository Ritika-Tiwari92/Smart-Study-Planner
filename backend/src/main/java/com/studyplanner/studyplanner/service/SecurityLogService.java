package com.studyplanner.studyplanner.service;

import com.studyplanner.studyplanner.model.SecurityLog;
import com.studyplanner.studyplanner.repository.SecurityLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class SecurityLogService {

     private final SecurityLogRepository securityLogRepository;

     public SecurityLogService(SecurityLogRepository securityLogRepository) {
          this.securityLogRepository = securityLogRepository;
     }

     /*
      * Admin: get all security logs latest first.
      */
     public List<SecurityLog> getAllLogs() {
          return securityLogRepository.findAllByOrderByCreatedAtDesc();
     }

     /*
      * Admin: filter logs by severity.
      * Example severity: INFO, SUCCESS, WARNING, CRITICAL
      */
     public List<SecurityLog> getLogsBySeverity(String severity) {
          if (isBlank(severity) || severity.equalsIgnoreCase("all")) {
               return getAllLogs();
          }

          return securityLogRepository.findBySeverityIgnoreCaseOrderByCreatedAtDesc(severity);
     }

     /*
      * Admin: filter logs by action.
      * Example action: LOGIN, LOGOUT, FAILED_LOGIN, ADMIN_ACTION
      */
     public List<SecurityLog> getLogsByAction(String action) {
          if (isBlank(action) || action.equalsIgnoreCase("all")) {
               return getAllLogs();
          }

          return securityLogRepository.findByActionIgnoreCaseOrderByCreatedAtDesc(action);
     }

     /*
      * Admin: filter logs by role.
      * Example role: ADMIN, STUDENT
      */
     public List<SecurityLog> getLogsByRole(String role) {
          if (isBlank(role) || role.equalsIgnoreCase("all")) {
               return getAllLogs();
          }

          return securityLogRepository.findByRoleIgnoreCaseOrderByCreatedAtDesc(role);
     }

     /*
      * User-specific logs if needed later.
      */
     public List<SecurityLog> getLogsByUserId(Long userId) {
          if (userId == null || userId <= 0) {
               return getAllLogs();
          }

          return securityLogRepository.findByUserIdOrderByCreatedAtDesc(userId);
     }

     /*
      * Create security log from controller/service.
      */
     @Transactional
     public SecurityLog createLog(Map<String, Object> requestBody) {
          Map<String, Object> body = safeBody(requestBody);

          String action = getString(body, "action");
          String description = getString(body, "description", "message", "detail");

          if (isBlank(action)) {
               throw new IllegalArgumentException("Security action is required.");
          }

          SecurityLog log = new SecurityLog();

          log.setUserId(getLong(body, "userId", "adminId", "studentId"));
          log.setUserName(getString(body, "userName", "adminName", "studentName", "name"));
          log.setEmail(getString(body, "email", "userEmail", "adminEmail"));
          log.setRole(normalizeRole(getString(body, "role")));
          log.setAction(normalizeAction(action));
          log.setSeverity(normalizeSeverity(getString(body, "severity")));
          log.setStatus(normalizeStatus(getString(body, "status")));
          log.setDescription(isBlank(description) ? buildDefaultDescription(action) : description);
          log.setIpAddress(getString(body, "ipAddress", "ip"));
          log.setDeviceInfo(getString(body, "deviceInfo", "device", "userAgent"));

          return securityLogRepository.save(log);
     }

     /*
      * Helper method for internal logging.
      * Later we can call this from login/logout/settings/notifications controllers.
      */
     @Transactional
     public SecurityLog createLog(
               Long userId,
               String userName,
               String email,
               String role,
               String action,
               String severity,
               String status,
               String description,
               String ipAddress,
               String deviceInfo) {
          if (isBlank(action)) {
               throw new IllegalArgumentException("Security action is required.");
          }

          SecurityLog log = new SecurityLog();

          log.setUserId(userId);
          log.setUserName(userName);
          log.setEmail(email);
          log.setRole(normalizeRole(role));
          log.setAction(normalizeAction(action));
          log.setSeverity(normalizeSeverity(severity));
          log.setStatus(normalizeStatus(status));
          log.setDescription(isBlank(description) ? buildDefaultDescription(action) : description);
          log.setIpAddress(ipAddress);
          log.setDeviceInfo(deviceInfo);

          return securityLogRepository.save(log);
     }

     /*
      * Summary for admin security logs cards.
      */
     public Map<String, Object> getSummary() {
          List<SecurityLog> logs = getAllLogs();

          long total = logs.size();

          long success = logs.stream()
                    .filter(log -> equalsAny(log.getSeverity(), "SUCCESS") || equalsAny(log.getStatus(), "SUCCESS"))
                    .count();

          long warnings = logs.stream()
                    .filter(log -> equalsAny(log.getSeverity(), "WARNING"))
                    .count();

          long critical = logs.stream()
                    .filter(log -> equalsAny(log.getSeverity(), "CRITICAL"))
                    .count();

          long failed = logs.stream()
                    .filter(log -> equalsAny(log.getStatus(), "FAILED")
                              || equalsAny(log.getAction(), "FAILED_LOGIN")
                              || equalsAny(log.getSeverity(), "CRITICAL"))
                    .count();

          long loginEvents = logs.stream()
                    .filter(log -> equalsAny(log.getAction(), "LOGIN"))
                    .count();

          long logoutEvents = logs.stream()
                    .filter(log -> equalsAny(log.getAction(), "LOGOUT"))
                    .count();

          long adminActions = logs.stream()
                    .filter(log -> equalsAny(log.getAction(), "ADMIN_ACTION", "SETTINGS_UPDATE", "NOTIFICATION_SENT"))
                    .count();

          Map<String, Object> summary = new LinkedHashMap<>();
          summary.put("total", total);
          summary.put("success", success);
          summary.put("warnings", warnings);
          summary.put("critical", critical);
          summary.put("failed", failed);
          summary.put("loginEvents", loginEvents);
          summary.put("logoutEvents", logoutEvents);
          summary.put("adminActions", adminActions);

          return summary;
     }

     private String normalizeRole(String role) {
          if (isBlank(role)) {
               return "ADMIN";
          }

          String cleaned = role.trim().toUpperCase();

          if (cleaned.equals("STUDENT")) {
               return "STUDENT";
          }

          return "ADMIN";
     }

     private String normalizeAction(String action) {
          if (isBlank(action)) {
               return "ADMIN_ACTION";
          }

          String cleaned = action.trim().toUpperCase().replace(" ", "_").replace("-", "_");

          if (cleaned.equals("LOGIN")
                    || cleaned.equals("LOGOUT")
                    || cleaned.equals("FAILED_LOGIN")
                    || cleaned.equals("ADMIN_ACTION")
                    || cleaned.equals("SETTINGS_UPDATE")
                    || cleaned.equals("NOTIFICATION_SENT")
                    || cleaned.equals("REPORT_EXPORTED")
                    || cleaned.equals("TOKEN_VALIDATED")
                    || cleaned.equals("UNAUTHORIZED_ACCESS")) {
               return cleaned;
          }

          return cleaned;
     }

     private String normalizeSeverity(String severity) {
          if (isBlank(severity)) {
               return "INFO";
          }

          String cleaned = severity.trim().toUpperCase();

          if (cleaned.equals("SUCCESS")
                    || cleaned.equals("WARNING")
                    || cleaned.equals("CRITICAL")
                    || cleaned.equals("INFO")) {
               return cleaned;
          }

          return "INFO";
     }

     private String normalizeStatus(String status) {
          if (isBlank(status)) {
               return "SUCCESS";
          }

          String cleaned = status.trim().toUpperCase();

          if (cleaned.equals("FAILED")
                    || cleaned.equals("PENDING")
                    || cleaned.equals("SUCCESS")) {
               return cleaned;
          }

          return "SUCCESS";
     }

     private String buildDefaultDescription(String action) {
          String normalizedAction = normalizeAction(action);

          if (normalizedAction.equals("LOGIN")) {
               return "User logged in successfully.";
          }

          if (normalizedAction.equals("LOGOUT")) {
               return "User logged out from the system.";
          }

          if (normalizedAction.equals("FAILED_LOGIN")) {
               return "Failed login attempt detected.";
          }

          if (normalizedAction.equals("SETTINGS_UPDATE")) {
               return "Admin settings were updated.";
          }

          if (normalizedAction.equals("NOTIFICATION_SENT")) {
               return "Admin sent a notification.";
          }

          if (normalizedAction.equals("REPORT_EXPORTED")) {
               return "Admin exported a report.";
          }

          if (normalizedAction.equals("UNAUTHORIZED_ACCESS")) {
               return "Unauthorized access attempt detected.";
          }

          return "Security event recorded.";
     }

     private boolean equalsAny(String value, String... expectedValues) {
          if (value == null) {
               return false;
          }

          for (String expected : expectedValues) {
               if (value.equalsIgnoreCase(expected)) {
                    return true;
               }
          }

          return false;
     }

     private Map<String, Object> safeBody(Map<String, Object> body) {
          if (body == null) {
               return new LinkedHashMap<>();
          }

          return body;
     }

     private String getString(Map<String, Object> body, String... keys) {
          if (body == null) {
               return null;
          }

          for (String key : keys) {
               if (body.containsKey(key) && body.get(key) != null) {
                    return String.valueOf(body.get(key));
               }
          }

          return null;
     }

     private Long getLong(Map<String, Object> body, String... keys) {
          if (body == null) {
               return null;
          }

          for (String key : keys) {
               if (!body.containsKey(key) || body.get(key) == null) {
                    continue;
               }

               Object value = body.get(key);

               if (value instanceof Number) {
                    return ((Number) value).longValue();
               }

               try {
                    return Long.parseLong(String.valueOf(value).trim());
               } catch (Exception ignored) {
               }
          }

          return null;
     }

     private boolean isBlank(String value) {
          return value == null || value.trim().isEmpty();
     }
}