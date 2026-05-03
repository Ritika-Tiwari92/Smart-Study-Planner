package com.studyplanner.studyplanner.controller;

import com.studyplanner.studyplanner.model.SecurityLog;
import com.studyplanner.studyplanner.security.JwtUtil;
import com.studyplanner.studyplanner.service.SecurityLogService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
public class SecurityLogController {

     private final SecurityLogService securityLogService;
     private final JwtUtil jwtUtil;

     public SecurityLogController(SecurityLogService securityLogService, JwtUtil jwtUtil) {
          this.securityLogService = securityLogService;
          this.jwtUtil = jwtUtil;
     }

     /*
      * Admin: Get security logs.
      *
      * Supported examples:
      * GET /api/admin/security-logs
      * GET /api/admin/security-logs?severity=SUCCESS
      * GET /api/admin/security-logs?action=LOGIN
      * GET /api/admin/security-logs?role=ADMIN
      */
     @GetMapping("/api/admin/security-logs")
     public ResponseEntity<?> getSecurityLogs(
               HttpServletRequest request,
               @RequestParam(required = false) String severity,
               @RequestParam(required = false) String action,
               @RequestParam(required = false) String role) {
          try {
               extractUserIdFromRequest(request);

               List<SecurityLog> logs;

               if (severity != null && !severity.trim().isEmpty() && !"all".equalsIgnoreCase(severity)) {
                    logs = securityLogService.getLogsBySeverity(severity);
               } else if (action != null && !action.trim().isEmpty() && !"all".equalsIgnoreCase(action)) {
                    logs = securityLogService.getLogsByAction(action);
               } else if (role != null && !role.trim().isEmpty() && !"all".equalsIgnoreCase(role)) {
                    logs = securityLogService.getLogsByRole(role);
               } else {
                    logs = securityLogService.getAllLogs();
               }

               Map<String, Object> response = new LinkedHashMap<>();
               response.put("success", true);
               response.put("message", "Security logs fetched successfully.");
               response.put("logs", logs);
               response.put("total", logs.size());

               return ResponseEntity.ok(response);

          } catch (SecurityException ex) {
               return error(HttpStatus.UNAUTHORIZED, ex.getMessage());
          } catch (Exception ex) {
               return error(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to fetch security logs: " + ex.getMessage());
          }
     }

     /*
      * Admin: Summary cards for Security Logs page.
      *
      * GET /api/admin/security-logs/summary
      */
     @GetMapping("/api/admin/security-logs/summary")
     public ResponseEntity<?> getSecurityLogSummary(HttpServletRequest request) {
          try {
               extractUserIdFromRequest(request);

               Map<String, Object> summary = securityLogService.getSummary();

               Map<String, Object> response = new LinkedHashMap<>();
               response.put("success", true);
               response.put("message", "Security log summary fetched successfully.");
               response.put("summary", summary);

               return ResponseEntity.ok(response);

          } catch (SecurityException ex) {
               return error(HttpStatus.UNAUTHORIZED, ex.getMessage());
          } catch (Exception ex) {
               return error(HttpStatus.INTERNAL_SERVER_ERROR,
                         "Failed to fetch security log summary: " + ex.getMessage());
          }
     }

     /*
      * Admin/Internal: Create security log.
      *
      * POST /api/admin/security-logs
      *
      * Body example:
      * {
      * "userId": 1,
      * "userName": "Ritika Admin",
      * "email": "ritika@example.com",
      * "role": "ADMIN",
      * "action": "LOGIN",
      * "severity": "SUCCESS",
      * "status": "SUCCESS",
      * "description": "Admin logged in successfully."
      * }
      */
     @PostMapping("/api/admin/security-logs")
     public ResponseEntity<?> createSecurityLog(
               HttpServletRequest request,
               @RequestBody(required = false) Map<String, Object> requestBody) {
          try {
               Long currentAdminId = extractUserIdFromRequest(request);

               Map<String, Object> body = safeBody(requestBody);

               if (!body.containsKey("userId") || body.get("userId") == null) {
                    body.put("userId", currentAdminId);
               }

               if (!body.containsKey("role") || body.get("role") == null) {
                    body.put("role", "ADMIN");
               }

               if (!body.containsKey("ipAddress") || body.get("ipAddress") == null) {
                    body.put("ipAddress", getClientIp(request));
               }

               if (!body.containsKey("deviceInfo") || body.get("deviceInfo") == null) {
                    body.put("deviceInfo", getDeviceInfo(request));
               }

               SecurityLog log = securityLogService.createLog(body);

               Map<String, Object> response = new LinkedHashMap<>();
               response.put("success", true);
               response.put("message", "Security log created successfully.");
               response.put("id", log.getId());
               response.put("log", log);

               return ResponseEntity.status(HttpStatus.CREATED).body(response);

          } catch (SecurityException ex) {
               return error(HttpStatus.UNAUTHORIZED, ex.getMessage());
          } catch (IllegalArgumentException ex) {
               return error(HttpStatus.BAD_REQUEST, ex.getMessage());
          } catch (Exception ex) {
               return error(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to create security log: " + ex.getMessage());
          }
     }

     /*
      * Current user/admin logs if needed later.
      *
      * GET /api/admin/security-logs/my
      */
     @GetMapping("/api/admin/security-logs/my")
     public ResponseEntity<?> getMySecurityLogs(HttpServletRequest request) {
          try {
               Long userId = extractUserIdFromRequest(request);

               List<SecurityLog> logs = securityLogService.getLogsByUserId(userId);

               Map<String, Object> response = new LinkedHashMap<>();
               response.put("success", true);
               response.put("message", "My security logs fetched successfully.");
               response.put("logs", logs);
               response.put("total", logs.size());

               return ResponseEntity.ok(response);

          } catch (SecurityException ex) {
               return error(HttpStatus.UNAUTHORIZED, ex.getMessage());
          } catch (Exception ex) {
               return error(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to fetch my security logs: " + ex.getMessage());
          }
     }

     private Long extractUserIdFromRequest(HttpServletRequest request) {
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
               return Long.valueOf(String.valueOf(jwtUtil.extractUserId(token)));
          } catch (Exception ex) {
               throw new SecurityException("Unable to extract user id from token.");
          }
     }

     private Map<String, Object> safeBody(Map<String, Object> requestBody) {
          if (requestBody == null) {
               return new LinkedHashMap<>();
          }

          return new LinkedHashMap<>(requestBody);
     }

     private String getClientIp(HttpServletRequest request) {
          String forwardedFor = request.getHeader("X-Forwarded-For");

          if (forwardedFor != null && !forwardedFor.trim().isEmpty()) {
               return forwardedFor.split(",")[0].trim();
          }

          String realIp = request.getHeader("X-Real-IP");

          if (realIp != null && !realIp.trim().isEmpty()) {
               return realIp.trim();
          }

          return request.getRemoteAddr();
     }

     private String getDeviceInfo(HttpServletRequest request) {
          String userAgent = request.getHeader("User-Agent");

          if (userAgent == null || userAgent.trim().isEmpty()) {
               return "Unknown Device";
          }

          if (userAgent.length() > 240) {
               return userAgent.substring(0, 240);
          }

          return userAgent;
     }

     private ResponseEntity<Map<String, Object>> error(HttpStatus status, String message) {
          Map<String, Object> response = new LinkedHashMap<>();
          response.put("success", false);
          response.put("message", message);
          response.put("status", status.value());

          return ResponseEntity.status(status).body(response);
     }
}