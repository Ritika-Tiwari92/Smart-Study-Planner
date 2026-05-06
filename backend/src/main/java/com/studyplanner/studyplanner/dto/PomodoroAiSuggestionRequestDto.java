package com.studyplanner.studyplanner.dto;

public class PomodoroAiSuggestionRequestDto {

     private String subjectName;
     private String selectedTask;
     private String selectedRevision;
     private String selectedPlan;
     private String videoTitle;
     private Integer plannedDurationMinutes;
     private Long totalFocusMinutes;
     private Long completedSessions;
     private Long interruptedSessions;
     private String notes;

     public PomodoroAiSuggestionRequestDto() {
     }

     public String getSubjectName() {
          return subjectName;
     }

     public void setSubjectName(String subjectName) {
          this.subjectName = subjectName;
     }

     public String getSelectedTask() {
          return selectedTask;
     }

     public void setSelectedTask(String selectedTask) {
          this.selectedTask = selectedTask;
     }

     public String getSelectedRevision() {
          return selectedRevision;
     }

     public void setSelectedRevision(String selectedRevision) {
          this.selectedRevision = selectedRevision;
     }

     public String getSelectedPlan() {
          return selectedPlan;
     }

     public void setSelectedPlan(String selectedPlan) {
          this.selectedPlan = selectedPlan;
     }

     public String getVideoTitle() {
          return videoTitle;
     }

     public void setVideoTitle(String videoTitle) {
          this.videoTitle = videoTitle;
     }

     public Integer getPlannedDurationMinutes() {
          return plannedDurationMinutes;
     }

     public void setPlannedDurationMinutes(Integer plannedDurationMinutes) {
          this.plannedDurationMinutes = plannedDurationMinutes;
     }

     public Long getTotalFocusMinutes() {
          return totalFocusMinutes;
     }

     public void setTotalFocusMinutes(Long totalFocusMinutes) {
          this.totalFocusMinutes = totalFocusMinutes;
     }

     public Long getCompletedSessions() {
          return completedSessions;
     }

     public void setCompletedSessions(Long completedSessions) {
          this.completedSessions = completedSessions;
     }

     public Long getInterruptedSessions() {
          return interruptedSessions;
     }

     public void setInterruptedSessions(Long interruptedSessions) {
          this.interruptedSessions = interruptedSessions;
     }

     public String getNotes() {
          return notes;
     }

     public void setNotes(String notes) {
          this.notes = notes;
     }
}
