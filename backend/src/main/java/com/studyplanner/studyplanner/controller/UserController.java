package com.studyplanner.studyplanner.controller;

import com.studyplanner.studyplanner.dto.LoginRequest;
import com.studyplanner.studyplanner.model.User;
import com.studyplanner.studyplanner.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@CrossOrigin("*")
public class UserController {

     @Autowired
     private UserService userService;

     @PostMapping("/register")
     public Object registerUser(@RequestBody User user) {
          try {
               return userService.registerUser(user);
          } catch (RuntimeException e) {
               return e.getMessage();
          }
     }

     @PostMapping("/login")
     public Object loginUser(@RequestBody LoginRequest loginRequest) {
          try {
               return userService.loginUser(loginRequest.getEmail(), loginRequest.getPassword());
          } catch (RuntimeException e) {
               return e.getMessage();
          }
     }

     @GetMapping
     public List<User> getAllUsers() {
          return userService.getAllUsers();
     }
}