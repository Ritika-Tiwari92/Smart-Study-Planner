package com.studyplanner.studyplanner.controller;

import com.studyplanner.studyplanner.dto.ApiErrorResponse;
import com.studyplanner.studyplanner.dto.AuthResponseDto;
import com.studyplanner.studyplanner.dto.ChangePasswordRequestDto;
import com.studyplanner.studyplanner.dto.LoginRequestDto;
import com.studyplanner.studyplanner.dto.ProfileUpdateRequestDto;
import com.studyplanner.studyplanner.dto.RefreshTokenRequestDto;
import com.studyplanner.studyplanner.dto.RefreshTokenResponseDto;
import com.studyplanner.studyplanner.dto.RegisterRequestDto;
import com.studyplanner.studyplanner.service.AuthService;
import com.studyplanner.studyplanner.service.AuthService.AccountLockedException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * Auth Controller — final version with:
 *
 * PUBLIC endpoints:
 * POST /api/auth/register → register new user
 * POST /api/auth/login → login, returns access + refresh token
 * POST /api/auth/refresh-token → get new access token using refresh token
 * POST /api/auth/logout → invalidate refresh token (JWT required)
 *
 * PROTECTED endpoints (JWT required):
 * GET /api/auth/profile → get user profile
 * PUT /api/auth/profile → update profile
 * PUT /api/auth/change-password
 * DELETE /api/auth/delete-account
 * PUT /api/auth/two-factor
 * GET /api/auth/validate
 */
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

     private final AuthService authService;

     public AuthController(AuthService authService) {
          this.authService = authService;
     }

     // ═══════════════════════════════════════════
     // PUBLIC ENDPOINTS
     // ═══════════════════════════════════════════

     /**
      * POST /api/auth/register
      * 
      * @Valid runs DTO annotations → GlobalExceptionHandler handles failures
      */
     @PostMapping("/register")
     public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequestDto request) {
          try {
               AuthResponseDto response = authService.registerUser(request);
               return ResponseEntity.ok(response);

          } catch (IllegalArgumentException ex) {
               String message = ex.getMessage();

               // Duplicate email → 409 Conflict
               if (message != null && message.toLowerCase().contains("email already")) {
                    return ResponseEntity
                              .status(HttpStatus.CONFLICT)
                              .body(ApiErrorResponse.of("email", message));
               }

               return ResponseEntity
                         .status(HttpStatus.BAD_REQUEST)
                         .body(ApiErrorResponse.general(message));
          }
     }

     /**
      * POST /api/auth/login
      * Returns both accessToken (15 min) and refreshToken (7 days).
      * Frontend stores both in localStorage.
      */
     @PostMapping("/login")
     public ResponseEntity<?> loginUser(@Valid @RequestBody LoginRequestDto request) {
          try {
               AuthResponseDto response = authService.loginUser(request);
               return ResponseEntity.ok(response);

          } catch (AccountLockedException ex) {
               // 423 Locked — account locked after too many failures
               return ResponseEntity
                         .status(HttpStatus.LOCKED) // 423
                         .body(ApiErrorResponse.of("email", ex.getMessage()));

          } catch (IllegalArgumentException ex) {
               String message = ex.getMessage();

               // Wrong credentials → 401
               if (message != null && (message.toLowerCase().contains("invalid")
                         || message.toLowerCase().contains("no account"))) {
                    return ResponseEntity
                              .status(HttpStatus.UNAUTHORIZED)
                              .body(ApiErrorResponse.of("email", message));
               }

               return ResponseEntity
                         .status(HttpStatus.BAD_REQUEST)
                         .body(ApiErrorResponse.general(message));
          }
     }

     /**
      * POST /api/auth/refresh-token
      * Frontend calls this when access token expires (401 from any API).
      * Sends refresh token → gets new access token.
      * No JWT needed for this endpoint — it IS the token renewal mechanism.
      */
     @PostMapping("/refresh-token")
     public ResponseEntity<?> refreshToken(
               @Valid @RequestBody RefreshTokenRequestDto request) {
          try {
               RefreshTokenResponseDto response = authService.refreshAccessToken(request);
               return ResponseEntity.ok(response);

          } catch (IllegalArgumentException ex) {
               // Expired or invalid refresh token → must login again
               return ResponseEntity
                         .status(HttpStatus.UNAUTHORIZED)
                         .body(ApiErrorResponse.general(ex.getMessage()));
          }
     }

     /**
      * POST /api/auth/logout
      * JWT required — uses @AuthenticationPrincipal to get logged-in user.
      * Deletes refresh token from DB → session fully invalidated.
      */
     @PostMapping("/logout")
     public ResponseEntity<?> logout(
               @AuthenticationPrincipal UserDetails userDetails) {
          try {
               String message = authService.logoutUser(userDetails.getUsername());
               return ResponseEntity.ok(ApiErrorResponse.general(message));
          } catch (IllegalArgumentException ex) {
               return ResponseEntity
                         .status(HttpStatus.BAD_REQUEST)
                         .body(ApiErrorResponse.general(ex.getMessage()));
          }
     }

     // ═══════════════════════════════════════════
     // PROTECTED ENDPOINTS (JWT required)
     // All unchanged from previous version
     // ═══════════════════════════════════════════

     @GetMapping("/profile")
     public ResponseEntity<?> getUserProfile(
               @AuthenticationPrincipal UserDetails userDetails) {
          try {
               return ResponseEntity.ok(
                         authService.getUserProfileByEmail(userDetails.getUsername()));
          } catch (IllegalArgumentException ex) {
               return ResponseEntity.badRequest()
                         .body(ApiErrorResponse.general(ex.getMessage()));
          }
     }

     @PutMapping("/profile")
     public ResponseEntity<?> updateUserProfile(
               @AuthenticationPrincipal UserDetails userDetails,
               @RequestBody ProfileUpdateRequestDto request) {
          try {
               return ResponseEntity.ok(
                         authService.updateUserProfileByEmail(
                                   userDetails.getUsername(), request));
          } catch (IllegalArgumentException ex) {
               return ResponseEntity.badRequest()
                         .body(ApiErrorResponse.general(ex.getMessage()));
          }
     }

     @PutMapping("/change-password")
     public ResponseEntity<?> changeUserPassword(
               @AuthenticationPrincipal UserDetails userDetails,
               @RequestBody ChangePasswordRequestDto request) {
          try {
               return ResponseEntity.ok(
                         authService.changeUserPasswordByEmail(
                                   userDetails.getUsername(), request));
          } catch (IllegalArgumentException ex) {
               return ResponseEntity.badRequest()
                         .body(ApiErrorResponse.general(ex.getMessage()));
          }
     }

     @DeleteMapping("/delete-account")
     public ResponseEntity<?> deleteUserAccount(
               @AuthenticationPrincipal UserDetails userDetails) {
          try {
               return ResponseEntity.ok(
                         authService.deleteUserAccountByEmail(userDetails.getUsername()));
          } catch (IllegalArgumentException ex) {
               return ResponseEntity.badRequest()
                         .body(ApiErrorResponse.general(ex.getMessage()));
          }
     }

     @PutMapping("/two-factor")
     public ResponseEntity<?> updateTwoFactorStatus(
               @AuthenticationPrincipal UserDetails userDetails,
               @RequestParam boolean enabled) {
          try {
               return ResponseEntity.ok(
                         authService.updateTwoFactorStatusByEmail(
                                   userDetails.getUsername(), enabled));
          } catch (IllegalArgumentException ex) {
               return ResponseEntity.badRequest()
                         .body(ApiErrorResponse.general(ex.getMessage()));
          }
     }

     @GetMapping("/validate")
     public ResponseEntity<?> validateToken(
               @AuthenticationPrincipal UserDetails userDetails) {
          return ResponseEntity.ok("Token is valid for: " + userDetails.getUsername());
     }
}