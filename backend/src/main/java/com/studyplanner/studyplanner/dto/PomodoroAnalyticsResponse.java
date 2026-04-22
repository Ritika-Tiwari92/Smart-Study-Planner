package com.studyplanner.studyplanner.dto;

import java.util.List;
import java.util.Map;

// Yeh DTO analytics page ke liye sara data ek saath bhejta hai

public class PomodoroAnalyticsResponse {

     // ─── Summary Cards ────────────────────────────────────────────────────────
     private long totalFocusMinutes; // e.g. 340
     private long totalCompletedSessions; // e.g. 18
     private long totalInterruptedSessions; // e.g. 3
     private double averageDailyFocusMinutes; // e.g. 48.5
     private long activeDaysThisWeek; // e.g. 5
     private String mostFocusedSubject; // e.g. "Java"
     private double breakBalanceRatio; // e.g. 0.28

     // ─── Productivity Score ───────────────────────────────────────────────────
     private int productivityScore; // 0–100
     private String productivityLabel; // "Excellent", "Strong", "Improving", "Low Consistency"

     // ─── Chart Data ───────────────────────────────────────────────────────────

     // Daily focus — last 7 days
     // e.g. [{"date":"2025-01-20","minutes":45}, ...]
     private List<Map<String, Object>> dailyFocusData;

     // Subject wise — e.g. [{"subject":"Java","minutes":120}, ...]
     private List<Map<String, Object>> subjectFocusData;

     // Weekly sessions — e.g. [{"week":"Week 1","sessions":8}, ...]
     private List<Map<String, Object>> weeklySessionData;

     // ─── Insight Texts ────────────────────────────────────────────────────────
     private List<String> insights; // Human-readable lines

     public PomodoroAnalyticsResponse() {
     }

     // Getters & Setters
     public long getTotalFocusMinutes() {
          return totalFocusMinutes;
     }

     public void setTotalFocusMinutes(long totalFocusMinutes) {
          this.totalFocusMinutes = totalFocusMinutes;
     }

     public long getTotalCompletedSessions() {
          return totalCompletedSessions;
     }

     public void setTotalCompletedSessions(long totalCompletedSessions) {
          this.totalCompletedSessions = totalCompletedSessions;
     }

     public long getTotalInterruptedSessions() {
          return totalInterruptedSessions;
     }

     public void setTotalInterruptedSessions(long totalInterruptedSessions) {
          this.totalInterruptedSessions = totalInterruptedSessions;
     }

     public double getAverageDailyFocusMinutes() {
          return averageDailyFocusMinutes;
     }

     public void setAverageDailyFocusMinutes(double averageDailyFocusMinutes) {
          this.averageDailyFocusMinutes = averageDailyFocusMinutes;
     }

     public long getActiveDaysThisWeek() {
          return activeDaysThisWeek;
     }

     public void setActiveDaysThisWeek(long activeDaysThisWeek) {
          this.activeDaysThisWeek = activeDaysThisWeek;
     }

     public String getMostFocusedSubject() {
          return mostFocusedSubject;
     }

     public void setMostFocusedSubject(String mostFocusedSubject) {
          this.mostFocusedSubject = mostFocusedSubject;
     }

     public double getBreakBalanceRatio() {
          return breakBalanceRatio;
     }

     public void setBreakBalanceRatio(double breakBalanceRatio) {
          this.breakBalanceRatio = breakBalanceRatio;
     }

     public int getProductivityScore() {
          return productivityScore;
     }

     public void setProductivityScore(int productivityScore) {
          this.productivityScore = productivityScore;
     }

     public String getProductivityLabel() {
          return productivityLabel;
     }

     public void setProductivityLabel(String productivityLabel) {
          this.productivityLabel = productivityLabel;
     }

     public List<Map<String, Object>> getDailyFocusData() {
          return dailyFocusData;
     }

     public void setDailyFocusData(List<Map<String, Object>> dailyFocusData) {
          this.dailyFocusData = dailyFocusData;
     }

     public List<Map<String, Object>> getSubjectFocusData() {
          return subjectFocusData;
     }

     public void setSubjectFocusData(List<Map<String, Object>> subjectFocusData) {
          this.subjectFocusData = subjectFocusData;
     }

     public List<Map<String, Object>> getWeeklySessionData() {
          return weeklySessionData;
     }

     public void setWeeklySessionData(List<Map<String, Object>> weeklySessionData) {
          this.weeklySessionData = weeklySessionData;
     }

     public List<String> getInsights() {
          return insights;
     }

     public void setInsights(List<String> insights) {
          this.insights = insights;
     }
}
