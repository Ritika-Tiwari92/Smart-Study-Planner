package com.studyplanner.studyplanner.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * SecurityConfig — Updated with Admin Routes
 *
 * CHANGES FROM ORIGINAL:
 * 1. /api/admin/auth/login → public (admin login ke liye)
 * 2. /api/admin/** → authenticated (protected admin APIs)
 * 3. /pages/admin/** → public (HTML files ko Spring block na kare)
 *
 * Existing student routes UNCHANGED.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

     private final JwtAuthFilter jwtAuthFilter;
     private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

     public SecurityConfig(
               JwtAuthFilter jwtAuthFilter,
               JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint) {
          this.jwtAuthFilter = jwtAuthFilter;
          this.jwtAuthenticationEntryPoint = jwtAuthenticationEntryPoint;
     }

     @Bean
     public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
          http
                    .csrf(csrf -> csrf.disable())

                    .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                    .sessionManagement(session -> session
                              .sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                    .exceptionHandling(exception -> exception
                              .authenticationEntryPoint(jwtAuthenticationEntryPoint))

                    .authorizeHttpRequests(auth -> auth

                              .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                              // ─────────────────────────────────────────
                              // Student Auth APIs — public
                              // ─────────────────────────────────────────
                              .requestMatchers("/api/auth/**").permitAll()

                              // ─────────────────────────────────────────
                              // NEW: Admin Login API — public
                              // (Baaki /api/admin/** protected rahenge)
                              // ─────────────────────────────────────────
                              .requestMatchers("/api/admin/auth/login").permitAll()

                              // ─────────────────────────────────────────
                              // Frontend pages — public
                              // (admin HTML files bhi yahan cover hain)
                              // ─────────────────────────────────────────
                              .requestMatchers(
                                        "/",
                                        "/index.html",
                                        "/pages/**", // student pages
                                        "/landing.html",
                                        "/assets/**",
                                        "/css/**",
                                        "/js/**",
                                        "/images/**",
                                        "/favicon.ico",
                                        "/error")
                              .permitAll()

                              .requestMatchers("/api/syllabus/health").permitAll()

                              // ─────────────────────────────────────────
                              // NEW: Admin APIs — authentication required
                              // Role check AdminAuthController mein hoga
                              // ─────────────────────────────────────────
                              .requestMatchers("/api/admin/**").authenticated()

                              // ─────────────────────────────────────────
                              // All other APIs — authentication required
                              // ─────────────────────────────────────────
                              .requestMatchers("/api/**").authenticated()

                              .anyRequest().permitAll())

                    .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

          return http.build();
     }

     @Bean
     public CorsConfigurationSource corsConfigurationSource() {
          CorsConfiguration config = new CorsConfiguration();

          config.setAllowedOriginPatterns(List.of("*"));
          config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
          config.setAllowedHeaders(List.of("*"));
          config.setExposedHeaders(List.of("Authorization"));
          config.setAllowCredentials(true);

          UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
          source.registerCorsConfiguration("/**", config);
          return source;
     }

     @Bean
     public PasswordEncoder passwordEncoder() {
          return new BCryptPasswordEncoder();
     }

     @Bean
     public AuthenticationManager authenticationManager(
               AuthenticationConfiguration config) throws Exception {
          return config.getAuthenticationManager();
     }
}