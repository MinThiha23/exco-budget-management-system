// API Configuration
// Change this to your InfinityFree domain when deploying
export const API_BASE_URL = 'https://exco.kesug.com/api';  // Production (InfinityFree)
// export const API_BASE_URL = 'http://localhost:8000';     // Development (Local) - uncomment for local testing

export const API_ENDPOINTS = {
  AUTH: `${API_BASE_URL}/auth.php`,
  USERS: `${API_BASE_URL}/debug_users.php`,
  PROGRAMS: `${API_BASE_URL}/programs.php`,
  MESSAGING: `${API_BASE_URL}/messaging.php`,
  NOTIFICATIONS: `${API_BASE_URL}/notifications.php`,
  BUDGET: `${API_BASE_URL}/budget.php`,
  REPORTS: `${API_BASE_URL}/reports.php`,
  UPLOAD: `${API_BASE_URL}/upload.php`,
  UPLOAD_PROFILE: `${API_BASE_URL}/upload_profile_photo.php`,
  DOWNLOAD: `${API_BASE_URL}/download.php`,
  EXCO_USERS: `${API_BASE_URL}/exco_users.php`,
  DASHBOARD: `${API_BASE_URL}/dashboard.php`,
  ACTIVITY: `${API_BASE_URL}/activity.php`,
  APPROVALS: `${API_BASE_URL}/approvals.php`,
  UPDATE_USER: `${API_BASE_URL}/update_user.php`,
  CHANGE_PASSWORD: `${API_BASE_URL}/change_password.php`,
  UPDATE_EMAIL: `${API_BASE_URL}/update_email.php`,
  FPDF_GOVERNMENT: `${API_BASE_URL}/fpdf_government_report.php`,
} as const;
