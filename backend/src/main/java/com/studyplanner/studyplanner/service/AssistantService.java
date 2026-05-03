package com.studyplanner.studyplanner.service;

import com.studyplanner.studyplanner.dto.AssistantRequest;
import com.studyplanner.studyplanner.dto.AssistantResponse;
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

     public AssistantService(
               WebClient.Builder webClientBuilder,
               ChatHistoryService chatHistoryService,
               TaskService taskService,
               SubjectService subjectService,
               RevisionService revisionService) {
          this.webClient = webClientBuilder
                    .baseUrl("https://api.groq.com")
                    .build();
          this.chatHistoryService = chatHistoryService;
          this.taskService = taskService;
          this.subjectService = subjectService;
          this.revisionService = revisionService;
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

          } catch (Exception e) {
               System.out.println("ASSISTANT AI ERROR: " + e.getMessage());
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
                    coding doubts, and personalized smart suggestions.

                    CRITICAL LANGUAGE RULE:
                    1. Detect the user's language.
                    2. If user uses Hinglish/Hindi words, reply in natural Hinglish.
                    3. If user writes fully in English, reply in pure English.
                    4. Do not switch language unnecessarily.

                    RULES:
                    - Keep answers practical and concise.
                    - Use the REAL DATA provided below to give personalized answers.
                    - Never make up task names, subject names, or test details.
                    - For study plans, suggest Pomodoro-style sessions: 25 min study, 5 min break.
                    - Use beginner-friendly language.
                    - If data is missing, tell the student what to add first.
                    """
                    + "\n\n"
                    + dataContext;

          Map<String, Object> requestBody = Map.of(
                    "model", "llama-3.1-8b-instant",
                    "messages", List.of(
                              Map.of("role", "system", "content", systemPrompt),
                              Map.of("role", "user", "content",
                                        "Detected language: " + detectLanguage(userMessage)
                                                  + "\nReply only in that language.\n\nUser message: "
                                                  + userMessage)),
                    "max_tokens", 1024,
                    "temperature", 0.7);

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
          String language = detectLanguage(userMessage);
          String lower = userMessage.toLowerCase();

          String dataSummary = buildShortDataSummary(userId, email);

          boolean hinglish = language.toLowerCase().contains("hinglish");

          if (lower.contains("task") || lower.contains("pending") || lower.contains("kaam")) {
               if (hinglish) {
                    return "Aapke current study data ke basis par yeh quick help hai:\n\n"
                              + dataSummary
                              + "\nSuggestion: Pehle pending/high-priority tasks complete karo. Har task ke liye 25-minute Pomodoro session rakho, phir 5-minute break lo.";
               }

               return "Based on your current study data:\n\n"
                         + dataSummary
                         + "\nSuggestion: Start with pending or high-priority tasks. Use one 25-minute Pomodoro session per task, followed by a 5-minute break.";
          }

          if (lower.contains("plan") || lower.contains("schedule") || lower.contains("padhna")
                    || lower.contains("study")) {
               if (hinglish) {
                    return "Yeh simple study plan follow karo:\n\n"
                              + "1. Sabse pehle pending tasks/revisions dekho.\n"
                              + "2. Ek subject choose karo jisme progress low hai.\n"
                              + "3. 25 minute focus + 5 minute break ka Pomodoro use karo.\n"
                              + "4. Session ke baad short notes banao.\n\n"
                              + dataSummary;
               }

               return "Here is a simple study plan:\n\n"
                         + "1. Check your pending tasks and revisions.\n"
                         + "2. Pick the subject with lower progress first.\n"
                         + "3. Study in 25-minute Pomodoro blocks with 5-minute breaks.\n"
                         + "4. After each session, write short notes.\n\n"
                         + dataSummary;
          }

          if (lower.contains("revision") || lower.contains("revise")) {
               if (hinglish) {
                    return "Revision ke liye best approach:\n\n"
                              + "1. Pehle weak/high-priority topics revise karo.\n"
                              + "2. Har topic ke baad 5 questions solve karo.\n"
                              + "3. Galtiyon ko separate note me likho.\n"
                              + "4. Raat me 10-minute quick recap karo.\n\n"
                              + dataSummary;
               }

               return "For revision, use this approach:\n\n"
                         + "1. Revise weak or high-priority topics first.\n"
                         + "2. Solve 5 questions after each topic.\n"
                         + "3. Keep a separate note of mistakes.\n"
                         + "4. Do a 10-minute recap at night.\n\n"
                         + dataSummary;
          }

          if (hinglish) {
               return "Astra local assistant active hai. Main aapko study plan, pending tasks, revision help, coding doubts aur Pomodoro suggestions me help kar sakti hoon.\n\n"
                         + dataSummary
                         + "\nAap specific question puch sakti ho, jaise: “Aaj mujhe kya padhna chahiye?”";
          }

          return "Astra local assistant is active. I can help you with study plans, pending tasks, revision help, coding doubts, and Pomodoro suggestions.\n\n"
                    + dataSummary
                    + "\nYou can ask a specific question such as: “What should I study today?”";
     }

     private String buildShortDataSummary(Long userId, String email) {
          StringBuilder summary = new StringBuilder();

          try {
               List<Subject> subjects = subjectService.getSubjectsByEmail(email);
               summary.append("Subjects: ").append(subjects.size()).append("\n");

               if (!subjects.isEmpty()) {
                    summary.append("Top subjects:\n");
                    subjects.stream().limit(5).forEach(subject -> {
                         summary.append("- ").append(subject.getSubjectName());

                         if (subject.getProgress() != null) {
                              summary.append(" (").append(subject.getProgress()).append("% progress)");
                         }

                         summary.append("\n");
                    });
               }
          } catch (Exception e) {
               summary.append("Subjects: Could not fetch.\n");
          }

          try {
               List<Task> allTasks = taskService.getAllTasks(userId);
               long pending = allTasks.stream()
                         .filter(task -> task.getStatus() != null && task.getStatus().equalsIgnoreCase("PENDING"))
                         .count();

               summary.append("Tasks: ").append(allTasks.size()).append(" total, ")
                         .append(pending).append(" pending\n");
          } catch (Exception e) {
               summary.append("Tasks: Could not fetch.\n");
          }

          try {
               List<Revision> revisions = revisionService.getAllRevisions(userId);
               long pending = revisions.stream()
                         .filter(revision -> revision.getStatus() != null
                                   && revision.getStatus().equalsIgnoreCase("PENDING"))
                         .count();

               summary.append("Revisions: ").append(revisions.size()).append(" total, ")
                         .append(pending).append(" pending\n");
          } catch (Exception e) {
               summary.append("Revisions: Could not fetch.\n");
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
          } catch (Exception e) {
               System.out.println("Assistant chat history save failed: " + e.getMessage());
          }
     }

     private String detectLanguage(String message) {
          String lower = safeText(message).toLowerCase();

          String[] hindiWords = {
                    "mera", "mere", "meri", "mujhe", "tumhe", "tumhara",
                    "kya", "kyun", "kaise", "kaun", "kitna", "kab", "kahan",
                    "batao", "karo", "chahiye", "samjhao", "bolo", "banao", "btao",
                    "aaj", "kal", "abhi", "nahi", "bahut", "thoda", "zyada",
                    "padhna", "likhna", "dekho", "yaar", "dost", "theek", "accha",
                    "hai ", " hai", "hain", "tha ", " tha", "thi ", " thi",
                    "apna", "apni", "apne", "unka", "unki", "uska", "uski"
          };

          int hindiCount = 0;

          for (String word : hindiWords) {
               if (lower.contains(word)) {
                    hindiCount++;
               }

               if (hindiCount >= 2) {
                    return "Hinglish";
               }
          }

          return "English";
     }

     private String buildDataContext(Long userId, String email) {
          StringBuilder ctx = new StringBuilder("=== STUDENT'S REAL-TIME DATA ===\n");
          ctx.append("Today's date: ").append(LocalDate.now()).append("\n\n");

          try {
               List<Subject> subjects = subjectService.getSubjectsByEmail(email);

               if (subjects.isEmpty()) {
                    ctx.append("SUBJECTS: None added yet.\n\n");
               } else {
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
               }
          } catch (Exception e) {
               ctx.append("SUBJECTS: Could not fetch.\n\n");
          }

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

                    pendingTasks.stream().limit(8).forEach(task -> {
                         ctx.append("  * ").append(task.getTitle());

                         if (task.getDueDate() != null) {
                              ctx.append(" (Due: ").append(task.getDueDate()).append(")");
                         }

                         if (task.getPriority() != null) {
                              ctx.append(" [").append(task.getPriority()).append("]");
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
          } catch (Exception e) {
               ctx.append("TASKS: Could not fetch.\n\n");
          }

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

                    pendingRevisions.stream().limit(5).forEach(revision -> {
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
          } catch (Exception e) {
               ctx.append("REVISIONS: Could not fetch.\n\n");
          }

          ctx.append("=== END OF DATA ===\n");
          return ctx.toString();
     }

     private String safeText(String value) {
          return value == null ? "" : value.trim();
     }
}