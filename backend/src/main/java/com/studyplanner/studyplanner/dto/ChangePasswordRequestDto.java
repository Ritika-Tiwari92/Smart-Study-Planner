package com.studyplanner.studyplanner.dto;

public class ChangePasswordRequestDto {

     private String currentPassword;
     private String newPassword;
     private String confirmNewPassword;

     public ChangePasswordRequestDto() {
     }

     public String getCurrentPassword() {
          return currentPassword;
     }

     public void setCurrentPassword(String currentPassword) {
          this.currentPassword = currentPassword;
     }

     public String getNewPassword() {
          return newPassword;
     }

     public void setNewPassword(String newPassword) {
          this.newPassword = newPassword;
     }

     public String getConfirmNewPassword() {
          return confirmNewPassword;
     }

     public void setConfirmNewPassword(String confirmNewPassword) {
          this.confirmNewPassword = confirmNewPassword;
     }
}