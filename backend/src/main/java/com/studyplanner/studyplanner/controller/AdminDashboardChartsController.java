package com.studyplanner.studyplanner.controller;

import com.studyplanner.studyplanner.model.User;
import com.studyplanner.studyplanner.repository.UserRepository;
import com.studyplanner.studyplanner.security.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

/**
 * AdminDashboardChartsController
 *
 * Separate premium chart endpoint for Admin Dashboard.
 *
 * Why separate controller?
 * - Existing AdminController is already large and working.
 * - This file adds final graph datasets without breaking old APIs.
 *
 * API:
 * GET /api/admin/dashboard-charts
 */
@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminDashboardChartsController {

     private final UserRepository userRepository;
     private final JwtUtil jwtUtil;
     private final JdbcTemplate jdbcTemplate;

     public AdminDashboardChartsController(
               UserRepository userRepository,
               JwtUtil jwtUtil,
               JdbcTemplate jdbcTemplate) {
          this.userRepository = userRepository;
          this.jwtUtil = jwtUtil;
          this.jdbcTemplate = jdbcTemplate;
     }

     private User getAdminFromToken(String authHeader) {
          try {
               if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                    return null;
               }

               String token = authHeader.replace("Bearer ", "").trim();
               String email = jwtUtil.extractEmail(token);
               Optional<User> userOpt = userRepository.findByEmail(email);

               if (userOpt.isEmpty() || userOpt.get().getRole() != User.Role.ADMIN) {
                    return null;
               }

               return userOpt.get();
          } catch (Exception e) {
               return null;
          }
     }

     private ResponseEntity<Map<String, Object>> unauthorized() {
          return ResponseEntity.status(403)
                    .body(Map.of("success", false, "message", "Admin access required."));
     }

     @GetMapping("/dashboard-charts")
     public ResponseEntity<Map<String, Object>> getPremiumDashboardCharts(
               @RequestHeader("Authorization") String authHeader) {

          if (getAdminFromToken(authHeader) == null) {
               return unauthorized();
          }

          Map<String, Object> response = new LinkedHashMap<>();
          response.put("success", true);
          response.put("message", "Admin premium dashboard charts fetched successfully.");

          response.put("platformActivityChart", buildPlatformActivityChartData());
          response.put("pomodoroTrendChart", buildPomodoroTrendChartData());
          response.put("assistantTrendChart", buildAssistantTrendChartData());
          response.put("securityHealthChart", buildSecurityHealthChartData());
          response.put("taskStatusChart", buildTaskStatusChartData());
          response.put("subjectEngagementChart", buildSubjectEngagementChartData());

          return ResponseEntity.ok(response);
     }

     private Map<String, Object> buildPlatformActivityChartData() {
          List<String> labels = new ArrayList<>();
          List<Long> tasks = new ArrayList<>();
          List<Long> plans = new ArrayList<>();
          List<Long> revisions = new ArrayList<>();
          List<Long> tests = new ArrayList<>();
          List<Long> pomodoro = new ArrayList<>();
          List<Long> assistant = new ArrayList<>();
          List<Long> total = new ArrayList<>();

          for (int i = 6; i >= 0; i--) {
               LocalDate date = LocalDate.now().minusDays(i);
               labels.add(date.getDayOfWeek().toString().substring(0, 3));

               long taskCount = countByDateFirstAvailable(
                         new String[] { "tasks" },
                         new String[] { "created_at", "due_date", "date" },
                         date);

               long planCount = countByDateFirstAvailable(
                         new String[] { "planners", "plans", "planner" },
                         new String[] { "created_at", "date", "plan_date" },
                         date);

               long revisionCount = countByDateFirstAvailable(
                         new String[] { "revisions" },
                         new String[] { "created_at", "revision_date", "date" },
                         date);

               long testCount = countByDateFirstAvailable(
                         new String[] { "test_attempts", "tests" },
                         new String[] { "created_at", "test_date", "date" },
                         date);

               long pomodoroCount = countByDateFirstAvailable(
                         new String[] { "pomodoro_sessions" },
                         new String[] { "session_date", "started_at", "created_at" },
                         date);

               long assistantCount = countByDateFirstAvailable(
                         new String[] { "assistant_logs" },
                         new String[] { "created_at" },
                         date);

               tasks.add(taskCount);
               plans.add(planCount);
               revisions.add(revisionCount);
               tests.add(testCount);
               pomodoro.add(pomodoroCount);
               assistant.add(assistantCount);
               total.add(taskCount + planCount + revisionCount + testCount + pomodoroCount + assistantCount);
          }

          Map<String, Object> chart = new LinkedHashMap<>();
          chart.put("labels", labels);
          chart.put("tasks", tasks);
          chart.put("plans", plans);
          chart.put("revisions", revisions);
          chart.put("tests", tests);
          chart.put("pomodoro", pomodoro);
          chart.put("assistant", assistant);
          chart.put("total", total);
          return chart;
     }

     private Map<String, Object> buildPomodoroTrendChartData() {
          List<String> labels = new ArrayList<>();
          List<Long> sessions = new ArrayList<>();
          List<Long> focusMinutes = new ArrayList<>();

          for (int i = 6; i >= 0; i--) {
               LocalDate date = LocalDate.now().minusDays(i);
               labels.add(date.getDayOfWeek().toString().substring(0, 3));

               sessions.add(countByDateFirstAvailable(
                         new String[] { "pomodoro_sessions" },
                         new String[] { "session_date", "started_at", "created_at" },
                         date));

               focusMinutes.add(sumPomodoroMinutesByDate(date));
          }

          Map<String, Object> chart = new LinkedHashMap<>();
          chart.put("labels", labels);
          chart.put("sessions", sessions);
          chart.put("focusMinutes", focusMinutes);
          return chart;
     }

     private Map<String, Object> buildAssistantTrendChartData() {
          List<String> labels = new ArrayList<>();
          List<Long> success = new ArrayList<>();
          List<Long> failed = new ArrayList<>();
          List<Long> total = new ArrayList<>();

          for (int i = 6; i >= 0; i--) {
               LocalDate date = LocalDate.now().minusDays(i);
               labels.add(date.getDayOfWeek().toString().substring(0, 3));

               long totalCount = countByDateFirstAvailable(
                         new String[] { "assistant_logs" },
                         new String[] { "created_at" },
                         date);

               long failedCount = countByDateAndStatus(
                         "assistant_logs",
                         new String[] { "created_at" },
                         "status",
                         new String[] { "FAILED", "ERROR" },
                         date);

               long successCount = countByDateAndStatus(
                         "assistant_logs",
                         new String[] { "created_at" },
                         "status",
                         new String[] { "SUCCESS", "COMPLETED", "OK" },
                         date);

               if (successCount == 0 && totalCount > 0) {
                    successCount = Math.max(0, totalCount - failedCount);
               }

               success.add(successCount);
               failed.add(failedCount);
               total.add(totalCount);
          }

          Map<String, Object> chart = new LinkedHashMap<>();
          chart.put("labels", labels);
          chart.put("success", success);
          chart.put("failed", failed);
          chart.put("total", total);
          return chart;
     }

     private Map<String, Object> buildSecurityHealthChartData() {
          long total = countTable("security_logs");
          long critical = countSecurityByLevels("CRITICAL", "HIGH");
          long warning = countSecurityByLevels("WARNING", "WARN", "FAILED", "MEDIUM");
          long safe = Math.max(0, total - critical - warning);

          Map<String, Object> chart = new LinkedHashMap<>();
          chart.put("labels", List.of("Safe", "Warning", "Critical"));
          chart.put("data", List.of(safe, warning, critical));
          chart.put("safe", safe);
          chart.put("warning", warning);
          chart.put("critical", critical);
          chart.put("total", total);
          return chart;
     }

     private Map<String, Object> buildTaskStatusChartData() {
          long completed = countWhereAnyStatus("tasks", "status", "COMPLETED", "COMPLETE", "DONE");
          long pending = countWhereAnyStatus("tasks", "status", "PENDING", "TODO", "TO_DO");
          long inProgress = countWhereAnyStatus("tasks", "status", "IN_PROGRESS", "IN PROGRESS", "ACTIVE", "ONGOING");
          long overdue = countOverdueTasks();
          long total = countTable("tasks");
          long other = Math.max(0, total - completed - pending - inProgress - overdue);

          Map<String, Object> chart = new LinkedHashMap<>();
          chart.put("labels", List.of("Completed", "Pending", "In Progress", "Overdue", "Other"));
          chart.put("data", List.of(completed, pending, inProgress, overdue, other));
          chart.put("completed", completed);
          chart.put("pending", pending);
          chart.put("inProgress", inProgress);
          chart.put("overdue", overdue);
          chart.put("other", other);
          chart.put("total", total);
          return chart;
     }

     private Map<String, Object> buildSubjectEngagementChartData() {
          List<String> labels = new ArrayList<>();
          List<Long> data = new ArrayList<>();

          String subjectTable = firstExistingTable("subjects");
          if (subjectTable == null) {
               return emptyChart("No Data");
          }

          String nameColumn = firstExistingColumn(subjectTable, "subject_name", "name", "title");
          String idColumn = firstExistingColumn(subjectTable, "id", "subject_id");

          if (nameColumn == null) {
               return emptyChart("No Data");
          }

          try {
               String sql;

               if (idColumn != null && tableExists("tasks") && columnExists("tasks", "subject_id")) {
                    sql = "SELECT s." + nameColumn + " AS subject_name, COUNT(t.id) AS total "
                              + "FROM " + subjectTable + " s "
                              + "LEFT JOIN tasks t ON t.subject_id = s." + idColumn + " "
                              + "GROUP BY s." + nameColumn + " "
                              + "ORDER BY total DESC, s." + nameColumn + " ASC "
                              + "LIMIT 6";
               } else {
                    sql = "SELECT " + nameColumn + " AS subject_name, COUNT(*) AS total "
                              + "FROM " + subjectTable + " "
                              + "GROUP BY " + nameColumn + " "
                              + "ORDER BY total DESC "
                              + "LIMIT 6";
               }

               jdbcTemplate.query(sql, rs -> {
                    labels.add(safeText(rs.getString("subject_name"), "Subject"));
                    data.add(rs.getLong("total"));
               });

          } catch (Exception ignored) {
          }

          if (labels.isEmpty()) {
               return emptyChart("No Data");
          }

          Map<String, Object> chart = new LinkedHashMap<>();
          chart.put("labels", labels);
          chart.put("data", data);
          return chart;
     }

     private Map<String, Object> emptyChart(String label) {
          Map<String, Object> chart = new LinkedHashMap<>();
          chart.put("labels", List.of(label));
          chart.put("data", List.of(0));
          return chart;
     }

     private long countTable(String tableName) {
          try {
               if (!tableExists(tableName)) {
                    return 0;
               }

               Number value = jdbcTemplate.queryForObject(
                         "SELECT COUNT(*) FROM " + tableName,
                         Number.class);

               return value == null ? 0 : value.longValue();
          } catch (Exception e) {
               return 0;
          }
     }

     private boolean tableExists(String tableName) {
          try {
               Number value = jdbcTemplate.queryForObject(
                         """
                                   SELECT COUNT(*)
                                   FROM information_schema.tables
                                   WHERE table_schema = DATABASE()
                                     AND table_name = ?
                                   """,
                         Number.class,
                         tableName);

               return value != null && value.longValue() > 0;
          } catch (Exception e) {
               return false;
          }
     }

     private boolean columnExists(String tableName, String columnName) {
          try {
               Number value = jdbcTemplate.queryForObject(
                         """
                                   SELECT COUNT(*)
                                   FROM information_schema.columns
                                   WHERE table_schema = DATABASE()
                                     AND table_name = ?
                                     AND column_name = ?
                                   """,
                         Number.class,
                         tableName,
                         columnName);

               return value != null && value.longValue() > 0;
          } catch (Exception e) {
               return false;
          }
     }

     private String firstExistingTable(String... tableNames) {
          for (String tableName : tableNames) {
               if (tableExists(tableName)) {
                    return tableName;
               }
          }

          return null;
     }

     private String firstExistingColumn(String tableName, String... columnNames) {
          for (String columnName : columnNames) {
               if (columnExists(tableName, columnName)) {
                    return columnName;
               }
          }

          return null;
     }

     private long countByDateFirstAvailable(String[] tableNames, String[] columnNames, LocalDate date) {
          for (String tableName : tableNames) {
               if (!tableExists(tableName)) {
                    continue;
               }

               for (String columnName : columnNames) {
                    if (!columnExists(tableName, columnName)) {
                         continue;
                    }

                    try {
                         Number value = jdbcTemplate.queryForObject(
                                   "SELECT COUNT(*) FROM " + tableName + " WHERE DATE(" + columnName + ") = ?",
                                   Number.class,
                                   date.toString());

                         return value == null ? 0 : value.longValue();
                    } catch (Exception ignored) {
                    }
               }
          }

          return 0;
     }

     private long countByDateAndStatus(
               String tableName,
               String[] dateColumns,
               String statusColumn,
               String[] statuses,
               LocalDate date) {

          if (!tableExists(tableName) || !columnExists(tableName, statusColumn)) {
               return 0;
          }

          for (String dateColumn : dateColumns) {
               if (!columnExists(tableName, dateColumn)) {
                    continue;
               }

               try {
                    String placeholders = String.join(",", Collections.nCopies(statuses.length, "?"));
                    List<Object> params = new ArrayList<>();
                    params.add(date.toString());

                    for (String status : statuses) {
                         params.add(status.toUpperCase());
                    }

                    Number value = jdbcTemplate.queryForObject(
                              "SELECT COUNT(*) FROM " + tableName + " WHERE DATE(" + dateColumn + ") = ? "
                                        + "AND UPPER(" + statusColumn + ") IN (" + placeholders + ")",
                              Number.class,
                              params.toArray());

                    return value == null ? 0 : value.longValue();
               } catch (Exception ignored) {
               }
          }

          return 0;
     }

     private long sumPomodoroMinutesByDate(LocalDate date) {
          if (!tableExists("pomodoro_sessions")) {
               return 0;
          }

          String dateColumn = firstExistingColumn("pomodoro_sessions", "session_date", "started_at", "created_at");
          String minutesColumn = firstExistingColumn(
                    "pomodoro_sessions",
                    "actual_duration_minutes",
                    "focus_minutes",
                    "planned_duration_minutes");

          if (dateColumn == null || minutesColumn == null) {
               return 0;
          }

          try {
               Number value = jdbcTemplate.queryForObject(
                         "SELECT COALESCE(SUM(" + minutesColumn + "), 0) "
                                   + "FROM pomodoro_sessions "
                                   + "WHERE DATE(" + dateColumn + ") = ?",
                         Number.class,
                         date.toString());

               return value == null ? 0 : value.longValue();
          } catch (Exception e) {
               return 0;
          }
     }

     private long countSecurityByLevels(String... levels) {
          if (!tableExists("security_logs")) {
               return 0;
          }

          String column = firstExistingColumn("security_logs", "severity", "status");
          if (column == null) {
               return 0;
          }

          return countWhereAnyStatus("security_logs", column, levels);
     }

     private long countWhereAnyStatus(String tableName, String columnName, String... statuses) {
          try {
               if (!tableExists(tableName) || !columnExists(tableName, columnName) || statuses.length == 0) {
                    return 0;
               }

               String placeholders = String.join(",", Collections.nCopies(statuses.length, "?"));
               Object[] params = Arrays.stream(statuses)
                         .map(status -> status == null ? "" : status.toUpperCase())
                         .toArray();

               Number value = jdbcTemplate.queryForObject(
                         "SELECT COUNT(*) FROM " + tableName
                                   + " WHERE UPPER(" + columnName + ") IN (" + placeholders + ")",
                         Number.class,
                         params);

               return value == null ? 0 : value.longValue();
          } catch (Exception e) {
               return 0;
          }
     }

     private long countOverdueTasks() {
          try {
               if (!tableExists("tasks")) {
                    return 0;
               }

               String dateColumn = firstExistingColumn("tasks", "due_date", "date");
               if (dateColumn == null) {
                    return 0;
               }

               String statusFilter = columnExists("tasks", "status")
                         ? " AND UPPER(status) NOT IN ('COMPLETED', 'COMPLETE', 'DONE')"
                         : "";

               Number value = jdbcTemplate.queryForObject(
                         "SELECT COUNT(*) FROM tasks WHERE DATE(" + dateColumn + ") < CURDATE()" + statusFilter,
                         Number.class);

               return value == null ? 0 : value.longValue();
          } catch (Exception e) {
               return 0;
          }
     }

     private String safeText(String value, String fallback) {
          if (value == null || value.trim().isEmpty()) {
               return fallback;
          }

          return value.trim();
     }
}
