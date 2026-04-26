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

     @Value("${groq.api.key}")
     private String groqApiKey;

     private final WebClient webClient;
     private final ChatHistoryService chatHistoryService;
     private final TaskService taskService;
     private final SubjectService subjectService;
     private final RevisionService revisionService;

     public AssistantService(WebClient.Builder webClientBuilder,
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

          // ─── Collect real-time user data ──────────────────
          String dataContext = buildDataContext(userId, email);

          // ─── Build system prompt with real data ───────────
          String systemPrompt = """
                    You are Astra, an AI study assistant for the EduMind AI student planner app.
                    You help students with study plans, revision strategies, topic explanations,
                    coding doubts, and personalized smart suggestions.

                    CRITICAL LANGUAGE RULE — FOLLOW STRICTLY:
                    Step 1: Read the user's message carefully.
                    Step 2: Identify what language they used.
                    - If user message contains Hindi/Urdu words like "batao", "karo", "mera", "mere", "kya", "aaj", "chahiye" → reply ONLY in Hinglish.
                    - If user message is fully in English with no Hindi words → reply ONLY in pure English.
                    Step 3: NEVER switch language mid-reply.

                    EXAMPLES:
                    User: "What are my pending tasks?" → Reply in English only.
                    User: "Mere pending tasks batao" → Reply in Hinglish only.
                    User: "Aaj mujhe kya padhna chahiye?" → Reply in Hinglish only.
                    User: "Explain recursion to me" → Reply in English only.

                    OTHER RULES:
                    - Keep answers practical and concise.
                    - Use the REAL DATA provided below to give personalized answers.
                    - Never make up task names, subject names, or test details.
                    - For study plans, suggest Pomodoro-style sessions: 25 min study, 5 min break.
                    - When motivating, reference actual progress from data.
                                """
                    + dataContext;

          Map<String, Object> requestBody = Map.of(
                    "model", "llama-3.1-8b-instant",
                    "messages", List.of(
                              Map.of("role", "system", "content", systemPrompt),
                              Map.of("role", "user", "content",
                                        "LANGUAGE DETECTION: The following message is written in: " +
                                                  detectLanguage(request.getMessage()) +
                                                  ". Reply ONLY in that language.\n\nUSER MESSAGE: " +
                                                  request.getMessage())),
                    "max_tokens", 1024,
                    "temperature", 0.7);

          try {
               Map response = webClient.post()
                         .uri("/openai/v1/chat/completions")
                         .header("Content-Type", "application/json")
                         .header("Authorization", "Bearer " + groqApiKey)
                         .bodyValue(requestBody)
                         .retrieve()
                         .bodyToMono(Map.class)
                         .block();

               List choices = (List) response.get("choices");
               Map firstChoice = (Map) choices.get(0);
               Map message = (Map) firstChoice.get("message");
               String reply = (String) message.get("content");

               // ─── Save to history if sessionId provided ────
               if (request.getSessionId() != null) {
                    chatHistoryService.saveMessage(request.getSessionId(), "USER", request.getMessage());
                    chatHistoryService.saveMessage(request.getSessionId(), "ASSISTANT", reply);
               }

               return new AssistantResponse(reply, request.getSessionId());

          } catch (Exception e) {
               System.out.println("GROQ ERROR: " + e.getMessage());
               return new AssistantResponse(
                         "Sorry yaar, abhi AI service se connect nahi ho pa raha. " +
                                   "Thodi der baad try karo. Agar problem continue ho toh backend check karo.",
                         request.getSessionId());
          }
     }

     private String detectLanguage(String message) {
          String lower = message.toLowerCase();

          // Only pure Hindi/Urdu words — no English words that accidentally match
          String[] hindiWords = {
                    "mera", "mere", "meri", "mujhe", "tumhe", "tumhara",
                    "kya", "kyun", "kaise", "kaun", "kitna", "kab", "kahan",
                    "batao", "karo", "chahiye", "samjhao", "bolo", "banao", "btao",
                    "aaj", "kal", "abhi", "nahi", "bahut", "thoda", "zyada",
                    "padhna", "likhna", "dekho", "yaar", "dost", "theek", "accha",
                    "hai ", " hai", "hain", "tha ", " tha", "thi ", " thi",
                    "apna", "apni", "apne", "unka", "unki", "uska", "uski"
          };

          // Count how many Hindi words appear — require at least 2 matches
          int hindiCount = 0;
          for (String word : hindiWords) {
               if (lower.contains(word)) {
                    hindiCount++;
               }
               if (hindiCount >= 2) {
                    return "Hinglish (Hindi + English mix) — use Hindi words naturally mixed with English";
               }
          }

          return "English — reply in pure English only, no Hindi words at all";
     }

     // ─── Build real-time data context string ──────────────
     private String buildDataContext(Long userId, String email) {
          StringBuilder ctx = new StringBuilder("=== STUDENT'S REAL-TIME DATA ===\n");
          ctx.append("Today's date: ").append(LocalDate.now()).append("\n\n");

          // Subjects
          try {
               List<Subject> subjects = subjectService.getSubjectsByEmail(email);
               if (subjects.isEmpty()) {
                    ctx.append("SUBJECTS: None added yet.\n\n");
               } else {
                    ctx.append("SUBJECTS (").append(subjects.size()).append(" total):\n");
                    for (Subject s : subjects) {
                         ctx.append("- ").append(s.getSubjectName());
                         if (s.getProgress() != null)
                              ctx.append(" | Progress: ").append(s.getProgress()).append("%");
                         if (s.getDifficultyLevel() != null)
                              ctx.append(" | Difficulty: ").append(s.getDifficultyLevel());
                         ctx.append("\n");
                    }
                    ctx.append("\n");
               }
          } catch (Exception e) {
               ctx.append("SUBJECTS: Could not fetch.\n\n");
          }

          // Tasks
          try {
               List<Task> allTasks = taskService.getAllTasks(userId);
               List<Task> pendingTasks = allTasks.stream()
                         .filter(t -> t.getStatus() != null && t.getStatus().equalsIgnoreCase("PENDING"))
                         .collect(Collectors.toList());
               List<Task> completedTasks = allTasks.stream()
                         .filter(t -> t.getStatus() != null && t.getStatus().equalsIgnoreCase("COMPLETED"))
                         .collect(Collectors.toList());
               List<Task> todayTasks = taskService.getTodayTasks(userId);

               ctx.append("TASKS SUMMARY:\n");
               ctx.append("- Total: ").append(allTasks.size()).append("\n");
               ctx.append("- Pending: ").append(pendingTasks.size()).append("\n");
               ctx.append("- Completed: ").append(completedTasks.size()).append("\n");

               if (!pendingTasks.isEmpty()) {
                    ctx.append("PENDING TASKS LIST:\n");
                    pendingTasks.stream().limit(8).forEach(t -> {
                         ctx.append("  * ").append(t.getTitle());
                         if (t.getDueDate() != null)
                              ctx.append(" (Due: ").append(t.getDueDate()).append(")");
                         if (t.getPriority() != null)
                              ctx.append(" [").append(t.getPriority()).append("]");
                         ctx.append("\n");
                    });
               }

               if (!todayTasks.isEmpty()) {
                    ctx.append("TODAY'S TASKS:\n");
                    todayTasks.forEach(t -> ctx.append("  * ").append(t.getTitle())
                              .append(" [").append(t.getStatus()).append("]\n"));
               }
               ctx.append("\n");
          } catch (Exception e) {
               ctx.append("TASKS: Could not fetch.\n\n");
          }

          // Revisions
          try {
               List<Revision> revisions = revisionService.getAllRevisions(userId);
               List<Revision> pendingRevisions = revisions.stream()
                         .filter(r -> r.getStatus() != null && r.getStatus().equalsIgnoreCase("PENDING"))
                         .collect(Collectors.toList());

               ctx.append("REVISIONS:\n");
               ctx.append("- Total: ").append(revisions.size()).append("\n");
               ctx.append("- Pending revisions: ").append(pendingRevisions.size()).append("\n");

               if (!pendingRevisions.isEmpty()) {
                    ctx.append("PENDING REVISIONS:\n");
                    pendingRevisions.stream().limit(5).forEach(r -> {
                         ctx.append("  * ").append(r.getTitle());
                         if (r.getSubject() != null)
                              ctx.append(" (Subject: ").append(r.getSubject()).append(")");
                         if (r.getPriority() != null)
                              ctx.append(" [Priority: ").append(r.getPriority()).append("]");
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
}