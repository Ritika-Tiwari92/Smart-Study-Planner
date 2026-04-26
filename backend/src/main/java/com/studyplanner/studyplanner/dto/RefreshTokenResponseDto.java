package com.studyplanner.studyplanner.dto;

/**
 * Response DTO for POST /api/auth/refresh-token
 *
 * Returns new access token.
 * Frontend replaces old token in localStorage with this new one.
 *
 * Example response:
 * {
 * "accessToken": "eyJhbGci...",
 * "message": "Token refreshed successfully."
 * }
 */
public class RefreshTokenResponseDto {

     private String accessToken;
     private String message;

     public RefreshTokenResponseDto() {
     }

     public RefreshTokenResponseDto(String accessToken, String message) {
          this.accessToken = accessToken;
          this.message = message;
     }

     public String getAccessToken() {
          return accessToken;
     }

     public void setAccessToken(String accessToken) {
          this.accessToken = accessToken;
     }

     public String getMessage() {
          return message;
     }

     public void setMessage(String message) {
          this.message = message;
     }
}