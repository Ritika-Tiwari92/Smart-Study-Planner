package com.studyplanner.studyplanner.controller;

import com.studyplanner.studyplanner.model.User;
import com.studyplanner.studyplanner.repository.UserRepository;
import com.studyplanner.studyplanner.security.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin/auth")
public class AdminAuthController {

     private final UserRepository userRepository;
     private final PasswordEncoder passwordEncoder;
     private final JwtUtil jwtUtil;

     private static final int MAX_ATTEMPTS = 5;
     private static final int LOCK_MINUTES = 15;

     public AdminAuthController(
               UserRepository userRepository,
               PasswordEncoder passwordEncoder,
               JwtUtil jwtUtil) {
          this.userRepository = userRepository;
          this.passwordEncoder = passwordEncoder;
          this.jwtUtil = jwtUtil;
     }

     @PostMapping("/login")
     public ResponseEntity<Map<String, Object>> adminLogin(
               @RequestBody Map<String, String> request) {

          Map<String, Object> response = new HashMap<>();

          String email = request.get("email");
          String password = request.get("password");

          // DEBUG — Spring Boot console mein dikhega
          System.out.println("=== ADMIN LOGIN DEBUG ===");
          System.out.println("Email received    : " + email);
          System.out.println("Password received : " + (password != null ? "YES len=" + password.length() : "NULL"));

          if (email == null || email.isBlank() || password == null || password.isBlank()) {
               response.put("success", false);
               response.put("message", "Email aur password required hain.");
               return ResponseEntity.badRequest().body(response);
          }

          String cleanEmail = email.trim().toLowerCase();
          System.out.println("Clean email       : " + cleanEmail);

          Optional<User> userOpt = userRepository.findByEmail(cleanEmail);
          System.out.println("User found in DB  : " + userOpt.isPresent());

          if (userOpt.isEmpty()) {
               System.out.println("RESULT: No user with this email!");
               response.put("success", false);
               response.put("message", "Invalid credentials. Admin access only.");
               return ResponseEntity.status(401).body(response);
          }

          User user = userOpt.get();
          System.out.println("User ID           : " + user.getId());
          System.out.println("User email in DB  : " + user.getEmail());
          System.out.println("User role         : " + user.getRole());
          System.out.println("Role is null?     : " + (user.getRole() == null));

          // Role null check
          if (user.getRole() == null) {
               System.out.println("RESULT: Role is NULL — run SQL update!");
               response.put("success", false);
               response.put("message",
                         "Role not set. Run: UPDATE users SET role='ADMIN' WHERE email='" + cleanEmail + "';");
               return ResponseEntity.status(403).body(response);
          }

          // Role ADMIN check
          if (user.getRole() != User.Role.ADMIN) {
               System.out.println("RESULT: Role is " + user.getRole() + " — not ADMIN!");
               response.put("success", false);
               response.put("message", "Not an admin. Your role is: " + user.getRole());
               return ResponseEntity.status(403).body(response);
          }

          System.out.println("Role check        : PASSED ✓");

          // Account lock check
          if (user.isAccountLocked()) {
               System.out.println("RESULT: Account is LOCKED");
               response.put("success", false);
               response.put("message", "Account locked. Try after " + LOCK_MINUTES + " minutes.");
               return ResponseEntity.status(423).body(response);
          }

          // Password check
          boolean pwMatch = passwordEncoder.matches(password, user.getPassword());
          System.out.println("Password match    : " + pwMatch);

          if (!pwMatch) {
               user.incrementFailedAttempts();
               if (user.getFailedLoginAttempts() >= MAX_ATTEMPTS) {
                    user.lockAccount(LOCK_MINUTES);
                    userRepository.save(user);
                    response.put("success", false);
                    response.put("message",
                              "Too many failed attempts. Account locked for " + LOCK_MINUTES + " minutes.");
                    return ResponseEntity.status(423).body(response);
               }
               userRepository.save(user);
               int remaining = MAX_ATTEMPTS - user.getFailedLoginAttempts();
               response.put("success", false);
               response.put("message", "Wrong password. " + remaining + " attempts left.");
               return ResponseEntity.status(401).body(response);
          }

          // Success
          user.resetFailedAttempts();
          userRepository.save(user);

          String token = jwtUtil.generateToken(user.getId(), user.getEmail());

          System.out.println("RESULT: LOGIN SUCCESS for " + user.getEmail());
          System.out.println("=========================");

          response.put("success", true);
          response.put("message", "Admin login successful!");
          response.put("token", token);
          response.put("adminName", user.getFullName());
          response.put("adminEmail", user.getEmail());
          response.put("role", user.getRole().name());

          return ResponseEntity.ok(response);
     }

     @GetMapping("/verify")
     public ResponseEntity<Map<String, Object>> verifyAdmin(
               @RequestHeader("Authorization") String authHeader) {

          Map<String, Object> response = new HashMap<>();
          try {
               String token = authHeader.replace("Bearer ", "").trim();
               String email = jwtUtil.extractEmail(token);
               Optional<User> userOpt = userRepository.findByEmail(email);

               if (userOpt.isEmpty() || userOpt.get().getRole() != User.Role.ADMIN) {
                    response.put("valid", false);
                    response.put("message", "Not an admin.");
                    return ResponseEntity.status(403).body(response);
               }

               response.put("valid", true);
               response.put("adminName", userOpt.get().getFullName());
               response.put("role", "ADMIN");
               return ResponseEntity.ok(response);

          } catch (Exception e) {
               response.put("valid", false);
               response.put("message", "Invalid or expired token.");
               return ResponseEntity.status(401).body(response);
          }
     }
}