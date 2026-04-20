package com.studyplanner.studyplanner.controller;

import com.studyplanner.studyplanner.model.Revision;
import com.studyplanner.studyplanner.service.RevisionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/revisions")
@CrossOrigin(origins = "*")
public class RevisionController {

     private final RevisionService revisionService;

     public RevisionController(RevisionService revisionService) {
          this.revisionService = revisionService;
     }

     @GetMapping
     public List<Revision> getAllRevisions(@RequestParam Long userId) {
          return revisionService.getAllRevisions(userId);
     }

     @GetMapping("/{id}")
     public ResponseEntity<Revision> getRevisionById(@PathVariable Long id, @RequestParam Long userId) {
          return ResponseEntity.ok(revisionService.getRevisionById(userId, id));
     }

     @PostMapping
     public Revision createRevision(@RequestParam Long userId, @RequestBody Revision revision) {
          return revisionService.createRevision(userId, revision);
     }

     @PutMapping("/{id}")
     public ResponseEntity<Revision> updateRevision(
               @PathVariable Long id,
               @RequestParam Long userId,
               @RequestBody Revision revision) {
          Revision updatedRevision = revisionService.updateRevision(userId, id, revision);
          return ResponseEntity.ok(updatedRevision);
     }

     @DeleteMapping("/{id}")
     public ResponseEntity<String> deleteRevision(@PathVariable Long id, @RequestParam Long userId) {
          revisionService.deleteRevision(userId, id);
          return ResponseEntity.ok("Revision deleted successfully.");
     }
}