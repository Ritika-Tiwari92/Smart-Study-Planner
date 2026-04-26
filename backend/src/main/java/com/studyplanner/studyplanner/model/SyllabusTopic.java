package com.studyplanner.studyplanner.model;

import jakarta.persistence.*;

/**
 * Represents one topic inside a chapter.
 * e.g. "TCP/IP Stack", "Subnetting", "OSI Layer functions"
 */
@Entity
@Table(name = "syllabus_topics")
public class SyllabusTopic {

     @Id
     @GeneratedValue(strategy = GenerationType.IDENTITY)
     private Long id;

     @Column(nullable = false)
     private String topicTitle;

     // Position inside chapter
     private Integer topicNumber;

     // easy / medium / hard
     private String difficulty;

     // Estimated hours for this topic
     private Double estimatedHours;

     @ManyToOne(fetch = FetchType.LAZY)
     @JoinColumn(name = "chapter_id", nullable = false)
     private SyllabusChapter chapter;

     public SyllabusTopic() {
     }

     public Long getId() {
          return id;
     }

     public void setId(Long id) {
          this.id = id;
     }

     public String getTopicTitle() {
          return topicTitle;
     }

     public void setTopicTitle(String topicTitle) {
          this.topicTitle = topicTitle;
     }

     public Integer getTopicNumber() {
          return topicNumber;
     }

     public void setTopicNumber(Integer topicNumber) {
          this.topicNumber = topicNumber;
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

     public SyllabusChapter getChapter() {
          return chapter;
     }

     public void setChapter(SyllabusChapter chapter) {
          this.chapter = chapter;
     }
}