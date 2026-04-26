package com.studyplanner.studyplanner.model;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Represents one chapter parsed from syllabus.
 * e.g. "Chapter 1: OSI Model", "Unit 2: IP Addressing"
 */
@Entity
@Table(name = "syllabus_chapters")
public class SyllabusChapter {

     @Id
     @GeneratedValue(strategy = GenerationType.IDENTITY)
     private Long id;

     @Column(nullable = false)
     private String chapterTitle;

     // Position in syllabus — 1, 2, 3 ...
     private Integer chapterNumber;

     // easy / medium / hard — estimated by parser
     private String difficulty;

     // Estimated hours to study this chapter
     private Double estimatedHours;

     // Estimated number of lectures needed
     private Integer estimatedLectures;

     @ManyToOne(fetch = FetchType.LAZY)
     @JoinColumn(name = "syllabus_file_id", nullable = false)
     private SyllabusFile syllabusFile;

     @OneToMany(mappedBy = "chapter", cascade = CascadeType.ALL, orphanRemoval = true)
     private List<SyllabusTopic> topics = new ArrayList<>();

     public SyllabusChapter() {
     }

     public Long getId() {
          return id;
     }

     public void setId(Long id) {
          this.id = id;
     }

     public String getChapterTitle() {
          return chapterTitle;
     }

     public void setChapterTitle(String chapterTitle) {
          this.chapterTitle = chapterTitle;
     }

     public Integer getChapterNumber() {
          return chapterNumber;
     }

     public void setChapterNumber(Integer chapterNumber) {
          this.chapterNumber = chapterNumber;
     }

     public String getDifficulty() {
          return difficulty;
     }

     public void setDifficulty(String difficulty) {
          this.difficulty = difficulty;
     }

     public Double getEstimatedHours() {
          return estimatedHours;
     }

     public void setEstimatedHours(Double estimatedHours) {
          this.estimatedHours = estimatedHours;
     }

     public Integer getEstimatedLectures() {
          return estimatedLectures;
     }

     public void setEstimatedLectures(Integer estimatedLectures) {
          this.estimatedLectures = estimatedLectures;
     }

     public SyllabusFile getSyllabusFile() {
          return syllabusFile;
     }

     public void setSyllabusFile(SyllabusFile syllabusFile) {
          this.syllabusFile = syllabusFile;
     }

     public List<SyllabusTopic> getTopics() {
          return topics;
     }

     public void setTopics(List<SyllabusTopic> topics) {
          this.topics = topics;
     }
}