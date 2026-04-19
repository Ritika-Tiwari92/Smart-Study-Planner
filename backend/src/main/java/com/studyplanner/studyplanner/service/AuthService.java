package com.studyplanner.studyplanner.service;

import com.studyplanner.studyplanner.dto.AuthResponseDto;
import com.studyplanner.studyplanner.dto.LoginRequestDto;
import com.studyplanner.studyplanner.dto.RegisterRequestDto;
import com.studyplanner.studyplanner.model.User;
import com.studyplanner.studyplanner.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

     private final UserRepository userRepository;

     public AuthService(UserRepository userRepository) {
          this.userRepository = userRepository;
     }

     public AuthResponseDto registerUser(RegisterRequestDto request) {
          if (request.getFullName() == null || request.getFullName().trim().isEmpty()
                    || request.getEmail() == null || request.getEmail().trim().isEmpty()
                    || request.getPassword() == null || request.getPassword().trim().isEmpty()
                    || request.getCourse() == null || request.getCourse().trim().isEmpty()
                    || request.getCollege() == null || request.getCollege().trim().isEmpty()) {
               throw new IllegalArgumentException("All fields are required.");
          }

          if (request.getPassword().trim().length() < 6) {
               throw new IllegalArgumentException("Password must be at least 6 characters long.");
          }

          if (userRepository.existsByEmail(request.getEmail().trim())) {
               throw new IllegalArgumentException("Email already registered.");
          }

          User user = new User();
          user.setFullName(request.getFullName().trim());
          user.setEmail(request.getEmail().trim());
          user.setPassword(request.getPassword().trim());
          user.setCourse(request.getCourse().trim());
          user.setCollege(request.getCollege().trim());

          User savedUser = userRepository.save(user);

          return new AuthResponseDto(
                    savedUser.getId(),
                    savedUser.getFullName(),
                    savedUser.getEmail(),
                    savedUser.getCourse(),
                    savedUser.getCollege(),
                    "Account created successfully.");
     }

     public AuthResponseDto loginUser(LoginRequestDto request) {
          if (request.getEmail() == null || request.getEmail().trim().isEmpty()
                    || request.getPassword() == null || request.getPassword().trim().isEmpty()) {
               throw new IllegalArgumentException("Email and password are required.");
          }

          User user = userRepository.findByEmail(request.getEmail().trim())
                    .orElseThrow(() -> new IllegalArgumentException("No account found with this email."));

          if (!user.getPassword().equals(request.getPassword().trim())) {
               throw new IllegalArgumentException("Invalid email or password.");
          }

          return new AuthResponseDto(
                    user.getId(),
                    user.getFullName(),
                    user.getEmail(),
                    user.getCourse(),
                    user.getCollege(),
                    "Login successful.");
     }
}