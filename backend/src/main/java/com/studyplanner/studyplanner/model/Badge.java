package com.studyplanner.studyplanner.model;

import jakarta.persistence.*;

/**
 * Badge — master record for each achievement badge.
 * These are seeded once in the database.
 * ruleType is a string code used in BadgeService to check rules.
 */
@Entity
@Table(name = "badges")
public class Badge {

     @Id
     @GeneratedValue(strategy = GenerationType.IDENTITY)
     private Long id;

     @Column(nullable = false, unique = true)
     private String name;

     @Column(nullable = false, length = 500)
     private String description;

     // FontAwesome icon class e.g. "fa-trophy"
     @Column(nullable = false)
     private String icon;

     // Rule code: FIRST_VIDEO, TEN_VIDEOS, STREAK_7, TEN_SESSIONS,
     // FOCUS_5H, SUBJECT_CHAMPION, COMEBACK
     @Column(nullable = false, unique = true)
     private String ruleType;

     // Threshold value for the rule (e.g. 7 for 7-day streak)
     @Column(nullable = false)
     private Integer ruleValue;

     // ── Getters & Setters ──────────────────────

     public Long getId() {
          return id;
     }

     public void setId(Long id) {
          this.id = id;
     }

     public String getName() {
          return name;
     }

     public void setName(String name) {
          this.name = name;
     }

     public String getDescription() {
          return description;
     }

     public void setDescription(String description) {
          this.description = description;
     }

     public String getIcon() {
          return icon;
     }

     public void setIcon(String icon) {
          this.icon = icon;
     }

     public String getRuleType() {
          return ruleType;
     }

     public void setRuleType(String ruleType) {
          this.ruleType = ruleType;
     }

     public Integer getRuleValue() {
          return ruleValue;
     }

     public void setRuleValue(Integer ruleValue) {
          this.ruleValue = ruleValue;
     }
}
