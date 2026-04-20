package com.studyplanner.studyplanner.controller;

import com.studyplanner.studyplanner.dto.AuthResponseDto;
import com.studyplanner.studyplanner.dto.ChangePasswordRequestDto;
import com.studyplanner.studyplanner.dto.LoginRequestDto;
import com.studyplanner.studyplanner.dto.ProfileUpdateRequestDto;
import com.studyplanner.studyplanner.dto.RegisterRequestDto;
import com.studyplanner.studyplanner.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

     private final AuthService authService;

     public AuthController(AuthService authService) {
          this.authService = authService;
     }

     @PostMapping("/register")
     public ResponseEntity<?> registerUser(@RequestBody RegisterRequestDto request) {
          try {
               AuthResponseDto response = authService.registerUser(request);
               return ResponseEntity.ok(response);
          } catch (IllegalArgumentException ex) {
               return ResponseEntity.badRequest().body(ex.getMessage());
          }
     }

     @PostMapping("/login")
     public ResponseEntity<?> loginUser(@RequestBody LoginRequestDto request) {
          try {
               AuthResponseDto response = authService.loginUser(request);
               return ResponseEntity.ok(response);
          } catch (IllegalArgumentException ex) {
               return ResponseEntity.badRequest().body(ex.getMessage());
          }
     }

     @GetMapping("/profile/{id}")
     public ResponseEntity<?> getUserProfile(@PathVariable Long id) {
          try {
               AuthResponseDto response = authService.getUserProfile(id);
               return ResponseEntity.ok(response);
          } catch (IllegalArgumentException ex) {
               return ResponseEntity.badRequest().body(ex.getMessage());
          }
     }

     @PutMapping("/profile/{id}")
     public ResponseEntity<?> updateUserProfile(@PathVariable Long id,
               @RequestBody ProfileUpdateRequestDto request) {
          try {
               AuthResponseDto response = authService.updateUserProfile(id, request);
               return ResponseEntity.ok(response);
          } catch (IllegalArgumentException ex) {
               return ResponseEntity.badRequest().body(ex.getMessage());
          }
     }

     @PutMapping("/change-password/{id}")
     public ResponseEntity<?> changeUserPassword(@PathVariable Long id,
               @RequestBody ChangePasswordRequestDto request) {
          try {
               String message = authService.changeUserPassword(id, request);
               return ResponseEntity.ok(message);
          } catch (IllegalArgumentException ex) {
               return ResponseEntity.badRequest().body(ex.getMessage());
          }
     }

     @DeleteMapping("/delete-account/{id}")
     public ResponseEntity<?> deleteUserAccount(@PathVariable Long id) {
          try {
               String message = authService.deleteUserAccount(id);
               return ResponseEntity.ok(message);
          } catch (IllegalArgumentException ex) {
               return ResponseEntity.badRequest().body(ex.getMessage());
          }
     }

     @PutMapping("/two-factor/{id}")
     public ResponseEntity<?> updateTwoFactorStatus(@PathVariable Long id,
               @RequestParam boolean enabled) {
          try {
               AuthResponseDto response = authService.updateTwoFactorStatus(id, enabled);
               return ResponseEntity.ok(response);
          } catch (IllegalArgumentException ex) {
               return ResponseEntity.badRequest().body(ex.getMessage());
          }
     }
}