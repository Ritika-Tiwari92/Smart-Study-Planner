package com.studyplanner.studyplanner.repository;

import com.studyplanner.studyplanner.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

     /*
      * Admin panel ke liye latest notifications first.
      */
     List<Notification> findAllByOrderByCreatedAtDesc();

     /*
      * Admin-specific notifications if future me multiple admins hon.
      */
     List<Notification> findByAdminIdOrderByCreatedAtDesc(Long adminId);

     /*
      * Student side ke liye:
      * target = all notifications.
      */
     List<Notification> findByTargetIgnoreCaseOrderByCreatedAtDesc(String target);

     /*
      * Specific student notifications.
      */
     List<Notification> findByTargetStudentIdOrderByCreatedAtDesc(Long targetStudentId);

     /*
      * Admin filter ke liye type-based notifications.
      */
     List<Notification> findByTypeIgnoreCaseOrderByCreatedAtDesc(String type);

     /*
      * Status filter ke liye SENT / DRAFT.
      */
     List<Notification> findByStatusIgnoreCaseOrderByCreatedAtDesc(String status);
}