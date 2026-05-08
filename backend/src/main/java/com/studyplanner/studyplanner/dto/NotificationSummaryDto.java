package com.studyplanner.studyplanner.dto;

public class NotificationSummaryDto {

     private long totalNotifications;
     private long unreadCount;
     private long readCount;

     public NotificationSummaryDto() {
     }

     public NotificationSummaryDto(long totalNotifications, long unreadCount) {
          this.totalNotifications = totalNotifications;
          this.unreadCount = unreadCount;
          this.readCount = Math.max(0, totalNotifications - unreadCount);
     }

     public long getTotalNotifications() {
          return totalNotifications;
     }

     public void setTotalNotifications(long totalNotifications) {
          this.totalNotifications = totalNotifications;
     }

     public long getUnreadCount() {
          return unreadCount;
     }

     public void setUnreadCount(long unreadCount) {
          this.unreadCount = unreadCount;
     }

     public long getReadCount() {
          return readCount;
     }

     public void setReadCount(long readCount) {
          this.readCount = readCount;
     }
}