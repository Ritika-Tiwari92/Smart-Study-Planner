package com.studyplanner.studyplanner.service;

import com.studyplanner.studyplanner.dto.AssistantRequest;
import com.studyplanner.studyplanner.dto.AssistantResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

@Service
public class AssistantService {

     @Value("${groq.api.key}")
     private String groqApiKey;

     private final WebClient webClient;
     private final ChatHistoryService chatHistoryService;

     public AssistantService(WebClient.Builder webClientBuilder,
               ChatHistoryService chatHistoryService) {
          this.webClient = webClientBuilder
                    .baseUrl("https://api.groq.com")
                    .build();
          this.chatHistoryService = chatHistoryService;
     }

     public AssistantResponse chat(AssistantRequest request) {

          String systemContext = "You are Astra, an AI study assistant for students. " +
                    "Help with study plans, topic explanations, revision strategies, " +
                    "coding doubts, mock test preparation, and smart learning support. " +
                    "Keep responses clear, concise, and student-friendly.";

          Map<String, Object> requestBody = Map.of(
                    "model", "llama-3.1-8b-instant",
                    "messages", List.of(
                              Map.of("role", "system", "content", systemContext),
                              Map.of("role", "user", "content", request.getMessage())),
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
                    chatHistoryService.saveMessage(
                              request.getSessionId(), "USER", request.getMessage());
                    chatHistoryService.saveMessage(
                              request.getSessionId(), "ASSISTANT", reply);
               }

               return new AssistantResponse(reply, request.getSessionId());

          } catch (Exception e) {
               System.out.println("GROQ ERROR: " + e.getMessage());
               e.printStackTrace();
               return new AssistantResponse(
                         "Sorry, I could not process your request right now. Please try again.",
                         request.getSessionId());
          }
     }
}