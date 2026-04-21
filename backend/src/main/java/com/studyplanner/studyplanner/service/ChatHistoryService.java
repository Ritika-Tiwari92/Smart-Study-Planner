package com.studyplanner.studyplanner.service;

import com.studyplanner.studyplanner.dto.ChatMessageDto;
import com.studyplanner.studyplanner.dto.ChatSessionDto;
import com.studyplanner.studyplanner.model.ChatMessage;
import com.studyplanner.studyplanner.model.ChatSession;
import com.studyplanner.studyplanner.model.User;
import com.studyplanner.studyplanner.repository.ChatMessageRepository;
import com.studyplanner.studyplanner.repository.ChatSessionRepository;
import com.studyplanner.studyplanner.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ChatHistoryService {

     private final ChatSessionRepository chatSessionRepository;
     private final ChatMessageRepository chatMessageRepository;
     private final UserRepository userRepository;

     public ChatHistoryService(
               ChatSessionRepository chatSessionRepository,
               ChatMessageRepository chatMessageRepository,
               UserRepository userRepository) {
          this.chatSessionRepository = chatSessionRepository;
          this.chatMessageRepository = chatMessageRepository;
          this.userRepository = userRepository;
     }

     // ─── Create New Session ───────────────────────────────
     public ChatSessionDto createSession(Long userId, String firstMessage) {
          User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

          ChatSession session = new ChatSession();
          session.setUser(user);

          // Title = first 50 chars of first message
          String title = firstMessage.length() > 50
                    ? firstMessage.substring(0, 50) + "..."
                    : firstMessage;
          session.setTitle(title);

          ChatSession saved = chatSessionRepository.save(session);
          return toSessionDto(saved);
     }

     // ─── Save Message ─────────────────────────────────────
     public void saveMessage(Long sessionId, String sender, String content) {
          ChatSession session = chatSessionRepository.findById(sessionId)
                    .orElseThrow(() -> new RuntimeException("Session not found"));

          ChatMessage message = new ChatMessage();
          message.setSession(session);
          message.setSender(sender);
          message.setContent(content);

          chatMessageRepository.save(message);
     }

     // ─── Get All Sessions for User ────────────────────────
     public List<ChatSessionDto> getSessionsByUser(Long userId) {
          return chatSessionRepository
                    .findByUserIdOrderByCreatedAtDesc(userId)
                    .stream()
                    .map(this::toSessionDto)
                    .collect(Collectors.toList());
     }

     // ─── Get Messages for Session ─────────────────────────
     public List<ChatMessageDto> getMessagesBySession(Long sessionId) {
          return chatMessageRepository
                    .findBySessionIdOrderByCreatedAtAsc(sessionId)
                    .stream()
                    .map(this::toMessageDto)
                    .collect(Collectors.toList());
     }

     // ─── Delete Session ───────────────────────────────────
     public void deleteSession(Long sessionId) {
          chatSessionRepository.deleteById(sessionId);
     }

     // ─── Mappers ──────────────────────────────────────────
     private ChatSessionDto toSessionDto(ChatSession session) {
          return new ChatSessionDto(
                    session.getId(),
                    session.getTitle(),
                    session.getCreatedAt());
     }

     private ChatMessageDto toMessageDto(ChatMessage message) {
          return new ChatMessageDto(
                    message.getId(),
                    message.getSender(),
                    message.getContent(),
                    message.getCreatedAt());
     }
}