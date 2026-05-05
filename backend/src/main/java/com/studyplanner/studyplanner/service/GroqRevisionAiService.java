package com.studyplanner.studyplanner.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.studyplanner.studyplanner.dto.RevisionAiRequestDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
public class GroqRevisionAiService {

     private final ObjectMapper objectMapper;
     private final WebClient webClient;
     private final String groqApiKey;

     public GroqRevisionAiService(
               ObjectMapper objectMapper,
               @Value("${groq.api.key:}") String groqApiKey,
               @Value("${groq.api.base-url:https://api.groq.com/openai/v1}") String groqBaseUrl) {

          this.objectMapper = objectMapper;
          this.groqApiKey = groqApiKey;

          this.webClient = WebClient.builder()
                    .baseUrl(groqBaseUrl)
                    .build();
     }

     public Map<String, Object> analyzeRevision(RevisionAiRequestDto request) {
          if (groqApiKey == null || groqApiKey.isBlank()) {
               throw new RuntimeException("Groq API key is missing. Please set GROQ_API_KEY environment variable.");
          }

          if (request == null || request.getTitle() == null || request.getTitle().isBlank()) {
               throw new RuntimeException("Revision title is required for AI analysis.");
          }

          String prompt = buildPrompt(request);

          Map<String, Object> requestBody = Map.of(
                    "model", "llama-3.1-8b-instant",
                    "messages", List.of(
                              Map.of(
                                        "role", "system",
                                        "content", "You are EduMind AI Revision Coach. Always return valid JSON only."),
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

     private String buildPrompt(RevisionAiRequestDto request) {
          String title = safe(request.getTitle());
          String subject = safe(request.getSubject());
          String priority = safe(request.getPriority());
          String revisionDate = safe(request.getRevisionDate());
          String status = safe(request.getStatus());
          String description = safe(request.getDescription());

          return """
                    You are EduMind AI Revision Coach, an academic revision assistant for students.

                    Return ONLY valid JSON.
                    Do not include markdown.
                    Do not include explanation outside JSON.
                    Do not include code fences.

                    Your job:
                    Analyze the revision topic, subject, priority, revision date, status, and description.
                    Create a unique, subject-specific revision strategy.

                    Revision context:
                    Topic Title: "%s"
                    Subject: "%s"
                    Priority: "%s"
                    Revision Date: "%s"
                    Status: "%s"
                    Description: "%s"

                    Very important rules:
                    - First infer the academic domain from subject, title, and description.
                    - Do not depend on a fixed subject list.
                    - Do not give generic revision advice.
                    - Every text field must mention the actual subject, topic, or revision title.
                    - If the topic is theoretical, suggest active recall, short notes, diagrams, definitions, and examples.
                    - If the topic is numerical, suggest formulas, solved examples, step-by-step practice, and mistakes review.
                    - If the topic is technical or coding based, suggest dry run, small programs, debugging, syntax practice, and examples.
                    - If the topic is geography or social science, suggest maps, locations, keywords, diagrams, examples, and case studies.
                    - If the topic is language based, suggest reading, grammar, vocabulary, writing practice, and examples.
                    - If status is Weak Topic, give a stronger revision strategy.
                    - If revision date is close, increase urgency.
                    - The revision strategy must be different for different subjects.
                    - Avoid repeating the same sentence structure for every revision topic.

                    Output JSON format:
                    {
                      "revisionPriority": "High",
                      "revisionScore": 85,
                      "recommendedMethod": "Active Recall + Practice",
                      "focusSessions": 3,
                      "memoryTip": "A specific memory tip for this revision topic.",
                      "revisionPlan": [
                        "Specific step 1 for this exact revision topic",
                        "Specific step 2 for this exact revision topic",
                        "Specific step 3 for this exact revision topic"
                      ],
                      "quickTestQuestions": [
                        "Question 1 for self-testing",
                        "Question 2 for self-testing",
                        "Question 3 for self-testing"
                      ],
                      "nextReviewSuggestion": "Specific suggestion for the next review cycle.",
                      "reason": "Specific reason why this revision strategy fits this topic."
                    }

                    Output rules:
                    - revisionPriority must be only High, Medium, or Low.
                    - revisionScore must be a number from 0 to 100.
                    - focusSessions must be a number from 1 to 4.
                    - revisionPlan must contain 3 to 5 short actionable steps.
                    - quickTestQuestions must contain exactly 3 short self-test questions.
                    - Use English only.
                    - Keep the language simple and student-friendly.
                    """
                    .formatted(
                              title,
                              subject,
                              priority,
                              revisionDate,
                              status,
                              description);
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
               throw new RuntimeException("Unable to parse AI revision JSON: " + e.getMessage(), e);
          }
     }

     private void validateResponse(Map<String, Object> analysis) {
          if (analysis == null || analysis.isEmpty()) {
               throw new RuntimeException("AI revision analysis is empty.");
          }

          if (!analysis.containsKey("memoryTip")) {
               throw new RuntimeException("AI revision analysis does not contain memoryTip.");
          }

          if (!analysis.containsKey("revisionPlan")) {
               throw new RuntimeException("AI revision analysis does not contain revisionPlan.");
          }

          if (!analysis.containsKey("quickTestQuestions")) {
               throw new RuntimeException("AI revision analysis does not contain quickTestQuestions.");
          }
     }
}