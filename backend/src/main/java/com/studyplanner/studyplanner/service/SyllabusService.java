package com.studyplanner.studyplanner.service;

import com.studyplanner.studyplanner.exception.ResourceNotFoundException;
import com.studyplanner.studyplanner.model.Planner;
import com.studyplanner.studyplanner.model.Subject;
import com.studyplanner.studyplanner.model.SyllabusChapter;
import com.studyplanner.studyplanner.model.SyllabusFile;
import com.studyplanner.studyplanner.model.SyllabusTopic;
import com.studyplanner.studyplanner.repository.PlannerRepository;
import com.studyplanner.studyplanner.repository.SubjectRepository;
import com.studyplanner.studyplanner.repository.SyllabusFileRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Service
public class SyllabusService {

     private final SubjectRepository subjectRepository;
     private final SyllabusFileRepository syllabusFileRepository;
     private final SyllabusParserService syllabusParserService;
     private final GroqSyllabusAiService groqSyllabusAiService;
     private final PlannerService plannerService;
     private final PlannerRepository plannerRepository;

     @Value("${app.syllabus.upload-dir:uploads/syllabus}")
     private String uploadDir;

     public SyllabusService(
               SubjectRepository subjectRepository,
               SyllabusFileRepository syllabusFileRepository,
               SyllabusParserService syllabusParserService,
               GroqSyllabusAiService groqSyllabusAiService,
               PlannerService plannerService,
               PlannerRepository plannerRepository) {

          this.subjectRepository = subjectRepository;
          this.syllabusFileRepository = syllabusFileRepository;
          this.syllabusParserService = syllabusParserService;
          this.groqSyllabusAiService = groqSyllabusAiService;
          this.plannerService = plannerService;
          this.plannerRepository = plannerRepository;
     }

     @Transactional
     public Map<String, Object> analyzeAndSaveSyllabus(MultipartFile file, Long subjectId, Long userId) {
          validateFile(file);

          Subject subject = getSubjectForUser(subjectId, userId);

          try {
               deleteOldSyllabusIfExists(subjectId);

               String originalFileName = cleanFileName(file.getOriginalFilename());
               String fileType = getFileType(originalFileName);
               String storedFileName = UUID.randomUUID() + "." + fileType;

               Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
               Files.createDirectories(uploadPath);

               Path targetPath = uploadPath.resolve(storedFileName);
               file.transferTo(targetPath.toFile());

               String extractedText = syllabusParserService.extractTextFromFile(targetPath.toFile(), fileType);

               if (extractedText == null || extractedText.trim().length() < 50) {
                    throw new RuntimeException("Could not extract enough readable text from the syllabus file.");
               }

               Map<String, Object> aiResult = groqSyllabusAiService.analyzeSyllabus(
                         extractedText,
                         subject.getSubjectName());

               SyllabusFile syllabusFile = new SyllabusFile();
               syllabusFile.setOriginalFileName(originalFileName);
               syllabusFile.setStoredFileName(storedFileName);
               syllabusFile.setFilePath(targetPath.toString());
               syllabusFile.setFileType(fileType);
               syllabusFile.setFileSize(file.getSize());
               syllabusFile.setSubject(subject);
               syllabusFile.setUploadedAt(LocalDateTime.now());
               syllabusFile.setAiGeneratedAt(LocalDateTime.now());
               syllabusFile.setPlannerCreated(false);

               attachAiResultToSyllabusFile(syllabusFile, aiResult);

               SyllabusFile savedFile = syllabusFileRepository.save(syllabusFile);
               subject.setSyllabusFile(savedFile);

               return buildAnalysisResponse(savedFile, subject);

          } catch (Exception e) {
               throw new RuntimeException("Syllabus analysis failed: " + e.getMessage(), e);
          }
     }

     @Transactional(readOnly = true)
     public Map<String, Object> getAnalysisBySubject(Long subjectId, Long userId) {
          Subject subject = getSubjectForUser(subjectId, userId);

          SyllabusFile syllabusFile = syllabusFileRepository.findBySubjectId(subjectId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                              "No syllabus analysis found for subjectId: " + subjectId));

