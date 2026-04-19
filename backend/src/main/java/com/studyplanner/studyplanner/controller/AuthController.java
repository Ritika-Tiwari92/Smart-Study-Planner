package com.studyplanner.studyplanner.controller;

import com.studyplanner.studyplanner.dto.AuthResponseDto;
import com.studyplanner.studyplanner.dto.LoginRequestDto;
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
}