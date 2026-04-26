package com.studyplanner.studyplanner.repository;

import com.studyplanner.studyplanner.model.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * Repository for PasswordResetToken DB operations.
 */
@Repository
public interface PasswordResetTokenRepository
          extends JpaRepository<PasswordResetToken, Long> {

     // Find latest token by email
     Optional<PasswordResetToken> findTopByEmailOrderByCreatedAtDesc(String email);

     // Find by email and OTP
     Optional<PasswordResetToken> findByEmailAndOtp(String email, String otp);

     // Delete all tokens for this email (cleanup)
     @Modifying
     @Transactional
     @Query("DELETE FROM PasswordResetToken p WHERE p.email = :email")
     void deleteByEmail(String email);
}