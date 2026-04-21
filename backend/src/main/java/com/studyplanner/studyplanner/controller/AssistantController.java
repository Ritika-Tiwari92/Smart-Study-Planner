package com.studyplanner.studyplanner.controller;

import com.studyplanner.studyplanner.dto.AssistantRequest;
import com.studyplanner.studyplanner.dto.AssistantResponse;
import com.studyplanner.studyplanner.dto.ChatMessageDto;
import com.studyplanner.studyplanner.dto.ChatSessionDto;
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

     public AssistantController(AssistantService assistantService,
               ChatHistoryService chatHistoryService) {
          this.assistantService = assistantService;
          this.chatHistoryService = chatHistoryService;
     }

     // ─── Send Message ─────────────────────────────────────
     @PostMapping("/chat")
     public ResponseEntity<AssistantResponse> chat(@RequestBody AssistantRequest request) {
          AssistantResponse response = assistantService.chat(request);
          return ResponseEntity.ok(response);
     }

     // ─── Create New Session ───────────────────────────────
     @PostMapping("/session")
     public ResponseEntity<ChatSessionDto> createSession(@RequestBody Map<String, Object> body) {
          Long userId = Long.valueOf(body.get("userId").toString());
          String firstMessage = body.get("firstMessage").toString();
          ChatSessionDto session = chatHistoryService.createSession(userId, firstMessage);
          return ResponseEntity.ok(session);
     }

     // ─── Get All Sessions for User ────────────────────────
     @GetMapping("/sessions/{userId}")
     public ResponseEntity<List<ChatSessionDto>> getSessions(@PathVariable Long userId) {
          List<ChatSessionDto> sessions = chatHistoryService.getSessionsByUser(userId);
          return ResponseEntity.ok(sessions);
     }

     // ─── Get Messages for Session ─────────────────────────
     @GetMapping("/session/{sessionId}")
     public ResponseEntity<List<ChatMessageDto>> getMessages(@PathVariable Long sessionId) {
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