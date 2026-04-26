package com.studyplanner.studyplanner.security;

import com.studyplanner.studyplanner.model.User;
import com.studyplanner.studyplanner.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * Loads user from DB by email for Spring Security.
 * Spring Security calls this during JWT validation.
 */
@Service
public class CustomUserDetailsService implements UserDetailsService {

     private final UserRepository userRepository;

     public CustomUserDetailsService(UserRepository userRepository) {
          this.userRepository = userRepository;
     }

     @Override
     public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
          User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));

          // Build Spring Security UserDetails from our User entity
          return org.springframework.security.core.userdetails.User
                    .withUsername(user.getEmail())
                    .password(user.getPassword())
                    .roles("USER")
                    .build();
     }
}