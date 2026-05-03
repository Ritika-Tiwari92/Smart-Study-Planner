package com.studyplanner.studyplanner.service;

import com.studyplanner.studyplanner.model.Notification;
import com.studyplanner.studyplanner.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class NotificationService {

     private final NotificationRepository notificationRepository;

     public NotificationService(NotificationRepository notificationRepository) {
          this.notificationRepository = notificationRepository;
     }

     /*
      * Admin: get all notifications latest first.
      */
     public List<Notification> getAllNotifications() {
          return notificationRepository.findAllByOrderByCreatedAtDesc();
     }

     /*
      * Admin: get notifications created by a specific admin.
      * Useful later if multiple admins exist.
      */
     public List<Notification> getNotificationsByAdmin(Long adminId) {
          if (adminId == null || adminId <= 0) {
               return getAllNotifications();
          }

          return notificationRepository.findByAdminIdOrderByCreatedAtDesc(adminId);
     }

     /*
      * Student: get notifications for logged-in student.
      * This includes:
      * 1. all-student notifications
      * 2. specific notifications targeted to that student
      */
     public List<Notification> getNotificationsForStudent(Long studentId) {
          List<Notification> result = new ArrayList<>();

          result.addAll(notificationRepository.findByTargetIgnoreCaseOrderByCreatedAtDesc("all"));

          if (studentId != null && studentId > 0) {
               result.addAll(notificationRepository.findByTargetStudentIdOrderByCreatedAtDesc(studentId));
          }

          result.sort(Comparator.comparing(
                    notification -> notification.getCreatedAt() == null
                              ? LocalDateTime.MIN
                              : notification.getCreatedAt(),
                    Comparator.reverseOrder()));

          return result;
     }

     /*
      * Admin: create/send notification.
      */
     @Transactional
     public Notification createNotification(Long adminId, Map<String, Object> requestBody) {
          Map<String, Object> body = safeBody(requestBody);

          String title = getString(body, "title");
          String message = getString(body, "message", "body");
          String type = getString(body, "type", "notifType");
          String target = getString(body, "target", "audience");
          String targetLabel = getString(body, "targetLabel", "audienceLabel");
          String status = getString(body, "status");

          validateTitleAndMessage(title, message);

          Notification notification = new Notification();
          notification.setAdminId(adminId);
          notification.setTitle(title);
          notification.setMessage(message);
          notification.setType(normalizeType(type));
          notification.setStatus(normalizeStatus(status));

          applyTarget(notification, target, targetLabel);
          applySentAt(notification, body);

          return notificationRepository.save(notification);
     }

     /*
      * Admin: update notification.
      */
     @Transactional
     public Notification updateNotification(Long id, Map<String, Object> requestBody) {
          if (id == null || id <= 0) {
               throw new IllegalArgumentException("Valid notification id is required.");
          }

          Notification notification = notificationRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Notification not found with id: " + id));

          Map<String, Object> body = safeBody(requestBody);

          String title = getString(body, "title");
          if (title != null) {
               if (title.trim().isEmpty()) {
                    throw new IllegalArgumentException("Notification title cannot be empty.");
               }
               notification.setTitle(title);
          }

          String message = getString(body, "message", "body");
          if (message != null) {
               if (message.trim().isEmpty()) {
                    throw new IllegalArgumentException("Notification message cannot be empty.");
               }
               notification.setMessage(message);
          }

          String type = getString(body, "type", "notifType");
          if (type != null) {
               notification.setType(normalizeType(type));
          }

          String status = getString(body, "status");
          if (status != null) {
               notification.setStatus(normalizeStatus(status));
          }

          String target = getString(body, "target", "audience");
          String targetLabel = getString(body, "targetLabel", "audienceLabel");

          if (target != null || targetLabel != null) {
               applyTarget(notification, target, targetLabel);
          }

          applySentAt(notification, body);

          return notificationRepository.save(notification);
     }

     /*
      * Admin: delete notification by id.
      */
     @Transactional
     public void deleteNotification(Long id) {
          if (id == null || id <= 0) {
               throw new IllegalArgumentException("Valid notification id is required.");
          }

          if (!notificationRepository.existsById(id)) {
               throw new IllegalArgumentException("Notification not found with id: " + id);
          }

          notificationRepository.deleteById(id);
     }

     /*
      * Admin: summary counts for dashboard/cards.
      */
     public Map<String, Object> getNotificationSummary() {
          List<Notification> all = getAllNotifications();

          long total = all.size();
          long sent = all.stream()
                    .filter(n -> "SENT".equalsIgnoreCase(n.getStatus()))
                    .count();

          long draft = all.stream()
                    .filter(n -> "DRAFT".equalsIgnoreCase(n.getStatus()))
                    .count();

          LocalDateTime startOfToday = LocalDateTime.now().toLocalDate().atStartOfDay();

          long today = all.stream()
                    .filter(n -> {
                         LocalDateTime time = n.getSentAt() != null ? n.getSentAt() : n.getCreatedAt();
                         return time != null && !time.isBefore(startOfToday);
                    })
                    .count();

          String topType = getTopType(all);

          Map<String, Object> summary = new LinkedHashMap<>();
          summary.put("total", total);
          summary.put("sent", sent);
          summary.put("draft", draft);
          summary.put("today", today);
          summary.put("topType", topType);

          return summary;
     }

     private String getTopType(List<Notification> notifications) {
          if (notifications == null || notifications.isEmpty()) {
               return "-";
          }

          Map<String, Integer> typeCounts = new LinkedHashMap<>();

          for (Notification notification : notifications) {
               String type = notification.getType() == null ? "General" : notification.getType();
               typeCounts.put(type, typeCounts.getOrDefault(type, 0) + 1);
          }

          return typeCounts.entrySet()
                    .stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElse("-");
     }

     private void validateTitleAndMessage(String title, String message) {
          if (title == null || title.trim().isEmpty()) {
               throw new IllegalArgumentException("Notification title is required.");
          }

          if (title.trim().length() > 120) {
               throw new IllegalArgumentException("Notification title cannot be more than 120 characters.");
          }

          if (message == null || message.trim().isEmpty()) {
               throw new IllegalArgumentException("Notification message is required.");
          }

          if (message.trim().length() > 1000) {
               throw new IllegalArgumentException("Notification message cannot be more than 1000 characters.");
          }
     }

     private void applyTarget(Notification notification, String target, String targetLabel) {
          String cleanedTarget = target == null || target.trim().isEmpty()
                    ? "all"
                    : target.trim();

          if ("all".equalsIgnoreCase(cleanedTarget) || "ALL_STUDENTS".equalsIgnoreCase(cleanedTarget)) {
               notification.setTarget("all");
               notification.setTargetStudentId(null);
               notification.setTargetLabel("All Students");
               return;
          }

          Long studentId = tryParseLong(cleanedTarget);

          if (studentId != null && studentId > 0) {
               notification.setTarget("student");
               notification.setTargetStudentId(studentId);

               if (targetLabel != null && !targetLabel.trim().isEmpty()) {
                    notification.setTargetLabel(targetLabel.trim());
               } else {
                    notification.setTargetLabel("Student #" + studentId);
               }

               return;
          }

          /*
           * Fallback for custom audience labels.
           */
          notification.setTarget(cleanedTarget);
          notification.setTargetStudentId(null);

          if (targetLabel != null && !targetLabel.trim().isEmpty()) {
               notification.setTargetLabel(targetLabel.trim());
          } else {
               notification.setTargetLabel(cleanedTarget);
          }
     }

     private void applySentAt(Notification notification, Map<String, Object> body) {
          String sentAtText = getString(body, "sentAt", "createdAt");

          if (sentAtText == null || sentAtText.trim().isEmpty()) {
               return;
          }

          LocalDateTime parsed = parseDateTime(sentAtText);

          if (parsed != null) {
               notification.setSentAt(parsed);
          }
     }

     private LocalDateTime parseDateTime(String value) {
          if (value == null || value.trim().isEmpty()) {
               return null;
          }

          String text = value.trim();

          try {
               return LocalDateTime.parse(text);
          } catch (Exception ignored) {
          }

          try {
               return OffsetDateTime.parse(text).toLocalDateTime();
          } catch (Exception ignored) {
          }

          return null;
     }

     private String normalizeType(String type) {
          if (type == null || type.trim().isEmpty()) {
               return "General";
          }

          String cleaned = type.trim();

          if (cleaned.equalsIgnoreCase("study")) {
               return "Study";
          }

          if (cleaned.equalsIgnoreCase("test")) {
               return "Test";
          }

          if (cleaned.equalsIgnoreCase("revision")) {
               return "Revision";
          }

          if (cleaned.equalsIgnoreCase("pomodoro")) {
               return "Pomodoro";
          }

          return "General";
     }

     private String normalizeStatus(String status) {
          if (status == null || status.trim().isEmpty()) {
               return "SENT";
          }

          String cleaned = status.trim().toUpperCase();

          if (cleaned.equals("DRAFT")) {
               return "DRAFT";
          }

          return "SENT";
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

     private Long tryParseLong(String value) {
          try {
               return Long.parseLong(value.trim());
          } catch (Exception ex) {
               return null;
          }
     }
}