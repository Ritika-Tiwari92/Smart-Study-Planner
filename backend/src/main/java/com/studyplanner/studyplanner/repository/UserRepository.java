package com.studyplanner.studyplanner.repository;

import com.studyplanner.studyplanner.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * UserRepository — Updated for Admin Module
 *
 * NEW METHODS ADDED:
 * - countByRole() → dashboard mein student count
 * - findByRole() → admin users list
 * - findTop5ByOrderByCreatedAtDesc() → recent activity feed
 *
 * Existing methods UNCHANGED.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

     // ── Existing (do not remove) ──
     Optional<User> findByEmail(String email);

     boolean existsByEmail(String email);

     // ── NEW: Admin ke liye ──

     // Role ke hisaab se count karo (STUDENT ya ADMIN)
     long countByRole(User.Role role);

     // Role ke hisaab se users list
     List<User> findByRole(User.Role role);

     // Last 5 registered users (recent activity feed)
     List<User> findTop5ByOrderByCreatedAtDesc();
}