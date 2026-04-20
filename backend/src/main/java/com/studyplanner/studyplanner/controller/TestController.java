package com.studyplanner.studyplanner.controller;

import com.studyplanner.studyplanner.model.Test;
import com.studyplanner.studyplanner.service.TestService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tests")
@CrossOrigin(origins = "*")
public class TestController {

     private final TestService testService;

     public TestController(TestService testService) {
          this.testService = testService;
     }

     @GetMapping
     public List<Test> getAllTests(@RequestParam Long userId) {
          return testService.getAllTests(userId);
     }

     @GetMapping("/{id}")
     public Test getTestById(@PathVariable Long id, @RequestParam Long userId) {
          return testService.getTestById(userId, id);
     }

     @PostMapping
     public Test createTest(@RequestParam Long userId, @RequestBody Test test) {
          return testService.createTest(userId, test);
     }

     @PutMapping("/{id}")
     public Test updateTest(@PathVariable Long id, @RequestParam Long userId, @RequestBody Test test) {
          return testService.updateTest(userId, id, test);
     }

     @DeleteMapping("/{id}")
     public void deleteTest(@PathVariable Long id, @RequestParam Long userId) {
          testService.deleteTest(userId, id);
     }
}