package com.studyplanner.studyplanner.dto;

// Yeh DTO tab use hoga jab session complete ya cancel ho
// actualDurationMinutes fill hoga tab

public class PomodoroSessionUpdateRequest {

     private String status; // "COMPLETED", "INTERRUPTED", "CANCELLED"
     private Integer actualDurationMinutes; // kitne minute actually study kiya

     public PomodoroSessionUpdateRequest() {
     }

     public String getStatus() {
          return status;
     }

     public void setStatus(String status) {
          this.status = status;
     }

     public Integer getActualDurationMinutes() {
          return actualDurationMinutes;
     }

     public void setActualDurationMinutes(Integer actualDurationMinutes) {
          this.actualDurationMinutes = actualDurationMinutes;
     }
}