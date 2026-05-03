package com.studyplanner.studyplanner.controller;

import com.studyplanner.studyplanner.model.User;
import com.studyplanner.studyplanner.repository.*;
import com.studyplanner.studyplanner.security.JwtUtil;
import com.studyplanner.studyplanner.service.TestService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.studyplanner.studyplanner.model.Test;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;

import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * AdminController — Ek hi controller mein sabhi admin APIs
 *
 * APIs included:
 * GET /api/admin/students
 * GET /api/admin/students/{id}
 * PUT /api/admin/students/{id}/block
 * DELETE /api/admin/students/{id}
 *
 * GET /api/admin/subjects
 * GET /api/admin/tasks
 * GET /api/admin/revisions
 * GET /api/admin/tests
 * POST /api/admin/tests
 * PUT /api/admin/tests/{id}
 * DELETE /api/admin/tests/{id}
 *
 * GET /api/admin/plans
 *
 * GET /api/admin/dashboard-summary
 * GET /api/admin/recent-activities
 */
@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

     private final UserRepository userRepository;
     private final SubjectRepository subjectRepository;
     private final TaskRepository taskRepository;
     private final RevisionRepository revisionRepository;
     private final TestRepository testRepository;
     private final PlannerRepository plannerRepository;
     private final JwtUtil jwtUtil;
     private final TestService testService;
     private final JdbcTemplate jdbcTemplate;

     public AdminController(
               UserRepository userRepository,
               SubjectRepository subjectRepository,
               TaskRepository taskRepository,
               RevisionRepository revisionRepository,
               TestRepository testRepository,
               PlannerRepository plannerRepository,
               JwtUtil jwtUtil,
               TestService testService,
               JdbcTemplate jdbcTemplate) {
          this.userRepository = userRepository;
          this.subjectRepository = subjectRepository;
          this.taskRepository = taskRepository;
          this.revisionRepository = revisionRepository;
          this.testRepository = testRepository;
          this.plannerRepository = plannerRepository;
          this.jwtUtil = jwtUtil;
          this.testService = testService;
          this.jdbcTemplate = jdbcTemplate;
     }

     // ─────────────────────────────────────────
     // Helper: Token se admin user nikalo
     // ─────────────────────────────────────────
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

     // ─────────────────────────────────────────
     // Helper: Token se userId nikalo (Long)
     // ─────────────────────────────────────────
     private Long extractUserIdFromToken(String authHeader) {
          String token = authHeader.replace("Bearer ", "").trim();
          return jwtUtil.extractUserId(token);
     }

     private ResponseEntity<Map<String, Object>> unauthorized() {
          return ResponseEntity.status(403)
                    .body(Map.of("success", false, "message", "Admin access required."));
     }

     // ══════════════════════════════════════════
     // DASHBOARD SUMMARY — Final enhanced realtime data
     // GET /api/admin/dashboard-summary
     // ══════════════════════════════════════════
     @GetMapping("/dashboard-summary")
     public ResponseEntity<Map<String, Object>> getDashboardSummary(
               @RequestHeader("Authorization") String authHeader) {

          if (getAdminFromToken(authHeader) == null) {
               return unauthorized();
          }

          long totalStudents = userRepository.countByRole(User.Role.STUDENT);
          long totalSubjects = subjectRepository.count();
          long totalTasks = taskRepository.count();
          long pendingTasks = safeTaskStatusCount("Pending");
          long completedTasks = safeTaskStatusCount("Completed");
          long totalRevisions = revisionRepository.count();
          long totalTests = testRepository.count();
          long totalPlans = plannerRepository.count();

          long totalQuestions = countFirstAvailableTable("test_questions", "questions");
          long publishedTests = countPublishedTests();

          long totalNotifications = countTable("notifications");
          long totalReports = countFirstAvailableTable("reports", "generated_reports");

          long pomodoroSessions = countTable("pomodoro_sessions");
          long totalFocusMinutes = sumFirstAvailable(
                    "SELECT COALESCE(SUM(actual_duration_minutes), 0) FROM pomodoro_sessions",
                    "SELECT COALESCE(SUM(focus_minutes), 0) FROM pomodoro_sessions");

          long assistantQueries = countTable("assistant_logs");
          long failedAssistantQueries = countWhere("assistant_logs", "UPPER(status) = 'FAILED'");

          long totalSecurityLogs = countTable("security_logs");
          long securityWarnings = countFirstAvailableWhere(
                    "security_logs",
                    "UPPER(severity) IN ('WARNING', 'CRITICAL')",
                    "UPPER(status) IN ('FAILED', 'WARNING', 'CRITICAL')");

          double avgScore = averageFirstAvailable(
                    "SELECT COALESCE(AVG(percentage), 0) FROM test_attempts WHERE percentage IS NOT NULL",
                    "SELECT COALESCE(AVG(score), 0) FROM test_attempts WHERE score IS NOT NULL",
                    "SELECT COALESCE(AVG(score), 0) FROM tests WHERE score IS NOT NULL");

          Map<String, Object> summary = new LinkedHashMap<>();
          summary.put("success", true);
          summary.put("message", "Admin dashboard summary fetched successfully.");

          // Existing frontend keys
          summary.put("totalStudents", totalStudents);
          summary.put("totalSubjects", totalSubjects);
          summary.put("totalTasks", totalTasks);
          summary.put("pendingTasks", pendingTasks);
          summary.put("completedTasks", completedTasks);
          summary.put("totalRevisions", totalRevisions);
          summary.put("totalTests", totalTests);
          summary.put("totalPlans", totalPlans);
          summary.put("pomodoroSessions", pomodoroSessions);
          summary.put("aiQueries", assistantQueries);
          summary.put("avgScore", roundOne(avgScore));

          // New final dashboard keys
          summary.put("totalPlannerEntries", totalPlans);
          summary.put("totalQuestions", totalQuestions);
          summary.put("publishedTests", publishedTests);
          summary.put("totalNotifications", totalNotifications);
          summary.put("totalReports", totalReports);
          summary.put("totalSecurityLogs", totalSecurityLogs);
          summary.put("securityWarnings", securityWarnings);
          summary.put("totalFocusMinutes", totalFocusMinutes);
          summary.put("assistantQueries", assistantQueries);
          summary.put("failedAssistantQueries", failedAssistantQueries);

          // Chart datasets for frontend enhancement
          summary.put("weeklyChart", buildWeeklyChartData());
          summary.put("taskChart", buildTaskChartData());
          summary.put("subjectChart", buildSubjectChartData());
          summary.put("scoreChart", buildScoreChartData());

          return ResponseEntity.ok(summary);
     }

     // ══════════════════════════════════════════
     // RECENT ACTIVITIES — Final enhanced realtime activity
     // GET /api/admin/recent-activities
     // ══════════════════════════════════════════
     @GetMapping("/recent-activities")
     public ResponseEntity<Map<String, Object>> getRecentActivities(
               @RequestHeader("Authorization") String authHeader) {

          User admin = getAdminFromToken(authHeader);
          if (admin == null) {
               return unauthorized();
          }

          List<Map<String, Object>> activities = new ArrayList<>();

          Map<String, Object> adminAct = new LinkedHashMap<>();
          adminAct.put("icon", "🔐");
          adminAct.put("message", "Admin " + safeText(admin.getFullName(), "Admin") + " logged in");
          adminAct.put("time", LocalDateTime.now().toString());
          adminAct.put("type", "admin_login");
          activities.add(adminAct);

          addRecentStudents(activities);
          addRecentTests(activities);
          addRecentNotifications(activities);
          addRecentPomodoroSessions(activities);
          addRecentAssistantLogs(activities);
          addRecentSecurityLogs(activities);

          activities.sort((a, b) -> parseTime(b.get("time")).compareTo(parseTime(a.get("time"))));

          if (activities.size() > 18) {
               activities = activities.subList(0, 18);
          }

          Map<String, Object> response = new LinkedHashMap<>();
          response.put("success", true);
          response.put("message", "Recent activities fetched successfully.");
          response.put("activities", activities);
          response.put("total", activities.size());

          return ResponseEntity.ok(response);
     }

     // ══════════════════════════════════════════
     // STUDENT MANAGEMENT
     // ══════════════════════════════════════════

     @GetMapping("/students")
     public ResponseEntity<Map<String, Object>> getAllStudents(
               @RequestHeader("Authorization") String authHeader) {

          if (getAdminFromToken(authHeader) == null)
               return unauthorized();

          List<User> students = userRepository.findByRole(User.Role.STUDENT);
          List<Map<String, Object>> list = new ArrayList<>();

          for (User u : students) {
               Map<String, Object> data = new LinkedHashMap<>();
               data.put("id", u.getId());
               data.put("fullName", u.getFullName());
               data.put("email", u.getEmail());
               data.put("course", u.getCourse());
               data.put("college", u.getCollege());
               data.put("createdAt", u.getCreatedAt());
               data.put("isLocked", u.isAccountLocked());
               data.put("lockedUntil", u.getAccountLockedUntil());
               data.put("subjectCount", subjectRepository.findByUserId(u.getId()).size());
               data.put("taskCount", taskRepository.findBySubjectUserId(u.getId()).size());
               data.put("revisionCount", revisionRepository.findByUserId(u.getId()).size());
               data.put("testCount", testRepository.findByUserId(u.getId()).size());
               list.add(data);
          }

          return ResponseEntity.ok(Map.of("success", true, "students", list, "total", list.size()));
     }

     @GetMapping("/students/{id}")
     public ResponseEntity<Map<String, Object>> getStudentById(
               @RequestHeader("Authorization") String authHeader,
               @PathVariable Long id) {

          if (getAdminFromToken(authHeader) == null)
               return unauthorized();

          Optional<User> userOpt = userRepository.findById(id);
          if (userOpt.isEmpty()) {
               return ResponseEntity.status(404)
                         .body(Map.of("success", false, "message", "Student not found."));
          }

          User u = userOpt.get();
          Map<String, Object> data = new LinkedHashMap<>();
          data.put("id", u.getId());
          data.put("fullName", u.getFullName());
          data.put("email", u.getEmail());
          data.put("course", u.getCourse());
          data.put("college", u.getCollege());
          data.put("createdAt", u.getCreatedAt());
          data.put("isLocked", u.isAccountLocked());
          data.put("twoFactorEnabled", u.isTwoFactorEnabled());
          data.put("preferredStudyTime", u.getPreferredStudyTime());
          data.put("dailyStudyGoal", u.getDailyStudyGoal());
          data.put("subjectCount", subjectRepository.findByUserId(u.getId()).size());
          data.put("taskCount", taskRepository.findBySubjectUserId(u.getId()).size());
          data.put("revisionCount", revisionRepository.findByUserId(u.getId()).size());
          data.put("testCount", testRepository.findByUserId(u.getId()).size());

          return ResponseEntity.ok(Map.of("success", true, "student", data));
     }

     @PutMapping("/students/{id}/block")
     public ResponseEntity<Map<String, Object>> toggleBlockStudent(
               @RequestHeader("Authorization") String authHeader,
               @PathVariable Long id) {

          if (getAdminFromToken(authHeader) == null)
               return unauthorized();

          Optional<User> userOpt = userRepository.findById(id);
          if (userOpt.isEmpty()) {
               return ResponseEntity.status(404)
                         .body(Map.of("success", false, "message", "Student not found."));
          }

          User u = userOpt.get();
          if (u.getRole() == User.Role.ADMIN) {
               return ResponseEntity.status(400)
                         .body(Map.of("success", false, "message", "Cannot block admin account."));
          }

          if (u.isAccountLocked()) {
               u.resetFailedAttempts();
               userRepository.save(u);
               return ResponseEntity.ok(Map.of(
                         "success", true,
                         "message", u.getFullName() + " account unblocked.",
                         "isLocked", false));
          } else {
               u.lockAccount(99999);
               userRepository.save(u);
               return ResponseEntity.ok(Map.of(
                         "success", true,
                         "message", u.getFullName() + " account blocked.",
                         "isLocked", true));
          }
     }

     @DeleteMapping("/students/{id}")
     public ResponseEntity<Map<String, Object>> deleteStudent(
               @RequestHeader("Authorization") String authHeader,
               @PathVariable Long id) {

          if (getAdminFromToken(authHeader) == null)
               return unauthorized();

          Optional<User> userOpt = userRepository.findById(id);
          if (userOpt.isEmpty()) {
               return ResponseEntity.status(404)
                         .body(Map.of("success", false, "message", "Student not found."));
          }

          User u = userOpt.get();
          if (u.getRole() == User.Role.ADMIN) {
               return ResponseEntity.status(400)
                         .body(Map.of("success", false, "message", "Cannot delete admin account."));
          }

          try {
               var subjects = subjectRepository.findByUserId(id);
               for (var subject : subjects) {
                    var tasks = taskRepository.findBySubjectId(subject.getId());
                    taskRepository.deleteAll(tasks);
               }
               subjectRepository.deleteAll(subjects);
               revisionRepository.deleteAll(revisionRepository.findByUserId(id));
               testRepository.deleteAll(testRepository.findByUserId(id));
               plannerRepository.deleteAll(plannerRepository.findByUserId(id));
               userRepository.deleteById(id);

               return ResponseEntity.ok(Map.of(
                         "success", true,
                         "message", u.getFullName() + " deleted successfully."));
          } catch (Exception e) {
               return ResponseEntity.status(500)
                         .body(Map.of("success", false, "message", "Delete failed: " + e.getMessage()));
          }
     }

     // ══════════════════════════════════════════
     // SUBJECTS
     // GET /api/admin/subjects
     // ══════════════════════════════════════════
     @GetMapping("/subjects")
     public ResponseEntity<Map<String, Object>> getAllSubjects(
               @RequestHeader("Authorization") String authHeader) {

          if (getAdminFromToken(authHeader) == null)
               return unauthorized();

          List<User> students = userRepository.findByRole(User.Role.STUDENT);
          List<Map<String, Object>> allSubjects = new ArrayList<>();

          for (User u : students) {
               var subjects = subjectRepository.findByUserId(u.getId());
               for (var s : subjects) {
                    Map<String, Object> data = new LinkedHashMap<>();
                    data.put("id", s.getId());
                    data.put("name", s.getSubjectName());
                    data.put("code", s.getCode());
                    data.put("chapters", s.getChapters());
                    data.put("progress", s.getProgress());
                    data.put("difficulty", s.getDifficultyLevel());
                    data.put("description", s.getDescription());
                    data.put("studentName", u.getFullName());
                    data.put("studentEmail", u.getEmail());
                    data.put("userId", u.getId());
                    data.put("taskCount", taskRepository.findBySubjectId(s.getId()).size());
                    allSubjects.add(data);
               }
          }

          return ResponseEntity.ok(
                    Map.of("success", true, "subjects", allSubjects, "total", allSubjects.size()));
     }

     // ══════════════════════════════════════════
     // TASKS
     // GET /api/admin/tasks
     // ══════════════════════════════════════════
     @GetMapping("/tasks")
     public ResponseEntity<Map<String, Object>> getAllTasks(
               @RequestHeader("Authorization") String authHeader) {

          if (getAdminFromToken(authHeader) == null)
               return unauthorized();

          List<User> students = userRepository.findByRole(User.Role.STUDENT);
          List<Map<String, Object>> allTasks = new ArrayList<>();

          for (User u : students) {
               var tasks = taskRepository.findBySubjectUserId(u.getId());
               for (var t : tasks) {
                    Map<String, Object> data = new LinkedHashMap<>();
                    data.put("id", t.getId());
                    data.put("title", t.getTitle());
                    data.put("status", t.getStatus());
                    data.put("priority", t.getPriority());
                    data.put("dueDate", t.getDueDate());
                    data.put("studentName", u.getFullName());
                    data.put("studentEmail", u.getEmail());
                    data.put("userId", u.getId());
                    allTasks.add(data);
               }
          }

          return ResponseEntity.ok(
                    Map.of("success", true, "tasks", allTasks, "total", allTasks.size()));
     }

     // ══════════════════════════════════════════
     // REVISIONS
     // GET /api/admin/revisions
     // ══════════════════════════════════════════
     @GetMapping("/revisions")
     public ResponseEntity<Map<String, Object>> getAllRevisions(
               @RequestHeader("Authorization") String authHeader) {

          if (getAdminFromToken(authHeader) == null)
               return unauthorized();

          List<User> students = userRepository.findByRole(User.Role.STUDENT);
          List<Map<String, Object>> allRevisions = new ArrayList<>();

          for (User u : students) {
               var revisions = revisionRepository.findByUserId(u.getId());
               for (var r : revisions) {
                    Map<String, Object> data = new LinkedHashMap<>();
                    data.put("id", r.getId());
                    data.put("topic", r.getTitle());
                    data.put("weakArea", r.getDescription());
                    data.put("priority", r.getPriority());
                    data.put("status", r.getStatus());
                    data.put("revisionDate", r.getRevisionDate());
                    data.put("studentName", u.getFullName());
                    data.put("studentEmail", u.getEmail());
                    data.put("userId", u.getId());
                    allRevisions.add(data);
               }
          }

          return ResponseEntity.ok(
                    Map.of("success", true, "revisions", allRevisions, "total", allRevisions.size()));
     }

     // ══════════════════════════════════════════
     // TESTS — GET + POST + PUT + DELETE
     // ══════════════════════════════════════════

     @GetMapping("/tests")
     public ResponseEntity<Map<String, Object>> getAllTests(
               @RequestHeader("Authorization") String authHeader) {

          if (getAdminFromToken(authHeader) == null)
               return unauthorized();

          List<Test> tests = testRepository.findAll();
          List<Map<String, Object>> allTests = new ArrayList<>();

          for (Test t : tests) {
               Map<String, Object> data = new LinkedHashMap<>();
               data.put("id", t.getId());
               data.put("title", t.getTitle());
               data.put("subject", t.getSubject());
               data.put("testDate", t.getTestDate());
               data.put("testType", t.getTestType());
               data.put("duration", t.getDuration());
               data.put("description", t.getDescription());
               data.put("instructions", t.getInstructions());
               data.put("score", t.getScore());
               data.put("focusArea", t.getFocusArea());
               data.put("negativeMarking", t.getNegativeMarking());
               data.put("published", t.getPublished());
               data.put("adminStatus", t.getAdminStatus());

               if (t.getUser() != null) {
                    data.put("userId", t.getUser().getId());
                    data.put("studentName", t.getUser().getFullName());
                    data.put("studentEmail", t.getUser().getEmail());
               } else {
                    data.put("userId", null);
                    data.put("studentName", "");
                    data.put("studentEmail", "");
               }

               allTests.add(data);
          }

          return ResponseEntity.ok(
                    Map.of("success", true, "tests", allTests, "total", allTests.size()));
     }

     @PostMapping("/tests")
     public ResponseEntity<?> createAdminTest(
               @RequestHeader("Authorization") String authHeader,
               @RequestBody Test test) {

          if (getAdminFromToken(authHeader) == null)
               return unauthorized();

          try {
               Long adminUserId = extractUserIdFromToken(authHeader);
               Test created = testService.createAdminTest(adminUserId, test);
               return ResponseEntity.ok(created);
          } catch (Exception e) {
               return ResponseEntity.status(500)
                         .body(Map.of("success", false,
                                   "field", "general",
                                   "message", e.getMessage() != null
                                             ? e.getMessage()
                                             : "Test create nahi hua. Please try again."));
          }
     }

     @PutMapping("/tests/{id}")
     public ResponseEntity<?> updateAdminTest(
               @RequestHeader("Authorization") String authHeader,
               @PathVariable Long id,
               @RequestBody Test test) {

          if (getAdminFromToken(authHeader) == null)
               return unauthorized();

          try {
               Test updated = testService.updateAdminTest(id, test);
               return ResponseEntity.ok(updated);
          } catch (Exception e) {
               return ResponseEntity.status(500)
                         .body(Map.of("success", false,
                                   "field", "general",
                                   "message", e.getMessage() != null
                                             ? e.getMessage()
                                             : "Test update nahi hua. Please try again."));
          }
     }

     @DeleteMapping("/tests/{id}")
     public ResponseEntity<?> deleteAdminTest(
               @RequestHeader("Authorization") String authHeader,
               @PathVariable Long id) {

          if (getAdminFromToken(authHeader) == null)
               return unauthorized();

          try {
               testService.deleteAdminTest(id);
               return ResponseEntity.ok(Map.of("success", true, "message", "Test deleted successfully."));
          } catch (IllegalStateException e) {
               return ResponseEntity.status(400)
                         .body(Map.of("success", false,
                                   "field", "general",
                                   "message", e.getMessage()));
          } catch (Exception e) {
               return ResponseEntity.status(500)
                         .body(Map.of("success", false,
                                   "field", "general",
                                   "message", e.getMessage() != null
                                             ? e.getMessage()
                                             : "Test delete nahi hua. Please try again."));
          }
     }

     // ══════════════════════════════════════════
     // PLANNERS
     // GET /api/admin/plans
     // ══════════════════════════════════════════
     @GetMapping("/plans")
     public ResponseEntity<Map<String, Object>> getAllPlans(
               @RequestHeader("Authorization") String authHeader) {

          if (getAdminFromToken(authHeader) == null)
               return unauthorized();

          List<User> students = userRepository.findByRole(User.Role.STUDENT);
          List<Map<String, Object>> allPlans = new ArrayList<>();

          for (User u : students) {
               var plans = plannerRepository.findByUserId(u.getId());
               for (var p : plans) {
                    Map<String, Object> data = new LinkedHashMap<>();
                    data.put("id", p.getId());
                    data.put("topic", p.getTitle());
                    data.put("subject", p.getSubject());
                    data.put("date", p.getDate());
                    data.put("time", p.getTime());
                    data.put("status", p.getStatus());
                    data.put("description", p.getDescription());
                    data.put("studentName", u.getFullName());
                    data.put("userId", u.getId());
                    allPlans.add(data);
               }
          }

          return ResponseEntity.ok(
                    Map.of("success", true, "plans", allPlans, "total", allPlans.size()));
     }

     // ══════════════════════════════════════════
     // DASHBOARD HELPER METHODS
     // These use JdbcTemplate safely so optional modules do not break backend.
     // ══════════════════════════════════════════

     private long safeTaskStatusCount(String status) {
          try {
               return taskRepository.findByStatus(status).size();
          } catch (Exception e) {
               return countWhere("tasks", "LOWER(status) = '" + status.toLowerCase() + "'");
          }
     }

     private long countTable(String tableName) {
          try {
               Number value = jdbcTemplate.queryForObject(
                         "SELECT COUNT(*) FROM " + tableName,
                         Number.class);

               return value == null ? 0 : value.longValue();
          } catch (Exception e) {
               return 0;
          }
     }

     private long countFirstAvailableTable(String... tableNames) {
          for (String tableName : tableNames) {
               if (tableExists(tableName)) {
                    return countTable(tableName);
               }
          }

          return 0;
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

     private long countWhere(String tableName, String whereClause) {
          try {
               if (!tableExists(tableName)) {
                    return 0;
               }

               Number value = jdbcTemplate.queryForObject(
                         "SELECT COUNT(*) FROM " + tableName + " WHERE " + whereClause,
                         Number.class);

               return value == null ? 0 : value.longValue();
          } catch (Exception e) {
               return 0;
          }
     }

     private long countFirstAvailableWhere(String tableName, String... whereClauses) {
          for (String whereClause : whereClauses) {
               long count = countWhere(tableName, whereClause);

               if (count > 0) {
                    return count;
               }
          }

          return 0;
     }

     private long sumFirstAvailable(String... queries) {
          for (String sql : queries) {
               try {
                    Number value = jdbcTemplate.queryForObject(sql, Number.class);

                    if (value != null) {
                         return value.longValue();
                    }
               } catch (Exception ignored) {
               }
          }

          return 0;
     }

     private double averageFirstAvailable(String... queries) {
          for (String sql : queries) {
               try {
                    Number value = jdbcTemplate.queryForObject(sql, Number.class);

                    if (value != null) {
                         return value.doubleValue();
                    }
               } catch (Exception ignored) {
               }
          }

          return 0;
     }

     private long countPublishedTests() {
          long publishedBoolean = countWhere("tests", "published = true");

          if (publishedBoolean > 0) {
               return publishedBoolean;
          }

          return countWhere("tests", "LOWER(admin_status) = 'published'");
     }

     private double roundOne(double value) {
          return Math.round(value * 10.0) / 10.0;
     }

     private String safeText(String value, String fallback) {
          if (value == null || value.trim().isEmpty()) {
               return fallback;
          }

          return value.trim();
     }

     private String trimText(String value, int maxLength) {
          if (value == null) {
               return "";
          }

          String text = value.trim();

          if (text.length() <= maxLength) {
               return text;
          }

          return text.substring(0, maxLength).trim() + "...";
     }

     private String toTimeText(Object value) {
          if (value == null) {
               return LocalDateTime.now().toString();
          }

          if (value instanceof Timestamp timestamp) {
               return timestamp.toLocalDateTime().toString();
          }

          if (value instanceof LocalDateTime localDateTime) {
               return localDateTime.toString();
          }

          return String.valueOf(value);
     }

     private LocalDateTime parseTime(Object value) {
          try {
               if (value == null) {
                    return LocalDateTime.MIN;
               }

               if (value instanceof LocalDateTime localDateTime) {
                    return localDateTime;
               }

               return LocalDateTime.parse(String.valueOf(value));
          } catch (Exception e) {
               return LocalDateTime.MIN;
          }
     }

     private Map<String, Object> activity(String icon, String message, String time, String type) {
          Map<String, Object> item = new LinkedHashMap<>();
          item.put("icon", icon);
          item.put("message", message);
          item.put("time", time);
          item.put("type", type);
          return item;
     }

     private void addRecentStudents(List<Map<String, Object>> activities) {
          try {
               List<User> recentUsers = userRepository.findTop5ByOrderByCreatedAtDesc();

               for (User u : recentUsers) {
                    if (u.getRole() == User.Role.STUDENT) {
                         activities.add(activity(
                                   "👤",
                                   safeText(u.getFullName(), "New student") + " joined EduMind AI",
                                   u.getCreatedAt() != null ? u.getCreatedAt().toString()
                                             : LocalDateTime.now().toString(),
                                   "user_registered"));
                    }
               }
          } catch (Exception ignored) {
          }
     }

     private void addRecentTests(List<Map<String, Object>> activities) {
          try {
               if (!tableExists("tests")) {
                    return;
               }

               String titleColumn = columnExists("tests", "title") ? "title" : "id";
               String timeColumn = columnExists("tests", "created_at") ? "created_at" : null;

               if (timeColumn == null) {
                    return;
               }

               String sql = "SELECT id, " + titleColumn + " AS title, " + timeColumn
                         + " AS created_at FROM tests ORDER BY " + timeColumn + " DESC LIMIT 5";

               jdbcTemplate.query(sql, rs -> {
                    activities.add(activity(
                              "📝",
                              "Test updated: " + safeText(rs.getString("title"), "Test"),
                              toTimeText(rs.getObject("created_at")),
                              "test"));
               });
          } catch (Exception ignored) {
          }
     }

     private void addRecentNotifications(List<Map<String, Object>> activities) {
          try {
               if (!tableExists("notifications") || !columnExists("notifications", "created_at")) {
                    return;
               }

               String titleColumn = columnExists("notifications", "title") ? "title" : "id";
               String sql = "SELECT id, " + titleColumn
                         + " AS title, created_at FROM notifications ORDER BY created_at DESC LIMIT 5";

               jdbcTemplate.query(sql, rs -> {
                    activities.add(activity(
                              "🔔",
                              "Notification sent: " + safeText(rs.getString("title"), "Notification"),
                              toTimeText(rs.getObject("created_at")),
                              "notification"));
               });
          } catch (Exception ignored) {
          }
     }

     private void addRecentPomodoroSessions(List<Map<String, Object>> activities) {
          try {
               if (!tableExists("pomodoro_sessions") || !columnExists("pomodoro_sessions", "created_at")) {
                    return;
               }

               String studentColumn = columnExists("pomodoro_sessions", "student_name") ? "student_name" : "user_id";
               String topicColumn = columnExists("pomodoro_sessions", "topic") ? "topic" : "id";
               String statusColumn = columnExists("pomodoro_sessions", "status") ? "status" : "id";

               String sql = "SELECT id, " + studentColumn + " AS student_name, " + topicColumn + " AS topic, " +
                         statusColumn
                         + " AS status, created_at FROM pomodoro_sessions ORDER BY created_at DESC LIMIT 5";

               jdbcTemplate.query(sql, rs -> {
                    activities.add(activity(
                              "⏱️",
                              safeText(rs.getString("student_name"), "Student") + " " +
                                        safeText(rs.getString("status"), "updated").toLowerCase() +
                                        " Pomodoro: " + safeText(rs.getString("topic"), "Focus session"),
                              toTimeText(rs.getObject("created_at")),
                              "pomodoro"));
               });
          } catch (Exception ignored) {
          }
     }

     private void addRecentAssistantLogs(List<Map<String, Object>> activities) {
          try {
               if (!tableExists("assistant_logs") || !columnExists("assistant_logs", "created_at")) {
                    return;
               }

               String sql = """
                         SELECT id, student_name, question, status, created_at
                         FROM assistant_logs
                         ORDER BY created_at DESC
                         LIMIT 5
                         """;

               jdbcTemplate.query(sql, rs -> {
                    activities.add(activity(
                              "🤖",
                              safeText(rs.getString("student_name"), "Student") +
                                        " asked AI: " +
                                        trimText(safeText(rs.getString("question"), "Assistant query"), 55) +
                                        " (" + safeText(rs.getString("status"), "SUCCESS") + ")",
                              toTimeText(rs.getObject("created_at")),
                              "assistant"));
               });
          } catch (Exception ignored) {
          }
     }

     private void addRecentSecurityLogs(List<Map<String, Object>> activities) {
          try {
               if (!tableExists("security_logs") || !columnExists("security_logs", "created_at")) {
                    return;
               }

               String actionColumn = columnExists("security_logs", "action") ? "action" : "id";
               String severityColumn = columnExists("security_logs", "severity") ? "severity" : "status";

               String sql = "SELECT id, " + actionColumn + " AS action, " + severityColumn +
                         " AS severity, created_at FROM security_logs ORDER BY created_at DESC LIMIT 5";

               jdbcTemplate.query(sql, rs -> {
                    activities.add(activity(
                              "🛡️",
                              "Security event: " + safeText(rs.getString("action"), "Security event") +
                                        " (" + safeText(rs.getString("severity"), "INFO") + ")",
                              toTimeText(rs.getObject("created_at")),
                              "security"));
               });
          } catch (Exception ignored) {
          }
     }

     private Map<String, Object> buildWeeklyChartData() {
          List<String> labels = new ArrayList<>();
          List<Long> data = new ArrayList<>();

          for (int i = 6; i >= 0; i--) {
               LocalDate date = LocalDate.now().minusDays(i);
               labels.add(date.getDayOfWeek().toString().substring(0, 3));
               data.add(countUsersCreatedOn(date));
          }

          Map<String, Object> chart = new LinkedHashMap<>();
          chart.put("labels", labels);
          chart.put("data", data);
          return chart;
     }

     private long countUsersCreatedOn(LocalDate date) {
          try {
               if (!tableExists("users") || !columnExists("users", "created_at")) {
                    return 0;
               }

               Number value = jdbcTemplate.queryForObject(
                         "SELECT COUNT(*) FROM users WHERE role = 'STUDENT' AND DATE(created_at) = ?",
                         Number.class,
                         date.toString());

               return value == null ? 0 : value.longValue();
          } catch (Exception e) {
               return 0;
          }
     }

     private Map<String, Object> buildTaskChartData() {
          List<String> labels = List.of("W1", "W2", "W3", "W4");
          List<Long> completed = new ArrayList<>();
          List<Long> pending = new ArrayList<>();

          for (int i = 3; i >= 0; i--) {
               LocalDate start = LocalDate.now().minusWeeks(i).with(java.time.DayOfWeek.MONDAY);
               LocalDate end = start.plusDays(6);

               completed.add(countTasksByStatusInRange("Completed", start, end));
               pending.add(countTasksByStatusInRange("Pending", start, end));
          }

          Map<String, Object> chart = new LinkedHashMap<>();
          chart.put("labels", labels);
          chart.put("completed", completed);
          chart.put("pending", pending);
          return chart;
     }

     private long countTasksByStatusInRange(String status, LocalDate start, LocalDate end) {
          try {
               if (!tableExists("tasks")) {
                    return 0;
               }

               if (columnExists("tasks", "created_at")) {
                    Number value = jdbcTemplate.queryForObject(
                              "SELECT COUNT(*) FROM tasks WHERE LOWER(status) = ? AND DATE(created_at) BETWEEN ? AND ?",
                              Number.class,
                              status.toLowerCase(),
                              start.toString(),
                              end.toString());

                    return value == null ? 0 : value.longValue();
               }

               return countWhere("tasks", "LOWER(status) = '" + status.toLowerCase() + "'");
          } catch (Exception e) {
               return 0;
          }
     }

     private Map<String, Object> buildSubjectChartData() {
          List<String> labels = new ArrayList<>();
          List<Long> data = new ArrayList<>();

          try {
               if (!tableExists("subjects")) {
                    return emptySubjectChart();
               }

               String nameColumn = columnExists("subjects", "subject_name")
                         ? "subject_name"
                         : columnExists("subjects", "name") ? "name" : null;

               if (nameColumn == null) {
                    return emptySubjectChart();
               }

               String sql = "SELECT " + nameColumn + " AS subject_name, COUNT(*) AS total FROM subjects GROUP BY " +
                         nameColumn + " ORDER BY total DESC LIMIT 5";

               jdbcTemplate.query(sql, rs -> {
                    labels.add(safeText(rs.getString("subject_name"), "Subject"));
                    data.add(rs.getLong("total"));
               });

          } catch (Exception ignored) {
               return emptySubjectChart();
          }

          if (labels.isEmpty()) {
               return emptySubjectChart();
          }

          Map<String, Object> chart = new LinkedHashMap<>();
          chart.put("labels", labels);
          chart.put("data", data);
          return chart;
     }

     private Map<String, Object> emptySubjectChart() {
          Map<String, Object> chart = new LinkedHashMap<>();
          chart.put("labels", List.of("No Data"));
          chart.put("data", List.of(1));
          return chart;
     }

     private Map<String, Object> buildScoreChartData() {
          List<String> labels = new ArrayList<>();
          List<Double> data = new ArrayList<>();

          for (int i = 5; i >= 0; i--) {
               LocalDate month = LocalDate.now().minusMonths(i);
               labels.add(month.getMonth().toString().substring(0, 3));
               data.add(roundOne(avgScoreForMonth(month)));
          }

          Map<String, Object> chart = new LinkedHashMap<>();
          chart.put("labels", labels);
          chart.put("data", data);
          return chart;
     }

     private double avgScoreForMonth(LocalDate month) {
          String start = month.withDayOfMonth(1).toString();
          String end = month.withDayOfMonth(month.lengthOfMonth()).toString();

          return averageFirstAvailable(
                    "SELECT COALESCE(AVG(percentage), 0) FROM test_attempts WHERE DATE(created_at) BETWEEN '" + start
                              + "' AND '" + end + "'",
                    "SELECT COALESCE(AVG(score), 0) FROM test_attempts WHERE DATE(created_at) BETWEEN '" + start
                              + "' AND '" + end + "'",
                    "SELECT COALESCE(AVG(score), 0) FROM tests WHERE DATE(test_date) BETWEEN '" + start + "' AND '"
                              + end + "'");
     }
}