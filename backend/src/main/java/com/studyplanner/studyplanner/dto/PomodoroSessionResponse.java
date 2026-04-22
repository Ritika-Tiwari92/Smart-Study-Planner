package com.studyplanner.studyplanner.dto;

import com.studyplanner.studyplanner.model.PomodoroSession;
import java.time.LocalDate;
import java.time.LocalDateTime;

// Yeh DTO frontend ko data bhejne ke liye hai
// User object nahi bhejte — sirf zaroori fields

public class PomodoroSessionResponse {

     private Long id;
     private String sessionType;
     private String status;
     private String linkedSubjectName;
     private Long linkedTaskId;
     private Long linkedRevisionId;
     private Long linkedPlanId;
     private Integer plannedDurationMinutes;
     private Integer actualDurationMinutes;
     private LocalDateTime startedAt;
     private LocalDateTime endedAt;
     private LocalDate sessionDate;
     private Integer cycleNumber;
     private String notes;
     private LocalDateTime createdAt;

     public PomodoroSessionResponse() {
     }

     // Static factory method — entity se response banana easy ho jaata hai
     public static PomodoroSessionResponse fromEntity(PomodoroSession session) {
          PomodoroSessionResponse res = new PomodoroSessionResponse();
          res.id = session.getId();
          res.sessionType = session.getSessionType().name();
          res.status = session.getStatus().name();
          res.linkedSubjectName = session.getLinkedSubjectName();
          res.linkedTaskId = session.getLinkedTaskId();
          res.linkedRevisionId = session.getLinkedRevisionId();
          res.linkedPlanId = session.getLinkedPlanId();
          res.plannedDurationMinutes = session.getPlannedDurationMinutes();
          res.actualDurationMinutes = session.getActualDurationMinutes();
          res.startedAt = session.getStartedAt();
          res.endedAt = session.getEndedAt();
          res.sessionDate = session.getSessionDate();
          res.cycleNumber = session.getCycleNumber();
          res.notes = session.getNotes();
          res.createdAt = session.getCreatedAt();
          return res;
     }

     // Getters
     public Long getId() {
          return id;
     }

     public String getSessionType() {
          return sessionType;
     }

     public String getStatus() {
          return status;
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

     public Integer getPlannedDurationMinutes() {
          return plannedDurationMinutes;
     }

     public Integer getActualDurationMinutes() {
          return actualDurationMinutes;
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
}
