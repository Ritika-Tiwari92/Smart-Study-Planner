package com.studyplanner.studyplanner.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class SyllabusService {

     public Map<String, Object> processSyllabusFile(MultipartFile file, Long userId) {
          if (file == null || file.isEmpty()) {
               throw new RuntimeException("Uploaded file is empty.");
          }

          try {
               String fileName = file.getOriginalFilename() != null
                         ? file.getOriginalFilename()
                         : "uploaded-file";

               String content = new String(file.getBytes(), StandardCharsets.UTF_8).trim();

               if (content.isBlank()) {
                    throw new RuntimeException("Uploaded syllabus file has no readable content.");
               }

               List<String> lines = extractCleanLines(content);
               List<Map<String, Object>> chapters = parseChaptersAndTopics(lines);

               int totalTopics = chapters.stream()
                         .mapToInt(ch -> {
                              Object topicsObj = ch.get("topics");
                              if (topicsObj instanceof List<?> topicList) {
                                   return topicList.size();
                              }
                              return 0;
                         })
                         .sum();

               Map<String, Object> response = new LinkedHashMap<>();
               response.put("message", "Syllabus uploaded and parsed successfully.");
               response.put("userId", userId);
               response.put("fileName", fileName);
               response.put("totalLines", lines.size());
               response.put("totalChapters", chapters.size());
               response.put("totalTopics", totalTopics);
               response.put("chapters", chapters);
               response.put("contentPreview", buildPreview(content));

               return response;

          } catch (Exception e) {
               throw new RuntimeException("Failed to process syllabus file: " + e.getMessage(), e);
          }
     }

     private List<String> extractCleanLines(String content) {
          String[] rawLines = content.split("\\r?\\n");
          List<String> cleanLines = new ArrayList<>();

          for (String rawLine : rawLines) {
               String line = rawLine == null ? "" : rawLine.trim();

               if (line.isBlank()) {
                    continue;
               }

               cleanLines.add(line);
          }

          return cleanLines;
     }

     private List<Map<String, Object>> parseChaptersAndTopics(List<String> lines) {
          List<Map<String, Object>> chapters = new ArrayList<>();

          Map<String, Object> currentChapter = null;
          List<String> currentTopics = null;
          int chapterCounter = 0;

          for (String line : lines) {
               if (looksLikeChapter(line)) {
                    if (currentChapter != null && currentTopics != null) {
                         currentChapter.put("topics", currentTopics);
                         chapters.add(currentChapter);
                    }

                    chapterCounter++;

                    currentChapter = new LinkedHashMap<>();
                    currentChapter.put("chapterNumber", extractChapterNumber(line, chapterCounter));
                    currentChapter.put("chapterTitle", extractChapterTitle(line));

                    currentTopics = new ArrayList<>();
               } else {
                    if (currentChapter == null) {
                         chapterCounter++;

                         currentChapter = new LinkedHashMap<>();
                         currentChapter.put("chapterNumber", chapterCounter);
                         currentChapter.put("chapterTitle", "General Topics");

                         currentTopics = new ArrayList<>();
                    }

                    String topic = normalizeTopicLine(line);
                    if (!topic.isBlank()) {
                         currentTopics.add(topic);
                    }
               }
          }

          if (currentChapter != null && currentTopics != null) {
               currentChapter.put("topics", currentTopics);
               chapters.add(currentChapter);
          }

          return chapters;
     }

     private boolean looksLikeChapter(String line) {
          String normalized = line.toLowerCase(Locale.ROOT).trim();

          return normalized.matches("^chapter\\s*\\d+.*")
                    || normalized.matches("^unit\\s*\\d+.*")
                    || normalized.matches("^module\\s*\\d+.*")
                    || normalized.matches("^ch\\.?\\s*\\d+.*");
     }

     private int extractChapterNumber(String line, int fallback) {
          Pattern pattern = Pattern.compile("(\\d+)");
          Matcher matcher = pattern.matcher(line);

          if (matcher.find()) {
               try {
                    return Integer.parseInt(matcher.group(1));
               } catch (NumberFormatException ignored) {
                    return fallback;
               }
          }

          return fallback;
     }

     private String extractChapterTitle(String line) {
          String cleaned = line
                    .replaceFirst("(?i)^chapter\\s*\\d+\\s*[:.-]?", "")
                    .replaceFirst("(?i)^unit\\s*\\d+\\s*[:.-]?", "")
                    .replaceFirst("(?i)^module\\s*\\d+\\s*[:.-]?", "")
                    .replaceFirst("(?i)^ch\\.?\\s*\\d+\\s*[:.-]?", "")
                    .trim();

          if (cleaned.isBlank()) {
               return "Untitled Chapter";
          }

          return cleaned;
     }

     private String normalizeTopicLine(String line) {
          return line
                    .replaceFirst("^[-•*]\\s*", "")
                    .replaceFirst("^\\d+[.)]\\s*", "")
                    .trim();
     }

     private String buildPreview(String content) {
          final int maxLength = 300;
          if (content.length() <= maxLength) {
               return content;
          }
          return content.substring(0, maxLength) + "...";
     }
}