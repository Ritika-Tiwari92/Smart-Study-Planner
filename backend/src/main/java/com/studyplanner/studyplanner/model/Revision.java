package com.studyplanner.studyplanner.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "revisions")
public class Revision {

     @Id
     @GeneratedValue(strategy = GenerationType.IDENTITY)
     private Long id;

     private String title;

     private String subject;

     private String priority;

     private LocalDate revisionDate;

     private String status;

     @Column(length = 1000)
     private String description;

     public Revision() {
     }

     public Long getId() {
          return id;
     }

     public void setId(Long id) {
          this.id = id;
     }

     public String getTitle() {
          return title;
     }

     public void setTitle(String title) {
          this.title = title;
     }

     public String getSubject() {
          return subject;
     }

     public void setSubject(String subject) {
          this.subject = subject;
     }

     public String getPriority() {
          return priority;
     }

     public void setPriority(String priority) {
          this.priority = priority;
     }

     public LocalDate getRevisionDate() {
          return revisionDate;
     }

     public void setRevisionDate(LocalDate revisionDate) {
          this.revisionDate = revisionDate;
     }

     public String getStatus() {
          return status;
     }

     public void setStatus(String status) {
          this.status = status;
     }

     public String getDescription() {
          return description;
     }

     public void setDescription(String description) {
          this.description = description;
     }
}
