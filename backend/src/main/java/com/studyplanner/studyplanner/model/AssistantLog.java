package com.studyplanner.studyplanner.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "assistant_logs")
public class AssistantLog {

     @Id
     @GeneratedValue(strategy = GenerationType.IDENTITY)
     private Long id;

     /*
      * Student/User who asked the question.
      * We store id directly to avoid breaking existing User entity.
      */
     @Column(name = "student_id")
     private Long studentId;

     @Column(name = "student_name", length = 120)
     private String studentName;

     @Column(name = "student_email", length = 150)
     private String studentEmail;

     /*
      * User's full question/prompt.
      */
     @Column(name = "question", columnDefinition = "TEXT", nullable = false)
     private String question;

     /*
      * Short AI response summary for admin monitoring.
      * Full response can be stored here if needed, but summary is safer for admin
      * page.
      */
     @Column(name = "response_summary", columnDefinition = "TEXT")
     private String responseSummary;

     /*
      * Full AI response if you want to show/review it later.
      */
     @Column(name = "full_response", columnDefinition = "TEXT")
     private String fullResponse;

     /*
      * Example:
      * SUCCESS, FAILED
      */
     @Column(name = "status", length = 40)
     private String status = "SUCCESS";

     /*
      * Example:
      * STUDY_SUGGESTION, TASK_HELP, TEST_HELP, REVISION_HELP, GENERAL
      */
     @Column(name = "query_type", length = 80)
     private String queryType = "GENERAL";

     /*
      * Optional error message if AI API/backend fails.
      */
     @Column(name = "error_message", columnDefinition = "TEXT")
     private String errorMessage;

     /*
      * Optional model/provider info.
      * Example:
      * GROQ, OPENAI, LOCAL_FALLBACK
      */
     @Column(name = "provider", length = 80)
     private String provider = "LOCAL_FALLBACK";

     @Column(name = "model_name", length = 120)
     private String modelName;

     /*
      * Useful for analytics.
      */
     @Column(name = "tokens_used")
     private Integer tokensUsed = 0;

     @Column(name = "response_time_ms")
     private Long responseTimeMs = 0L;

     @Column(name = "created_at", updatable = false)
     private LocalDateTime createdAt;

     @Column(name = "updated_at")
     private LocalDateTime updatedAt;

     public AssistantLog() {
     }

     @PrePersist
     protected void onCreate() {
          LocalDateTime now = LocalDateTime.now();

          if (createdAt == null) {
               createdAt = now;
          }

          updatedAt = now;
          normalizeDefaults();
     }

     @PreUpdate
     protected void onUpdate() {
          updatedAt = LocalDateTime.now();
          normalizeDefaults();
     }

     private void normalizeDefaults() {
          if (status == null || status.trim().isEmpty()) {
               status = "SUCCESS";
          }

          if (queryType == null || queryType.trim().isEmpty()) {
               queryType = "GENERAL";
          }

          if (provider == null || provider.trim().isEmpty()) {
               provider = "LOCAL_FALLBACK";
          }

          status = status.trim().toUpperCase();
          queryType = queryType.trim().toUpperCase().replace(" ", "_").replace("-", "_");
          provider = provider.trim().toUpperCase().replace(" ", "_").replace("-", "_");

          if (tokensUsed == null || tokensUsed < 0) {
               tokensUsed = 0;
          }

          if (responseTimeMs == null || responseTimeMs < 0) {
               responseTimeMs = 0L;
          }

          if (studentName != null) {
               studentName = studentName.trim();
          }

          if (studentEmail != null) {
               studentEmail = studentEmail.trim();
          }

          if (question != null) {
               question = question.trim();
          }

          if (responseSummary != null) {
               responseSummary = responseSummary.trim();
          }

          if (fullResponse != null) {
               fullResponse = fullResponse.trim();
          }

          if (errorMessage != null) {
               errorMessage = errorMessage.trim();
          }

          if (modelName != null) {
               modelName = modelName.trim();
          }
     }

     public Long getId() {
          return id;
     }

     public Long getStudentId() {
          return studentId;
     }

     public void setStudentId(Long studentId) {
          this.studentId = studentId;
     }

     public String getStudentName() {
          return studentName;
     }

     public void setStudentName(String studentName) {
          this.studentName = studentName;
     }

     public String getStudentEmail() {
          return studentEmail;
     }

     public void setStudentEmail(String studentEmail) {
          this.studentEmail = studentEmail;
     }

     public String getQuestion() {
          return question;
     }

     public void setQuestion(String question) {
          this.question = question;
     }

     public String getResponseSummary() {
          return responseSummary;
     }

     public void setResponseSummary(String responseSummary) {
          this.responseSummary = responseSummary;
     }

     public String getFullResponse() {
          return fullResponse;
     }

     public void setFullResponse(String fullResponse) {
          this.fullResponse = fullResponse;
     }

     public String getStatus() {
          return status;
     }

     public void setStatus(String status) {
          this.status = status;
     }

     public String getQueryType() {
          return queryType;
     }

     public void setQueryType(String queryType) {
          this.queryType = queryType;
     }

     public String getErrorMessage() {
          return errorMessage;
     }

     public void setErrorMessage(String errorMessage) {
          this.errorMessage = errorMessage;
     }

     public String getProvider() {
          return provider;
     }

     public void setProvider(String provider) {
          this.provider = provider;
     }

     public String getModelName() {
          return modelName;
     }

     public void setModelName(String modelName) {
          this.modelName = modelName;
     }

     public Integer getTokensUsed() {
          return tokensUsed;
     }

     public void setTokensUsed(Integer tokensUsed) {
          this.tokensUsed = tokensUsed;
     }

     public Long getResponseTimeMs() {
          return responseTimeMs;
     }

     public void setResponseTimeMs(Long responseTimeMs) {
          this.responseTimeMs = responseTimeMs;
     }

     public LocalDateTime getCreatedAt() {
          return createdAt;
     }

     public LocalDateTime getUpdatedAt() {
          return updatedAt;
     }
}