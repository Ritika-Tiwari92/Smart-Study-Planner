package com.studyplanner.studyplanner.controller;

import com.studyplanner.studyplanner.model.AssistantLog;
import com.studyplanner.studyplanner.security.JwtUtil;
import com.studyplanner.studyplanner.service.AssistantLogService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/admin/assistant-logs")
public class AdminAssistantLogController {

     private final AssistantLogService assistantLogService;
     private final JwtUtil jwtUtil;

     public AdminAssistantLogController(AssistantLogService assistantLogService, JwtUtil jwtUtil) {
          this.assistantLogService = assistantLogService;
          this.jwtUtil = jwtUtil;
     }

     /*
      * Admin: Get all assistant logs.
      *
      * Examples:
      * GET /api/admin/assistant-logs
      * GET /api/admin/assistant-logs?status=SUCCESS
      * GET /api/admin/assistant-logs?queryType=TEST_HELP
      * GET /api/admin/assistant-logs?provider=LOCAL_FALLBACK
      */
     @GetMapping
     public ResponseEntity<?> getAssistantLogs(
               HttpServletRequest request,
               @RequestParam(required = false) String status,
               @RequestParam(required = false) String queryType,
               @RequestParam(required = false) String provider) {
          try {
               extractUserIdFromRequest(request);

               List<AssistantLog> logs;

               if (status != null && !status.trim().isEmpty() && !"all".equalsIgnoreCase(status)) {
                    logs = assistantLogService.getLogsByStatus(status);
               } else if (queryType != null && !queryType.trim().isEmpty() && !"all".equalsIgnoreCase(queryType)) {
                    logs = assistantLogService.getLogsByQueryType(queryType);
               } else if (provider != null && !provider.trim().isEmpty() && !"all".equalsIgnoreCase(provider)) {
                    logs = assistantLogService.getLogsByProvider(provider);
               } else {
                    logs = assistantLogService.getAllLogs();
               }

               Map<String, Object> response = new LinkedHashMap<>();
               response.put("success", true);
               response.put("message", "Assistant logs fetched successfully.");
               response.put("logs", logs);
               response.put("total", logs.size());

               return ResponseEntity.ok(response);

          } catch (SecurityException ex) {
               return error(HttpStatus.UNAUTHORIZED, ex.getMessage());
          } catch (Exception ex) {
               return error(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to fetch assistant logs: " + ex.getMessage());
          }
     }

     /*
      * Admin: Summary cards for Assistant Logs page.
      *
      * GET /api/admin/assistant-logs/summary
      */
     @GetMapping("/summary")
     public ResponseEntity<?> getAssistantLogSummary(HttpServletRequest request) {
          try {
               extractUserIdFromRequest(request);

               Map<String, Object> summary = assistantLogService.getSummary();

               Map<String, Object> response = new LinkedHashMap<>();
               response.put("success", true);
               response.put("message", "Assistant log summary fetched successfully.");
               response.put("summary", summary);

               return ResponseEntity.ok(response);

          } catch (SecurityException ex) {
               return error(HttpStatus.UNAUTHORIZED, ex.getMessage());
          } catch (Exception ex) {
               return error(HttpStatus.INTERNAL_SERVER_ERROR,
                         "Failed to fetch assistant log summary: " + ex.getMessage());
          }
     }

     /*
      * Admin: Student-wise assistant usage ranking.
      *
      * GET /api/admin/assistant-logs/ranking
      */
     @GetMapping("/ranking")
     public ResponseEntity<?> getStudentQueryRanking(HttpServletRequest request) {
          try {
               extractUserIdFromRequest(request);

               List<Map<String, Object>> ranking = assistantLogService.getStudentQueryRanking();

               Map<String, Object> response = new LinkedHashMap<>();
               response.put("success", true);
               response.put("message", "Assistant student ranking fetched successfully.");
               response.put("ranking", ranking);
               response.put("total", ranking.size());

               return ResponseEntity.ok(response);

          } catch (SecurityException ex) {
               return error(HttpStatus.UNAUTHORIZED, ex.getMessage());
          } catch (Exception ex) {
               return error(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to fetch assistant ranking: " + ex.getMessage());
          }
     }

     /*
      * Admin/Internal: Create assistant log manually.
      * Useful for testing admin page without calling actual assistant chat.
      *
      * POST /api/admin/assistant-logs
      */
     @PostMapping
     public ResponseEntity<?> createAssistantLog(
               HttpServletRequest request,
               @RequestBody(required = false) Map<String, Object> requestBody) {
          try {
               extractUserIdFromRequest(request);

               AssistantLog log = assistantLogService.createLog(safeBody(requestBody));

               Map<String, Object> response = new LinkedHashMap<>();
               response.put("success", true);
               response.put("message", "Assistant log created successfully.");
               response.put("id", log.getId());
               response.put("log", log);

               return ResponseEntity.status(HttpStatus.CREATED).body(response);

          } catch (SecurityException ex) {
               return error(HttpStatus.UNAUTHORIZED, ex.getMessage());
          } catch (IllegalArgumentException ex) {
               return error(HttpStatus.BAD_REQUEST, ex.getMessage());
          } catch (Exception ex) {
               return error(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to create assistant log: " + ex.getMessage());
          }
     }

     private Long extractUserIdFromRequest(HttpServletRequest request) {
          String authHeader = request.getHeader("Authorization");

          if (authHeader == null || authHeader.trim().isEmpty()) {
               throw new SecurityException("Authorization header is missing.");
          }

          if (!authHeader.startsWith("Bearer ")) {
               throw new SecurityException("Invalid authorization header. Bearer token is required.");
          }

          String token = authHeader.substring(7).trim();

          if (token.isEmpty()) {
               throw new SecurityException("JWT token is missing.");
          }

          try {
               return Long.valueOf(String.valueOf(jwtUtil.extractUserId(token)));
          } catch (Exception ex) {
               throw new SecurityException("Unable to extract user id from token.");
          }
     }

     private Map<String, Object> safeBody(Map<String, Object> requestBody) {
          if (requestBody == null) {
               return new LinkedHashMap<>();
          }

          return requestBody;
     }

     private ResponseEntity<Map<String, Object>> error(HttpStatus status, String message) {
          Map<String, Object> response = new LinkedHashMap<>();
          response.put("success", false);
          response.put("message", message);
          response.put("status", status.value());

          return ResponseEntity.status(status).body(response);
     }
}