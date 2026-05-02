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
 * EduMind AI — Security Configuration
 *
 * Fix:
 * - Admin panel can access admin APIs.
 * - Admin panel can also access existing student-module APIs when needed
 * for old workflow compatibility.
 * - Student APIs remain protected.
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

                              // Preflight requests
                              .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                              // PUBLIC AUTH APIs
                              .requestMatchers(HttpMethod.POST, "/api/auth/register").permitAll()
                              .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                              .requestMatchers(HttpMethod.POST, "/api/auth/refresh-token").permitAll()

                              // PUBLIC FORGOT PASSWORD APIs
                              .requestMatchers(HttpMethod.POST, "/api/auth/forgot-password").permitAll()
                              .requestMatchers(HttpMethod.POST, "/api/auth/verify-otp").permitAll()
                              .requestMatchers(HttpMethod.POST, "/api/auth/reset-password").permitAll()

                              // ADMIN LOGIN API
                              .requestMatchers(HttpMethod.POST, "/api/admin/auth/login").permitAll()

                              // FRONTEND STATIC FILES
                              .requestMatchers(
                                        "/",
                                        "/index.html",
                                        "/landing.html",
                                        "/pages/**",
                                        "/assets/**",
                                        "/css/**",
                                        "/js/**",
                                        "/images/**",
                                        "/favicon.ico",
                                        "/error")
                              .permitAll()

                              // PUBLIC HEALTH
                              .requestMatchers("/api/syllabus/health").permitAll()

                              // PROTECTED AUTH APIs
                              .requestMatchers(
                                        "/api/auth/profile",
                                        "/api/auth/logout",
                                        "/api/auth/validate",
                                        "/api/auth/change-password",
                                        "/api/auth/delete-account",
                                        "/api/auth/two-factor")
                              .hasAnyRole("STUDENT", "ADMIN")

                              // ADMIN APIs — ADMIN ONLY
                              .requestMatchers("/api/admin/**").hasRole("ADMIN")

                              // SHARED MODULE APIs
                              // Admin panel is using some existing module endpoints,
                              // so ADMIN must be allowed here too.
                              .requestMatchers(
                                        "/api/dashboard/**",
                                        "/api/subjects/**",
                                        "/api/tasks/**",
                                        "/api/plans/**",
                                        "/api/revisions/**",
                                        "/api/tests/**",
                                        "/api/student/**",
                                        "/api/analytics/**",
                                        "/api/pomodoro/**",
                                        "/api/assistant/**",
                                        "/api/notifications/**",
                                        "/api/settings/**")
                              .hasAnyRole("STUDENT", "ADMIN")

                              // OLD ROUTE COMPATIBILITY
                              .requestMatchers(
                                        "/subjects/**",
                                        "/tasks/**",
                                        "/plans/**",
                                        "/revisions/**",
                                        "/tests/**")
                              .hasAnyRole("STUDENT", "ADMIN")

                              // Any remaining API needs login
                              .requestMatchers("/api/**").authenticated()

                              // Non-API requests allowed
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