package com.studyplanner.studyplanner.controller;

import com.studyplanner.studyplanner.model.User;
import com.studyplanner.studyplanner.repository.UserRepository;
import com.studyplanner.studyplanner.security.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * AdminDashboardController
 *
 * Provides admin dashboard summary data.
 *
 * APIs:
 * GET /api/admin/dashboard-summary → stat cards ka data
 * GET /api/admin/recent-activities → recent activity feed
 *
 * Security: JWT token + ADMIN role check har request pe.
 *
 * Note: Jaise-jaise aur modules (Tasks, Tests, etc.) ke
 * repositories inject honge, yahan real counts aa jayenge.
 * Abhi jo repositories available hain unka real data hai,
 * baaki ke liye 0 placeholder hai.
 */
@RestController
@RequestMapping("/api/admin")
public class AdminDashboardController {

     private final UserRepository userRepository;
     private final JwtUtil jwtUtil;

     // ── Inject aur repositories jab ready hon ──
     // private final TaskRepository taskRepository;
     // private final SubjectRepository subjectRepository;
     // private final PlannerRepository plannerRepository;
     // private final RevisionRepository revisionRepository;
     // private final TestRepository testRepository;

     public AdminDashboardController(
               UserRepository userRepository,
               JwtUtil jwtUtil) {
          this.userRepository = userRepository;
          this.jwtUtil = jwtUtil;
     }

     // ─────────────────────────────────────────
     // Helper: Token se user nikalo + ADMIN check
     // ─────────────────────────────────────────
     private User getAdminFromToken(String authHeader) {
          String token = authHeader.replace("Bearer ", "").trim();
          String email = jwtUtil.extractEmail(token);
          Optional<User> userOpt = userRepository.findByEmail(email);

          if (userOpt.isEmpty() || userOpt.get().getRole() != User.Role.ADMIN) {
               return null;
          }
          return userOpt.get();
     }

     // ─────────────────────────────────────────
     // GET /api/admin/dashboard-summary
     // Dashboard stat cards ka data
     // ─────────────────────────────────────────
     @GetMapping("/dashboard-summary")
     public ResponseEntity<Map<String, Object>> getDashboardSummary(
               @RequestHeader("Authorization") String authHeader) {

          // Admin check
          User admin = getAdminFromToken(authHeader);
          if (admin == null) {
               return ResponseEntity.status(403).body(Map.of(
                         "success", false,
                         "message", "Admin access required."));
          }

          Map<String, Object> summary = new LinkedHashMap<>();

          // ── Real data: Users ──
          long totalStudents = userRepository.countByRole(User.Role.STUDENT);
          long totalAdmins = userRepository.countByRole(User.Role.ADMIN);
          long totalUsers = userRepository.count();

          summary.put("totalStudents", totalStudents);
          summary.put("totalAdmins", totalAdmins);
          summary.put("totalUsers", totalUsers);

          // ── Placeholder: Inject repositories jab ready hon ──
          // summary.put("totalSubjects", subjectRepository.count());
          // summary.put("totalTasks", taskRepository.count());
          // summary.put("pendingTasks", taskRepository.countByStatus("Pending"));
          // summary.put("completedTasks", taskRepository.countByStatus("Completed"));
          // summary.put("totalPlans", plannerRepository.count());
          // summary.put("totalRevisions", revisionRepository.count());
          // summary.put("totalTests", testRepository.count());
          // summary.put("avgScore", testRepository.findAverageScore());

          // Abhi ke liye 0 (baad mein real data se replace hoga)
          summary.put("totalSubjects", 0);
          summary.put("totalTasks", 0);
          summary.put("pendingTasks", 0);
          summary.put("completedTasks", 0);
          summary.put("totalPlans", 0);
          summary.put("totalRevisions", 0);
          summary.put("totalTests", 0);
          summary.put("avgScore", 0);
          summary.put("pomodoroSessions", 0);
          summary.put("aiQueries", 0);

          summary.put("success", true);

          return ResponseEntity.ok(summary);
     }

     // ─────────────────────────────────────────
     // GET /api/admin/recent-activities
     // Activity feed ke liye
     // ─────────────────────────────────────────
     @GetMapping("/recent-activities")
     public ResponseEntity<Map<String, Object>> getRecentActivities(
               @RequestHeader("Authorization") String authHeader) {

          User admin = getAdminFromToken(authHeader);
          if (admin == null) {
               return ResponseEntity.status(403).body(Map.of(
                         "success", false,
                         "message", "Admin access required."));
          }

          // Recently registered students (last 5)
          List<Map<String, Object>> activities = new ArrayList<>();

          // Real: Last 5 registered users
          List<User> recentUsers = userRepository.findTop5ByOrderByCreatedAtDesc();
          for (User u : recentUsers) {
               Map<String, Object> activity = new LinkedHashMap<>();
               activity.put("type", "user_registered");
               activity.put("icon", "👤");
               activity.put("message", u.getFullName() + " ne EduMind AI join kiya");
               activity.put("time", u.getCreatedAt() != null
                         ? u.getCreatedAt().toString()
                         : "Recently");
               activities.add(activity);
          }

          // Baaki activities baad mein real repositories se aayengi
          // Abhi admin login activity add karte hain
          Map<String, Object> adminActivity = new LinkedHashMap<>();
          adminActivity.put("type", "admin_login");
          adminActivity.put("icon", "🔐");
          adminActivity.put("message", "Admin " + admin.getFullName() + " logged in");
          adminActivity.put("time", new Date().toString());
          activities.add(0, adminActivity);

          return ResponseEntity.ok(Map.of(
                    "success", true,
                    "activities", activities));
     }

     // ─────────────────────────────────────────
     // GET /api/admin/users-list
     // All students list (User Management ke liye bhi kaam aayega)
     // ─────────────────────────────────────────
     @GetMapping("/users-list")
     public ResponseEntity<Map<String, Object>> getUsersList(
               @RequestHeader("Authorization") String authHeader) {

          User admin = getAdminFromToken(authHeader);
          if (admin == null) {
               return ResponseEntity.status(403).body(Map.of(
                         "success", false,
                         "message", "Admin access required."));
          }

          List<User> students = userRepository.findByRole(User.Role.STUDENT);

          List<Map<String, Object>> userList = new ArrayList<>();
          for (User u : students) {
               Map<String, Object> userData = new LinkedHashMap<>();
               userData.put("id", u.getId());
               userData.put("fullName", u.getFullName());
               userData.put("email", u.getEmail());
               userData.put("course", u.getCourse());
               userData.put("college", u.getCollege());
               userData.put("createdAt", u.getCreatedAt());
               userData.put("isLocked", u.isAccountLocked());
               // Password expose mat karo
               userList.add(userData);
          }

          return ResponseEntity.ok(Map.of(
                    "success", true,
                    "users", userList,
                    "total", userList.size()));
     }
}