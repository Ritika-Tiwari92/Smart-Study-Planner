package com.studyplanner.studyplanner.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Stores metadata about uploaded syllabus file.
 * One subject can have one syllabus file.
 * Actual file is stored on disk; metadata and AI analysis are saved in DB.
 */
@Entity
@Table(name = "syllabus_files")
public class SyllabusFile {

     @Id
     @GeneratedValue(strategy = GenerationType.IDENTITY)
     private Long id;

     @Column(nullable = false)
     private String originalFileName;

     @Column(nullable = false)
     private String storedFileName;

     @Column(nullable = false)
     private String filePath;

     @Column(nullable = false)
     private String fileType;

     private Long fileSize;

     @Column(nullable = false, updatable = false)
     private LocalDateTime uploadedAt;

     private Double totalHours;

     private Integer weeksNeeded;

     private String overallDifficulty;

     @Column(length = 1500)
     private String studyTips;

     private LocalDateTime aiGeneratedAt;

     private Boolean plannerCreated = false;

     @OneToOne(fetch = FetchType.LAZY)
     @JoinColumn(name = "subject_id", nullable = false)
     private Subject subject;

     @OneToMany(mappedBy = "syllabusFile", cascade = CascadeType.ALL, orphanRemoval = true)
     private List<SyllabusChapter> chapters = new ArrayList<>();

     @PrePersist
     public void prePersist() {
          if (this.uploadedAt == null) {
               this.uploadedAt = LocalDateTime.now();
          }
     }

     public SyllabusFile() {
     }

     public Long getId() {
          return id;
     }

     public void setId(Long id) {
          this.id = id;
     }

     public String getOriginalFileName() {
          return originalFileName;
     }

     public void setOriginalFileName(String originalFileName) {
          this.originalFileName = originalFileName;
     }

     public String getStoredFileName() {
          return storedFileName;
     }

     public void setStoredFileName(String storedFileName) {
          this.storedFileName = storedFileName;
     }

     public String getFilePath() {
          return filePath;
     }

     public void setFilePath(String filePath) {
          this.filePath = filePath;
     }

     public String getFileType() {
          return fileType;
     }

     public void setFileType(String fileType) {
          this.fileType = fileType;
     }

     public Long getFileSize() {
          return fileSize;
     }

     public void setFileSize(Long fileSize) {
          this.fileSize = fileSize;
     }

     public LocalDateTime getUploadedAt() {
          return uploadedAt;
     }

     public void setUploadedAt(LocalDateTime uploadedAt) {
          this.uploadedAt = uploadedAt;
     }

     public Double getTotalHours() {
          return totalHours;
     }

     public void setTotalHours(Double totalHours) {
          this.totalHours = totalHours;
     }

     public Integer getWeeksNeeded() {
          return weeksNeeded;
     }

     public void setWeeksNeeded(Integer weeksNeeded) {
          this.weeksNeeded = weeksNeeded;
     }

     public String getOverallDifficulty() {
          return overallDifficulty;
     }

     public void setOverallDifficulty(String overallDifficulty) {
          this.overallDifficulty = overallDifficulty;
     }

     public String getStudyTips() {
          return studyTips;
     }

     public void setStudyTips(String studyTips) {
          this.studyTips = studyTips;
     }

     public LocalDateTime getAiGeneratedAt() {
          return aiGeneratedAt;
     }

     public void setAiGeneratedAt(LocalDateTime aiGeneratedAt) {
          this.aiGeneratedAt = aiGeneratedAt;
     }

     public Boolean getPlannerCreated() {
          return plannerCreated;
     }

     public void setPlannerCreated(Boolean plannerCreated) {
          this.plannerCreated = plannerCreated;
     }

     public Subject getSubject() {
          return subject;
     }

     public void setSubject(Subject subject) {
          this.subject = subject;
     }

     public List<SyllabusChapter> getChapters() {
          return chapters;
     }

     public void setChapters(List<SyllabusChapter> chapters) {
          this.chapters = chapters;
     }
}