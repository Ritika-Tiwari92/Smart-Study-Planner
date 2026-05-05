package com.studyplanner.studyplanner.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.studyplanner.studyplanner.dto.TaskAiRequestDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
public class GroqTaskAiService {

     private final ObjectMapper objectMapper;
     private final WebClient webClient;
     private final String groqApiKey;

     public GroqTaskAiService(
               ObjectMapper objectMapper,
               @Value("${groq.api.key:}") String groqApiKey,
               @Value("${groq.api.base-url:https://api.groq.com/openai/v1}") String groqBaseUrl) {

          this.objectMapper = objectMapper;
          this.groqApiKey = groqApiKey;

          this.webClient = WebClient.builder()
                    .baseUrl(groqBaseUrl)
                    .build();
     }

     public Map<String, Object> analyzeTask(TaskAiRequestDto request) {
          if (groqApiKey == null || groqApiKey.isBlank()) {
               throw new RuntimeException("Groq API key is missing. Please set GROQ_API_KEY environment variable.");
          }

          if (request == null || request.getTitle() == null || request.getTitle().isBlank()) {
               throw new RuntimeException("Task title is required for AI analysis.");
          }

          String prompt = buildPrompt(request);

          Map<String, Object> requestBody = Map.of(
                    "model", "llama-3.1-8b-instant",
                    "messages", List.of(
                              Map.of(
                                        "role", "system",
                                        "content",
                                        "You are an academic productivity assistant. Always return valid JSON only."),
                              Map.of(
                                        "role", "user",
                                        "content", prompt)),
                    "temperature", 0.65,
                    "max_tokens", 1800);

          Map<String, Object> response = webClient.post()
                    .uri("/chat/completions")
                    .header("Authorization", "Bearer " + groqApiKey)
                    .header("Content-Type", "application/json")
                    .bodyValue(requestBody)
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, clientResponse -> clientResponse.bodyToMono(String.class)
                              .map(errorBody -> new RuntimeException(
                                        "Groq API error: "
                                                  + clientResponse.statusCode().value()
                                                  + " - "
                                                  + errorBody)))
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {
                    })
                    .block(Duration.ofSeconds(45));

          String rawContent = extractContent(response);
          Map<String, Object> parsed = parseJsonObject(rawContent);

          validateResponse(parsed);

          return parsed;
     }

     private String buildPrompt(TaskAiRequestDto request) {
          String title = safe(request.getTitle());
          String description = safe(request.getDescription());
          String subject = safe(request.getSubjectName());
          String dueDate = safe(request.getDueDate());
          String priority = safe(request.getPriority());
          String status = safe(request.getStatus());

          return """
                    You are EduMind AI Task Coach, an academic productivity assistant for students.

                    Return ONLY valid JSON.
                    Do not include markdown.
                    Do not include explanation outside JSON.
                    Do not include code fences.

                    Your job:
                    Analyze the task title, description, subject name, due date, priority, and status.
                    Then create a unique, subject-specific productivity plan.

                    Task context:
                    Title: "%s"
                    Description: "%s"
                    Subject: "%s"
                    Due Date: "%s"
                    Priority: "%s"
                    Status: "%s"

                    Very important rules:
                    - First, infer the academic domain from the subject name, title, and description.
                    - Do not depend on a fixed subject list.
                    - Do not give generic advice.
                    - Every text field must mention the actual subject, topic, or task title.
                    - The response must be different for different subjects.
                    - The response must be useful even for subjects not listed in this prompt.
                    - If the subject is technical, include coding/practical/concept practice when relevant.
                    - If the subject is theoretical, include notes, diagrams, definitions, examples, and revision when relevant.
                    - If the subject is numerical, include formulas, solved examples, steps, and practice problems when relevant.
                    - If the subject is language-based, include reading, grammar, writing practice, vocabulary, or examples when relevant.
                    - If the subject is geography/social science, include maps, locations, diagrams, definitions, examples, and case studies when relevant.
                    - If the subject is science, include concepts, diagrams, formulas, experiments, and examples when relevant.
                    - If the subject is business/commerce/economics, include definitions, charts, examples, numericals, and case-based understanding when relevant.
                    - If the task title gives a specific topic, focus on that topic more than the broad subject.

                    Output JSON format:
                    {
                      "suggestedPriority": "High",
                      "smartScore": 85,
                      "pomodoroSessions": 3,
                      "healthLabel": "Urgent",
                      "studyTip": "A specific study tip for this exact task and subject.",
                      "breakdown": [
                        "Specific step 1 for this exact task",
                        "Specific step 2 for this exact task",
                        "Specific step 3 for this exact task"
                      ],
                      "plannerSuggestion": "A specific planner suggestion based on the subject, task, and due date.",
                      "rescheduleSuggestion": "A specific reschedule suggestion if this task is missed.",
                      "reason": "A specific reason why this exact task needs this priority and plan."
                    }

                    Output rules:
                    - suggestedPriority must be only High, Medium, or Low.
                    - smartScore must be a number from 0 to 100.
                    - pomodoroSessions must be a number from 1 to 4.
                    - healthLabel must be only Critical, Urgent, Focus, Safe, or Done.
                    - breakdown must contain 3 to 5 short actionable steps.
                    - Use English only.
                    - Keep the language simple and student-friendly.
                    - Avoid repeating the same sentence structure for every task.
                    """
                    .formatted(title, description, subject, dueDate, priority, status);
     }

     private String safe(String value) {
          return value == null || value.isBlank() ? "Not provided" : value.trim();
     }

     private String extractContent(Map<String, Object> response) {
          if (response == null) {
               throw new RuntimeException("Groq returned an empty response.");
          }

          Object choicesObj = response.get("choices");

          if (!(choicesObj instanceof List<?> choices) || choices.isEmpty()) {
               throw new RuntimeException("Groq response does not contain choices.");
          }

          Object firstChoiceObj = choices.get(0);

          if (!(firstChoiceObj instanceof Map<?, ?> firstChoice)) {
               throw new RuntimeException("Groq response choice is invalid.");
          }

          Object messageObj = firstChoice.get("message");

          if (!(messageObj instanceof Map<?, ?> message)) {
               throw new RuntimeException("Groq response message is invalid.");
          }

          Object contentObj = message.get("content");

          if (contentObj == null) {
               throw new RuntimeException("Groq response content is empty.");
          }

          return contentObj.toString();
     }

     private Map<String, Object> parseJsonObject(String rawContent) {
          try {
               String cleaned = rawContent
                         .replace("```json", "")
                         .replace("```", "")
                         .trim();

               int start = cleaned.indexOf("{");
               int end = cleaned.lastIndexOf("}");

               if (start < 0 || end < start) {
                    throw new RuntimeException("AI did not return a valid JSON object.");
               }

               String json = cleaned.substring(start, end + 1);

               return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {
               });

          } catch (Exception e) {
               throw new RuntimeException("Unable to parse AI task JSON: " + e.getMessage(), e);
          }
     }

     private void validateResponse(Map<String, Object> analysis) {
          if (analysis == null || analysis.isEmpty()) {
               throw new RuntimeException("AI task analysis is empty.");
          }

          if (!analysis.containsKey("studyTip")) {
               throw new RuntimeException("AI task analysis does not contain studyTip.");
          }

          if (!analysis.containsKey("breakdown")) {
               throw new RuntimeException("AI task analysis does not contain breakdown.");
          }
     }
}