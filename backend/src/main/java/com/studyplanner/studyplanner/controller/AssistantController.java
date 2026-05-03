package com.studyplanner.studyplanner.controller;

import com.studyplanner.studyplanner.dto.AssistantRequest;
import com.studyplanner.studyplanner.dto.AssistantResponse;
import com.studyplanner.studyplanner.dto.ChatMessageDto;
import com.studyplanner.studyplanner.dto.ChatSessionDto;
import com.studyplanner.studyplanner.model.AssistantLog;
import com.studyplanner.studyplanner.security.JwtUtil;
import com.studyplanner.studyplanner.service.AssistantLogService;
import com.studyplanner.studyplanner.service.AssistantService;
import com.studyplanner.studyplanner.service.ChatHistoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.lang.reflect.Method;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/assistant")
@CrossOrigin(origins = "*")
public class AssistantController {

     private final AssistantService assistantService;
     private final ChatHistoryService chatHistoryService;
     private final AssistantLogService assistantLogService;
     private final JwtUtil jwtUtil;

     public AssistantController(
               AssistantService assistantService,
               ChatHistoryService chatHistoryService,
               AssistantLogService assistantLogService,
               JwtUtil jwtUtil) {
          this.assistantService = assistantService;
          this.chatHistoryService = chatHistoryService;
          this.assistantLogService = assistantLogService;
          this.jwtUtil = jwtUtil;
     }

     // Extract Bearer token from Authorization header
     private String extractToken(String authHeader) {
          if (authHeader != null && authHeader.startsWith("Bearer ")) {
               return authHeader.substring(7).trim();
          }
          throw new RuntimeException("Missing or invalid Authorization header");
     }

     // ─── Send Message ─────────────────────────────────────
     @PostMapping("/chat")
     public ResponseEntity<AssistantResponse> chat(
               @RequestHeader("Authorization") String authHeader,
               @RequestBody AssistantRequest request) {

          String token = extractToken(authHeader);
          Long userId = jwtUtil.extractUserId(token);
          String email = jwtUtil.extractEmail(token);

          long startedAt = System.currentTimeMillis();

          try {
               AssistantResponse response = assistantService.chat(request, userId, email);

               saveAssistantLogSafely(
                         userId,
                         email,
                         request,
                         response,
                         "SUCCESS",
                         null,
                         System.currentTimeMillis() - startedAt);

               return ResponseEntity.ok(response);

          } catch (RuntimeException ex) {
               saveAssistantLogSafely(
                         userId,
                         email,
                         request,
                         null,
                         "FAILED",
                         ex.getMessage(),
                         System.currentTimeMillis() - startedAt);

               throw ex;
          }
     }

     // ─── Student: Get Own Assistant Logs ───────────────────
     @GetMapping("/my-logs")
     public ResponseEntity<?> getMyAssistantLogs(
               @RequestHeader("Authorization") String authHeader) {

          String token = extractToken(authHeader);
          Long userId = jwtUtil.extractUserId(token);

          List<AssistantLog> logs = assistantLogService.getStudentLogs(userId);

          Map<String, Object> response = new LinkedHashMap<>();
          response.put("success", true);
          response.put("message", "Assistant history fetched successfully.");
          response.put("logs", logs);
          response.put("total", logs.size());

          return ResponseEntity.ok(response);
     }

     // ─── Create New Session ───────────────────────────────
     @PostMapping("/session")
     public ResponseEntity<ChatSessionDto> createSession(
               @RequestHeader("Authorization") String authHeader,
               @RequestBody Map<String, Object> body) {

          String token = extractToken(authHeader);
          Long userId = jwtUtil.extractUserId(token);

          String firstMessage = body.get("firstMessage").toString();
          ChatSessionDto session = chatHistoryService.createSession(userId, firstMessage);
          return ResponseEntity.ok(session);
     }

     // ─── Get All Sessions for User ────────────────────────
     @GetMapping("/sessions")
     public ResponseEntity<List<ChatSessionDto>> getSessions(
               @RequestHeader("Authorization") String authHeader) {

          String token = extractToken(authHeader);
          Long userId = jwtUtil.extractUserId(token);

          List<ChatSessionDto> sessions = chatHistoryService.getSessionsByUser(userId);
          return ResponseEntity.ok(sessions);
     }

     // ─── Get Messages for Session ─────────────────────────
     @GetMapping("/session/{sessionId}")
     public ResponseEntity<List<ChatMessageDto>> getMessages(
               @PathVariable Long sessionId) {

          List<ChatMessageDto> messages = chatHistoryService.getMessagesBySession(sessionId);
          return ResponseEntity.ok(messages);
     }

     // ─── Delete Session ───────────────────────────────────
     @DeleteMapping("/session/{sessionId}")
     public ResponseEntity<Void> deleteSession(@PathVariable Long sessionId) {
          chatHistoryService.deleteSession(sessionId);
          return ResponseEntity.noContent().build();
     }

     /*
      * Assistant logging should never break the assistant chat.
      * If logging fails, we only print error in backend console.
      */
     private void saveAssistantLogSafely(
               Long userId,
               String email,
               AssistantRequest request,
               AssistantResponse response,
               String status,
               String errorMessage,
               Long responseTimeMs) {
          try {
               String question = extractQuestionText(request);
               String answer = extractAnswerText(response);

               Map<String, Object> logBody = new LinkedHashMap<>();
               logBody.put("studentId", userId);
               logBody.put("studentEmail", email);
               logBody.put("studentName", email);
               logBody.put("question", question);
               logBody.put("fullResponse", answer);
               logBody.put("status", status);
               logBody.put("provider", "BACKEND_ASSISTANT");
               logBody.put("modelName", "AssistantService");
               logBody.put("responseTimeMs", responseTimeMs);

               if (errorMessage != null && !errorMessage.trim().isEmpty()) {
                    logBody.put("errorMessage", errorMessage);
               }

               assistantLogService.createLog(logBody);

          } catch (Exception logError) {
               System.out.println("Assistant log save failed: " + logError.getMessage());
          }
     }

     private String extractQuestionText(AssistantRequest request) {
          String question = extractTextByGetter(
                    request,
                    "getQuestion",
                    "getMessage",
                    "getPrompt",
                    "getQuery",
                    "getUserMessage",
                    "getText",
                    "getContent");

          if (question == null || question.trim().isEmpty()) {
               return "Assistant query submitted.";
          }

          return question.trim();
     }

     private String extractAnswerText(AssistantResponse response) {
          if (response == null) {
               return "Assistant failed to generate a response.";
          }

          String answer = extractTextByGetter(
                    response,
                    "getAnswer",
                    "getResponse",
                    "getMessage",
                    "getReply",
                    "getContent",
                    "getText");

          if (answer == null || answer.trim().isEmpty()) {
               return response.toString();
          }

          return answer.trim();
     }

     private String extractTextByGetter(Object source, String... getterNames) {
          if (source == null) {
               return null;
          }

          for (String getterName : getterNames) {
               try {
                    Method method = source.getClass().getMethod(getterName);
                    Object value = method.invoke(source);

                    if (value != null && !String.valueOf(value).trim().isEmpty()) {
                         return String.valueOf(value).trim();
                    }
               } catch (Exception ignored) {
                    // Ignore missing getter and try next one.
               }
          }

          return null;
     }
}