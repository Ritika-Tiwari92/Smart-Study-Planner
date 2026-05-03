package com.studyplanner.studyplanner.repository;

import com.studyplanner.studyplanner.model.AssistantLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AssistantLogRepository extends JpaRepository<AssistantLog, Long> {

     /*
      * Admin: latest assistant logs first.
      */
     List<AssistantLog> findAllByOrderByCreatedAtDesc();

     /*
      * Student: logged-in student's assistant query history.
      */
     List<AssistantLog> findByStudentIdOrderByCreatedAtDesc(Long studentId);

     /*
      * Admin: filter logs by status.
      * SUCCESS / FAILED
      */
     List<AssistantLog> findByStatusIgnoreCaseOrderByCreatedAtDesc(String status);

     /*
      * Admin: filter logs by query type.
      * GENERAL / STUDY_SUGGESTION / TASK_HELP / TEST_HELP / REVISION_HELP
      */
     List<AssistantLog> findByQueryTypeIgnoreCaseOrderByCreatedAtDesc(String queryType);

     /*
      * Admin: filter logs by provider.
      * LOCAL_FALLBACK / GROQ / OPENAI
      */
     List<AssistantLog> findByProviderIgnoreCaseOrderByCreatedAtDesc(String provider);

     /*
      * Admin: today's logs / date range logs.
      */
     List<AssistantLog> findByCreatedAtBetweenOrderByCreatedAtDesc(
               LocalDateTime startDateTime,
               LocalDateTime endDateTime);

     /*
      * Summary counts.
      */
     long countByStatusIgnoreCase(String status);

     long countByQueryTypeIgnoreCase(String queryType);

     long countByStudentId(Long studentId);
}