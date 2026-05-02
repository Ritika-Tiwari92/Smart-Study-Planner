package com.studyplanner.studyplanner.security;

import com.studyplanner.studyplanner.model.User;
import com.studyplanner.studyplanner.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * CustomUserDetailsService
 *
 * Loads user from database by email during JWT validation.
 *
 * Important:
 * - STUDENT user gets ROLE_STUDENT
 * - ADMIN user gets ROLE_ADMIN
 *
 * This is required for:
 * - hasRole("STUDENT")
 * - hasRole("ADMIN")
 * - hasAnyRole("STUDENT", "ADMIN")
 */
@Service
public class CustomUserDetailsService implements UserDetailsService {

     private final UserRepository userRepository;

     public CustomUserDetailsService(UserRepository userRepository) {
          this.userRepository = userRepository;
     }

     @Override
     public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {

          User user = userRepository.findByEmail(email.trim().toLowerCase())
                    .orElseThrow(() -> new UsernameNotFoundException(
                              "User not found with email: " + email));

          String authority = "ROLE_" + user.getRole().name();

          return org.springframework.security.core.userdetails.User
                    .withUsername(user.getEmail())
                    .password(user.getPassword())
                    .authorities(authority)
                    .accountLocked(user.isAccountLocked())
                    .accountExpired(false)
                    .credentialsExpired(false)
                    .disabled(false)
                    .build();
     }
}