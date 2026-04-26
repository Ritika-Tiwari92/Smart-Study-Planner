package com.studyplanner.studyplanner.controller;

import com.studyplanner.studyplanner.service.SyllabusService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/syllabus")
@CrossOrigin("*")
public class SyllabusController {

     private final SyllabusService syllabusService;

     public SyllabusController(SyllabusService syllabusService) {
          this.syllabusService = syllabusService;
     }

     @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
     public ResponseEntity<?> uploadSyllabus(
               @RequestParam("file") MultipartFile file,
               @RequestParam(value = "userId", required = false) Long userId) {

          Map<String, Object> result = syllabusService.processSyllabusFile(file, userId);
          return ResponseEntity.ok(result);
     }

     @GetMapping("/health")
     public ResponseEntity<?> health() {
          return ResponseEntity.ok(Map.of(
                    "message", "Syllabus API is working"));
     }
}