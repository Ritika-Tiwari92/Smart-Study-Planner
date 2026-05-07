package com.studyplanner.studyplanner.service;

import com.studyplanner.studyplanner.dto.AssistantRequest;
import com.studyplanner.studyplanner.dto.AssistantResponse;
import com.studyplanner.studyplanner.dto.RecentTestResultDto;
import com.studyplanner.studyplanner.dto.TestHistoryItemDto;
import com.studyplanner.studyplanner.model.PomodoroSession;
import com.studyplanner.studyplanner.model.Revision;
import com.studyplanner.studyplanner.model.Subject;
import com.studyplanner.studyplanner.model.Task;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AssistantService {

     /*
      * Important:
      * Default empty value keeps backend safe if groq.api.key is missing.
      * API key must stay in backend environment/application.properties only.
      */
     @Value("${groq.api.key:}")
     private String groqApiKey;

     private final WebClient webClient;
     private final ChatHistoryService chatHistoryService;
     private final TaskService taskService;
     private final SubjectService subjectService;
     private final RevisionService revisionService;
     private final TestEngineService testEngineService;
     private final PomodoroSessionService pomodoroSessionService;

     public AssistantService(
               WebClient.Builder webClientBuilder,
               ChatHistoryService chatHistoryService,
               TaskService taskService,
               SubjectService subjectService,
               RevisionService revisionService,
               TestEngineService testEngineService,
               PomodoroSessionService pomodoroSessionService) {

          this.webClient = webClientBuilder
                    .baseUrl("https://api.groq.com")
                    .build();

          this.chatHistoryService = chatHistoryService;
          this.taskService = taskService;
          this.subjectService = subjectService;
          this.revisionService = revisionService;
          this.testEngineService = testEngineService;
          this.pomodoroSessionService = pomodoroSessionService;
     }

     public AssistantResponse chat(AssistantRequest request, Long userId, String email) {

          String userMessage = request != null ? safeText(request.getMessage()) : "";

          if (userMessage.isBlank()) {
               return new AssistantResponse(
                         "Please type your question first.",
                         request != null ? request.getSessionId() : null);
          }

          String reply;

          try {
               if (groqApiKey == null || groqApiKey.trim().isBlank()) {
                    reply = buildLocalFallbackReply(userMessage, userId, email);
               } else {
                    reply = callGroqAi(userMessage, userId, email);
               }

          } catch (Exception error) {
               System.out.println("ASSISTANT AI ERROR: " + error.getMessage());
               reply = buildLocalFallbackReply(userMessage, userId, email);
          }

          saveHistorySafely(request.getSessionId(), userMessage, reply);

          return new AssistantResponse(reply, request.getSessionId());
     }

     private String callGroqAi(String userMessage, Long userId, String email) {
          String dataContext = buildDataContext(userId, email);

          String systemPrompt = """
                    You are Astra, an AI study assistant for the EduMind AI student planner app.
                    You help students with study plans, revision strategies, topic explanations,
                    coding doubts, test preparation, Pomodoro focus planning, and personalized study suggestions.

                    CRITICAL LANGUAGE RULE:
                    Always reply in clear English only.
                    Do not use Hindi or Hinglish words in assistant replies, UI text, suggestions, or error-style messages.

                    PERSONALIZATION RULES:
                    - Use the real student data provided below.
                    - Never invent task names, subject names, revision titles, dates, scores, percentages, Pomodoro sessions, or test details.
                    - If real data is missing, clearly tell the student what they should add first.
                    - Keep the response practical, concise, and beginner-friendly.
                    - For study plans, suggest Pomodoro-style sessions: 25 minutes study + 5 minutes break.
                    - For focus advice, use real completed sessions, interrupted sessions, focus minutes, most focused subject, and active focus days.
                    - For weak subjects, use progress, pending tasks, revisions, test result focus areas, and Pomodoro subject focus when available.
                    - For test preparation, use recent test percentage, focus area, and test tip from the real test data.
                    - For coding doubts, explain simply and give examples when useful.
                    """
                    + "\n\n"
                    + dataContext;

          Map<String, Object> requestBody = Map.of(
                    "model", "llama-3.1-8b-instant",
                    "messages", List.of(
                              Map.of("role", "system", "content", systemPrompt),
                              Map.of("role", "user", "content",
                                        "Reply in English only.\n\nUser message: " + userMessage)),
                    "max_tokens", 1024,
                    "temperature", 0.6);

          Map response = webClient.post()
                    .uri("/openai/v1/chat/completions")
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + groqApiKey.trim())
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

          if (response == null || response.get("choices") == null) {
               throw new RuntimeException("Empty response from AI provider.");
          }

          List choices = (List) response.get("choices");

          if (choices.isEmpty()) {
               throw new RuntimeException("No choices received from AI provider.");
          }

          Map firstChoice = (Map) choices.get(0);
          Map message = (Map) firstChoice.get("message");

          if (message == null || message.get("content") == null) {
               throw new RuntimeException("No message content received from AI provider.");
          }

          return String.valueOf(message.get("content")).trim();
     }

     private String buildLocalFallbackReply(String userMessage, Long userId, String email) {
          String lower = safeText(userMessage).toLowerCase();
          String dataSummary = buildShortDataSummary(userId, email);

          if (lower.contains("task") || lower.contains("pending") || lower.contains("work")) {
               return "Based on your current study data:\n\n"
                         + dataSummary
                         + "\n\nSuggestion: Start with pending or high-priority tasks. Use one 25-minute Pomodoro session per task, followed by a 5-minute break.";
          }

          if (lower.contains("plan")
                    || lower.contains("schedule")
                    || lower.contains("study")
                    || lower.contains("today")) {

               return "Here is a simple study plan:\n\n"
                         + "1. Check your pending tasks and revisions.\n"
                         + "2. Review your latest test focus area if a recent result exists.\n"
                         + "3. Pick the subject with lower progress first.\n"
                         + "4. Study in 25-minute Pomodoro blocks with 5-minute breaks.\n"
                         + "5. After each session, write short notes.\n\n"
                         + dataSummary;
          }

          if (lower.contains("revision") || lower.contains("revise")) {
               return "For revision, use this approach:\n\n"
                         + "1. Revise weak or high-priority topics first.\n"
                         + "2. Check your latest test focus area and revise that topic first.\n"
                         + "3. Solve 5 questions after each topic.\n"
                         + "4. Keep a separate note of mistakes.\n"
                         + "5. Do a 10-minute recap at night.\n\n"
                         + dataSummary;
          }

          if (lower.contains("test")
                    || lower.contains("exam")
                    || lower.contains("score")
                    || lower.contains("result")
                    || lower.contains("weak area")) {

               return "For better test preparation:\n\n"
                         + "1. Review your latest test result.\n"
                         + "2. Identify repeated weak topics from the focus area.\n"
                         + "3. Revise those topics before attempting another test.\n"
                         + "4. Use one short Pomodoro session before every practice attempt.\n"
                         + "5. Reattempt a similar test after revision.\n\n"
                         + dataSummary;
          }

          if (lower.contains("focus")
                    || lower.contains("pomodoro")
                    || lower.contains("timer")
                    || lower.contains("productivity")
                    || lower.contains("consistency")) {

               return "For better focus and consistency:\n\n"
                         + "1. Start with one 25-minute Pomodoro session.\n"
                         + "2. Choose only one subject or topic for the session.\n"
                         + "3. Keep distractions away until the timer ends.\n"
                         + "4. If interruptions are high, reduce the first session to 15 minutes and rebuild consistency.\n"
                         + "5. After the session, write a short summary of what you completed.\n\n"
                         + dataSummary;
          }

          if (lower.contains("subject") || lower.contains("weak")) {
               return "To improve your weak subjects:\n\n"
                         + "1. Check the subject with the lowest progress.\n"
                         + "2. Compare it with your latest test focus area.\n"
                         + "3. Check which subject has less Pomodoro focus time.\n"
                         + "4. Complete one small task from that subject.\n"
                         + "5. Add one revision session for the same subject.\n\n"
                         + dataSummary;
          }

          if (lower.contains("code") || lower.contains("java") || lower.contains("program")) {
               return "I can help with coding doubts. Share your exact problem, code, or error message, and I will explain it step by step in beginner-friendly English.\n\n"
                         + dataSummary;
          }

          return "Astra local assistant is active. I can help you with study plans, pending tasks, revision help, coding doubts, test preparation, weak area improvement, Pomodoro focus, and consistency suggestions.\n\n"
                    + dataSummary
                    + "\n\nYou can ask a specific question such as: “What should I study today?”, “How can I improve my latest test score?”, or “Suggest a Pomodoro plan for me.”";
     }

     private String buildShortDataSummary(Long userId, String email) {
          StringBuilder summary = new StringBuilder();

          try {
               List<Subject> subjects = subjectService.getSubjectsByEmail(email);
               summary.append("Subjects: ").append(subjects.size()).append("\n");

               if (!subjects.isEmpty()) {
                    summary.append("Top subjects:\n");

                    subjects.stream()
                              .limit(5)
                              .forEach(subject -> {
                                   summary.append("- ").append(subject.getSubjectName());

                                   if (subject.getProgress() != null) {
                                        summary.append(" (").append(subject.getProgress()).append("% progress)");
                                   }

                                   summary.append("\n");
                              });
               }
          } catch (Exception error) {
               summary.append("Subjects: Could not fetch.\n");
          }

          try {
               List<Task> allTasks = taskService.getAllTasks(userId);

               long pending = allTasks.stream()
                         .filter(task -> task.getStatus() != null
                                   && task.getStatus().equalsIgnoreCase("PENDING"))
                         .count();

               summary.append("Tasks: ")
                         .append(allTasks.size())
                         .append(" total, ")
                         .append(pending)
                         .append(" pending\n");

          } catch (Exception error) {
               summary.append("Tasks: Could not fetch.\n");
          }

          try {
               List<Revision> revisions = revisionService.getAllRevisions(userId);

               long pending = revisions.stream()
                         .filter(revision -> revision.getStatus() != null
                                   && revision.getStatus().equalsIgnoreCase("PENDING"))
                         .count();

               summary.append("Revisions: ")
                         .append(revisions.size())
                         .append(" total, ")
                         .append(pending)
                         .append(" pending\n");

          } catch (Exception error) {
               summary.append("Revisions: Could not fetch.\n");
          }

          try {
               List<RecentTestResultDto> recentResults = testEngineService.getRecentResults(userId);

               summary.append("Recent test results: ")
                         .append(recentResults.size())
                         .append("\n");

               if (!recentResults.isEmpty()) {
                    RecentTestResultDto latestResult = recentResults.get(0);

                    summary.append("Latest test: ")
                              .append(safeText(latestResult.getTitle()).isEmpty()
                                        ? "Untitled Test"
                                        : latestResult.getTitle());

                    if (latestResult.getPercentage() != null) {
                         summary.append(" | Percentage: ")
                                   .append(latestResult.getPercentage())
                                   .append("%");
                    }

                    if (latestResult.getFocusArea() != null && !latestResult.getFocusArea().trim().isEmpty()) {
                         summary.append(" | Focus area: ")
                                   .append(latestResult.getFocusArea());
                    }

                    summary.append("\n");

                    if (latestResult.getTestTip() != null && !latestResult.getTestTip().trim().isEmpty()) {
                         summary.append("Latest test tip: ")
                                   .append(latestResult.getTestTip())
                                   .append("\n");
                    }
               }

          } catch (Exception error) {
               summary.append("Recent test results: Could not fetch.\n");
          }

          try {
               List<PomodoroSession> sessions = pomodoroSessionService.getMySessions(userId);
               PomodoroStats stats = buildPomodoroStats(sessions);

               summary.append("Pomodoro focus: ")
                         .append(stats.totalFocusMinutes)
                         .append(" minutes, ")
                         .append(stats.completedSessions)
                         .append(" completed sessions, ")
                         .append(stats.interruptedSessions)
                         .append(" interrupted sessions\n");

               summary.append("Active focus days this week: ")
                         .append(stats.activeDaysThisWeek)
                         .append("\n");

               if (!safeText(stats.mostFocusedSubject).isEmpty()) {
                    summary.append("Most focused subject: ")
                              .append(stats.mostFocusedSubject)
                              .append("\n");
               }

               summary.append("Productivity: ")
                         .append(stats.productivityLabel)
                         .append(" (")
                         .append(stats.productivityScore)
                         .append("/100)\n");

          } catch (Exception error) {
               summary.append("Pomodoro focus: Could not fetch.\n");
          }

          return summary.toString().trim();
     }

     private void saveHistorySafely(Long sessionId, String userMessage, String reply) {
          if (sessionId == null) {
               return;
          }

          try {
               chatHistoryService.saveMessage(sessionId, "USER", userMessage);
               chatHistoryService.saveMessage(sessionId, "ASSISTANT", reply);
          } catch (Exception error) {
               System.out.println("Assistant chat history save failed: " + error.getMessage());
          }
     }

     private String buildDataContext(Long userId, String email) {
          StringBuilder ctx = new StringBuilder("=== STUDENT REAL-TIME DATA ===\n");
          ctx.append("Today's date: ").append(LocalDate.now()).append("\n\n");

          appendSubjectContext(ctx, email);
          appendTaskContext(ctx, userId);
          appendRevisionContext(ctx, userId);
          appendTestContext(ctx, userId);
          appendPomodoroContext(ctx, userId);

          ctx.append("=== END OF DATA ===\n");

          return ctx.toString();
     }

     private void appendSubjectContext(StringBuilder ctx, String email) {
          try {
               List<Subject> subjects = subjectService.getSubjectsByEmail(email);

               if (subjects.isEmpty()) {
                    ctx.append("SUBJECTS: None added yet.\n\n");
                    return;
               }

               ctx.append("SUBJECTS (").append(subjects.size()).append(" total):\n");

               for (Subject subject : subjects) {
                    ctx.append("- ").append(subject.getSubjectName());

                    if (subject.getProgress() != null) {
                         ctx.append(" | Progress: ").append(subject.getProgress()).append("%");
                    }

                    if (subject.getDifficultyLevel() != null) {
                         ctx.append(" | Difficulty: ").append(subject.getDifficultyLevel());
                    }

                    ctx.append("\n");
               }

               ctx.append("\n");

          } catch (Exception error) {
               ctx.append("SUBJECTS: Could not fetch.\n\n");
          }
     }

     private void appendTaskContext(StringBuilder ctx, Long userId) {
          try {
               List<Task> allTasks = taskService.getAllTasks(userId);

               List<Task> pendingTasks = allTasks.stream()
                         .filter(task -> task.getStatus() != null
                                   && task.getStatus().equalsIgnoreCase("PENDING"))
                         .collect(Collectors.toList());

               List<Task> completedTasks = allTasks.stream()
                         .filter(task -> task.getStatus() != null
                                   && task.getStatus().equalsIgnoreCase("COMPLETED"))
                         .collect(Collectors.toList());

               List<Task> todayTasks = taskService.getTodayTasks(userId);

               ctx.append("TASKS SUMMARY:\n");
               ctx.append("- Total: ").append(allTasks.size()).append("\n");
               ctx.append("- Pending: ").append(pendingTasks.size()).append("\n");
               ctx.append("- Completed: ").append(completedTasks.size()).append("\n");

               if (!pendingTasks.isEmpty()) {
                    ctx.append("PENDING TASKS LIST:\n");

                    pendingTasks.stream()
                              .limit(8)
                              .forEach(task -> {
                                   ctx.append("  * ").append(task.getTitle());

                                   if (task.getDueDate() != null) {
                                        ctx.append(" (Due: ").append(task.getDueDate()).append(")");
                                   }

                                   if (task.getPriority() != null) {
                                        ctx.append(" [Priority: ").append(task.getPriority()).append("]");
                                   }

                                   ctx.append("\n");
                              });
               }

               if (!todayTasks.isEmpty()) {
                    ctx.append("TODAY'S TASKS:\n");

                    todayTasks.forEach(task -> ctx.append("  * ")
                              .append(task.getTitle())
                              .append(" [")
                              .append(task.getStatus())
                              .append("]\n"));
               }

               ctx.append("\n");

          } catch (Exception error) {
               ctx.append("TASKS: Could not fetch.\n\n");
          }
     }

     private void appendRevisionContext(StringBuilder ctx, Long userId) {
          try {
               List<Revision> revisions = revisionService.getAllRevisions(userId);

               List<Revision> pendingRevisions = revisions.stream()
                         .filter(revision -> revision.getStatus() != null
                                   && revision.getStatus().equalsIgnoreCase("PENDING"))
                         .collect(Collectors.toList());

               ctx.append("REVISIONS:\n");
               ctx.append("- Total: ").append(revisions.size()).append("\n");
               ctx.append("- Pending revisions: ").append(pendingRevisions.size()).append("\n");

               if (!pendingRevisions.isEmpty()) {
                    ctx.append("PENDING REVISIONS:\n");

                    pendingRevisions.stream()
                              .limit(5)
                              .forEach(revision -> {
                                   ctx.append("  * ").append(revision.getTitle());

                                   if (revision.getSubject() != null) {
                                        ctx.append(" (Subject: ").append(revision.getSubject()).append(")");
                                   }

                                   if (revision.getPriority() != null) {
                                        ctx.append(" [Priority: ").append(revision.getPriority()).append("]");
                                   }

                                   ctx.append("\n");
                              });
               }

               ctx.append("\n");

          } catch (Exception error) {
               ctx.append("REVISIONS: Could not fetch.\n\n");
          }
     }

     private void appendTestContext(StringBuilder ctx, Long userId) {
          try {
               List<RecentTestResultDto> recentResults = testEngineService.getRecentResults(userId);
               List<TestHistoryItemDto> testHistory = testEngineService.getTestHistory(userId);

               ctx.append("TEST RESULTS SUMMARY:\n");
               ctx.append("- Recent submitted results: ").append(recentResults.size()).append("\n");
               ctx.append("- Total test attempts: ").append(testHistory.size()).append("\n");

               if (!recentResults.isEmpty()) {
                    ctx.append("RECENT TEST RESULTS:\n");

                    recentResults.stream()
                              .limit(5)
                              .forEach(result -> {
                                   ctx.append("  * ")
                                             .append(safeText(result.getTitle()).isEmpty()
                                                       ? "Untitled Test"
                                                       : result.getTitle());

                                   if (result.getSubject() != null && !result.getSubject().trim().isEmpty()) {
                                        ctx.append(" | Subject: ").append(result.getSubject());
                                   }

                                   if (result.getPercentage() != null) {
                                        ctx.append(" | Percentage: ").append(result.getPercentage()).append("%");
                                   }

                                   if (result.getScore() != null) {
                                        ctx.append(" | Score: ").append(result.getScore());
                                   }

                                   if (result.getFocusArea() != null && !result.getFocusArea().trim().isEmpty()) {
                                        ctx.append(" | Focus area: ").append(result.getFocusArea());
                                   }

                                   if (result.getTestTip() != null && !result.getTestTip().trim().isEmpty()) {
                                        ctx.append(" | Tip: ").append(result.getTestTip());
                                   }

                                   if (result.getSubmittedAt() != null) {
                                        ctx.append(" | Submitted: ").append(result.getSubmittedAt());
                                   }

                                   ctx.append("\n");
                              });
               }

               if (!testHistory.isEmpty()) {
                    ctx.append("TEST ATTEMPT HISTORY:\n");

                    testHistory.stream()
                              .limit(8)
                              .forEach(item -> {
                                   ctx.append("  * ")
                                             .append(safeText(item.getTitle()).isEmpty()
                                                       ? "Untitled Test"
                                                       : item.getTitle());

                                   if (item.getSubject() != null && !item.getSubject().trim().isEmpty()) {
                                        ctx.append(" | Subject: ").append(item.getSubject());
                                   }

                                   if (item.getStatus() != null && !item.getStatus().trim().isEmpty()) {
                                        ctx.append(" | Status: ").append(item.getStatus());
                                   }

                                   if (item.getPercentage() != null) {
                                        ctx.append(" | Percentage: ").append(item.getPercentage()).append("%");
                                   }

                                   if (item.getAnsweredQuestions() != null && item.getTotalQuestions() != null) {
                                        ctx.append(" | Answered: ")
                                                  .append(item.getAnsweredQuestions())
                                                  .append("/")
                                                  .append(item.getTotalQuestions());
                                   }

                                   if (item.getCorrectAnswers() != null && item.getTotalQuestions() != null) {
                                        ctx.append(" | Correct: ")
                                                  .append(item.getCorrectAnswers())
                                                  .append("/")
                                                  .append(item.getTotalQuestions());
                                   }

                                   if (item.getFocusArea() != null && !item.getFocusArea().trim().isEmpty()) {
                                        ctx.append(" | Focus area: ").append(item.getFocusArea());
                                   }

                                   ctx.append("\n");
                              });
               }

               ctx.append("\n");

          } catch (Exception error) {
               ctx.append("TEST RESULTS: Could not fetch.\n\n");
          }
     }

     private void appendPomodoroContext(StringBuilder ctx, Long userId) {
          try {
               List<PomodoroSession> sessions = pomodoroSessionService.getMySessions(userId);
               PomodoroStats stats = buildPomodoroStats(sessions);

               ctx.append("POMODORO / STUDY TIMER SUMMARY:\n");
               ctx.append("- Total sessions: ").append(sessions.size()).append("\n");
               ctx.append("- Completed sessions: ").append(stats.completedSessions).append("\n");
               ctx.append("- Interrupted sessions: ").append(stats.interruptedSessions).append("\n");
               ctx.append("- Total focus minutes: ").append(stats.totalFocusMinutes).append("\n");
               ctx.append("- Average focus minutes per completed session: ")
                         .append(stats.averageMinutesPerCompletedSession)
                         .append("\n");
               ctx.append("- Active focus days this week: ").append(stats.activeDaysThisWeek).append("\n");
               ctx.append("- Most focused subject: ")
                         .append(safeText(stats.mostFocusedSubject).isEmpty() ? "Not available"
                                   : stats.mostFocusedSubject)
                         .append("\n");
               ctx.append("- Productivity score: ")
                         .append(stats.productivityScore)
                         .append("/100")
                         .append(" | Label: ")
                         .append(stats.productivityLabel)
                         .append("\n");

               if (!sessions.isEmpty()) {
                    ctx.append("RECENT POMODORO SESSIONS:\n");

                    sessions.stream()
                              .limit(8)
                              .forEach(session -> {
                                   ctx.append("  * ");

                                   String subject = safeText(session.getSubjectName()).isEmpty()
                                             ? "No subject"
                                             : session.getSubjectName();

                                   String topic = safeText(session.getTopic()).isEmpty()
                                             ? "Focus Session"
                                             : session.getTopic();

                                   ctx.append(subject)
                                             .append(" | Topic: ")
                                             .append(topic)
                                             .append(" | Status: ")
                                             .append(safeText(session.getStatus()).isEmpty()
                                                       ? "UNKNOWN"
                                                       : session.getStatus());

                                   if (session.getFocusMinutes() != null) {
                                        ctx.append(" | Focus minutes: ").append(session.getFocusMinutes());
                                   }

                                   if (session.getPlannedMinutes() != null) {
                                        ctx.append(" | Planned: ").append(session.getPlannedMinutes()).append(" min");
                                   }

                                   if (session.getSessionDate() != null) {
                                        ctx.append(" | Date: ").append(session.getSessionDate());
                                   }

                                   ctx.append("\n");
                              });
               }

               ctx.append("\n");

          } catch (Exception error) {
               ctx.append("POMODORO DATA: Could not fetch.\n\n");
          }
     }

     private PomodoroStats buildPomodoroStats(List<PomodoroSession> sessions) {
          PomodoroStats stats = new PomodoroStats();

          if (sessions == null || sessions.isEmpty()) {
               stats.productivityLabel = "No focus data yet";
               stats.productivityScore = 0;
               stats.mostFocusedSubject = "";
               return stats;
          }

          LocalDate today = LocalDate.now();
          LocalDate weekStart = today.minusDays(6);

          Map<String, Integer> subjectMinutes = sessions.stream()
                    .filter(session -> session.getFocusMinutes() != null && session.getFocusMinutes() > 0)
                    .collect(Collectors.groupingBy(
                              session -> safeText(session.getSubjectName()).isEmpty()
                                        ? "Unlinked Subject"
                                        : session.getSubjectName(),
                              Collectors.summingInt(
                                        session -> session.getFocusMinutes() == null ? 0 : session.getFocusMinutes())));

          stats.completedSessions = sessions.stream()
                    .filter(session -> safeText(session.getStatus()).equalsIgnoreCase("COMPLETED"))
                    .count();

          stats.interruptedSessions = sessions.stream()
                    .filter(session -> safeText(session.getStatus()).equalsIgnoreCase("INTERRUPTED"))
                    .count();

          stats.totalFocusMinutes = sessions.stream()
                    .filter(session -> safeText(session.getStatus()).equalsIgnoreCase("COMPLETED"))
                    .map(PomodoroSession::getFocusMinutes)
                    .filter(minutes -> minutes != null && minutes > 0)
                    .mapToInt(Integer::intValue)
                    .sum();

          stats.activeDaysThisWeek = sessions.stream()
                    .filter(session -> safeText(session.getStatus()).equalsIgnoreCase("COMPLETED"))
                    .filter(session -> session.getSessionDate() != null)
                    .filter(session -> !session.getSessionDate().isBefore(weekStart)
                              && !session.getSessionDate().isAfter(today))
                    .map(PomodoroSession::getSessionDate)
                    .distinct()
                    .count();

          stats.averageMinutesPerCompletedSession = stats.completedSessions == 0
                    ? 0
                    : Math.round((stats.totalFocusMinutes * 10.0) / stats.completedSessions) / 10.0;

          stats.mostFocusedSubject = subjectMinutes.entrySet()
                    .stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElse("");

          stats.productivityScore = calculateProductivityScore(stats);
          stats.productivityLabel = buildProductivityLabel(stats.productivityScore);

          return stats;
     }

     private int calculateProductivityScore(PomodoroStats stats) {
          int score = 0;

          score += Math.min(40, (int) Math.round(stats.totalFocusMinutes / 10.0));
          score += Math.min(25, (int) stats.activeDaysThisWeek * 5);
          score += Math.min(20, (int) stats.completedSessions * 2);

          if (stats.interruptedSessions == 0) {
               score += 15;
          } else {
               score -= Math.min(15, (int) stats.interruptedSessions * 3);
          }

          if (score < 0) {
               return 0;
          }

          return Math.min(100, score);
     }

     private String buildProductivityLabel(int score) {
          if (score >= 85) {
               return "Excellent";
          }

          if (score >= 65) {
               return "Strong";
          }

          if (score >= 40) {
               return "Improving";
          }

          if (score > 0) {
               return "Low consistency";
          }

          return "No focus data yet";
     }

     private String safeText(String value) {
          return value == null ? "" : value.trim();
     }

     private static class PomodoroStats {
          private long totalFocusMinutes;
          private long completedSessions;
          private long interruptedSessions;
          private double averageMinutesPerCompletedSession;
          private long activeDaysThisWeek;
          private String mostFocusedSubject;
          private int productivityScore;
          private String productivityLabel;
     }
}
