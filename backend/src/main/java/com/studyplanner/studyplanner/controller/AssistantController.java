package com.studyplanner.studyplanner.controller;

import com.studyplanner.studyplanner.dto.AssistantRequest;
import com.studyplanner.studyplanner.dto.AssistantResponse;
import com.studyplanner.studyplanner.dto.ChatMessageDto;
import com.studyplanner.studyplanner.dto.ChatSessionDto;
import com.studyplanner.studyplanner.security.JwtUtil;
import com.studyplanner.studyplanner.service.AssistantService;
import com.studyplanner.studyplanner.service.ChatHistoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/assistant")
@CrossOrigin(origins = "*")
public class AssistantController {

     private final AssistantService assistantService;
     private final ChatHistoryService chatHistoryService;
     private final JwtUtil jwtUtil;

     public AssistantController(AssistantService assistantService,
               ChatHistoryService chatHistoryService,
               JwtUtil jwtUtil) {
          this.assistantService = assistantService;
          this.chatHistoryService = chatHistoryService;
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

          AssistantResponse response = assistantService.chat(request, userId, email);
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
}