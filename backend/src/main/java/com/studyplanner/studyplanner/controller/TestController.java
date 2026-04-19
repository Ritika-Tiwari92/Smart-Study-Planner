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
     public List<Test> getAllTests() {
          return testService.getAllTests();
     }

     @GetMapping("/{id}")
     public Test getTestById(@PathVariable Long id) {
          return testService.getTestById(id);
     }

     @PostMapping
     public Test createTest(@RequestBody Test test) {
          return testService.createTest(test);
     }

     @PutMapping("/{id}")
     public Test updateTest(@PathVariable Long id, @RequestBody Test test) {
          return testService.updateTest(id, test);
     }

     @DeleteMapping("/{id}")
     public void deleteTest(@PathVariable Long id) {
          testService.deleteTest(id);
     }
}