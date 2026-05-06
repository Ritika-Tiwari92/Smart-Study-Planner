package com.studyplanner.studyplanner.dto;

import java.util.List;

public class YouTubeVideoAnalyzeResponseDto {

     private String videoId;
     private String title;
     private String channelTitle;
     private String thumbnailUrl;
     private Integer durationMinutes;
     private Integer durationSeconds;
     private String recommendedMode;
     private String recommendationMessage;
     private List<String> sessionPlan;

     public YouTubeVideoAnalyzeResponseDto() {
     }

     public String getVideoId() {
          return videoId;
     }

     public void setVideoId(String videoId) {
          this.videoId = videoId;
     }

     public String getTitle() {
          return title;
     }

     public void setTitle(String title) {
          this.title = title;
     }

     public String getChannelTitle() {
          return channelTitle;
     }

     public void setChannelTitle(String channelTitle) {
          this.channelTitle = channelTitle;
     }

     public String getThumbnailUrl() {
          return thumbnailUrl;
     }

     public void setThumbnailUrl(String thumbnailUrl) {
          this.thumbnailUrl = thumbnailUrl;
     }

     public Integer getDurationMinutes() {
          return durationMinutes;
     }

     public void setDurationMinutes(Integer durationMinutes) {
          this.durationMinutes = durationMinutes;
     }

     public Integer getDurationSeconds() {
          return durationSeconds;
     }

     public void setDurationSeconds(Integer durationSeconds) {
          this.durationSeconds = durationSeconds;
     }

     public String getRecommendedMode() {
          return recommendedMode;
     }

     public void setRecommendedMode(String recommendedMode) {
          this.recommendedMode = recommendedMode;
     }

     public String getRecommendationMessage() {
          return recommendationMessage;
     }

     public void setRecommendationMessage(String recommendationMessage) {
          this.recommendationMessage = recommendationMessage;
     }

     public List<String> getSessionPlan() {
          return sessionPlan;
     }

     public void setSessionPlan(List<String> sessionPlan) {
          this.sessionPlan = sessionPlan;
     }
}