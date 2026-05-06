package com.studyplanner.studyplanner.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.studyplanner.studyplanner.dto.PomodoroAiSuggestionRequestDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
public class GroqPomodoroAiService {

     private final ObjectMapper objectMapper;
     private final WebClient webClient;
     private final String groqApiKey;

     public GroqPomodoroAiService(
               ObjectMapper objectMapper,
               @Value("${groq.api.key:}") String groqApiKey,
               @Value("${groq.api.base-url:https://api.groq.com/openai/v1}") String groqBaseUrl) {

          this.objectMapper = objectMapper;
          this.groqApiKey = groqApiKey;

          this.webClient = WebClient.builder()
                    .baseUrl(groqBaseUrl)
                    .build();
     }

     public Map<String, Object> generateSuggestion(PomodoroAiSuggestionRequestDto request) {
          if (groqApiKey == null || groqApiKey.isBlank()) {
               throw new RuntimeException("Groq API key is missing. Please set GROQ_API_KEY environment variable.");
          }

          String prompt = buildPrompt(request);

          Map<String, Object> requestBody = Map.of(
                    "model", "llama-3.1-8b-instant",
                    "messages", List.of(
                              Map.of(
                                        "role", "system",
                                        "content",
                                        "You are EduMind AI Productivity Coach. Always return valid JSON only."),
                              Map.of(
                                        "role", "user",
                                        "content", prompt)),
                    "temperature", 0.65,
                    "max_tokens", 1500);

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

     private String buildPrompt(PomodoroAiSuggestionRequestDto request) {
          String subjectName = safe(request == null ? null : request.getSubjectName());
          String selectedTask = safe(request == null ? null : request.getSelectedTask());
          String selectedRevision = safe(request == null ? null : request.getSelectedRevision());
          String selectedPlan = safe(request == null ? null : request.getSelectedPlan());
          String videoTitle = safe(request == null ? null : request.getVideoTitle());
          String notes = safe(request == null ? null : request.getNotes());

          Integer plannedDuration = request == null || request.getPlannedDurationMinutes() == null
                    ? 25
                    : request.getPlannedDurationMinutes();

          Long totalFocusMinutes = request == null || request.getTotalFocusMinutes() == null
                    ? 0L
                    : request.getTotalFocusMinutes();

          Long completedSessions = request == null || request.getCompletedSessions() == null
                    ? 0L
                    : request.getCompletedSessions();

          Long interruptedSessions = request == null || request.getInterruptedSessions() == null
                    ? 0L
                    : request.getInterruptedSessions();

          return """
                    You are EduMind AI Productivity Coach for a student study timer.

                    Return ONLY valid JSON.
                    Do not include markdown.
                    Do not include explanation outside JSON.
                    Do not include code fences.

                    Context:
                    Subject: "%s"
                    Selected Task: "%s"
                    Selected Revision: "%s"
                    Selected Planner Session: "%s"
                    Video Title: "%s"
                    Planned Duration: %d minutes
                    Total Focus Minutes: %d
                    Completed Sessions: %d
                    Interrupted Sessions: %d
                    Notes: "%s"

                    Your job:
                    Create a personalized Pomodoro productivity suggestion.
                    Use selected task, revision, planner session, video title, duration, and past focus data.
                    If the session is long, suggest breaks.
                    If interrupted sessions are high, suggest smaller focus blocks.
                    If subject/video is technical, suggest practice/dry run.
                    If subject/video is theoretical, suggest active recall and notes.
                    If revision is selected, suggest quick recall before and after the session.
                    Keep tone student-friendly and practical.

                    Output JSON format:
                    {
                      "focusTitle": "Short focus title",
                      "recommendedDuration": 25,
                      "focusMode": "Deep Focus",
                      "preSessionChecklist": [
                        "Step 1",
                        "Step 2",
                        "Step 3"
                      ],
                      "duringSessionTips": [
                        "Tip 1",
                        "Tip 2",
                        "Tip 3"
                      ],
                      "afterSessionAction": "One practical action after completing the session.",
                      "burnoutWarning": "Short warning if needed, otherwise positive guidance.",
                      "productivityScoreImpact": "How this session may improve productivity.",
                      "reason": "Why this suggestion fits the current study context."
                    }

                    Rules:
                    - recommendedDuration must be between 5 and 60.
                    - preSessionChecklist must contain 3 short points.
                    - duringSessionTips must contain 3 short points.
                    - Use English only.
                    - Mention actual subject/topic/task/revision when available.
                    - Keep each sentence short and clear.
                    """.formatted(
                    subjectName,
                    selectedTask,
                    selectedRevision,
                    selectedPlan,
                    videoTitle,
                    plannedDuration,
                    totalFocusMinutes,
                    completedSessions,
                    interruptedSessions,
                    notes);
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
               throw new RuntimeException("Unable to parse AI Pomodoro JSON: " + e.getMessage(), e);
          }
     }

     private void validateResponse(Map<String, Object> analysis) {
          if (analysis == null || analysis.isEmpty()) {
               throw new RuntimeException("AI Pomodoro suggestion is empty.");
          }

          if (!analysis.containsKey("focusTitle")) {
               throw new RuntimeException("AI Pomodoro suggestion does not contain focusTitle.");
          }

          if (!analysis.containsKey("preSessionChecklist")) {
               throw new RuntimeException("AI Pomodoro suggestion does not contain preSessionChecklist.");
          }

          if (!analysis.containsKey("duringSessionTips")) {
               throw new RuntimeException("AI Pomodoro suggestion does not contain duringSessionTips.");
          }
     }
}