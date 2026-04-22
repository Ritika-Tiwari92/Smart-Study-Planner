package com.studyplanner.studyplanner.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "pomodoro_sessions")
public class PomodoroSession {

    // ─── Enums ───────────────────────────────────────────────────────────────

    public enum SessionType {
        FOCUS, SHORT_BREAK, LONG_BREAK
    }

    public enum SessionStatus {
        IN_PROGRESS, COMPLETED, INTERRUPTED, CANCELLED
    }

    // ─── Primary Key ─────────────────────────────────────────────────────────

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ─── User (owner) ─────────────────────────────────────────────────────────

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // ─── Session Type & Status ────────────────────────────────────────────────

    @Enumerated(EnumType.STRING)
    @Column(name = "session_type", nullable = false)
    private SessionType sessionType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private SessionStatus status;

    // ─── Optional Links ───────────────────────────────────────────────────────

    @Column(name = "linked_subject_name")
    private String linkedSubjectName;

    @Column(name = "linked_task_id")
    private Long linkedTaskId;

    @Column(name = "linked_revision_id")
    private Long linkedRevisionId;

    @Column(name = "linked_plan_id")
    private Long linkedPlanId;

    // ─── Duration ────────────────────────────────────────────────────────────

    @Column(name = "planned_duration_minutes", nullable = false)
    private Integer plannedDurationMinutes;

    @Column(name = "actual_duration_minutes")
    private Integer actualDurationMinutes;

    // ─── Timestamps ──────────────────────────────────────────────────────────

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @Column(name = "session_date", nullable = false)
    private LocalDate sessionDate;

    // ─── Cycle ───────────────────────────────────────────────────────────────

    @Column(name = "cycle_number")
    private Integer cycleNumber;

    // ─── Notes ───────────────────────────────────────────────────────────────

    @Column(name = "notes", length = 500)
    private String notes;

    // ─── Audit ───────────────────────────────────────────────────────────────

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ─── Lifecycle Hooks ─────────────────────────────────────────────────────

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.sessionDate == null) {
            this.sessionDate = LocalDate.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // ─── Constructors ─────────────────────────────────────────────────────────

    public PomodoroSession() {}

    // ─── Getters & Setters ────────────────────────────────────────────────────

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public SessionType getSessionType() { return sessionType; }
    public void setSessionType(SessionType sessionType) { this.sessionType = sessionType; }

    public SessionStatus getStatus() { return status; }
    public void setStatus(SessionStatus status) { this.status = status; }

    public String getLinkedSubjectName() { return linkedSubjectName; }
    public void setLinkedSubjectName(String linkedSubjectName) { this.linkedSubjectName = linkedSubjectName; }

    public Long getLinkedTaskId() { return linkedTaskId; }
    public void setLinkedTaskId(Long linkedTaskId) { this.linkedTaskId = linkedTaskId; }

    public Long getLinkedRevisionId() { return linkedRevisionId; }
    public void setLinkedRevisionId(Long linkedRevisionId) { this.linkedRevisionId = linkedRevisionId; }

    public Long getLinkedPlanId() { return linkedPlanId; }
    public void setLinkedPlanId(Long linkedPlanId) { this.linkedPlanId = linkedPlanId; }

    public Integer getPlannedDurationMinutes() { return plannedDurationMinutes; }
    public void setPlannedDurationMinutes(Integer plannedDurationMinutes) { this.plannedDurationMinutes = plannedDurationMinutes; }

    public Integer getActualDurationMinutes() { return actualDurationMinutes; }
    public void setActualDurationMinutes(Integer actualDurationMinutes) { this.actualDurationMinutes = actualDurationMinutes; }

    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }

    public LocalDateTime getEndedAt() { return endedAt; }
    public void setEndedAt(LocalDateTime endedAt) { this.endedAt = endedAt; }

    public LocalDate getSessionDate() { return sessionDate; }
    public void setSessionDate(LocalDate sessionDate) { this.sessionDate = sessionDate; }

    public Integer getCycleNumber() { return cycleNumber; }
    public void setCycleNumber(Integer cycleNumber) { this.cycleNumber = cycleNumber; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}