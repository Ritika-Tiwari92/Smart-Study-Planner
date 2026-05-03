package com.studyplanner.studyplanner.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "pomodoro_sessions")
public class PomodoroSession {

    /*
     * Backward-compatible enums.
     * Existing DashboardService / old Pomodoro code may import:
     * PomodoroSession.SessionType
     * PomodoroSession.SessionStatus
     *
     * Main DB fields below are stored as String to keep API simple.
     */
    public enum SessionType {
        FOCUS,
        POMODORO,
        DEEP_WORK,
        REVISION,
        TEST_PREP,
        SHORT_BREAK,
        LONG_BREAK
    }

    public enum SessionStatus {
        ACTIVE,
        COMPLETED,
        INTERRUPTED,
        BREAK,
        CANCELLED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /*
     * New admin Pomodoro module uses student_id.
     */
    @Column(name = "student_id")
    private Long studentId;

    /*
     * Old Pomodoro/dashboard table uses user_id.
     * Both userId and studentId are kept synced to avoid NOT NULL insert errors.
     */
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "student_name", length = 120)
    private String studentName;

    @Column(name = "student_email", length = 150)
    private String studentEmail;

    @Column(name = "subject_id")
    private Long subjectId;

    /*
     * Old DTO/table naming support:
     * linkedSubjectName <-> linked_subject_name
     *
     * Frontend/admin page can still use getSubjectName().
     */
    @Column(name = "linked_subject_name", length = 120)
    private String subjectName;

    @Column(name = "topic", length = 180)
    private String topic;

    /*
     * Stored as String.
     * Example values:
     * FOCUS, POMODORO, DEEP_WORK, REVISION, TEST_PREP
     */
    @Column(name = "session_type", length = 50)
    private String sessionType = "POMODORO";

    /*
     * Stored as String.
     * Example values:
     * ACTIVE, COMPLETED, INTERRUPTED, BREAK
     */
    @Column(name = "status", length = 40)
    private String status = "ACTIVE";

    /*
     * Old table/DTO naming:
     * planned_duration_minutes
     */
    @Column(name = "planned_duration_minutes")
    private Integer plannedMinutes = 25;

    /*
     * Old table/DTO naming:
     * actual_duration_minutes
     */
    @Column(name = "actual_duration_minutes")
    private Integer focusMinutes = 0;

    @Column(name = "break_minutes")
    private Integer breakMinutes = 5;

    /*
     * Old table/DTO naming:
     * started_at
     */
    @Column(name = "started_at")
    private LocalDateTime startTime;

    /*
     * Old table/DTO naming:
     * ended_at
     */
    @Column(name = "ended_at")
    private LocalDateTime endTime;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    /*
     * Important for DashboardService streak/calendar/weekly analytics.
     */
    @Column(name = "session_date")
    private LocalDate sessionDate;

    @Column(name = "linked_task_id")
    private Long linkedTaskId;

    @Column(name = "linked_revision_id")
    private Long linkedRevisionId;

    @Column(name = "linked_plan_id")
    private Long linkedPlanId;

    @Column(name = "cycle_number")
    private Integer cycleNumber = 1;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public PomodoroSession() {
    }

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();

        if (createdAt == null) {
            createdAt = now;
        }

        if (startTime == null) {
            startTime = now;
        }

        if (sessionDate == null) {
            sessionDate = startTime != null ? startTime.toLocalDate() : LocalDate.now();
        }

        normalizeDefaults();

        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        if (sessionDate == null) {
            if (startTime != null) {
                sessionDate = startTime.toLocalDate();
            } else if (createdAt != null) {
                sessionDate = createdAt.toLocalDate();
            } else {
                sessionDate = LocalDate.now();
            }
        }

        normalizeDefaults();

