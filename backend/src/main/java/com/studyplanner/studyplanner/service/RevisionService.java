package com.studyplanner.studyplanner.service;

import com.studyplanner.studyplanner.model.Revision;
import com.studyplanner.studyplanner.repository.RevisionRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class RevisionService {

     private final RevisionRepository revisionRepository;

     public RevisionService(RevisionRepository revisionRepository) {
          this.revisionRepository = revisionRepository;
     }

     public List<Revision> getAllRevisions() {
          return revisionRepository.findAll();
     }

     public Optional<Revision> getRevisionById(Long id) {
          return revisionRepository.findById(id);
     }

     public Revision createRevision(Revision revision) {
          return revisionRepository.save(revision);
     }

     public Revision updateRevision(Long id, Revision updatedRevision) {
          Revision existingRevision = revisionRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Revision not found with id: " + id));

          existingRevision.setTitle(updatedRevision.getTitle());
          existingRevision.setSubject(updatedRevision.getSubject());
          existingRevision.setPriority(updatedRevision.getPriority());
          existingRevision.setRevisionDate(updatedRevision.getRevisionDate());
          existingRevision.setStatus(updatedRevision.getStatus());
          existingRevision.setDescription(updatedRevision.getDescription());

          return revisionRepository.save(existingRevision);
     }

     public void deleteRevision(Long id) {
          revisionRepository.deleteById(id);
     }
}