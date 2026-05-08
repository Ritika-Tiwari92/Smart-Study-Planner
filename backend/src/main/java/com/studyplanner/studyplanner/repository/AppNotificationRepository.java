package com.studyplanner.studyplanner.repository;

import com.studyplanner.studyplanner.model.AppNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AppNotificationRepository extends JpaRepository<AppNotification, Long> {

     /*
      * Student notifications:
      * Logged-in user ke notifications latest first.
      */
     List<AppNotification> findByUserIdOrderByCreatedAtDesc(Long userId);

     /*
      * Student unread notifications.
      */
     List<AppNotification> findByUserIdAndReadFalseOrderByCreatedAtDesc(Long userId);

     /*
      * Student unread count.
      */
     long countByUserIdAndReadFalse(Long userId);

     /*
      * Admin notifications:
      * targetRole = ADMIN and userId can be null.
      */
     List<AppNotification> findByTargetRoleOrderByCreatedAtDesc(String targetRole);

     /*
      * Admin unread notifications.
      */
     List<AppNotification> findByTargetRoleAndReadFalseOrderByCreatedAtDesc(String targetRole);

     /*
      * Admin unread count.
      */
     long countByTargetRoleAndReadFalse(String targetRole);

     /*
      * Filter notifications by type.
      * Examples: TASK, TEST, REVISION, POMODORO, SYSTEM.
      */
     List<AppNotification> findByUserIdAndTypeOrderByCreatedAtDesc(Long userId, String type);

     /*
      * Prevent duplicate notifications for same source record if needed.
      */
     boolean existsByUserIdAndSourceModuleAndSourceIdAndType(
               Long userId,
               String sourceModule,
               Long sourceId,
               String type);
}
