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
 * Auth Controller
 *
 * PUBLIC endpoints (no JWT):
 * POST /api/auth/register
 * POST /api/auth/login
 * POST /api/auth/refresh-token
 *
 * NOTE: forgot-password, verify-otp, reset-password are handled
 * by ForgotPasswordController.java — do NOT add them here.
 *
 * PROTECTED endpoints (JWT required):
 * POST /api/auth/logout
 * GET /api/auth/profile
 * PUT /api/auth/profile
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
     // PUBLIC — REGISTER / LOGIN / REFRESH
     // ═══════════════════════════════════════════

     /**
      * POST /api/auth/register
      */
     @PostMapping("/register")
     public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequestDto request) {
          try {
               AuthResponseDto response = authService.registerUser(request);
               return ResponseEntity.ok(response);

          } catch (IllegalArgumentException ex) {
               String message = ex.getMessage();

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
      * Returns both accessToken and refreshToken.
      */
     @PostMapping("/login")
     public ResponseEntity<?> loginUser(@Valid @RequestBody LoginRequestDto request) {
          try {
               AuthResponseDto response = authService.loginUser(request);
               return ResponseEntity.ok(response);

          } catch (AccountLockedException ex) {
               return ResponseEntity
                         .status(HttpStatus.LOCKED) // 423
                         .body(ApiErrorResponse.of("email", ex.getMessage()));

          } catch (IllegalArgumentException ex) {
               String message = ex.getMessage();

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
      */
     @PostMapping("/refresh-token")
     public ResponseEntity<?> refreshToken(
               @Valid @RequestBody RefreshTokenRequestDto request) {
          try {
               RefreshTokenResponseDto response = authService.refreshAccessToken(request);
               return ResponseEntity.ok(response);

          } catch (IllegalArgumentException ex) {
               return ResponseEntity
                         .status(HttpStatus.UNAUTHORIZED)
                         .body(ApiErrorResponse.general(ex.getMessage()));
          }
     }

     // ═══════════════════════════════════════════
     // PROTECTED ENDPOINTS (JWT required)
     // ═══════════════════════════════════════════

     /**
      * POST /api/auth/logout
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

     /**
      * GET /api/auth/profile
      */
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

     /**
      * PUT /api/auth/profile
      */
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

     /**
      * PUT /api/auth/change-password
      */
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

     /**
      * DELETE /api/auth/delete-account
      */
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

     /**
      * PUT /api/auth/two-factor
      */
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

     /**
      * GET /api/auth/validate
      */
     @GetMapping("/validate")
     public ResponseEntity<?> validateToken(
               @AuthenticationPrincipal UserDetails userDetails) {
          return ResponseEntity.ok("Token is valid for: " + userDetails.getUsername());
     }
}