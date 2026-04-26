package com.studyplanner.studyplanner.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * DTO for user login request.
 * Backend validates email format and required fields.
 * Password strength is NOT checked here — only on register.
 */
public class LoginRequestDto {

    // ── Email ──
    @NotBlank(message = "Email is required.")
    @Email(message = "Please enter a valid email address.")
    private String email;

    // ── Password ──
    @NotBlank(message = "Password is required.")
    private String password;

    // ── Constructors ──
    public LoginRequestDto() {
    }

    // ── Getters & Setters ──
    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}