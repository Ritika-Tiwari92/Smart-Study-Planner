package com.studyplanner.studyplanner.service;

import com.studyplanner.studyplanner.dto.YouTubeVideoAnalyzeResponseDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class YouTubeVideoAnalyzerService {

     private final WebClient webClient;
     private final String youtubeApiKey;

     public YouTubeVideoAnalyzerService(
               @Value("${youtube.api.key:}") String youtubeApiKey) {

          this.youtubeApiKey = youtubeApiKey;

          this.webClient = WebClient.builder()
                    .baseUrl("https://www.googleapis.com/youtube/v3")
                    .build();
     }

     public YouTubeVideoAnalyzeResponseDto analyzeVideo(String videoUrl) {
          if (videoUrl == null || videoUrl.isBlank()) {
               throw new RuntimeException("YouTube video URL is required.");
          }

          String videoId = extractVideoId(videoUrl);

          if (videoId == null || videoId.isBlank()) {
               throw new RuntimeException("Invalid YouTube video URL.");
          }

          if (youtubeApiKey == null || youtubeApiKey.isBlank()) {
               throw new RuntimeException(
                         "YouTube API key is missing. Please set YOUTUBE_API_KEY environment variable.");
          }

          Map<String, Object> response = webClient.get()
                    .uri(uriBuilder -> uriBuilder
                              .path("/videos")
                              .queryParam("part", "snippet,contentDetails")
                              .queryParam("id", videoId)
                              .queryParam("key", youtubeApiKey)
                              .build())
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {
                    })
                    .block(Duration.ofSeconds(25));

          Map<String, Object> item = extractFirstItem(response);

          Map<String, Object> snippet = asMap(item.get("snippet"));
          Map<String, Object> contentDetails = asMap(item.get("contentDetails"));

          String title = stringValue(snippet.get("title"));
          String channelTitle = stringValue(snippet.get("channelTitle"));
          String isoDuration = stringValue(contentDetails.get("duration"));

          int durationSeconds = parseIsoDurationSeconds(isoDuration);
          int durationMinutes = Math.max(1, (int) Math.ceil(durationSeconds / 60.0));

          YouTubeVideoAnalyzeResponseDto dto = new YouTubeVideoAnalyzeResponseDto();

          dto.setVideoId(videoId);
          dto.setTitle(title);
          dto.setChannelTitle(channelTitle);
          dto.setThumbnailUrl(extractThumbnailUrl(snippet));
          dto.setDurationSeconds(durationSeconds);
          dto.setDurationMinutes(durationMinutes);
          dto.setRecommendedMode(getRecommendedMode(durationMinutes));
          dto.setRecommendationMessage(buildRecommendationMessage(title, durationMinutes));
          dto.setSessionPlan(buildSessionPlan(durationMinutes));

          return dto;
     }

     private String extractVideoId(String url) {
          String value = url.trim();

          if (value.matches("^[a-zA-Z0-9_-]{11}$")) {
               return value;
          }

          if (value.contains("youtu.be/")) {
               String part = value.substring(value.indexOf("youtu.be/") + 9);
               return cleanVideoId(part);
          }

          if (value.contains("watch?v=")) {
               String part = value.substring(value.indexOf("watch?v=") + 8);
               return cleanVideoId(part);
          }

          if (value.contains("/embed/")) {
               String part = value.substring(value.indexOf("/embed/") + 7);
               return cleanVideoId(part);
          }

          if (value.contains("/shorts/")) {
               String part = value.substring(value.indexOf("/shorts/") + 8);
               return cleanVideoId(part);
          }

          return null;
     }

     private String cleanVideoId(String value) {
          if (value == null)
               return null;

          String cleaned = value;

          int ampIndex = cleaned.indexOf("&");
          if (ampIndex >= 0)
               cleaned = cleaned.substring(0, ampIndex);

          int questionIndex = cleaned.indexOf("?");
          if (questionIndex >= 0)
               cleaned = cleaned.substring(0, questionIndex);

          int slashIndex = cleaned.indexOf("/");
          if (slashIndex >= 0)
               cleaned = cleaned.substring(0, slashIndex);

          cleaned = cleaned.trim();

          return cleaned.length() == 11 ? cleaned : null;
     }

     private Map<String, Object> extractFirstItem(Map<String, Object> response) {
          if (response == null) {
               throw new RuntimeException("YouTube API returned empty response.");
          }

          Object itemsObj = response.get("items");

          if (!(itemsObj instanceof List<?> items) || items.isEmpty()) {
               throw new RuntimeException("No YouTube video found for this URL.");
          }

          Object first = items.get(0);

          if (!(first instanceof Map<?, ?> map)) {
               throw new RuntimeException("Invalid YouTube video response.");
          }

          return (Map<String, Object>) map;
     }

     private Map<String, Object> asMap(Object value) {
          if (value instanceof Map<?, ?> map) {
               return (Map<String, Object>) map;
          }

          return Map.of();
     }

     private String stringValue(Object value) {
          return value == null ? "" : value.toString();
     }

     private String extractThumbnailUrl(Map<String, Object> snippet) {
          Map<String, Object> thumbnails = asMap(snippet.get("thumbnails"));

          for (String key : List.of("maxres", "standard", "high", "medium", "default")) {
               Map<String, Object> thumb = asMap(thumbnails.get(key));

               String url = stringValue(thumb.get("url"));

               if (!url.isBlank()) {
                    return url;
               }
          }

          return "";
     }

     private int parseIsoDurationSeconds(String isoDuration) {
          if (isoDuration == null || isoDuration.isBlank()) {
               return 0;
          }

          Duration duration = Duration.parse(isoDuration);
          return (int) duration.getSeconds();
     }

     private String getRecommendedMode(int durationMinutes) {
          if (durationMinutes <= 10)
               return "Quick Focus";
          if (durationMinutes <= 25)
               return "Single Focus Session";
          if (durationMinutes <= 50)
               return "Focus + Short Break";
          return "Deep Study Plan";
     }

     private String buildRecommendationMessage(String title, int durationMinutes) {
          String safeTitle = title == null || title.isBlank() ? "this video" : title;

          if (durationMinutes <= 10) {
               return "This is a short video. Watch it in one focused session and write 3 key points.";
          }

          if (durationMinutes <= 25) {
               return "Set your timer to " + durationMinutes + " minutes for \"" + safeTitle
                         + "\" and complete it in one focused session.";
          }

          if (durationMinutes <= 50) {
               return "This video is medium length. Use one 25-minute focus session, take a 5-minute break, then finish the remaining part.";
          }

          return "This is a long study video. Split it into multiple Pomodoro sessions with breaks to avoid overload.";
     }

     private List<String> buildSessionPlan(int durationMinutes) {
          List<String> plan = new ArrayList<>();

          if (durationMinutes <= 10) {
               plan.add(durationMinutes + " min: Watch video carefully");
               plan.add("3 min: Write quick notes");
               plan.add("2 min: Recall the main idea");
               return plan;
          }

          if (durationMinutes <= 25) {
               plan.add(durationMinutes + " min: Complete video in one focus session");
               plan.add("5 min: Make summary notes");
               plan.add("3 min: Self-test important points");
               return plan;
          }

          if (durationMinutes <= 50) {
               plan.add("25 min: Watch first part with notes");
               plan.add("5 min: Short break");
               plan.add((durationMinutes - 25) + " min: Watch remaining part");
               plan.add("5 min: Revise key points");
               return plan;
          }

          int remaining = durationMinutes;
          int session = 1;

          while (remaining > 0) {
               int focus = Math.min(25, remaining);
               plan.add("Session " + session + ": " + focus + " min focus");
               remaining -= focus;

               if (remaining > 0) {
                    plan.add("Break: 5 min");
               }

               session++;
          }

          plan.add("Final 10 min: Write summary and doubts");

          return plan;
     }
}