package com.studyplanner.studyplanner.service;

import com.studyplanner.studyplanner.model.User;
import com.studyplanner.studyplanner.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

     @Autowired
     private UserRepository userRepository;

     public User registerUser(User user) {
          if (userRepository.existsByEmail(user.getEmail())) {
               throw new RuntimeException("Email already exists");
          }
          return userRepository.save(user);
     }

     public List<User> getAllUsers() {
          return userRepository.findAll();
     }

     public Optional<User> getUserByEmail(String email) {
          return userRepository.findByEmail(email);
     }

     public User loginUser(String email, String password) {
          Optional<User> existingUser = userRepository.findByEmail(email);

          if (existingUser.isPresent()) {
               User user = existingUser.get();

               if (user.getPassword().equals(password)) {
                    return user;
               } else {
                    throw new RuntimeException("Invalid password");
               }
          } else {
               throw new RuntimeException("User not found");
          }
     }

}