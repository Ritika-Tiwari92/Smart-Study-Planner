package com.studyplanner.studyplanner.dto;

import com.studyplanner.studyplanner.model.PomodoroSession;

import java.time.LocalDate;
import java.time.LocalDateTime;

/*
 * DTO for sending Pomodoro session data to frontend.
 * This version matches the current PomodoroSession entity that we created.
 */
public class PomodoroSessionResponse {

     private Long id;
     private Long studentId;
     private String studentName;
     private String studentEmail;

     private String sessionType;
     private String status;

     private Long subjectId;
     private String linkedSubjectName;

     private Long linkedTaskId;
     private Long linkedRevisionId;
     private Long linkedPlanId;

     private String topic;

     private Integer plannedDurationMinutes;
     private Integer actualDurationMinutes;
     private Integer breakMinutes;

     private LocalDateTime startedAt;
     private LocalDateTime endedAt;
     private LocalDate sessionDate;

     private Integer cycleNumber;
     private String notes;

     private LocalDateTime createdAt;
     private LocalDateTime updatedAt;

     public PomodoroSessionResponse() {
     }

     public static PomodoroSessionResponse fromEntity(PomodoroSession session) {
          PomodoroSessionResponse res = new PomodoroSessionResponse();

          if (session == null) {
               return res;
          }

          res.id = session.getId();

          res.studentId = session.getStudentId();
          res.studentName = session.getStudentName();
          res.studentEmail = session.getStudentEmail();

          /*
           * Current entity stores sessionType/status as String.
           * So .name() is NOT needed here.
           */
          res.sessionType = session.getSessionType();
          res.status = session.getStatus();

          res.subjectId = session.getSubjectId();
          res.linkedSubjectName = session.getSubjectName();

          /*
           * These linked IDs are not present in the current PomodoroSession entity yet.
           * Keeping them null safely for frontend compatibility.
           */
          res.linkedTaskId = null;
          res.linkedRevisionId = null;
          res.linkedPlanId = null;

          res.topic = session.getTopic();

          res.plannedDurationMinutes = session.getPlannedMinutes();
          res.actualDurationMinutes = session.getFocusMinutes();
          res.breakMinutes = session.getBreakMinutes();

          res.startedAt = session.getStartTime();
          res.endedAt = session.getEndTime();

          if (session.getStartTime() != null) {
               res.sessionDate = session.getStartTime().toLocalDate();
          } else if (session.getCreatedAt() != null) {
               res.sessionDate = session.getCreatedAt().toLocalDate();
          } else {
               res.sessionDate = null;
          }

          /*
           * Cycle number is not added in current entity.
           * Default 1 means first Pomodoro cycle.
           */
          res.cycleNumber = 1;

          res.notes = session.getNotes();
          res.createdAt = session.getCreatedAt();
          res.updatedAt = session.getUpdatedAt();

          return res;
     }

     public Long getId() {
          return id;
     }

     public Long getStudentId() {
          return studentId;
     }

     public String getStudentName() {
          return studentName;
     }

     public String getStudentEmail() {
          return studentEmail;
     }

     public String getSessionType() {
          return sessionType;
     }

     public String getStatus() {
          return status;
     }

     public Long getSubjectId() {
          return subjectId;
     }

     public String getLinkedSubjectName() {
          return linkedSubjectName;
     }

     public Long getLinkedTaskId() {
          return linkedTaskId;
     }

     public Long getLinkedRevisionId() {
          return linkedRevisionId;
     }

     public Long getLinkedPlanId() {
          return linkedPlanId;
     }

     public String getTopic() {
          return topic;
     }

     public Integer getPlannedDurationMinutes() {
          return plannedDurationMinutes;
     }

     public Integer getActualDurationMinutes() {
          return actualDurationMinutes;
     }

     public Integer getBreakMinutes() {
          return breakMinutes;
     }

     public LocalDateTime getStartedAt() {
          return startedAt;
     }

     public LocalDateTime getEndedAt() {
          return endedAt;
     }

     public LocalDate getSessionDate() {
          return sessionDate;
     }

     public Integer getCycleNumber() {
          return cycleNumber;
     }

     public String getNotes() {
          return notes;
     }

     public LocalDateTime getCreatedAt() {
          return createdAt;
     }

     public LocalDateTime getUpdatedAt() {
          return updatedAt;
     }
}