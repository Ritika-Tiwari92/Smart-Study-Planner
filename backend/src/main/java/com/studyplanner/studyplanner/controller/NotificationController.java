package com.studyplanner.studyplanner.controller;

import com.studyplanner.studyplanner.model.Notification;
import com.studyplanner.studyplanner.security.JwtUtil;
import com.studyplanner.studyplanner.service.NotificationService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
public class NotificationController {

     private final NotificationService notificationService;
     private final JwtUtil jwtUtil;

     public NotificationController(NotificationService notificationService, JwtUtil jwtUtil) {
          this.notificationService = notificationService;
          this.jwtUtil = jwtUtil;
     }

     /*
      * Admin: Get all notifications.
      * Frontend page calls:
      * GET /api/admin/notifications
      */
     @GetMapping("/api/admin/notifications")
     public ResponseEntity<?> getAdminNotifications(HttpServletRequest request) {
          try {
               extractUserIdFromRequest(request);

               List<Notification> notifications = notificationService.getAllNotifications();

               Map<String, Object> response = new LinkedHashMap<>();
               response.put("success", true);
               response.put("message", "Notifications fetched successfully.");
               response.put("notifications", notifications);
               response.put("total", notifications.size());

               return ResponseEntity.ok(response);
          } catch (SecurityException ex) {
               return error(HttpStatus.UNAUTHORIZED, ex.getMessage());
          } catch (Exception ex) {
               return error(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to fetch notifications: " + ex.getMessage());
          }
     }

     /*
      * Admin: Notification summary for cards.
      * GET /api/admin/notifications/summary
      */
     @GetMapping("/api/admin/notifications/summary")
     public ResponseEntity<?> getNotificationSummary(HttpServletRequest request) {
          try {
               extractUserIdFromRequest(request);

               Map<String, Object> summary = notificationService.getNotificationSummary();

               Map<String, Object> response = new LinkedHashMap<>();
               response.put("success", true);
               response.put("message", "Notification summary fetched successfully.");
               response.put("summary", summary);

               return ResponseEntity.ok(response);
          } catch (SecurityException ex) {
               return error(HttpStatus.UNAUTHORIZED, ex.getMessage());
          } catch (Exception ex) {
               return error(HttpStatus.INTERNAL_SERVER_ERROR,
                         "Failed to fetch notification summary: " + ex.getMessage());
          }
     }

     /*
      * Admin: Create/send notification.
      * POST /api/admin/notifications
      */
     @PostMapping("/api/admin/notifications")
     public ResponseEntity<?> createNotification(
               HttpServletRequest request,
               @RequestBody(required = false) Map<String, Object> requestBody) {
          try {
               Long adminId = extractUserIdFromRequest(request);

               Notification notification = notificationService.createNotification(adminId, safeBody(requestBody));

               Map<String, Object> response = new LinkedHashMap<>();
               response.put("success", true);
               response.put("message", "Notification sent successfully.");
               response.put("id", notification.getId());
               response.put("notification", notification);

               return ResponseEntity.status(HttpStatus.CREATED).body(response);
          } catch (SecurityException ex) {
               return error(HttpStatus.UNAUTHORIZED, ex.getMessage());
          } catch (IllegalArgumentException ex) {
               return error(HttpStatus.BAD_REQUEST, ex.getMessage());
          } catch (Exception ex) {
               return error(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to send notification: " + ex.getMessage());
          }
     }

     /*
      * Admin: Update notification.
      * PUT /api/admin/notifications/{id}
      */
     @PutMapping("/api/admin/notifications/{id}")
     public ResponseEntity<?> updateNotification(
               HttpServletRequest request,
               @PathVariable Long id,
               @RequestBody(required = false) Map<String, Object> requestBody) {
          try {
               extractUserIdFromRequest(request);

               Notification notification = notificationService.updateNotification(id, safeBody(requestBody));

               Map<String, Object> response = new LinkedHashMap<>();
               response.put("success", true);
               response.put("message", "Notification updated successfully.");
               response.put("id", notification.getId());
               response.put("notification", notification);

               return ResponseEntity.ok(response);
          } catch (SecurityException ex) {
               return error(HttpStatus.UNAUTHORIZED, ex.getMessage());
          } catch (IllegalArgumentException ex) {
               return error(HttpStatus.BAD_REQUEST, ex.getMessage());
          } catch (Exception ex) {
               return error(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to update notification: " + ex.getMessage());
          }
     }

     /*
      * Admin: Delete notification.
      * DELETE /api/admin/notifications/{id}
      */
     @DeleteMapping("/api/admin/notifications/{id}")
     public ResponseEntity<?> deleteNotification(
               HttpServletRequest request,
               @PathVariable Long id) {
          try {
               extractUserIdFromRequest(request);

               notificationService.deleteNotification(id);

               Map<String, Object> response = new LinkedHashMap<>();
               response.put("success", true);
               response.put("message", "Notification deleted successfully.");
               response.put("deletedId", id);

               return ResponseEntity.ok(response);
          } catch (SecurityException ex) {
               return error(HttpStatus.UNAUTHORIZED, ex.getMessage());
          } catch (IllegalArgumentException ex) {
               return error(HttpStatus.BAD_REQUEST, ex.getMessage());
          } catch (Exception ex) {
               return error(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to delete notification: " + ex.getMessage());
          }
     }

     /*
      * Student: Get logged-in student's notifications.
      * GET /api/notifications/my
      *
      * This returns:
      * 1. notifications sent to all students
      * 2. notifications sent specifically to logged-in student
      */
     @GetMapping("/api/notifications/my")
     public ResponseEntity<?> getMyNotifications(HttpServletRequest request) {
          try {
               Long studentId = extractUserIdFromRequest(request);

               List<Notification> notifications = notificationService.getNotificationsForStudent(studentId);

               Map<String, Object> response = new LinkedHashMap<>();
               response.put("success", true);
               response.put("message", "Student notifications fetched successfully.");
               response.put("notifications", notifications);
               response.put("total", notifications.size());

               return ResponseEntity.ok(response);
          } catch (SecurityException ex) {
               return error(HttpStatus.UNAUTHORIZED, ex.getMessage());
          } catch (Exception ex) {
               return error(HttpStatus.INTERNAL_SERVER_ERROR,
                         "Failed to fetch student notifications: " + ex.getMessage());
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

          return requestBody;
     }

     private ResponseEntity<Map<String, Object>> error(HttpStatus status, String message) {
          Map<String, Object> response = new LinkedHashMap<>();
          response.put("success", false);
          response.put("message", message);
          response.put("status", status.value());

          return ResponseEntity.status(status).body(response);
     }
}