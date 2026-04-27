package com.studyplanner.studyplanner.repository;

import com.studyplanner.studyplanner.model.UserBadge;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserBadgeRepository extends JpaRepository<UserBadge, Long> {

     // All badges unlocked by a user
     List<UserBadge> findByUserId(Long userId);

     // Check if user already has a specific badge
     Optional<UserBadge> findByUserIdAndBadgeId(Long userId, Long badgeId);

     // Check by ruleType directly
     boolean existsByUserIdAndBadgeRuleType(Long userId, String ruleType);
}
