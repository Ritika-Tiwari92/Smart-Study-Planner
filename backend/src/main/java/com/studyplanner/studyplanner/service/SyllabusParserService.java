package com.studyplanner.studyplanner.service;

import com.studyplanner.studyplanner.model.SyllabusChapter;
import com.studyplanner.studyplanner.model.SyllabusFile;
import com.studyplanner.studyplanner.model.SyllabusTopic;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileInputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Rule-based syllabus parser.
 * Used for safe text extraction from PDF, DOCX, and TXT.
 */
@Service
public class SyllabusParserService {

     private static final Pattern CHAPTER_PATTERN = Pattern.compile(
               "^(chapter|unit|module|section|part)\\s*[\\d]+[:\\s-]*(.*)$",
               Pattern.CASE_INSENSITIVE);

     private static final Pattern NUMBERED_PATTERN = Pattern.compile(
               "^(\\d{1,2})[.):\\-]\\s+(.+)$");

     private static final List<String> HARD_KEYWORDS = List.of(
               "algorithm", "complexity", "advanced", "implement", "design",
               "analysis", "optimization", "theorem", "proof", "synchronization",
               "deadlock", "normalization", "cryptography", "compilation");

     private static final List<String> EASY_KEYWORDS = List.of(
               "introduction", "overview", "basics", "what is", "definition",
               "history", "concept", "types of", "classification", "features");

     public void parseSyllabusAndAttach(SyllabusFile syllabusFile, File file, String fileType) {
          try {
               String rawText = extractTextFromFile(file, fileType);
               List<SyllabusChapter> chapters = parseTextIntoChapters(rawText, syllabusFile);
               syllabusFile.setChapters(chapters);
          } catch (Exception e) {
               System.err.println("Syllabus parsing failed: " + e.getMessage());
          }
     }

     public String extractTextFromFile(File file, String fileType) throws Exception {
          return switch (fileType.toLowerCase()) {
               case "pdf" -> extractFromPdf(file);
               case "docx" -> extractFromDocx(file);
               case "txt" -> extractFromTxt(file);
               default -> throw new IllegalArgumentException("Unsupported file type: " + fileType);
          };
     }

     private String extractFromPdf(File file) throws Exception {
          try (PDDocument doc = Loader.loadPDF(file)) {
               PDFTextStripper stripper = new PDFTextStripper();
               return stripper.getText(doc);
          }
     }

     private String extractFromDocx(File file) throws Exception {
          try (FileInputStream fis = new FileInputStream(file);
                    XWPFDocument doc = new XWPFDocument(fis)) {

               StringBuilder sb = new StringBuilder();

               for (XWPFParagraph para : doc.getParagraphs()) {
                    String text = para.getText().trim();

                    if (!text.isEmpty()) {
                         sb.append(text).append("\n");
                    }
               }

               return sb.toString();
          }
     }

     private String extractFromTxt(File file) throws Exception {
          return new String(java.nio.file.Files.readAllBytes(file.toPath()));
     }

