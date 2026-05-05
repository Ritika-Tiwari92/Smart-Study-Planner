package com.studyplanner.studyplanner.model;

import jakarta.persistence.*;

/**
 * Represents one topic inside a chapter or AI-generated weekly plan.
 * Example: "TCP/IP Stack", "Subnetting", "OSI Layer functions"
 */
@Entity
@Table(name = "syllabus_topics")
public class SyllabusTopic {

     @Id
     @GeneratedValue(strategy = GenerationType.IDENTITY)
     private Long id;

     @Column(nullable = false)
     private String topicTitle;

     @Column(length = 1000)
     private String topicDescription;

     private Integer topicNumber;

     private String difficulty;

     private Double estimatedHours;

     private Integer recommendedWeek;

     private Boolean plannerCreated = false;

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

     public String getTopicDescription() {
          return topicDescription;
     }

     public void setTopicDescription(String topicDescription) {
          this.topicDescription = topicDescription;
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

     public Integer getRecommendedWeek() {
          return recommendedWeek;
     }

     public void setRecommendedWeek(Integer recommendedWeek) {
          this.recommendedWeek = recommendedWeek;
     }

     public Boolean getPlannerCreated() {
          return plannerCreated;
     }

     public void setPlannerCreated(Boolean plannerCreated) {
          this.plannerCreated = plannerCreated;
     }

     public SyllabusChapter getChapter() {
          return chapter;
     }

     public void setChapter(SyllabusChapter chapter) {
          this.chapter = chapter;
     }
}