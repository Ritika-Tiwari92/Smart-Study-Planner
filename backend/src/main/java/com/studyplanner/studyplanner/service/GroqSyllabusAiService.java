package com.studyplanner.studyplanner.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
public class GroqSyllabusAiService {

     private final ObjectMapper objectMapper;
     private final WebClient webClient;
     private final String groqApiKey;

     public GroqSyllabusAiService(
               ObjectMapper objectMapper,
               @Value("${groq.api.key:}") String groqApiKey,
               @Value("${groq.api.base-url:https://api.groq.com/openai/v1}") String groqBaseUrl) {

          this.objectMapper = objectMapper;
          this.groqApiKey = groqApiKey;

          this.webClient = WebClient.builder()
                    .baseUrl(groqBaseUrl)
                    .build();
     }

     public Map<String, Object> analyzeSyllabus(String syllabusText, String subjectName) {
          if (groqApiKey == null || groqApiKey.isBlank()) {
               throw new RuntimeException("Groq API key is missing. Please set GROQ_API_KEY environment variable.");
          }

          if (syllabusText == null || syllabusText.trim().length() < 50) {
               throw new RuntimeException("Syllabus text is too short for AI analysis.");
          }

          String prompt = buildPrompt(syllabusText, subjectName);

          Map<String, Object> requestBody = Map.of(
                    "model", "llama-3.1-8b-instant",
                    "messages", List.of(
                              Map.of(
                                        "role", "system",
                                        "content",
                                        "You are an academic syllabus analyzer. Always return valid JSON only."),
                              Map.of(
                                        "role", "user",
                                        "content", prompt)),
                    "temperature", 0.2,
                    "max_tokens", 2500);

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
                    .block(Duration.ofSeconds(60));

          String rawContent = extractContent(response);
          Map<String, Object> parsed = parseJsonObject(rawContent);

          validateAnalysis(parsed);

          return parsed;
     }

     private String buildPrompt(String syllabusText, String subjectName) {
          String safeSubject = subjectName == null || subjectName.isBlank()
                    ? "this subject"
                    : subjectName;

          String truncated = syllabusText.length() > 10000
                    ? syllabusText.substring(0, 10000)
                    : syllabusText;

          return """
                    Analyze the following syllabus for the subject "%s".

                    Return ONLY valid JSON.
                    Do not include markdown.
                    Do not include explanation.
                    Do not include code fences.

                    Required JSON format:
                    {
                      "topics": [
                        {
                          "topicNumber": 1,
                          "topicName": "Topic Name",
                          "description": "Brief one sentence description",
                          "difficulty": "easy",
                          "estimatedHours": 2,
                          "recommendedWeek": 1
                        }
                      ],
                      "totalHours": 20,
                      "weeksNeeded": 5,
                      "overallDifficulty": "medium",
                      "studyTips": "Revise difficult topics first and practice regularly."
                    }

                    Rules:
                    - Extract important units, chapters, topics, and concepts.
                    - difficulty must be only easy, medium, or hard.
                    - estimatedHours must be a number.
                    - recommendedWeek must be a number.
                    - weeksNeeded should usually be between 2 and 10.
                    - totalHours should be realistic.
                    - Topic names must be short and student-friendly.
                    - Descriptions must be simple and clear.
                    - Return at least 6 topics if syllabus has enough content.

                    Syllabus text:
                    %s
                    """.formatted(safeSubject, truncated);
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
               throw new RuntimeException("Unable to parse AI syllabus JSON: " + e.getMessage(), e);
          }
     }

     private void validateAnalysis(Map<String, Object> analysis) {
          Object topicsObj = analysis.get("topics");

          if (!(topicsObj instanceof List<?> topics) || topics.isEmpty()) {
               throw new RuntimeException("AI analysis did not return any topics.");
          }
     }
}