package com.studyplanner.studyplanner.model;

import jakarta.persistence.*;

@Entity
@Table(name = "subjects")
public class Subject {

     @Id
     @GeneratedValue(strategy = GenerationType.IDENTITY)
     private Long id;

     private String subjectName;
     private String difficultyLevel;

     public Subject() {
     }

     public Subject(Long id, String subjectName, String difficultyLevel) {
          this.id = id;
          this.subjectName = subjectName;
          this.difficultyLevel = difficultyLevel;
     }

     public Long getId() {
          return id;
     }

     public void setId(Long id) {
          this.id = id;
     }

     public String getSubjectName() {
          return subjectName;
     }

     public void setSubjectName(String subjectName) {
          this.subjectName = subjectName;
     }

     public String getDifficultyLevel() {
          return difficultyLevel;
     }

     public void setDifficultyLevel(String difficultyLevel) {
          this.difficultyLevel = difficultyLevel;
     }
}