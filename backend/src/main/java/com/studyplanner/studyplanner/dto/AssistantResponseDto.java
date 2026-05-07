package com.studyplanner.studyplanner.dto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class AssistantResponseDto {

     private String reply;
     private String intent;
     private List<String> suggestions = new ArrayList<>();
     private LocalDateTime generatedAt;

     public AssistantResponseDto() {
     }

     public AssistantResponseDto(String reply, String intent, List<String> suggestions) {
          this.reply = reply;
          this.intent = intent;
          this.suggestions = suggestions;
          this.generatedAt = LocalDateTime.now();
     }

     public String getReply() {
          return reply;
     }

     public void setReply(String reply) {
          this.reply = reply;
     }

     public String getIntent() {
          return intent;
     }

     public void setIntent(String intent) {
          this.intent = intent;
     }

     public List<String> getSuggestions() {
          return suggestions;
     }

     public void setSuggestions(List<String> suggestions) {
          this.suggestions = suggestions;
     }

     public LocalDateTime getGeneratedAt() {
          return generatedAt;
     }

     public void setGeneratedAt(LocalDateTime generatedAt) {
          this.generatedAt = generatedAt;
     }
}
