package com.studyplanner.studyplanner.exception;

import com.studyplanner.studyplanner.dto.ApiErrorResponse;
import com.studyplanner.studyplanner.service.AuthService.AccountLockedException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Global Exception Handler — updated with AccountLockedException (423).
 *
 * Handles:
 * 1. @Valid failures → 400 with list of field errors
 * 2. IllegalArgument → 400 with field-routed error
 * 3. AccountLocked → 423 Locked
 * 4. All other exceptions → 500 (no internal details exposed)
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Handles @Valid annotation failures.
     * Returns list: [{ field, message }, ...]
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<List<ApiErrorResponse>> handleValidationErrors(
            MethodArgumentNotValidException ex) {

        List<ApiErrorResponse> errors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(fe -> new ApiErrorResponse(fe.getField(), fe.getDefaultMessage()))
                .collect(Collectors.toList());

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errors);
    }

    /**
     * Handles account lock — returns 423 Locked.
     * Frontend shows "Account locked" message below email field.
     */
    @ExceptionHandler(AccountLockedException.class)
    public ResponseEntity<ApiErrorResponse> handleAccountLocked(
            AccountLockedException ex) {
        return ResponseEntity
                .status(HttpStatus.LOCKED) // 423
                .body(ApiErrorResponse.of("email", ex.getMessage()));
    }

    /**
     * Handles business logic errors from AuthService.
     * Routes error to correct field based on message content.
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiErrorResponse> handleIllegalArgument(
            IllegalArgumentException ex) {

        String message = ex.getMessage();
        String field = "general";

        if (message != null) {
            String lower = message.toLowerCase();
            if (lower.contains("email"))
                field = "email";
            else if (lower.contains("password"))
                field = "password";
            else if (lower.contains("name"))
                field = "fullName";
            else if (lower.contains("course"))
                field = "course";
            else if (lower.contains("college"))
                field = "college";
        }

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiErrorResponse.of(field, message));
    }

    /**
     * Fallback — never expose internal error details.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleGenericException(Exception ex) {
        System.err.println("Unhandled exception: " + ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiErrorResponse.general(
                        "Something went wrong. Please try again later."));
    }
}