          return buildAnalysisResponse(syllabusFile, subject);
     }

     @Transactional
     public Map<String, Object> createWeeklyPlanFromAnalysis(Long subjectId, Long userId) {
          Subject subject = getSubjectForUser(subjectId, userId);

          SyllabusFile syllabusFile = syllabusFileRepository.findBySubjectId(subjectId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                              "No syllabus analysis found for subjectId: " + subjectId));

          List<SyllabusTopic> topics = flattenTopics(syllabusFile);

          if (topics.isEmpty()) {
               throw new RuntimeException("No AI topics found for this syllabus.");
          }

          List<Planner> createdPlans = new ArrayList<>();
          int duplicateCount = 0;

          Map<Integer, Integer> weekTopicIndex = new HashMap<>();
          LocalDate today = LocalDate.now();

          for (SyllabusTopic topic : topics) {
               int week = topic.getRecommendedWeek() == null || topic.getRecommendedWeek() < 1
                         ? 1
                         : topic.getRecommendedWeek();

               int indexInsideWeek = weekTopicIndex.getOrDefault(week, 0);
               weekTopicIndex.put(week, indexInsideWeek + 1);

               LocalDate planDate = today.plusWeeks(week - 1L).plusDays(indexInsideWeek);
               LocalTime planTime = LocalTime.of(18, 0).plusMinutes((long) (indexInsideWeek % 3) * 60);

               String title = "Study: " + topic.getTopicTitle();
               String subjectName = subject.getSubjectName();

               boolean alreadyExists = plannerRepository.existsByUserIdAndTitleAndSubjectAndDate(
                         userId,
                         title,
                         subjectName,
                         planDate);

               if (alreadyExists) {
                    duplicateCount++;
                    topic.setPlannerCreated(true);
                    continue;
               }

               Planner planner = new Planner();
               planner.setTitle(title);
               planner.setSubject(subjectName);
               planner.setDate(planDate);
               planner.setTime(planTime);
               planner.setStatus("PENDING");
               planner.setDescription(buildPlannerDescription(topic, subjectName));

               Planner savedPlan = plannerService.createPlan(userId, planner);
               createdPlans.add(savedPlan);

               topic.setPlannerCreated(true);
          }

          syllabusFile.setPlannerCreated(true);
          syllabusFileRepository.save(syllabusFile);

          Map<String, Object> response = new LinkedHashMap<>();
          response.put("message", "Weekly study plan created successfully.");
          response.put("subjectId", subjectId);
          response.put("subjectName", subject.getSubjectName());
          response.put("createdCount", createdPlans.size());
          response.put("duplicateCount", duplicateCount);
          response.put("plannerCreated", true);
          response.put("plans", createdPlans);

          return response;
     }

     private Subject getSubjectForUser(Long subjectId, Long userId) {
          return subjectRepository.findByIdAndUserId(subjectId, userId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                              "Subject not found with id: " + subjectId));
     }

     private void validateFile(MultipartFile file) {
          if (file == null || file.isEmpty()) {
               throw new RuntimeException("Uploaded syllabus file is empty.");
          }

          String originalFileName = cleanFileName(file.getOriginalFilename());
          String fileType = getFileType(originalFileName);

          List<String> allowedTypes = List.of("pdf", "docx", "txt");

          if (!allowedTypes.contains(fileType)) {
               throw new RuntimeException("Invalid file type. Please upload PDF, DOCX, or TXT.");
          }

          if (file.getSize() > 10 * 1024 * 1024) {
               throw new RuntimeException("File size must be less than 10 MB.");
          }
     }

     private void deleteOldSyllabusIfExists(Long subjectId) {
          syllabusFileRepository.findBySubjectId(subjectId).ifPresent(oldFile -> {
               deletePhysicalFileQuietly(oldFile.getFilePath());
               syllabusFileRepository.delete(oldFile);
               syllabusFileRepository.flush();
          });
     }

     private void deletePhysicalFileQuietly(String filePath) {
          try {
               if (filePath != null && !filePath.isBlank()) {
                    Files.deleteIfExists(Paths.get(filePath));
               }
          } catch (Exception ignored) {
          }
     }

     private String cleanFileName(String fileName) {
          if (fileName == null || fileName.isBlank()) {
               return "syllabus.txt";
          }

          return Paths.get(fileName)
                    .getFileName()
                    .toString()
                    .replaceAll("[^a-zA-Z0-9._-]", "_");
     }

     private String getFileType(String fileName) {
          int dotIndex = fileName.lastIndexOf(".");

          if (dotIndex < 0 || dotIndex == fileName.length() - 1) {
               throw new RuntimeException("File extension is missing.");
          }

          return fileName.substring(dotIndex + 1).toLowerCase(Locale.ROOT);
     }

     @SuppressWarnings("unchecked")
     private void attachAiResultToSyllabusFile(SyllabusFile syllabusFile, Map<String, Object> aiResult) {
          List<Map<String, Object>> topics = (List<Map<String, Object>>) aiResult.get("topics");

          if (topics == null || topics.isEmpty()) {
               throw new RuntimeException("AI did not return syllabus topics.");
          }

          double totalHours = asDouble(aiResult.get("totalHours"), calculateTotalHours(topics));
          int weeksNeeded = asInt(aiResult.get("weeksNeeded"), Math.max(1, (int) Math.ceil(topics.size() / 4.0)));
          String overallDifficulty = safeString(aiResult.get("overallDifficulty"), "medium");
          String studyTips = safeString(aiResult.get("studyTips"),
                    "Revise difficult topics first and practice regularly.");

          syllabusFile.setTotalHours(totalHours);
          syllabusFile.setWeeksNeeded(weeksNeeded);
          syllabusFile.setOverallDifficulty(normalizeDifficulty(overallDifficulty));
          syllabusFile.setStudyTips(studyTips);

          Map<Integer, SyllabusChapter> weekChapterMap = new TreeMap<>();

          int topicCounter = 0;

          for (Map<String, Object> topicMap : topics) {
               topicCounter++;

               int recommendedWeek = asInt(topicMap.get("recommendedWeek"),
                         Math.min(weeksNeeded, Math.max(1, (int) Math.ceil(topicCounter / 4.0))));

               recommendedWeek = Math.max(1, Math.min(recommendedWeek, weeksNeeded));

               SyllabusChapter chapter = weekChapterMap.computeIfAbsent(recommendedWeek, week -> {
                    SyllabusChapter ch = new SyllabusChapter();
                    ch.setChapterNumber(week);
                    ch.setChapterTitle("Week " + week + " Study Topics");
                    ch.setDifficulty("medium");
                    ch.setEstimatedHours(0.0);
                    ch.setEstimatedLectures(0);
                    ch.setSyllabusFile(syllabusFile);
                    ch.setTopics(new ArrayList<>());
                    return ch;
               });

               SyllabusTopic topic = new SyllabusTopic();
               topic.setTopicNumber(topicCounter);
               topic.setTopicTitle(safeString(topicMap.get("topicName"), "Untitled Topic"));
               topic.setTopicDescription(safeString(topicMap.get("description"), ""));
               topic.setDifficulty(normalizeDifficulty(safeString(topicMap.get("difficulty"), "medium")));
               topic.setEstimatedHours(asDouble(topicMap.get("estimatedHours"), 2.0));
               topic.setRecommendedWeek(recommendedWeek);
               topic.setPlannerCreated(false);
               topic.setChapter(chapter);

               chapter.getTopics().add(topic);
          }

          for (SyllabusChapter chapter : weekChapterMap.values()) {
               double chapterHours = chapter.getTopics().stream()
                         .mapToDouble(topic -> topic.getEstimatedHours() == null ? 0.0 : topic.getEstimatedHours())
                         .sum();

               chapter.setEstimatedHours(chapterHours);
               chapter.setEstimatedLectures(Math.max(1, (int) Math.ceil(chapterHours / 2.0)));
               chapter.setDifficulty(calculateChapterDifficulty(chapter.getTopics()));

               syllabusFile.getChapters().add(chapter);
          }
     }

     private double calculateTotalHours(List<Map<String, Object>> topics) {
          return topics.stream()
                    .mapToDouble(topic -> asDouble(topic.get("estimatedHours"), 2.0))
                    .sum();
     }

     private String calculateChapterDifficulty(List<SyllabusTopic> topics) {
          long hard = topics.stream()
                    .filter(t -> "hard".equalsIgnoreCase(t.getDifficulty()))
                    .count();

          long easy = topics.stream()
                    .filter(t -> "easy".equalsIgnoreCase(t.getDifficulty()))
                    .count();

          if (hard >= easy && hard > 0) {
               return "hard";
          }

          if (easy > hard) {
               return "easy";
          }

          return "medium";
     }

     private String buildPlannerDescription(SyllabusTopic topic, String subjectName) {
          String description = """
                    Subject: %s
                    Topic: %s
                    Difficulty: %s
                    Estimated Hours: %.1f
                    Source: AI syllabus weekly plan

                    %s
                    """.formatted(
                    subjectName,
                    topic.getTopicTitle(),
                    topic.getDifficulty(),
                    topic.getEstimatedHours() == null ? 0.0 : topic.getEstimatedHours(),
                    topic.getTopicDescription() == null ? "" : topic.getTopicDescription());

          return description.length() > 1000 ? description.substring(0, 1000) : description;
     }

     private Map<String, Object> buildAnalysisResponse(SyllabusFile syllabusFile, Subject subject) {
          List<SyllabusTopic> topics = flattenTopics(syllabusFile);

          List<Map<String, Object>> topicDtos = new ArrayList<>();

          for (SyllabusTopic topic : topics) {
               Map<String, Object> topicDto = new LinkedHashMap<>();
               topicDto.put("id", topic.getId());
               topicDto.put("topicNumber", topic.getTopicNumber());
               topicDto.put("topicName", topic.getTopicTitle());
               topicDto.put("description", topic.getTopicDescription());
               topicDto.put("difficulty", topic.getDifficulty());
               topicDto.put("estimatedHours", topic.getEstimatedHours());
               topicDto.put("recommendedWeek", topic.getRecommendedWeek());
               topicDto.put("plannerCreated", Boolean.TRUE.equals(topic.getPlannerCreated()));
               topicDtos.add(topicDto);
          }

          Map<String, Object> response = new LinkedHashMap<>();
          response.put("subjectId", subject.getId());
          response.put("subjectName", subject.getSubjectName());
          response.put("fileName", syllabusFile.getOriginalFileName());
          response.put("fileType", syllabusFile.getFileType());
          response.put("fileSize", syllabusFile.getFileSize());
          response.put("uploadedAt", syllabusFile.getUploadedAt());
          response.put("aiGeneratedAt", syllabusFile.getAiGeneratedAt());
          response.put("totalTopics", topicDtos.size());
          response.put("topics", topicDtos);
          response.put("totalHours", syllabusFile.getTotalHours() == null ? 0.0 : syllabusFile.getTotalHours());
          response.put("weeksNeeded", syllabusFile.getWeeksNeeded() == null ? 0 : syllabusFile.getWeeksNeeded());
          response.put("overallDifficulty", syllabusFile.getOverallDifficulty());
          response.put("studyTips", syllabusFile.getStudyTips());
          response.put("plannerCreated", Boolean.TRUE.equals(syllabusFile.getPlannerCreated()));
          response.put("weeklyPlan", buildWeeklyPlan(topicDtos, syllabusFile.getWeeksNeeded()));

          return response;
     }

     private List<SyllabusTopic> flattenTopics(SyllabusFile syllabusFile) {
          List<SyllabusTopic> topics = new ArrayList<>();

          if (syllabusFile.getChapters() == null) {
               return topics;
          }

          syllabusFile.getChapters().stream()
                    .sorted(Comparator.comparing(ch -> ch.getChapterNumber() == null ? 0 : ch.getChapterNumber()))
                    .forEach(chapter -> {
                         if (chapter.getTopics() != null) {
                              chapter.getTopics().stream()
                                        .sorted(Comparator
                                                  .comparing(t -> t.getTopicNumber() == null ? 0 : t.getTopicNumber()))
                                        .forEach(topics::add);
                         }
                    });

          return topics;
     }

     private List<Map<String, Object>> buildWeeklyPlan(List<Map<String, Object>> topics, Integer weeksNeeded) {
          int totalWeeks = weeksNeeded == null || weeksNeeded < 1 ? 1 : weeksNeeded;
          List<Map<String, Object>> weeks = new ArrayList<>();

          for (int week = 1; week <= totalWeeks; week++) {
               int currentWeek = week;

               List<Map<String, Object>> weekTopics = topics.stream()
                         .filter(topic -> asInt(topic.get("recommendedWeek"), 1) == currentWeek)
                         .toList();

               double hours = weekTopics.stream()
                         .mapToDouble(topic -> asDouble(topic.get("estimatedHours"), 0.0))
                         .sum();

               Map<String, Object> weekDto = new LinkedHashMap<>();
               weekDto.put("week", week);
               weekDto.put("hours", hours);
               weekDto.put("topics", weekTopics);

               weeks.add(weekDto);
          }

          return weeks;
     }

     private int asInt(Object value, int fallback) {
          if (value == null) {
               return fallback;
          }

          if (value instanceof Number number) {
               return number.intValue();
          }

          try {
               return Integer.parseInt(value.toString().trim());
          } catch (Exception e) {
               return fallback;
          }
     }

     private double asDouble(Object value, double fallback) {
          if (value == null) {
               return fallback;
          }

          if (value instanceof Number number) {
               return number.doubleValue();
          }

          try {
               return Double.parseDouble(value.toString().trim());
          } catch (Exception e) {
               return fallback;
          }
     }

     private String safeString(Object value, String fallback) {
          if (value == null) {
               return fallback;
          }

          String text = value.toString().trim();

          return text.isBlank() ? fallback : text;
     }

     private String normalizeDifficulty(String difficulty) {
          if (difficulty == null) {
               return "medium";
          }

          String normalized = difficulty.toLowerCase(Locale.ROOT).trim();

          if (normalized.equals("easy") || normalized.equals("medium") || normalized.equals("hard")) {
               return normalized;
          }

          return "medium";
     }
}