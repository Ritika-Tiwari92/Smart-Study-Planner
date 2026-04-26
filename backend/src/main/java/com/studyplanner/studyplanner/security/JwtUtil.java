package com.studyplanner.studyplanner.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

/**
 * JWT Utility — updated with:
 *
 * 1. generateToken() → SHORT access token (15 minutes)
 * Used for all API calls
 * 2. generateRefreshToken() → Random UUID string (NOT a JWT)
 * Stored in DB, expires in 7 days
 * Used ONLY to get new access token
 *
 * Why two tokens?
 * Access token is short-lived → if stolen, expires in 15 min
 * Refresh token is long-lived → stored in DB, can be revoked on logout
 *
 * EXISTING methods unchanged → nothing breaks in JwtAuthFilter.
 */
@Component
public class JwtUtil {

     @Value("${jwt.secret}")
     private String secret;

     // Access token expiry: 15 minutes (900,000 ms)
     // Override jwt.expiration property with this constant
     private static final long ACCESS_TOKEN_EXPIRY_MS = 15 * 60 * 1000L; // 15 min

     // Refresh token expiry: 7 days in minutes (for DB storage)
     public static final int REFRESH_TOKEN_EXPIRY_DAYS = 7;

     // Build signing key from secret
     private SecretKey getSigningKey() {
          return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
     }

     // ─────────────────────────────────────────
     // ACCESS TOKEN — short-lived JWT (15 min)
     // ─────────────────────────────────────────

     /**
      * Generates a JWT access token valid for 15 minutes.
      * Contains userId and email as claims.
      * Used for authenticating all API requests.
      */
     public String generateToken(Long userId, String email) {
          return Jwts.builder()
                    .subject(email)
                    .claim("userId", userId)
                    .issuedAt(new Date())
                    .expiration(new Date(System.currentTimeMillis() + ACCESS_TOKEN_EXPIRY_MS))
                    .signWith(getSigningKey())
                    .compact();
     }

     // ─────────────────────────────────────────
     // REFRESH TOKEN — long-lived UUID (7 days)
     // ─────────────────────────────────────────

     /**
      * Generates a random refresh token string.
      * This is NOT a JWT — it is a UUID stored in the database.
      * When frontend sends this, we look it up in DB and issue new access token.
      */
     public String generateRefreshTokenValue() {
          // UUID is random, unique, and not decodable → safe as refresh token
          return UUID.randomUUID().toString() + "-" + UUID.randomUUID().toString();
     }

     // ─────────────────────────────────────────
     // VALIDATION & EXTRACTION (unchanged)
     // ─────────────────────────────────────────

     public String extractEmail(String token) {
          return getClaims(token).getSubject();
     }

     public Long extractUserId(String token) {
          return getClaims(token).get("userId", Long.class);
     }

     public boolean isTokenExpired(String token) {
          return getClaims(token).getExpiration().before(new Date());
     }

     public boolean validateToken(String token, String email) {
          return extractEmail(token).equals(email) && !isTokenExpired(token);
     }

     private Claims getClaims(String token) {
          return Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
     }
}