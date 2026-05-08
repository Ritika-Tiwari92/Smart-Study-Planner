package com.studyplanner.studyplanner.controller;

import com.studyplanner.studyplanner.dto.CreateNotificationRequestDto;
import com.studyplanner.studyplanner.dto.NotificationResponseDto;
import com.studyplanner.studyplanner.dto.NotificationSummaryDto;
import com.studyplanner.studyplanner.model.Notification;
import com.studyplanner.studyplanner.security.JwtUtil;
import com.studyplanner.studyplanner.service.AppNotificationService;
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
     private final AppNotificationService appNotificationService;
     private final JwtUtil jwtUtil;

     public NotificationController(NotificationService notificationService,
               AppNotificationService appNotificationService, JwtUtil jwtUtil) {
          this.notificationService = notificationService;
          this.appNotificationService = appNotificationService;
          this.jwtUtil = jwtUtil;
     }

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

     @PostMapping("/api/admin/notifications")
     public ResponseEntity<?> createNotification(HttpServletRequest request,
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

     @PutMapping("/api/admin/notifications/{id}")
     public ResponseEntity<?> updateNotification(HttpServletRequest request, @PathVariable Long id,
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

     @DeleteMapping("/api/admin/notifications/{id}")
     public ResponseEntity<?> deleteNotification(HttpServletRequest request, @PathVariable Long id) {
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

     @GetMapping("/api/notifications/my")
     public ResponseEntity<?> getMyNotifications(HttpServletRequest request) {
          try {
               Long studentId = extractUserIdFromRequest(request);
               List<NotificationResponseDto> notifications = appNotificationService.getStudentNotifications(studentId);
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

     @GetMapping("/api/notifications/my/unread")
     public ResponseEntity<?> getMyUnreadNotifications(HttpServletRequest request) {
          try {
               Long studentId = extractUserIdFromRequest(request);
               List<NotificationResponseDto> notifications = appNotificationService
                         .getStudentUnreadNotifications(studentId);
               Map<String, Object> response = new LinkedHashMap<>();
               response.put("success", true);
               response.put("message", "Unread notifications fetched successfully.");
               response.put("notifications", notifications);
               response.put("total", notifications.size());
               return ResponseEntity.ok(response);
          } catch (SecurityException ex) {
               return error(HttpStatus.UNAUTHORIZED, ex.getMessage());
          } catch (Exception ex) {
               return error(HttpStatus.INTERNAL_SERVER_ERROR,
                         "Failed to fetch unread notifications: " + ex.getMessage());
          }
     }

     @GetMapping("/api/notifications/my/summary")
     public ResponseEntity<?> getMyNotificationSummary(HttpServletRequest request) {
          try {
               Long studentId = extractUserIdFromRequest(request);
               NotificationSummaryDto summary = appNotificationService.getStudentSummary(studentId);
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

     @GetMapping("/api/notifications/my/unread-count")
     public ResponseEntity<?> getMyUnreadCount(HttpServletRequest request) {
          try {
               Long studentId = extractUserIdFromRequest(request);
               long unreadCount = appNotificationService.getStudentUnreadCount(studentId);
               Map<String, Object> response = new LinkedHashMap<>();
               response.put("success", true);
               response.put("unreadCount", unreadCount);
               return ResponseEntity.ok(response);
          } catch (SecurityException ex) {
               return error(HttpStatus.UNAUTHORIZED, ex.getMessage());
          } catch (Exception ex) {
               return error(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to fetch unread count: " + ex.getMessage());
          }
     }

     @PutMapping("/api/notifications/my/{notificationId}/read")
     public ResponseEntity<?> markMyNotificationAsRead(HttpServletRequest request, @PathVariable Long notificationId) {
          try {
               Long studentId = extractUserIdFromRequest(request);
               NotificationResponseDto notification = appNotificationService.markStudentNotificationAsRead(studentId,
                         notificationId);
               Map<String, Object> response = new LinkedHashMap<>();
               response.put("success", true);
               response.put("message", "Notification marked as read.");
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

     @PutMapping("/api/notifications/my/read-all")
     public ResponseEntity<?> markAllMyNotificationsAsRead(HttpServletRequest request) {
          try {
               Long studentId = extractUserIdFromRequest(request);
               appNotificationService.markAllStudentNotificationsAsRead(studentId);
               Map<String, Object> response = new LinkedHashMap<>();
               response.put("success", true);
               response.put("message", "All notifications marked as read.");
               return ResponseEntity.ok(response);
          } catch (SecurityException ex) {
               return error(HttpStatus.UNAUTHORIZED, ex.getMessage());
          } catch (Exception ex) {
               return error(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to update notifications: " + ex.getMessage());
          }
     }

     @DeleteMapping("/api/notifications/my/{notificationId}")
     public ResponseEntity<?> deleteMyNotification(HttpServletRequest request, @PathVariable Long notificationId) {
          try {
               Long studentId = extractUserIdFromRequest(request);
               appNotificationService.deleteStudentNotification(studentId, notificationId);
               Map<String, Object> response = new LinkedHashMap<>();
               response.put("success", true);
               response.put("message", "Notification deleted successfully.");
               response.put("deletedId", notificationId);
               return ResponseEntity.ok(response);
          } catch (SecurityException ex) {
               return error(HttpStatus.UNAUTHORIZED, ex.getMessage());
          } catch (IllegalArgumentException ex) {
               return error(HttpStatus.BAD_REQUEST, ex.getMessage());
          } catch (Exception ex) {
               return error(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to delete notification: " + ex.getMessage());
          }
     }

     @GetMapping("/api/notifications/admin")
     public ResponseEntity<?> getAppAdminNotifications(HttpServletRequest request) {
          try {
               extractUserIdFromRequest(request);
               List<NotificationResponseDto> notifications = appNotificationService.getAdminNotifications();
               Map<String, Object> response = new LinkedHashMap<>();
               response.put("success", true);
               response.put("message", "Admin notifications fetched successfully.");
               response.put("notifications", notifications);
               response.put("total", notifications.size());
               return ResponseEntity.ok(response);
          } catch (SecurityException ex) {
               return error(HttpStatus.UNAUTHORIZED, ex.getMessage());
          } catch (Exception ex) {
               return error(HttpStatus.INTERNAL_SERVER_ERROR,
                         "Failed to fetch admin notifications: " + ex.getMessage());
          }
     }

     @GetMapping("/api/notifications/admin/unread")
     public ResponseEntity<?> getAppAdminUnreadNotifications(HttpServletRequest request) {
          try {
               extractUserIdFromRequest(request);
               List<NotificationResponseDto> notifications = appNotificationService.getAdminUnreadNotifications();
               Map<String, Object> response = new LinkedHashMap<>();
               response.put("success", true);
               response.put("message", "Admin unread notifications fetched successfully.");
               response.put("notifications", notifications);
               response.put("total", notifications.size());
               return ResponseEntity.ok(response);
          } catch (SecurityException ex) {
               return error(HttpStatus.UNAUTHORIZED, ex.getMessage());
          } catch (Exception ex) {
               return error(HttpStatus.INTERNAL_SERVER_ERROR,
                         "Failed to fetch admin unread notifications: " + ex.getMessage());
          }
     }

     @GetMapping("/api/notifications/admin/summary")
     public ResponseEntity<?> getAppAdminSummary(HttpServletRequest request) {
          try {
               extractUserIdFromRequest(request);
               NotificationSummaryDto summary = appNotificationService.getAdminSummary();
               Map<String, Object> response = new LinkedHashMap<>();
               response.put("success", true);
               response.put("message", "Admin notification summary fetched successfully.");
               response.put("summary", summary);
               return ResponseEntity.ok(response);
          } catch (SecurityException ex) {
               return error(HttpStatus.UNAUTHORIZED, ex.getMessage());
          } catch (Exception ex) {
               return error(HttpStatus.INTERNAL_SERVER_ERROR,
                         "Failed to fetch admin notification summary: " + ex.getMessage());
          }
     }

     @GetMapping("/api/notifications/admin/unread-count")
     public ResponseEntity<?> getAppAdminUnreadCount(HttpServletRequest request) {
          try {
               extractUserIdFromRequest(request);
               long unreadCount = appNotificationService.getAdminUnreadCount();
               Map<String, Object> response = new LinkedHashMap<>();
               response.put("success", true);
               response.put("unreadCount", unreadCount);
               return ResponseEntity.ok(response);
          } catch (SecurityException ex) {
               return error(HttpStatus.UNAUTHORIZED, ex.getMessage());
          } catch (Exception ex) {
               return error(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to fetch admin unread count: " + ex.getMessage());
          }
     }

     @PostMapping("/api/notifications/admin/create")
     public ResponseEntity<?> createAppNotification(HttpServletRequest request,
               @RequestBody CreateNotificationRequestDto requestDto) {
          try {
               extractUserIdFromRequest(request);
               NotificationResponseDto notification = appNotificationService.createNotification(requestDto);
               Map<String, Object> response = new LinkedHashMap<>();
               response.put("success", true);
               response.put("message", "Notification created successfully.");
               response.put("notification", notification);
               return ResponseEntity.status(HttpStatus.CREATED).body(response);
          } catch (SecurityException ex) {
               return error(HttpStatus.UNAUTHORIZED, ex.getMessage());
          } catch (IllegalArgumentException ex) {
               return error(HttpStatus.BAD_REQUEST, ex.getMessage());
          } catch (Exception ex) {
               return error(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to create notification: " + ex.getMessage());
          }
     }

     @PutMapping("/api/notifications/admin/{notificationId}/read")
     public ResponseEntity<?> markAppAdminNotificationAsRead(HttpServletRequest request,
               @PathVariable Long notificationId) {
          try {
               extractUserIdFromRequest(request);
               NotificationResponseDto notification = appNotificationService
                         .markAdminNotificationAsRead(notificationId);
               Map<String, Object> response = new LinkedHashMap<>();
               response.put("success", true);
               response.put("message", "Admin notification marked as read.");
               response.put("notification", notification);
               return ResponseEntity.ok(response);
          } catch (SecurityException ex) {
               return error(HttpStatus.UNAUTHORIZED, ex.getMessage());
          } catch (IllegalArgumentException ex) {
               return error(HttpStatus.BAD_REQUEST, ex.getMessage());
          } catch (Exception ex) {
               return error(HttpStatus.INTERNAL_SERVER_ERROR,
                         "Failed to update admin notification: " + ex.getMessage());
          }
     }

     @PutMapping("/api/notifications/admin/read-all")
     public ResponseEntity<?> markAllAppAdminNotificationsAsRead(HttpServletRequest request) {
          try {
               extractUserIdFromRequest(request);
               appNotificationService.markAllAdminNotificationsAsRead();
               Map<String, Object> response = new LinkedHashMap<>();
               response.put("success", true);
               response.put("message", "All admin notifications marked as read.");
               return ResponseEntity.ok(response);
          } catch (SecurityException ex) {
               return error(HttpStatus.UNAUTHORIZED, ex.getMessage());
          } catch (Exception ex) {
               return error(HttpStatus.INTERNAL_SERVER_ERROR,
                         "Failed to update admin notifications: " + ex.getMessage());
          }
     }

     @DeleteMapping("/api/notifications/admin/{notificationId}")
     public ResponseEntity<?> deleteAppAdminNotification(HttpServletRequest request,
               @PathVariable Long notificationId) {
          try {
               extractUserIdFromRequest(request);
               appNotificationService.deleteAdminNotification(notificationId);
               Map<String, Object> response = new LinkedHashMap<>();
               response.put("success", true);
               response.put("message", "Admin notification deleted successfully.");
               response.put("deletedId", notificationId);
               return ResponseEntity.ok(response);
          } catch (SecurityException ex) {
               return error(HttpStatus.UNAUTHORIZED, ex.getMessage());
          } catch (IllegalArgumentException ex) {
               return error(HttpStatus.BAD_REQUEST, ex.getMessage());
          } catch (Exception ex) {
               return error(HttpStatus.INTERNAL_SERVER_ERROR,
                         "Failed to delete admin notification: " + ex.getMessage());
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