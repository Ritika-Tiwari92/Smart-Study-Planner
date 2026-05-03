package com.studyplanner.studyplanner.repository;

import com.studyplanner.studyplanner.model.SecurityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SecurityLogRepository extends JpaRepository<SecurityLog, Long> {

     /*
      * Latest logs first for admin security logs page.
      */
     List<SecurityLog> findAllByOrderByCreatedAtDesc();

     /*
      * Filter by severity:
      * INFO, SUCCESS, WARNING, CRITICAL
      */
     List<SecurityLog> findBySeverityIgnoreCaseOrderByCreatedAtDesc(String severity);

     /*
      * Filter by action:
      * LOGIN, LOGOUT, FAILED_LOGIN, ADMIN_ACTION, SETTINGS_UPDATE
      */
     List<SecurityLog> findByActionIgnoreCaseOrderByCreatedAtDesc(String action);

     /*
      * Filter by role:
      * ADMIN, STUDENT
      */
     List<SecurityLog> findByRoleIgnoreCaseOrderByCreatedAtDesc(String role);

     /*
      * User-specific logs if needed later.
      */
     List<SecurityLog> findByUserIdOrderByCreatedAtDesc(Long userId);

     long countBySeverityIgnoreCase(String severity);

     long countByActionIgnoreCase(String action);

     long countByStatusIgnoreCase(String status);
}