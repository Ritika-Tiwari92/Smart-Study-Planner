package com.studyplanner.studyplanner.repository;

import com.studyplanner.studyplanner.model.RefreshToken;
import com.studyplanner.studyplanner.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * Repository for RefreshToken DB operations.
 */
@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    // Find token by the token string value
    Optional<RefreshToken> findByToken(String token);

    // Find token by user (one per user)
    Optional<RefreshToken> findByUser(User user);

    // Delete token by user — called on logout and on new login
    @Modifying
    @Transactional
    @Query("DELETE FROM RefreshToken rt WHERE rt.user = :user")
    void deleteByUser(User user);

    // Check if token exists (for validation)
    boolean existsByToken(String token);
}