        updatedAt = LocalDateTime.now();
    }

    private void normalizeDefaults() {
        /*
         * Keep both old and new user columns synced.
         */
        if (studentId == null && userId != null) {
            studentId = userId;
        }

        if (userId == null && studentId != null) {
            userId = studentId;
        }

        if (sessionType == null || sessionType.trim().isEmpty()) {
            sessionType = "POMODORO";
        }

        if (status == null || status.trim().isEmpty()) {
            status = "ACTIVE";
        }

        sessionType = sessionType.trim().toUpperCase().replace(" ", "_").replace("-", "_");
        status = status.trim().toUpperCase().replace(" ", "_").replace("-", "_");

        if (plannedMinutes == null || plannedMinutes <= 0) {
            plannedMinutes = 25;
        }

        if (focusMinutes == null || focusMinutes < 0) {
            focusMinutes = 0;
        }

        if (breakMinutes == null || breakMinutes < 0) {
            breakMinutes = 5;
        }

        if (cycleNumber == null || cycleNumber <= 0) {
            cycleNumber = 1;
        }

        if (sessionDate == null) {
            if (startTime != null) {
                sessionDate = startTime.toLocalDate();
            } else {
                sessionDate = LocalDate.now();
            }
        }

        if (studentName != null) {
            studentName = studentName.trim();
        }

        if (studentEmail != null) {
            studentEmail = studentEmail.trim();
        }

        if (subjectName != null) {
            subjectName = subjectName.trim();
        }

        if (topic != null) {
            topic = topic.trim();
        }

        if (notes != null) {
            notes = notes.trim();
        }
    }

    public Long getId() {
        return id;
    }

    public Long getStudentId() {
        return studentId != null ? studentId : userId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
        this.userId = studentId;
    }

    public Long getUserId() {
        return userId != null ? userId : studentId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
        this.studentId = userId;
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

    public Long getSubjectId() {
        return subjectId;
    }

    public void setSubjectId(Long subjectId) {
        this.subjectId = subjectId;
    }

    /*
     * New/admin naming.
     */
    public String getSubjectName() {
        return subjectName;
    }

    public void setSubjectName(String subjectName) {
        this.subjectName = subjectName;
    }

    /*
     * Old DTO/dashboard naming.
     */
    public String getLinkedSubjectName() {
        return subjectName;
    }

    public void setLinkedSubjectName(String linkedSubjectName) {
        this.subjectName = linkedSubjectName;
    }

    public String getTopic() {
        return topic;
    }

    public void setTopic(String topic) {
        this.topic = topic;
    }

    /*
     * Current module uses String.
     */
    public String getSessionType() {
        return sessionType;
    }

    public void setSessionType(String sessionType) {
        this.sessionType = sessionType;
    }

    /*
     * Compatibility setter for enum-based old code.
     */
    public void setSessionType(SessionType sessionType) {
        this.sessionType = sessionType == null ? "POMODORO" : sessionType.name();
    }

    /*
     * Current module uses String.
     */
    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    /*
     * Compatibility setter for enum-based old code.
     */
    public void setStatus(SessionStatus status) {
        this.status = status == null ? "ACTIVE" : status.name();
    }

    /*
     * New/admin naming.
     */
    public Integer getPlannedMinutes() {
        return plannedMinutes;
    }

    public void setPlannedMinutes(Integer plannedMinutes) {
        this.plannedMinutes = plannedMinutes;
    }

    /*
     * Old DTO naming.
     */
    public Integer getPlannedDurationMinutes() {
        return plannedMinutes;
    }

    public void setPlannedDurationMinutes(Integer plannedDurationMinutes) {
        this.plannedMinutes = plannedDurationMinutes;
    }

    /*
     * New/admin naming.
     */
    public Integer getFocusMinutes() {
        return focusMinutes;
    }

    public void setFocusMinutes(Integer focusMinutes) {
        this.focusMinutes = focusMinutes;
    }

    /*
     * Old DTO naming.
     */
    public Integer getActualDurationMinutes() {
        return focusMinutes;
    }

    public void setActualDurationMinutes(Integer actualDurationMinutes) {
        this.focusMinutes = actualDurationMinutes;
    }

    public Integer getBreakMinutes() {
        return breakMinutes;
    }

    public void setBreakMinutes(Integer breakMinutes) {
        this.breakMinutes = breakMinutes;
    }

    /*
     * New/admin naming.
     */
    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;

        if (startTime != null) {
            this.sessionDate = startTime.toLocalDate();
        }
    }

    /*
     * Old DTO naming.
     */
    public LocalDateTime getStartedAt() {
        return startTime;
    }

    public void setStartedAt(LocalDateTime startedAt) {
        setStartTime(startedAt);
    }

    /*
     * New/admin naming.
     */
    public LocalDateTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }

    /*
     * Old DTO naming.
     */
    public LocalDateTime getEndedAt() {
        return endTime;
    }

    public void setEndedAt(LocalDateTime endedAt) {
        this.endTime = endedAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }

    public LocalDate getSessionDate() {
        if (sessionDate != null) {
            return sessionDate;
        }

        if (startTime != null) {
            return startTime.toLocalDate();
        }

        if (createdAt != null) {
            return createdAt.toLocalDate();
        }

        return null;
    }

    public void setSessionDate(LocalDate sessionDate) {
        this.sessionDate = sessionDate;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    /*
     * Setter added for compatibility/testing if needed.
     */
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    /*
     * Setter added for compatibility/testing if needed.
     */
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}