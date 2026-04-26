package com.studyplanner.studyplanner.dto;

/**
 * Structured error response sent to frontend.
 *
 * Frontend JavaScript reads this and shows error below the correct field.
 *
 * Example JSON response:
 * {
 * "field": "email",
 * "message": "Email already registered. Please login."
 * }
 *
 * For general errors (not field-specific), field = "general":
 * {
 * "field": "general",
 * "message": "Something went wrong."
 * }
 */
public class ApiErrorResponse {

    private String field;
    private String message;

    // ── Constructors ──
    public ApiErrorResponse() {
    }

    public ApiErrorResponse(String field, String message) {
        this.field = field;
        this.message = message;
    }

    // ── Static factory helpers (cleaner to use in controller) ──

    /** For field-specific errors: email, password, fullName etc. */
    public static ApiErrorResponse of(String field, String message) {
        return new ApiErrorResponse(field, message);
    }

    /** For general errors not tied to a specific field */
    public static ApiErrorResponse general(String message) {
        return new ApiErrorResponse("general", message);
    }

    // ── Getters & Setters ──
    public String getField() {
        return field;
    }

    public void setField(String field) {
        this.field = field;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}