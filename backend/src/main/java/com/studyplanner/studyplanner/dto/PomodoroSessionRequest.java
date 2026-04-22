package com.studyplanner.studyplanner.dto;

// Yeh DTO tab use hoga jab user timer start kare
// Frontend se yeh data aayega

public class PomodoroSessionRequest {

     private String sessionType; // "FOCUS", "SHORT_BREAK", "LONG_BREAK"
     private Integer plannedDurationMinutes; // 25, 5, 15
     private String linkedSubjectName; // optional — "Mathematics"
     private Long linkedTaskId; // optional
     private Long linkedRevisionId; // optional
     private Long linkedPlanId; // optional
     private Integer cycleNumber; // 1, 2, 3...
     private String notes; // optional

     public PomodoroSessionRequest() {
     }

     public String getSessionType() {
          return sessionType;
     }

     public void setSessionType(String sessionType) {
          this.sessionType = sessionType;
     }

     public Integer getPlannedDurationMinutes() {
          return plannedDurationMinutes;
     }

     public void setPlannedDurationMinutes(Integer plannedDurationMinutes) {
          this.plannedDurationMinutes = plannedDurationMinutes;
     }

     public String getLinkedSubjectName() {
          return linkedSubjectName;
     }

     public void setLinkedSubjectName(String linkedSubjectName) {
          this.linkedSubjectName = linkedSubjectName;
     }

     public Long getLinkedTaskId() {
          return linkedTaskId;
     }

     public void setLinkedTaskId(Long linkedTaskId) {
          this.linkedTaskId = linkedTaskId;
     }

     public Long getLinkedRevisionId() {
          return linkedRevisionId;
     }

     public void setLinkedRevisionId(Long linkedRevisionId) {
          this.linkedRevisionId = linkedRevisionId;
     }

     public Long getLinkedPlanId() {
          return linkedPlanId;
     }

     public void setLinkedPlanId(Long linkedPlanId) {
          this.linkedPlanId = linkedPlanId;
     }

     public Integer getCycleNumber() {
          return cycleNumber;
     }

     public void setCycleNumber(Integer cycleNumber) {
          this.cycleNumber = cycleNumber;
     }

     public String getNotes() {
          return notes;
     }

     public void setNotes(String notes) {
          this.notes = notes;
     }
}
