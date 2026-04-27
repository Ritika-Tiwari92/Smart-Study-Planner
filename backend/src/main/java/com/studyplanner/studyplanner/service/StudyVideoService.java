package com.studyplanner.studyplanner.service;

import com.studyplanner.studyplanner.dto.StudyVideoDto;
import com.studyplanner.studyplanner.model.*;
import com.studyplanner.studyplanner.repository.*;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class StudyVideoService {

     private final StudyVideoRepository studyVideoRepository;
     private final VideoProgressRepository videoProgressRepository;
     private final UserRepository userRepository;
     private final SubjectRepository subjectRepository;
     private final DailyActivityRepository dailyActivityRepository;
     private final BadgeService badgeService;

     public StudyVideoService(
               StudyVideoRepository studyVideoRepository,
               VideoProgressRepository videoProgressRepository,
               UserRepository userRepository,
               SubjectRepository subjectRepository,
               DailyActivityRepository dailyActivityRepository,
               BadgeService badgeService) {
          this.studyVideoRepository = studyVideoRepository;
          this.videoProgressRepository = videoProgressRepository;
          this.userRepository = userRepository;
          this.subjectRepository = subjectRepository;
          this.dailyActivityRepository = dailyActivityRepository;
          this.badgeService = badgeService;
     }

     // ── Get user from email (from JWT) ──────────
     private User getUser(String email) {
          return userRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("User not found."));
     }

     // ── Map entity to DTO with user-specific progress ──
     private StudyVideoDto toDto(StudyVideo video, Long userId) {
          StudyVideoDto dto = new StudyVideoDto();
          dto.setId(video.getId());
          dto.setSubjectId(video.getSubject().getId());
          dto.setSubjectName(video.getSubject().getSubjectName());
          dto.setTitle(video.getTitle());
          dto.setVideoUrl(video.getVideoUrl());
          dto.setTag(video.getTag());
          dto.setDurationSeconds(video.getDurationSeconds());
          dto.setCreatedAt(video.getCreatedAt());

          Optional<VideoProgress> progress = videoProgressRepository.findByUserIdAndVideoId(userId, video.getId());

          if (progress.isPresent()) {
               dto.setCompleted(progress.get().isCompleted());
               dto.setCompletedAt(progress.get().getCompletedAt());
               dto.setWatchedSeconds(progress.get().getWatchedSeconds());
          } else {
               dto.setCompleted(false);
               dto.setWatchedSeconds(0);
          }

          return dto;
     }

     // ── Add a new video under a subject ─────────
     public StudyVideoDto addVideo(String email, Long subjectId, String title,
               String videoUrl, String tag, Integer durationSeconds) {
          User user = getUser(email);

          Subject subject = subjectRepository.findByIdAndUserId(subjectId, user.getId())
                    .orElseThrow(() -> new IllegalArgumentException(
                              "Subject not found or does not belong to you."));

          if (title == null || title.trim().isEmpty()) {
               throw new IllegalArgumentException("Video title is required.");
          }

          StudyVideo video = new StudyVideo();
          video.setSubject(subject);
          video.setTitle(title.trim());
          video.setVideoUrl(videoUrl != null ? videoUrl.trim() : null);
          video.setTag(tag != null ? tag.trim() : null);
          video.setDurationSeconds(durationSeconds != null && durationSeconds > 0
                    ? durationSeconds
                    : 0);

          StudyVideo saved = studyVideoRepository.save(video);
          return toDto(saved, user.getId());
     }

     // ── Get all videos (with user progress) ─────
     public List<StudyVideoDto> getAllVideos(String email) {
          User user = getUser(email);

          List<StudyVideo> videos = studyVideoRepository.findAll()
                    .stream()
                    .filter(v -> v.getSubject().getUser().getId().equals(user.getId()))
                    .collect(Collectors.toList());

          return videos.stream()
                    .map(v -> toDto(v, user.getId()))
                    .collect(Collectors.toList());
     }

     // ── Get videos for a specific subject ───────
     public List<StudyVideoDto> getVideosBySubject(String email, Long subjectId) {
          User user = getUser(email);

          subjectRepository.findByIdAndUserId(subjectId, user.getId())
                    .orElseThrow(() -> new IllegalArgumentException(
                              "Subject not found or does not belong to you."));

          List<StudyVideo> videos = studyVideoRepository.findBySubjectIdAndSubjectUserId(subjectId, user.getId());

          return videos.stream()
                    .map(v -> toDto(v, user.getId()))
                    .collect(Collectors.toList());
     }

     // ── Mark video as completed (user-specific) ──
     public StudyVideoDto markVideoCompleted(String email, Long videoId) {
          User user = getUser(email);

          StudyVideo video = studyVideoRepository
                    .findByIdAndSubjectUserId(videoId, user.getId())
                    .orElseThrow(() -> new IllegalArgumentException(
                              "Video not found or does not belong to your subjects."));

          VideoProgress progress = videoProgressRepository
                    .findByUserIdAndVideoId(user.getId(), videoId)
                    .orElseGet(() -> {
                         VideoProgress vp = new VideoProgress();
                         vp.setUser(user);
                         vp.setVideo(video);
                         return vp;
                    });

          if (progress.isCompleted()) {
               return toDto(video, user.getId());
          }

          progress.setCompleted(true);
          progress.setCompletedAt(LocalDateTime.now());
          progress.setLastWatchedAt(LocalDateTime.now());
          videoProgressRepository.save(progress);

          // Update daily activity
          updateDailyActivityForVideo(user);

          // Check and unlock badges
          badgeService.checkAndUnlockBadges(user.getEmail());

          return toDto(video, user.getId());
     }

     // ── Update daily activity when video completed ──
     private void updateDailyActivityForVideo(User user) {
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

          int current = activity.getVideosCompleted() != null
                    ? activity.getVideosCompleted()
                    : 0;
          activity.setVideosCompleted(current + 1);
          activity.setActiveDay(true);
          dailyActivityRepository.save(activity);
     }

     // ── Get total completed video count for user ─
     public long getCompletedVideoCount(Long userId) {
          return videoProgressRepository.countByUserIdAndCompletedTrue(userId);
     }

     // ── Get completed videos for a subject ──────
     public long getCompletedVideoCountForSubject(Long userId, Long subjectId) {
          return videoProgressRepository
                    .findByUserIdAndCompletedTrueAndVideoSubjectId(userId, subjectId)
                    .size();
     }

     // ── Get total video count for a subject ─────
     public long getTotalVideoCountForSubject(Long subjectId) {
          return studyVideoRepository.countBySubjectId(subjectId);
     }
}