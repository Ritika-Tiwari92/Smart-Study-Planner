package com.studyplanner.studyplanner.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request DTO for POST /api/auth/refresh-token
 * Frontend sends the refresh token to get a new access token.
 */
public class RefreshTokenRequestDto {

     @NotBlank(message = "Refresh token is required.")
     private String refreshToken;

     public RefreshTokenRequestDto() {
     }

     public String getRefreshToken() {
          return refreshToken;
     }

     public void setRefreshToken(String refreshToken) {
          this.refreshToken = refreshToken;
     }
}
