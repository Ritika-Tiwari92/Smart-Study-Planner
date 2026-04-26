package com.studyplanner.studyplanner.service;

import com.studyplanner.studyplanner.model.SyllabusChapter;
import com.studyplanner.studyplanner.model.SyllabusFile;
import com.studyplanner.studyplanner.model.SyllabusTopic;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.Loader;
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
 *
 * Algorithm (for viva explanation):
 * 1. Read file as plain text (PDF via PDFBox, DOCX via Apache POI, TXT
 * directly)
 * 2. Split text into lines
 * 3. Identify chapter headings using patterns:
 * - "Chapter 1", "CHAPTER 1", "Unit 1", "UNIT 1"
 * - Numbered lines: "1.", "1)", "1 -"
 * - ALL CAPS lines (likely headings)
 * 4. Lines under a chapter heading = topics
 * 5. Estimate difficulty from keywords:
 * - hard keywords: algorithm, complex, advanced, implement, design, analysis
 * - easy keywords: introduction, overview, basics, what is, definition
 * - else: medium
 * 6. Estimate hours: hard=3h, medium=2h, easy=1h per chapter
 * 7. Estimate lectures: hard=3, medium=2, easy=1
 */
@Service
public class SyllabusParserService {

     // Pattern to detect chapter/unit headings
     private static final Pattern CHAPTER_PATTERN = Pattern.compile(
               "^(chapter|unit|module|section|part)\\s*[\\d]+[:\\s-]*(.*)$",
               Pattern.CASE_INSENSITIVE);

     // Pattern for numbered lines: "1.", "1)", "1 -", "1:"
     private static final Pattern NUMBERED_PATTERN = Pattern.compile(
               "^(\\d{1,2})[.):\\-]\\s+(.+)$");

     // Keywords that suggest hard difficulty
     private static final List<String> HARD_KEYWORDS = List.of(
               "algorithm", "complexity", "advanced", "implement", "design",
               "analysis", "optimization", "theorem", "proof", "synchronization",
               "deadlock", "normalization", "cryptography", "compilation");

     // Keywords that suggest easy difficulty
     private static final List<String> EASY_KEYWORDS = List.of(
               "introduction", "overview", "basics", "what is", "definition",
               "history", "concept", "types of", "classification", "features");

     /**
      * Main entry point — parse file and attach chapters/topics to syllabusFile
      * entity.
      */
     public void parseSyllabusAndAttach(SyllabusFile syllabusFile, File file, String fileType) {
          try {
               String rawText = extractTextFromFile(file, fileType);
               List<SyllabusChapter> chapters = parseTextIntoChapters(rawText, syllabusFile);
               syllabusFile.setChapters(chapters);
          } catch (Exception e) {
               // If parsing fails, still save the file — just without chapters
               System.err.println("Syllabus parsing failed: " + e.getMessage());
          }
     }

     // -----------------------------------------------------------------------
     // TEXT EXTRACTION
     // -----------------------------------------------------------------------

     private String extractTextFromFile(File file, String fileType) throws Exception {
          return switch (fileType.toLowerCase()) {
               case "pdf" -> extractFromPdf(file);
               case "docx" -> extractFromDocx(file);
               case "txt" -> extractFromTxt(file);
               default -> throw new IllegalArgumentException(
                         "Unsupported file type: " + fileType);
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

     // -----------------------------------------------------------------------
     // PARSING LOGIC
     // -----------------------------------------------------------------------

     private List<SyllabusChapter> parseTextIntoChapters(String text,
               SyllabusFile syllabusFile) {
          List<SyllabusChapter> chapters = new ArrayList<>();
          String[] lines = text.split("\\r?\\n");

          SyllabusChapter currentChapter = null;
          int chapterCount = 0;
          int topicCount = 0;

          for (String rawLine : lines) {
               String line = rawLine.trim();
               if (line.isEmpty())
                    continue;

               // --- Check if this line is a chapter heading ---
               String detectedTitle = detectChapterHeading(line);

               if (detectedTitle != null) {
                    // Save previous chapter if exists
                    if (currentChapter != null) {
                         chapters.add(currentChapter);
                    }

                    // Start new chapter
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
                    // This line is a topic under current chapter
                    topicCount++;
                    SyllabusTopic topic = new SyllabusTopic();
                    topic.setTopicNumber(topicCount);
                    topic.setTopicTitle(cleanTopicLine(line));
                    topic.setChapter(currentChapter);

                    String topicDiff = estimateDifficulty(line);
                    topic.setDifficulty(topicDiff);
                    topic.setEstimatedHours(hoursForDifficulty(topicDiff));
                    currentChapter.getTopics().add(topic);
               }
          }

          // Don't forget the last chapter
          if (currentChapter != null) {
               chapters.add(currentChapter);
          }

          // If parser found nothing, create one fallback chapter
          if (chapters.isEmpty()) {
               chapters.add(createFallbackChapter(syllabusFile));
          }

          return chapters;
     }

     /**
      * Detects if a line is a chapter heading.
      * Returns cleaned title or null if not a heading.
      */
     private String detectChapterHeading(String line) {
          // Match "Chapter 1: OSI Model", "Unit 2 - Networking" etc.
          Matcher chapterMatcher = CHAPTER_PATTERN.matcher(line);
          if (chapterMatcher.matches()) {
               String title = chapterMatcher.group(2).trim();
               return title.isEmpty() ? line : line;
          }

          // Match "1. Introduction", "2) Networking Basics"
          Matcher numberedMatcher = NUMBERED_PATTERN.matcher(line);
          if (numberedMatcher.matches()) {
               return numberedMatcher.group(2).trim();
          }

          // ALL CAPS line with reasonable length = likely a heading
          if (line.equals(line.toUpperCase())
                    && line.length() > 4
                    && line.length() < 80
                    && line.matches(".*[A-Z].*")) {
               return toTitleCase(line);
          }

          return null;
     }

     private boolean isTopicLine(String line) {
          // Skip very short or very long lines
          if (line.length() < 3 || line.length() > 200)
               return false;
          // Skip lines that look like page numbers
          if (line.matches("^\\d+$"))
               return false;
          // Skip lines that are just punctuation
          if (line.matches("^[^a-zA-Z]+$"))
               return false;
          return true;
     }

     private String cleanTopicLine(String line) {
          // Remove leading bullets, dashes, numbers
          return line.replaceAll("^[•\\-*>\\d.)]+\\s*", "").trim();
     }

     // -----------------------------------------------------------------------
     // DIFFICULTY ESTIMATION
     // -----------------------------------------------------------------------

     private String estimateDifficulty(String text) {
          String lower = text.toLowerCase();

          for (String keyword : HARD_KEYWORDS) {
               if (lower.contains(keyword))
                    return "hard";
          }
          for (String keyword : EASY_KEYWORDS) {
               if (lower.contains(keyword))
                    return "easy";
          }
          return "medium";
     }

     private Double hoursForDifficulty(String difficulty) {
          return switch (difficulty) {
               case "hard" -> 3.0;
               case "easy" -> 1.0;
               default -> 2.0; // medium
          };
     }

     private Integer lecturesForDifficulty(String difficulty) {
          return switch (difficulty) {
               case "hard" -> 3;
               case "easy" -> 1;
               default -> 2;
          };
     }

     // -----------------------------------------------------------------------
     // HELPERS
     // -----------------------------------------------------------------------

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