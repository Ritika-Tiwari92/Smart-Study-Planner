package com.studyplanner.studyplanner.model;

import java.util.List;
import jakarta.validation.constraints.NotBlank;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.*;

@Entity
@Table(name = "subjects")
public class Subject {

     @JsonIgnoreProperties("subject")
     @OneToMany(mappedBy = "subject")
     private List<Task> tasks;

     @Id
     @GeneratedValue(strategy = GenerationType.IDENTITY)
     private Long id;
     @NotBlank(message = "Subject name is required")
     private String subjectName;
     @NotBlank(message = "Difficulty level is required")
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

     public List<Task> getTasks() {
          return tasks;
     }

     public void setTasks(List<Task> tasks) {
          this.tasks = tasks;
     }
}