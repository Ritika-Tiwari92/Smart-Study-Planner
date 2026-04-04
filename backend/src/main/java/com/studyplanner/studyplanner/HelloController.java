package com.studyplanner.studyplanner;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HelloController {

     @GetMapping("/")
     public String sayHello() {
          return "Mubarak ho! Aapka Smart Study Planner Backend chal raha hai!";
     }
}
