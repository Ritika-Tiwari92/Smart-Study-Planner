package com.studyplanner.studyplanner.controller;

import com.studyplanner.studyplanner.model.User;
import com.studyplanner.studyplanner.repository.*;
import com.studyplanner.studyplanner.security.JwtUtil;
import com.studyplanner.studyplanner.service.TestService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.studyplanner.studyplanner.model.Test;
import org.springframework.http.HttpStatus;

import java.util.*;

/**
 * AdminController — Ek hi controller mein sabhi admin APIs
 *
 * APIs included:
 * GET /api/admin/students → sabke students
 * GET /api/admin/students/{id} → ek student ka detail
 * PUT /api/admin/students/{id}/block → block/unblock
 * DELETE /api/admin/students/{id} → delete student
 *
 * GET /api/admin/subjects → sabke subjects
 * GET /api/admin/tasks → sabke tasks
 * GET /api/admin/revisions → sabke revisions
 *
 * GET /api/admin/tests → ALL tests (student + admin created)
 * POST /api/admin/tests → admin creates a new test ← ADDED
 * PUT /api/admin/tests/{id} → admin updates any test ← ADDED
 * DELETE /api/admin/tests/{id} → admin deletes any test ← ADDED
 *
 * GET /api/admin/dashboard-summary → updated with real counts
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

     private final UserRepository userRepository;
     private final SubjectRepository subjectRepository;
     private final TaskRepository taskRepository;
     private final RevisionRepository revisionRepository;
     private final TestRepository testRepository;
     private final PlannerRepository plannerRepository;
     private final JwtUtil jwtUtil;
     private final TestService testService; // ← ADDED for admin test CRUD

     public AdminController(
               UserRepository userRepository,
               SubjectRepository subjectRepository,
               TaskRepository taskRepository,
               RevisionRepository revisionRepository,
               TestRepository testRepository,
               PlannerRepository plannerRepository,
               JwtUtil jwtUtil,
               TestService testService) { // ← ADDED
          this.userRepository = userRepository;
          this.subjectRepository = subjectRepository;
          this.taskRepository = taskRepository;
          this.revisionRepository = revisionRepository;
          this.testRepository = testRepository;
          this.plannerRepository = plannerRepository;
          this.jwtUtil = jwtUtil;
          this.testService = testService; // ← ADDED
     }

     // ─────────────────────────────────────────
     // Helper: Token se admin user nikalo
     // ─────────────────────────────────────────
     private User getAdminFromToken(String authHeader) {
          try {
               String token = authHeader.replace("Bearer ", "").trim();
               String email = jwtUtil.extractEmail(token);
               Optional<User> userOpt = userRepository.findByEmail(email);
               if (userOpt.isEmpty() || userOpt.get().getRole() != User.Role.ADMIN)
                    return null;
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
     // DASHBOARD SUMMARY — Real data
     // GET /api/admin/dashboard-summary
     // ══════════════════════════════════════════
     @GetMapping("/dashboard-summary")
     public ResponseEntity<Map<String, Object>> getDashboardSummary(
               @RequestHeader("Authorization") String authHeader) {

          if (getAdminFromToken(authHeader) == null)
               return unauthorized();

          Map<String, Object> summary = new LinkedHashMap<>();
          summary.put("success", true);
          summary.put("totalStudents", userRepository.countByRole(User.Role.STUDENT));
          summary.put("totalSubjects", subjectRepository.count());
          summary.put("totalTasks", taskRepository.count());
          summary.put("pendingTasks", taskRepository.findByStatus("Pending").size());
          summary.put("completedTasks", taskRepository.findByStatus("Completed").size());
          summary.put("totalRevisions", revisionRepository.count());
          summary.put("totalTests", testRepository.count());
          summary.put("totalPlans", plannerRepository.count());
          summary.put("pomodoroSessions", 0);
          summary.put("aiQueries", 0);
          summary.put("avgScore", 0);

          return ResponseEntity.ok(summary);
     }

     // ══════════════════════════════════════════
     // RECENT ACTIVITIES
     // GET /api/admin/recent-activities
     // ══════════════════════════════════════════
     @GetMapping("/recent-activities")
     public ResponseEntity<Map<String, Object>> getRecentActivities(
               @RequestHeader("Authorization") String authHeader) {

          User admin = getAdminFromToken(authHeader);
          if (admin == null)
               return unauthorized();

          List<Map<String, Object>> activities = new ArrayList<>();

          Map<String, Object> adminAct = new LinkedHashMap<>();
          adminAct.put("icon", "🔐");
          adminAct.put("message", "Admin " + admin.getFullName() + " logged in");
          adminAct.put("time", new Date().toString());
          adminAct.put("type", "admin_login");
          activities.add(adminAct);

          List<User> recentUsers = userRepository.findTop5ByOrderByCreatedAtDesc();
          for (User u : recentUsers) {
               if (u.getRole() == User.Role.STUDENT) {
                    Map<String, Object> act = new LinkedHashMap<>();
                    act.put("icon", "👤");
                    act.put("message", u.getFullName() + " joined EduMind AI");
                    act.put("time", u.getCreatedAt() != null ? u.getCreatedAt().toString() : "Recently");
                    act.put("type", "user_registered");
                    activities.add(act);
               }
          }

          return ResponseEntity.ok(Map.of("success", true, "activities", activities));
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

     /**
      * GET /api/admin/tests
      * Returns ALL tests — student-created + admin-created both.
      * FIXED: pehle sirf student tests tha, ab testRepository.findAll() use karta
      * hai.
      */
     @GetMapping("/tests")
     public ResponseEntity<Map<String, Object>> getAllTests(
               @RequestHeader("Authorization") String authHeader) {

          if (getAdminFromToken(authHeader) == null)
               return unauthorized();

          // findAll() → student + admin dono ke tests aayenge
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

               // User info (owner of this test)
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

     /**
      * POST /api/admin/tests
      * Admin ek naya test create karta hai.
      * adminUserId JWT token se nikalta hai.
      */
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

     /**
      * PUT /api/admin/tests/{id}
      * Admin koi bhi test update kar sakta hai.
      */
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

     /**
      * DELETE /api/admin/tests/{id}
      * Admin koi bhi test delete kar sakta hai.
      * Error aayega agar test ke attempts already hain.
      */
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
}