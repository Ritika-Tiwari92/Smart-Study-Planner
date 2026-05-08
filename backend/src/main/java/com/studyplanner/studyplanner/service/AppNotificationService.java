package com.studyplanner.studyplanner.service;

import com.studyplanner.studyplanner.dto.CreateNotificationRequestDto;
import com.studyplanner.studyplanner.dto.NotificationResponseDto;
import com.studyplanner.studyplanner.dto.NotificationSummaryDto;
import com.studyplanner.studyplanner.model.AppNotification;
import com.studyplanner.studyplanner.repository.AppNotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AppNotificationService {

     private final AppNotificationRepository appNotificationRepository;

     public AppNotificationService(AppNotificationRepository appNotificationRepository) {
          this.appNotificationRepository = appNotificationRepository;
     }

     // ─────────────────────────────────────────────
     // Student notifications
     // ─────────────────────────────────────────────

     @Transactional(readOnly = true)
     public List<NotificationResponseDto> getStudentNotifications(Long userId) {
          validateUserId(userId);

          return appNotificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                    .stream()
                    .map(this::mapToDto)
                    .collect(Collectors.toList());
     }

     @Transactional(readOnly = true)
     public List<NotificationResponseDto> getStudentUnreadNotifications(Long userId) {
          validateUserId(userId);

          return appNotificationRepository.findByUserIdAndReadFalseOrderByCreatedAtDesc(userId)
                    .stream()
                    .map(this::mapToDto)
                    .collect(Collectors.toList());
     }

     @Transactional(readOnly = true)
     public NotificationSummaryDto getStudentSummary(Long userId) {
          validateUserId(userId);

          long total = appNotificationRepository.findByUserIdOrderByCreatedAtDesc(userId).size();
          long unread = appNotificationRepository.countByUserIdAndReadFalse(userId);

          return new NotificationSummaryDto(total, unread);
     }

     @Transactional(readOnly = true)
     public long getStudentUnreadCount(Long userId) {
          validateUserId(userId);
          return appNotificationRepository.countByUserIdAndReadFalse(userId);
     }

     // ─────────────────────────────────────────────
     // Admin notifications
     // ─────────────────────────────────────────────

     @Transactional(readOnly = true)
     public List<NotificationResponseDto> getAdminNotifications() {
          return appNotificationRepository.findByTargetRoleOrderByCreatedAtDesc("ADMIN")
                    .stream()
                    .map(this::mapToDto)
                    .collect(Collectors.toList());
     }

     @Transactional(readOnly = true)
     public List<NotificationResponseDto> getAdminUnreadNotifications() {
          return appNotificationRepository.findByTargetRoleAndReadFalseOrderByCreatedAtDesc("ADMIN")
                    .stream()
                    .map(this::mapToDto)
                    .collect(Collectors.toList());
     }

     @Transactional(readOnly = true)
     public NotificationSummaryDto getAdminSummary() {
          long total = appNotificationRepository.findByTargetRoleOrderByCreatedAtDesc("ADMIN").size();
          long unread = appNotificationRepository.countByTargetRoleAndReadFalse("ADMIN");

          return new NotificationSummaryDto(total, unread);
     }

     @Transactional(readOnly = true)
     public long getAdminUnreadCount() {
          return appNotificationRepository.countByTargetRoleAndReadFalse("ADMIN");
     }

     // ─────────────────────────────────────────────
     // Create notifications
     // ─────────────────────────────────────────────

     @Transactional
     public NotificationResponseDto createNotification(CreateNotificationRequestDto request) {
          validateCreateRequest(request);

          AppNotification notification = new AppNotification();
          notification.setUserId(request.getUserId());
          notification.setTargetRole(defaultText(request.getTargetRole(), "STUDENT"));
          notification.setTitle(request.getTitle());
          notification.setMessage(request.getMessage());
          notification.setType(defaultText(request.getType(), "SYSTEM"));
          notification.setPriority(defaultText(request.getPriority(), "MEDIUM"));
          notification.setRedirectUrl(request.getRedirectUrl());
          notification.setSourceId(request.getSourceId());
          notification.setSourceModule(request.getSourceModule());
          notification.setRead(false);

          return mapToDto(appNotificationRepository.save(notification));
     }

     @Transactional
     public AppNotification createStudentNotification(
               Long userId,
               String title,
               String message,
               String type,
               String priority,
               String redirectUrl,
               Long sourceId,
               String sourceModule) {

          validateUserId(userId);

          AppNotification notification = new AppNotification();
          notification.setUserId(userId);
          notification.setTargetRole("STUDENT");
          notification.setTitle(requiredText(title, "Notification title is required."));
          notification.setMessage(requiredText(message, "Notification message is required."));
          notification.setType(defaultText(type, "SYSTEM"));
          notification.setPriority(defaultText(priority, "MEDIUM"));
          notification.setRedirectUrl(redirectUrl);
          notification.setSourceId(sourceId);
          notification.setSourceModule(sourceModule);
          notification.setRead(false);

          return appNotificationRepository.save(notification);
     }

     @Transactional
     public AppNotification createAdminNotification(
               String title,
               String message,
               String type,
               String priority,
               String redirectUrl,
               Long sourceId,
               String sourceModule) {

          AppNotification notification = new AppNotification();
          notification.setUserId(null);
          notification.setTargetRole("ADMIN");
          notification.setTitle(requiredText(title, "Notification title is required."));
          notification.setMessage(requiredText(message, "Notification message is required."));
          notification.setType(defaultText(type, "SYSTEM"));
          notification.setPriority(defaultText(priority, "MEDIUM"));
          notification.setRedirectUrl(redirectUrl);
          notification.setSourceId(sourceId);
          notification.setSourceModule(sourceModule);
          notification.setRead(false);

          return appNotificationRepository.save(notification);
     }

     @Transactional
     public void createStudentNotificationIfNotExists(
               Long userId,
               String title,
               String message,
               String type,
               String priority,
               String redirectUrl,
               Long sourceId,
               String sourceModule) {

          validateUserId(userId);

          String normalizedType = defaultText(type, "SYSTEM").trim().toUpperCase();
          String normalizedModule = defaultText(sourceModule, "SYSTEM").trim().toUpperCase();

          if (sourceId != null
                    && appNotificationRepository.existsByUserIdAndSourceModuleAndSourceIdAndType(
                              userId,
                              normalizedModule,
                              sourceId,
                              normalizedType)) {
               return;
          }

          createStudentNotification(
                    userId,
                    title,
                    message,
                    normalizedType,
                    priority,
                    redirectUrl,
                    sourceId,
                    normalizedModule);
     }

     // ─────────────────────────────────────────────
     // Read / delete actions
     // ─────────────────────────────────────────────

     @Transactional
     public NotificationResponseDto markStudentNotificationAsRead(Long userId, Long notificationId) {
          validateUserId(userId);

          AppNotification notification = appNotificationRepository.findById(notificationId)
                    .orElseThrow(() -> new IllegalArgumentException("Notification not found."));

          if (notification.getUserId() == null || !notification.getUserId().equals(userId)) {
               throw new IllegalArgumentException("You are not allowed to update this notification.");
          }

          notification.setRead(true);
          notification.setReadAt(LocalDateTime.now());

          return mapToDto(appNotificationRepository.save(notification));
     }

     @Transactional
     public NotificationResponseDto markAdminNotificationAsRead(Long notificationId) {
          AppNotification notification = appNotificationRepository.findById(notificationId)
                    .orElseThrow(() -> new IllegalArgumentException("Notification not found."));

          if (!"ADMIN".equalsIgnoreCase(notification.getTargetRole())) {
               throw new IllegalArgumentException("This is not an admin notification.");
          }

          notification.setRead(true);
          notification.setReadAt(LocalDateTime.now());

          return mapToDto(appNotificationRepository.save(notification));
     }

     @Transactional
     public void markAllStudentNotificationsAsRead(Long userId) {
          validateUserId(userId);

          List<AppNotification> unreadNotifications = appNotificationRepository
                    .findByUserIdAndReadFalseOrderByCreatedAtDesc(userId);

          for (AppNotification notification : unreadNotifications) {
               notification.setRead(true);
               notification.setReadAt(LocalDateTime.now());
          }

          appNotificationRepository.saveAll(unreadNotifications);
     }

     @Transactional
     public void markAllAdminNotificationsAsRead() {
          List<AppNotification> unreadNotifications = appNotificationRepository
                    .findByTargetRoleAndReadFalseOrderByCreatedAtDesc("ADMIN");

          for (AppNotification notification : unreadNotifications) {
               notification.setRead(true);
               notification.setReadAt(LocalDateTime.now());
          }

          appNotificationRepository.saveAll(unreadNotifications);
     }

     @Transactional
     public void deleteStudentNotification(Long userId, Long notificationId) {
          validateUserId(userId);

          AppNotification notification = appNotificationRepository.findById(notificationId)
                    .orElseThrow(() -> new IllegalArgumentException("Notification not found."));

          if (notification.getUserId() == null || !notification.getUserId().equals(userId)) {
               throw new IllegalArgumentException("You are not allowed to delete this notification.");
          }

          appNotificationRepository.delete(notification);
     }

     @Transactional
     public void deleteAdminNotification(Long notificationId) {
          AppNotification notification = appNotificationRepository.findById(notificationId)
                    .orElseThrow(() -> new IllegalArgumentException("Notification not found."));

          if (!"ADMIN".equalsIgnoreCase(notification.getTargetRole())) {
               throw new IllegalArgumentException("This is not an admin notification.");
          }

          appNotificationRepository.delete(notification);
     }

     // ─────────────────────────────────────────────
     // Mapper + validation
     // ─────────────────────────────────────────────

     private NotificationResponseDto mapToDto(AppNotification notification) {
          NotificationResponseDto dto = new NotificationResponseDto();

          dto.setId(notification.getId());
          dto.setUserId(notification.getUserId());
          dto.setTargetRole(notification.getTargetRole());
          dto.setTitle(notification.getTitle());
          dto.setMessage(notification.getMessage());
          dto.setType(notification.getType());
          dto.setPriority(notification.getPriority());
          dto.setRedirectUrl(notification.getRedirectUrl());
          dto.setSourceId(notification.getSourceId());
          dto.setSourceModule(notification.getSourceModule());
          dto.setRead(notification.getRead());
          dto.setCreatedAt(notification.getCreatedAt());
          dto.setReadAt(notification.getReadAt());

          return dto;
     }

     private void validateCreateRequest(CreateNotificationRequestDto request) {
          if (request == null) {
               throw new IllegalArgumentException("Notification request body is required.");
          }

          requiredText(request.getTitle(), "Notification title is required.");
          requiredText(request.getMessage(), "Notification message is required.");

          String targetRole = defaultText(request.getTargetRole(), "STUDENT");

          if ("STUDENT".equalsIgnoreCase(targetRole)) {
               validateUserId(request.getUserId());
          }
     }

     private void validateUserId(Long userId) {
          if (userId == null || userId <= 0) {
               throw new IllegalArgumentException("Valid user id is required.");
          }
     }

     private String requiredText(String value, String errorMessage) {
          if (value == null || value.trim().isEmpty()) {
               throw new IllegalArgumentException(errorMessage);
          }

          return value.trim();
     }

     private String defaultText(String value, String fallback) {
          if (value == null || value.trim().isEmpty()) {
               return fallback;
          }

          return value.trim();
     }
}