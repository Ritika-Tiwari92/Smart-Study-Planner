package com.studyplanner.studyplanner.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Stores metadata about uploaded syllabus file.
 * One subject can have one syllabus file.
 * Actual file stored on disk — only path saved here.
 */
@Entity
@Table(name = "syllabus_files")
public class SyllabusFile {

     @Id
     @GeneratedValue(strategy = GenerationType.IDENTITY)
     private Long id;

     // Original filename shown to user
     @Column(nullable = false)
     private String originalFileName;

     // Stored filename on disk (UUID-based, safe)
     @Column(nullable = false)
     private String storedFileName;

     // Full path on disk
     @Column(nullable = false)
     private String filePath;

     // pdf / docx / txt
     @Column(nullable = false)
     private String fileType;

     // File size in bytes
     private Long fileSize;

     @Column(nullable = false, updatable = false)
     private LocalDateTime uploadedAt;

     // One subject → one syllabus file
     @OneToOne(fetch = FetchType.LAZY)
     @JoinColumn(name = "subject_id", nullable = false)
     private Subject subject;

     // Parsed chapters from this syllabus
     @OneToMany(mappedBy = "syllabusFile", cascade = CascadeType.ALL, orphanRemoval = true)
     private List<SyllabusChapter> chapters = new ArrayList<>();

     @PrePersist
     public void prePersist() {
          this.uploadedAt = LocalDateTime.now();
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