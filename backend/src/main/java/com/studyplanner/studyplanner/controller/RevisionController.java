package com.studyplanner.studyplanner.controller;

import com.studyplanner.studyplanner.model.Revision;
import com.studyplanner.studyplanner.service.RevisionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/revisions")
public class RevisionController {

     private final RevisionService revisionService;

     public RevisionController(RevisionService revisionService) {
          this.revisionService = revisionService;
     }

     @GetMapping
     public List<Revision> getAllRevisions() {
          return revisionService.getAllRevisions();
     }

     @GetMapping("/{id}")
     public ResponseEntity<Revision> getRevisionById(@PathVariable Long id) {
          Optional<Revision> revision = revisionService.getRevisionById(id);

          if (revision.isPresent()) {
               return ResponseEntity.ok(revision.get());
          }

          return ResponseEntity.notFound().build();
     }

     @PostMapping
     public Revision createRevision(@RequestBody Revision revision) {
          return revisionService.createRevision(revision);
     }

     @PutMapping("/{id}")
     public ResponseEntity<Revision> updateRevision(@PathVariable Long id, @RequestBody Revision revision) {
          Optional<Revision> existingRevision = revisionService.getRevisionById(id);

          if (existingRevision.isEmpty()) {
               return ResponseEntity.notFound().build();
          }

          Revision updatedRevision = revisionService.updateRevision(id, revision);
          return ResponseEntity.ok(updatedRevision);
     }

     @DeleteMapping("/{id}")
     public ResponseEntity<String> deleteRevision(@PathVariable Long id) {
          Optional<Revision> existingRevision = revisionService.getRevisionById(id);

          if (existingRevision.isEmpty()) {
               return ResponseEntity.notFound().build();
          }

          revisionService.deleteRevision(id);
          return ResponseEntity.ok("Revision deleted successfully.");
     }
}