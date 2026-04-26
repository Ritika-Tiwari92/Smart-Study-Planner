package com.studyplanner.studyplanner.model;

import java.util.List;
import com.fasterxml.jackson.annotation.JsonManagedReference;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

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
     @JsonProperty("name")
     @JsonAlias("subjectName")
     @Column(name = "subject_name")
     private String subjectName;

     @Column(name = "code")
     private String code;

     @Min(value = 0, message = "Chapters cannot be negative")
     @Column(name = "chapters")
     private Integer chapters;

     @Min(value = 0, message = "Progress cannot be less than 0")
     @Max(value = 100, message = "Progress cannot be more than 100")
     @Column(name = "progress")
     private Integer progress;

     @Column(name = "icon_class")
     private String iconClass;

     @Column(name = "description", length = 1000)
     private String description;

     @Column(name = "difficulty_level")
     private String difficultyLevel;

     @JsonIgnore
     @ManyToOne(fetch = FetchType.LAZY)
     @JoinColumn(name = "user_id")
     private User user;

     @OneToOne(mappedBy = "subject", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
     private SyllabusFile syllabusFile;

     public Subject() {
     }

     public Subject(Long id, String subjectName, String code, Integer chapters, Integer progress,
               String iconClass, String description, String difficultyLevel) {
          this.id = id;
          this.subjectName = subjectName;
          this.code = code;
          this.chapters = chapters;
          this.progress = progress;
          this.iconClass = iconClass;
          this.description = description;
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

     public String getCode() {
          return code;
     }

     public void setCode(String code) {
          this.code = code;
     }

     public Integer getChapters() {
          return chapters;
     }

     public void setChapters(Integer chapters) {
          this.chapters = chapters;
     }

     public Integer getProgress() {
          return progress;
     }

     public void setProgress(Integer progress) {
          this.progress = progress;
     }

     public String getIconClass() {
          return iconClass;
     }

     public void setIconClass(String iconClass) {
          this.iconClass = iconClass;
     }

     public String getDescription() {
          return description;
     }

     public void setDescription(String description) {
          this.description = description;
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

     public User getUser() {
          return user;
     }

     public void setUser(User user) {
          this.user = user;
     }

     public SyllabusFile getSyllabusFile() {
          return syllabusFile;
     }

     public void setSyllabusFile(SyllabusFile syllabusFile) {
          this.syllabusFile = syllabusFile;
     }

}