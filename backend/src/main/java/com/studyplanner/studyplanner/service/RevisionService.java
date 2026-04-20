package com.studyplanner.studyplanner.service;

import com.studyplanner.studyplanner.exception.ResourceNotFoundException;
import com.studyplanner.studyplanner.model.Revision;
import com.studyplanner.studyplanner.model.User;
import com.studyplanner.studyplanner.repository.RevisionRepository;
import com.studyplanner.studyplanner.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RevisionService {

     private final RevisionRepository revisionRepository;
     private final UserRepository userRepository;

     public RevisionService(RevisionRepository revisionRepository, UserRepository userRepository) {
          this.revisionRepository = revisionRepository;
          this.userRepository = userRepository;
     }

     public List<Revision> getAllRevisions(Long userId) {
          return revisionRepository.findByUserId(userId);
     }

     public Revision getRevisionById(Long userId, Long id) {
          return revisionRepository.findByIdAndUserId(id, userId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                              "Revision not found with id: " + id + " for userId: " + userId));
     }

     public Revision createRevision(Long userId, Revision revision) {
          User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

          revision.setUser(user);
          return revisionRepository.save(revision);
     }

     public Revision updateRevision(Long userId, Long id, Revision updatedRevision) {
          Revision existingRevision = revisionRepository.findByIdAndUserId(id, userId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                              "Revision not found with id: " + id + " for userId: " + userId));

          existingRevision.setTitle(updatedRevision.getTitle());
          existingRevision.setSubject(updatedRevision.getSubject());
          existingRevision.setPriority(updatedRevision.getPriority());
          existingRevision.setRevisionDate(updatedRevision.getRevisionDate());
          existingRevision.setStatus(updatedRevision.getStatus());
          existingRevision.setDescription(updatedRevision.getDescription());

          return revisionRepository.save(existingRevision);
     }

     public void deleteRevision(Long userId, Long id) {
          Revision existingRevision = revisionRepository.findByIdAndUserId(id, userId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                              "Revision not found with id: " + id + " for userId: " + userId));

          revisionRepository.delete(existingRevision);
     }
}