     private List<SyllabusChapter> parseTextIntoChapters(String text, SyllabusFile syllabusFile) {
          List<SyllabusChapter> chapters = new ArrayList<>();
          String[] lines = text.split("\\r?\\n");

          SyllabusChapter currentChapter = null;
          int chapterCount = 0;
          int topicCount = 0;

          for (String rawLine : lines) {
               String line = rawLine.trim();

               if (line.isEmpty()) {
                    continue;
               }

               String detectedTitle = detectChapterHeading(line);

               if (detectedTitle != null) {
                    if (currentChapter != null) {
                         chapters.add(currentChapter);
                    }

                    chapterCount++;
                    topicCount = 0;

                    currentChapter = new SyllabusChapter();
                    currentChapter.setChapterNumber(chapterCount);
                    currentChapter.setChapterTitle(detectedTitle);
                    currentChapter.setSyllabusFile(syllabusFile);

                    String difficulty = estimateDifficulty(detectedTitle);
                    currentChapter.setDifficulty(difficulty);
                    currentChapter.setEstimatedHours(hoursForDifficulty(difficulty));
                    currentChapter.setEstimatedLectures(lecturesForDifficulty(difficulty));
                    currentChapter.setTopics(new ArrayList<>());

               } else if (currentChapter != null && isTopicLine(line)) {
                    topicCount++;

                    SyllabusTopic topic = new SyllabusTopic();
                    topic.setTopicNumber(topicCount);
                    topic.setTopicTitle(cleanTopicLine(line));
                    topic.setTopicDescription("");
                    topic.setChapter(currentChapter);

                    String topicDiff = estimateDifficulty(line);
                    topic.setDifficulty(topicDiff);
                    topic.setEstimatedHours(hoursForDifficulty(topicDiff));
                    topic.setRecommendedWeek(Math.max(1, chapterCount));
                    topic.setPlannerCreated(false);

                    currentChapter.getTopics().add(topic);
               }
          }

          if (currentChapter != null) {
               chapters.add(currentChapter);
          }

          if (chapters.isEmpty()) {
               chapters.add(createFallbackChapter(syllabusFile));
          }

          return chapters;
     }

     private String detectChapterHeading(String line) {
          Matcher chapterMatcher = CHAPTER_PATTERN.matcher(line);

          if (chapterMatcher.matches()) {
               String title = chapterMatcher.group(2).trim();
               return title.isEmpty() ? line : title;
          }

          Matcher numberedMatcher = NUMBERED_PATTERN.matcher(line);

          if (numberedMatcher.matches()) {
               return numberedMatcher.group(2).trim();
          }

          if (line.equals(line.toUpperCase())
                    && line.length() > 4
                    && line.length() < 80
                    && line.matches(".*[A-Z].*")) {
               return toTitleCase(line);
          }

          return null;
     }

     private boolean isTopicLine(String line) {
          if (line.length() < 3 || line.length() > 200) {
               return false;
          }

          if (line.matches("^\\d+$")) {
               return false;
          }

          return !line.matches("^[^a-zA-Z]+$");
     }

     private String cleanTopicLine(String line) {
          return line.replaceAll("^[•\\-*>\\d.)]+\\s*", "").trim();
     }

     private String estimateDifficulty(String text) {
          String lower = text.toLowerCase();

          for (String keyword : HARD_KEYWORDS) {
               if (lower.contains(keyword)) {
                    return "hard";
               }
          }

          for (String keyword : EASY_KEYWORDS) {
               if (lower.contains(keyword)) {
                    return "easy";
               }
          }

          return "medium";
     }

     private Double hoursForDifficulty(String difficulty) {
          return switch (difficulty) {
               case "hard" -> 3.0;
               case "easy" -> 1.0;
               default -> 2.0;
          };
     }

     private Integer lecturesForDifficulty(String difficulty) {
          return switch (difficulty) {
               case "hard" -> 3;
               case "easy" -> 1;
               default -> 2;
          };
     }

     private SyllabusChapter createFallbackChapter(SyllabusFile syllabusFile) {
          SyllabusChapter fallback = new SyllabusChapter();
          fallback.setChapterNumber(1);
          fallback.setChapterTitle("Full Syllabus");
          fallback.setDifficulty("medium");
          fallback.setEstimatedHours(2.0);
          fallback.setEstimatedLectures(2);
          fallback.setSyllabusFile(syllabusFile);
          fallback.setTopics(new ArrayList<>());
          return fallback;
     }

     private String toTitleCase(String input) {
          String[] words = input.toLowerCase().split("\\s+");
          StringBuilder sb = new StringBuilder();

          for (String word : words) {
               if (!word.isEmpty()) {
                    sb.append(Character.toUpperCase(word.charAt(0)))
                              .append(word.substring(1))
                              .append(" ");
               }
          }

          return sb.toString().trim();
     }
}