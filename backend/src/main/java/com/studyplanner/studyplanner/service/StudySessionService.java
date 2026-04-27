package com.studyplanner.studyplanner.service;

import com.studyplanner.studyplanner.model.*;
import com.studyplanner.studyplanner.model.StudySession.Status;
import com.studyplanner.studyplanner.repository.*;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Service
public class StudySessionService {

     private final StudySessionRepository studySessionRepository;
     private final DailyActivityRepository dailyActivityRepository;
     private final UserRepository userRepository;
     private final SubjectRepository subjectRepository;
     private final StudyVideoRepository studyVideoRepository;
     private final BadgeService badgeService;

     public StudySessionService(
               StudySessionRepository studySessionRepository,
               DailyActivityRepository dailyActivityRepository,
               UserRepository userRepository,
               SubjectRepository subjectRepository,
               StudyVideoRepository studyVideoRepository,
               BadgeService badgeService) {
          this.studySessionRepository = studySessionRepository;
          this.dailyActivityRepository = dailyActivityRepository;
          this.userRepository = userRepository;
          this.subjectRepository = subjectRepository;
          this.studyVideoRepository = studyVideoRepository;
          this.badgeService = badgeService;
     }

     // ── Get user from JWT email ──────────────────
     private User getUser(String email) {
          return userRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("User not found."));
     }

     // ── START session ────────────────────────────
     public StudySession startSession(String email, Long subjectId,
               Long videoId, Integer focusSeconds,
               Integer breakSeconds) {
          User user = getUser(email);

          Subject subject = subjectRepository.findByIdAndUserId(subjectId, user.getId())
                    .orElseThrow(() -> new IllegalArgumentException(
                              "Subject not found or does not belong to you."));

          Optional<StudySession> existing = studySessionRepository
                    .findByUserIdAndStatusIn(user.getId(),
                              List.of(Status.ACTIVE, Status.PAUSED));

          if (existing.isPresent()) {
               throw new IllegalArgumentException(
                         "You already have an active session. " +
                                   "Please complete or cancel it before starting a new one.");
          }

          StudySession session = new StudySession();
          session.setUser(user);
          session.setSubject(subject);
          session.setFocusSeconds(focusSeconds != null && focusSeconds > 0
                    ? focusSeconds
                    : 1500);
          session.setBreakSeconds(breakSeconds != null && breakSeconds > 0
                    ? breakSeconds
                    : 300);
          session.setStatus(Status.ACTIVE);
          session.setStartTime(LocalDateTime.now());

          if (videoId != null) {
               studyVideoRepository.findByIdAndSubjectUserId(videoId, user.getId())
                         .ifPresent(session::setVideo);
          }

          return studySessionRepository.save(session);
     }

     // ── PAUSE session ────────────────────────────
     public StudySession pauseSession(String email, Long sessionId) {
          User user = getUser(email);

          StudySession session = studySessionRepository
                    .findByIdAndUserId(sessionId, user.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Session not found."));

          if (session.getStatus() != Status.ACTIVE) {
               throw new IllegalArgumentException("Only ACTIVE sessions can be paused.");
          }

          session.setStatus(Status.PAUSED);
          return studySessionRepository.save(session);
     }

     // ── RESUME session ───────────────────────────
     public StudySession resumeSession(String email, Long sessionId) {
          User user = getUser(email);

          StudySession session = studySessionRepository
                    .findByIdAndUserId(sessionId, user.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Session not found."));

          if (session.getStatus() != Status.PAUSED) {
               throw new IllegalArgumentException("Only PAUSED sessions can be resumed.");
          }

          session.setStatus(Status.ACTIVE);
          return studySessionRepository.save(session);
     }

     // ── COMPLETE session ─────────────────────────
     public StudySession completeSession(String email, Long sessionId) {
          User user = getUser(email);

          StudySession session = studySessionRepository
                    .findByIdAndUserId(sessionId, user.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Session not found."));

          if (session.getStatus() == Status.COMPLETED) {
               throw new IllegalArgumentException("Session is already completed.");
          }

          if (session.getStatus() == Status.CANCELLED) {
               throw new IllegalArgumentException("Cancelled sessions cannot be completed.");
          }

          session.setStatus(Status.COMPLETED);
          session.setEndTime(LocalDateTime.now());
          StudySession saved = studySessionRepository.save(session);

          // Update daily activity
          updateDailyActivity(user, saved);

          // Check and unlock badges
          badgeService.checkAndUnlockBadges(user.getEmail());

          return saved;
     }

     // ── CANCEL session ───────────────────────────
     public StudySession cancelSession(String email, Long sessionId) {
          User user = getUser(email);

          StudySession session = studySessionRepository
                    .findByIdAndUserId(sessionId, user.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Session not found."));

          if (session.getStatus() == Status.COMPLETED) {
               throw new IllegalArgumentException("Completed sessions cannot be cancelled.");
          }

          if (session.getStatus() == Status.CANCELLED) {
               throw new IllegalArgumentException("Session is already cancelled.");
          }

          session.setStatus(Status.CANCELLED);
          session.setEndTime(LocalDateTime.now());
          return studySessionRepository.save(session);
     }

     // ── GET today's sessions ─────────────────────
     public List<StudySession> getTodaySessions(String email) {
          User user = getUser(email);
          LocalDateTime startOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MIDNIGHT);
          LocalDateTime endOfDay = startOfDay.plusDays(1);
          return studySessionRepository.findByUserIdAndStartTimeBetween(
                    user.getId(), startOfDay, endOfDay);
     }

     // ── GET weekly sessions ──────────────────────
     public List<StudySession> getWeeklySessions(String email) {
          User user = getUser(email);
          LocalDateTime startOfWeek = LocalDateTime.of(
                    LocalDate.now().minusDays(6), LocalTime.MIDNIGHT);
          LocalDateTime now = LocalDateTime.now();
          return studySessionRepository.findByUserIdAndStartTimeBetween(
                    user.getId(), startOfWeek, now);
     }

     // ── UPDATE daily activity after session ──────
     private void updateDailyActivity(User user, StudySession session) {
          LocalDate today = LocalDate.now();

          DailyActivity activity = dailyActivityRepository
                    .findByUserIdAndActivityDate(user.getId(), today)
                    .orElseGet(() -> {
                         DailyActivity da = new DailyActivity();
                         da.setUser(user);
                         da.setActivityDate(today);
                         da.setTargetVideos(3);
                         return da;
                    });

          int currentFocus = activity.getFocusSeconds() != null
                    ? activity.getFocusSeconds()
                    : 0;
          activity.setFocusSeconds(currentFocus + session.getFocusSeconds());

          int currentSessions = activity.getSessionsCompleted() != null
                    ? activity.getSessionsCompleted()
                    : 0;
          activity.setSessionsCompleted(currentSessions + 1);

          activity.setActiveDay(true);
          dailyActivityRepository.save(activity);
     }

     // ── GET user object (used by other services) ─
     public User getUserByEmail(String email) {
          return getUser(email);
     }
}