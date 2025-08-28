import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'ms';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation dictionary
const translations = {
  en: {
    // Navigation
    'main_menu': 'Main Menu',
    'dashboard': 'Dashboard',
    'my_programs': 'My Programs',
    'register_program': 'Register Program',
    'my_status': 'My Status',
    'program_management': 'Program Management',
    'program_approval': 'Program Approval',
    'approved_programs': 'Approved Programs',
    'budget_tracking': 'Budget Tracking',
    'financial_reports': 'Financial Reports',
    'exco_users': 'EXCO Users',
    'profile': 'Profile',
    'user_management': 'User Management',
    'status_tracking': 'Status Tracking',
    'messages': 'Messages',
    
    // Common
    'save': 'Save',
    'cancel': 'Cancel',
    'reset': 'Reset',
    'loading': 'Loading...',
    'error': 'Error',
    'success': 'Success',
    'close': 'Close',
    'edit': 'Edit',
    'delete': 'Delete',
    'view': 'View',
    'add': 'Add',
    'submit': 'Submit',
    'back': 'Back',
    'next': 'Next',
    'previous': 'Previous',
    
    // Settings
    'settings': 'Settings',
    'general_settings': 'General Settings',
    'language': 'Language',
    'english': 'English',
    'bahasa_malaysia': 'Bahasa Malaysia',
    'auto_save': 'Auto-save',
    'auto_save_description': 'Automatically save changes while editing',
    'notifications': 'Notifications',
    'appearance': 'Appearance',
    'advanced': 'Advanced',
    'save_changes': 'Save Changes',
    'saving': 'Saving...',
    'reset_to_defaults': 'Reset to Defaults',
    
    // Program Management
    'program_management_system': 'Program Management System',
    'kedah_state_government': 'Kedah State Government',
    'create_program': 'Create Program',
    'edit_program': 'Edit Program',
    'edit_expense': 'Edit Expense',
    'edit_remaining_budget': 'Edit Remaining Budget',
    'query_management': 'Query Management',
    'query_management_subtitle': 'Handle queries from Finance and update program details',
    'active_queries': 'Active Queries',
    'answered_queries': 'Answered Queries',
    'total_programs_with_queries': 'Total Programs with Queries',
    'query_history': 'Query History',
    'program_name': 'Program Name',
    'budget_rm': 'Budget (RM)',
    'queries': 'Queries',
    'answer_query': 'Answer Query',
    'edit_program': 'Edit Program',
    'view_program': 'View Program',
    'view_details': 'View Details',
    'no_active_queries': 'No active queries found',
    'no_query_history': 'No query history found',
    'query_from_finance': 'Query from Finance:',
    'your_answer': 'Your Answer:',
    'enter_answer_placeholder': 'Enter your answer to the query...',
    'submit_answer': 'Submit Answer',
    'query_answered_successfully': 'Query answered successfully!',
    'failed_to_submit_answer': 'Failed to submit answer. Please try again.',
    'timeline': 'Timeline',
    'end_date': 'End Date',
    'submitted_at': 'Submitted At',
    'not_available': 'Not available',
    'all_status': 'All Status',
    'queried_by_finance': 'Queried by Finance',
    'query_answered': 'Query Answered',
    'budget_deducted': 'Budget Deducted',
    'in_progress': 'In Progress',
    'program_title': 'Program Title',
    'program_description': 'Program Description',
    'budget': 'Budget',
    'status': 'Status',
    'created_date': 'Created Date',
    'approved_date': 'Approved Date',
    'rejected_date': 'Rejected Date',
    'approved_by': 'Approved By',
    'rejected_by': 'Rejected By',
    'letter_reference_number': 'Letter Reference Number',
    'objectives': 'Objectives',
    'objectives_optional': 'Objectives (Optional)',
    'kpi': 'KPI',
    'kpi_optional': 'KPI (Optional)',
    'no_objectives_defined': 'No objectives defined',
    'no_kpi_defined': 'No KPI defined',
    
    // Status
    'draft': 'Draft',
    'submitted': 'Under Review',
    'approved': 'Approved',
    'rejected': 'Rejected',
    
    // Finance
    'finance': 'Finance',
    'finance_user': 'Finance User',
    'generate_report': 'Generate Report',
    'rejected_budget': 'Rejected Budget',
    'approved_budget': 'Approved Budget',
    'total_budget_finance': 'Total Budget',
    'total_programs_finance': 'Total Programs',
    
    // Reports
    'report_type': 'Report Type',
    'approved_programs_report': 'Approved Programs',
    'rejected_programs': 'Rejected Programs',
    'all_programs': 'All Programs',
    'date_range': 'Date Range',
    'start_date': 'Start Date',
    'end_date': 'End Date',
    'generate_pdf_report': 'Generate PDF Report',
    'available_reports': 'Available Reports',
    
    // EXCO Users
    'exco_members': 'EXCO Members',
    'exco_user_profile': 'EXCO User Profile',
    'profile_details': 'Profile Details',
    'programs': 'Programs',
    'search_exco': 'Search EXCO members...',
    
    // Notifications
    'notifications_settings': 'Notifications',
    'email_notifications': 'Email Notifications',
    'push_notifications': 'Push Notifications',
    'program_updates': 'Program Updates',
    'system_alerts': 'System Alerts',
    'receive_email_notifications': 'Receive notifications via email',
    'receive_browser_push_notifications': 'Receive browser push notifications',
    'notifications_about_program_status_changes': 'Notifications about program status changes',
    'important_system_maintenance_and_updates': 'Important system maintenance and updates',
    
    // Appearance
    'theme': 'Theme',
    'light': 'Light',
    'dark': 'Dark',
    'auto_system': 'Auto (System)',
    'compact_mode': 'Compact Mode',
    'use_compact_layout_for_better_space_utilization': 'Use compact layout for better space utilization',
    
    // Advanced
    'advanced_settings': 'Advanced Settings',
    'advanced_settings_warning': 'These settings are for advanced users. Changes may affect system performance.',
    
    // Messages
    'program_created_successfully': 'Program created successfully!',
    'program_updated_successfully': 'Program updated successfully!',
    'program_deleted_successfully': 'Program deleted successfully!',
    'program_approved_successfully': 'Program approved successfully!',
    'program_rejected_successfully': 'Program rejected successfully!',
    
    'report_generated_successfully': 'Report generated successfully!',
    'settings_saved_successfully': 'Settings saved successfully!',
    'profile_updated_successfully': 'Profile updated successfully!',
    'password_changed_successfully': 'Password changed successfully!',
    
    // Errors
    'failed_to_create_program': 'Failed to create program. Please try again.',
    'failed_to_update_program': 'Failed to update program. Please try again.',
    'failed_to_delete_program': 'Failed to delete program. Please try again.',
    'failed_to_approve_program': 'Failed to approve program. Please try again.',
    'failed_to_reject_program': 'Failed to reject program. Please try again.',
    
    'failed_to_generate_report': 'Failed to generate report. Please try again.',
    'failed_to_save_settings': 'Failed to save settings. Please try again.',
    'failed_to_update_profile': 'Failed to update profile. Please try again.',
    'failed_to_change_password': 'Failed to change password. Please try again.',
    
    // Queries
    'query_program': 'Query Program',
    'query_message': 'Query Message',
    'query_history': 'Query History',
    'add_query': 'Add Query',
    'query_sent_successfully': 'Query sent successfully!',
    'failed_to_send_query': 'Failed to send query. Please try again.',
    

    
    // Authentication
    'login': 'Login',
    'logout': 'Logout',
    'email': 'Email',
    'password': 'Password',
    'confirm_password': 'Confirm Password',
    'current_password': 'Current Password',
    'new_password': 'New Password',
    'login_successful': 'Login successful!',
    'logout_successful': 'Logout successful!',
    'invalid_credentials': 'Invalid email or password.',
    'passwords_do_not_match': 'Passwords do not match.',
    'password_too_short': 'Password must be at least 6 characters long.',
    
    // PDF Report
    'kedah_state_government_logo': 'KEDAH STATE GOVERNMENT LOGO',
    'sistem_pengurusan_peruntukan_exco': 'SISTEM PENGURUSAN PERUNTUKAN EXCO',
    'program_report': 'Program Report',
    'program_report_description': 'This report contains programs with approved & rejected status',
    'report_period': 'Report Period',
    'programs_for_yab': 'Programs for YAB Dato\'Seri Haji Muhammad Sanusi bin Md Nor, SPMK., AMK.',
    'program_name': 'Program Name',
    'reference': 'Reference',
    'voucher': 'Voucher',
    'eft': 'EFT',
    'overall_summary': 'Overall Summary',
    
    // Dashboard Content
    'good_morning': 'Good Morning',
    'good_afternoon': 'Good Afternoon',
    'good_evening': 'Good Evening',
    'dashboard_summary': 'Here\'s today\'s summary of charity program management activities',
    'total_programs_dashboard': 'Total Programs',
    'approved_programs_dashboard': 'Approved Programs',
    'submitted_programs_dashboard': 'Programs Under Review',
    'total_budget_dashboard': 'Total Budget',
    'from_last_month': 'from last month',
    'allocation': 'Allocation',
    'program_status': 'Program Status',
    'budget_allocation_by_department': 'Budget Allocation by Department',
    'recent_activity': 'Recent Activity',
    'total_allocation': 'Total Allocation',
    
    // Program Status
    'query_answered': 'Query Answered',
    'budget_deducted': 'Budget Deducted',
    'in_progress': 'In Progress',
    'completed': 'Completed',
    'no_recent_activity': 'No recent activity',
    
    // Page Titles and Descriptions
    'program_management_title': 'Program Management',
    'program_management_subtitle': 'Review and manage submitted programs',
    'program_approval_title': 'Program Approval',
    'program_approval_subtitle': 'Review and approve submitted program applications',
    'approved_programs_title': 'Approved Programs',
    'approved_programs_subtitle': 'View all approved program applications',
    'budget_tracking_title': 'Budget Tracking',
    'budget_tracking_subtitle': 'Monitor budget allocation and spending across programs',
    'financial_reports_title': 'Financial Reports',
    'financial_reports_subtitle': 'Generate and download comprehensive financial reports',
    'exco_users_title': 'EXCO Users',
    'exco_users_subtitle': 'EXCO Members',
    'messages_title': 'Messages',
    'messages_subtitle': 'Direct messaging with system users',
    'profile_title': 'Profile',
    'profile_subtitle': 'Manage your account settings and preferences',
    
    // Program Management Content
    'program_queries': 'Program Queries',
    'show_queries': 'Show Queries',
    'search_programs': 'Search programs...',
    'all_status': 'All Status',
          'programs_for_review': 'Programs for Review',
      'no_pending_programs': 'No Pending Programs',
    'all_programs_reviewed': 'All programs have been reviewed',
    
    // Budget Tracking Content
    'budget_summary': 'Budget Summary',
    'approved_programs_budget': 'Approved Programs',
    'pending_programs_budget': 'Pending Programs',
    'rejected_programs_budget': 'Rejected Programs',
    'total_budget_requested': 'Total Budget Requested',
    
    // Financial Reports Content
    'program_report_generation': 'Program Report Generation',
    'date_range_optional': 'Date Range: Optional filter to limit report to specific date range',
    'monthly_budget_trends': 'Monthly Budget Trends',
    'monthly': 'Monthly',
    
    // Messages Content
    'search_conversations': 'Search conversations...',
    'select_conversation': 'Select a conversation',
    'choose_conversation': 'Choose a conversation from the sidebar to start messaging',
    
    // Profile Content
    'profile_information': 'Profile Information',
    'change_password': 'Change Password',
    'profile_photo': 'Profile Photo',
    'upload_profile_photo': 'Upload a new profile photo. The image should be at least 400x400 pixels.',
    'change_photo': 'Change Photo',
    'basic_information': 'Basic Information',
    'full_name': 'Full Name',
    'email_address': 'Email Address',
    'phone_number': 'Phone Number',
    'account_status': 'Account Status',
    'member_since': 'Member Since',
    'update_profile': 'Update Profile',
    
    // Additional missing keys
    'deduct_budget': 'Deduct Budget',
    
    // Additional missing keys for components
    'quarterly': 'Quarterly',
    'yearly': 'Yearly',
    'no_data_available': 'No data available for the selected period',
    'static_report_message': 'This is a static report. Use the "Generate Report" button above to create new reports.',
    'download_report': 'Download Report',
    'no_reports_available': 'No reports available',
    'generate_custom_report': 'Generate Custom Report',
    'recent_approved_programs': 'Recent Approved Programs',
    'generating': 'Generating...',
    
    // EXCO Users
    'loading_exco_users': 'Loading EXCO Users...',
    'exco_users_directory': 'EXCO Users Directory',
    'kedah_state_government_executive_council_members': 'Kedah State Government Executive Council Members',
    'search_exco_members_placeholder': 'Search EXCO members by name, title, role, or department...',
    'no_exco_members_found': 'No EXCO members found matching your search.',
    'no_exco_members_available': 'No EXCO members available.',
    'showing_exco_members': 'Showing {count} of {total} EXCO members',
    
    // Messaging
    'participants': 'participants',
    'type_message_placeholder': 'Type a message...',
    'choose_conversation_message': 'Choose a conversation from the sidebar to start messaging',
    'chat_with_finance_team': 'Chat with Finance Team',
    'new_conversation': 'New Conversation',
    'conversation_title': 'Conversation Title',
    'enter_conversation_title': 'Enter conversation title...',
    'search_finance_team': 'Search Finance Team',
    'search_finance_team_placeholder': 'Search finance team...',
    
    // User Management
    'manage_system_users': 'Manage system users and their roles',
    'total_users': 'Total Users',
    'admins': 'Admins',
    'active_users': 'Active Users',
    'inactive_users': 'Inactive Users',
    'all_roles': 'All Roles',
    'exco_user': 'EXCO User',
    'admin': 'Admin',
    'finance_mmk': 'Finance MMK',
    'users': 'Users',
    'phone': 'Phone',
    'active': 'Active',
    'inactive': 'Inactive',
    'delete_user': 'Delete User',
    'delete_user_confirmation': 'Are you sure you want to delete this user?',
    'user_deleted_successfully': 'User deleted successfully!',
    'failed_to_delete_user': 'Failed to delete user. Please try again.',
    'user_status_updated_successfully': 'User status updated successfully!',
    'failed_to_update_user_status': 'Failed to update user status. Please try again.',
    'user_updated_successfully': 'User updated successfully!',
    'failed_to_update_user': 'Failed to update user. Please try again.',
    'user_added_successfully': 'User added successfully! Password',
    'failed_to_add_user': 'Failed to add user. Please try again.',
    'update_user': 'Update User',
    'add_new_user': 'Add New User',
    'location': 'Location',
    'password_placeholder': 'Minimum 6 characters',
    'password_description': 'This will be the user\'s login password',
    'adding': 'Adding...',
    'finance_officer': 'Finance Officer',
    'super_admin': 'Super Admin',
    
    // Program Detail Modal
    'duration': 'Duration',
    'overall_progress': 'Overall Progress',
    'completion_rate': 'Completion Rate',
    'program_objectives': 'Program Objectives',
    'key_performance_indicators': 'Key Performance Indicators',
    'no_kpis_defined': 'No KPIs defined for this program',
    'no_documents_uploaded': 'No documents uploaded for this program',
    'last_updated': 'Last Updated',
    'finance_information': 'Finance Information',
    'queries_and_answers': 'Queries & Answers',
    'pending': 'Pending',
    'answered': 'Answered',
    'answer_query': 'Answer Query',
    'answer_from': 'Answer from',
    'approval_details': 'Approval Details',
    'voucher_number': 'Voucher Number',
    'not_yet_provided_by_finance': 'Not yet provided by finance',
    'eft_number': 'EFT Number',
    'rejection_details': 'Rejection Details',
    'rejection_reason': 'Rejection Reason',
    'budget_deductions': 'Budget Deductions',
    'by': 'By',
    
    'document_history': 'Document History',
    'no_history_available': 'No history available',
    'current_version': 'Current Version',
    'query': 'Query',
    'from': 'From',
    'your_answer': 'Your Answer',
    'enter_answer_placeholder': 'Enter your answer to this query...',
    'submit_answer': 'Submit Answer',
    
    // Additional Program Detail Keys
    'recipient_name': 'Recipient Name',
    
    // Notifications
    'delete_all': 'Delete all',
    'mark_all_read': 'Mark all read',
    'delete_notification_confirm': 'Are you sure you want to delete this notification?',
    'delete_all_notifications_confirm': 'Are you sure you want to delete all notifications? This action cannot be undone.',
    'delete_all_notifications_question': 'Are you sure you want to delete all notifications?',
    'yes_delete_all': 'Yes, Delete All',
    'just_now': 'Just now',
    'minutes_ago': 'm ago',
    'hours_ago': 'h ago',
    'loading_notifications': 'Loading notifications...',
    'no_notifications': 'No notifications',
    'show_more': 'Show more',
    'show_less': 'Show less',
    'view_all_notifications': 'View all notifications',
    
    // User Program List
    'users_program_list': 'User\'s Program List',
    'show_programs': 'Show Programs',
    'hide_programs': 'Hide Programs',
    'search_user_programs': 'Search user programs...',
    'no_user_programs_match_search': 'No user programs match your search criteria',
    'no_user_programs_available': 'No user programs available',
    'program': 'Program',
    'view_options': 'View Options',
    'exco_users_budgets': 'EXCO Users Budgets',
    'program_list': 'Program List',
    'exco_users_budgets_subtitle': 'Set and manage EXCO user budgets. Click View to see programs for a user.',
    'total_expense': 'Total Expense',
    'remaining_budget': 'Remaining Budget',
    'view_user_programs': 'View User Programs',
  },
  ms: {
    // Navigation
    'main_menu': 'Menu Utama',
    'dashboard': 'Papan Pemuka',
    'my_programs': 'Program Saya',
    'register_program': 'Daftar Program',
    'my_status': 'Status Saya',
    'program_management': 'Pengurusan Program',
    'program_approval': 'Kelulusan Program',
    'approved_programs': 'Program Diluluskan',
    'budget_tracking': 'Penjejakan Bajet',
    'financial_reports': 'Laporan Kewangan',
    'exco_users': 'Pengguna EXCO',
    'profile': 'Profil',
    'user_management': 'Pengurusan Pengguna',
    'status_tracking': 'Penjejakan Status',
    'messages': 'Mesej',
    
    // Common
    'save': 'Simpan',
    'cancel': 'Batal',
    'reset': 'Set Semula',
    'loading': 'Memuat...',
    'error': 'Ralat',
    'success': 'Berjaya',
    'close': 'Tutup',
    'edit': 'Sunting',
    'delete': 'Padam',
    'view': 'Lihat',
    'add': 'Tambah',
    'submit': 'Hantar',
    'back': 'Kembali',
    'next': 'Seterusnya',
    'previous': 'Sebelumnya',
    
    // Settings
    'settings': 'Tetapan',
    'general_settings': 'Tetapan Umum',
    'language': 'Bahasa',
    'english': 'Bahasa Inggeris',
    'bahasa_malaysia': 'Bahasa Malaysia',
    'auto_save': 'Simpan automatik',
    'auto_save_description': 'Simpan perubahan secara automatik semasa menyunting',
    'notifications': 'Pemberitahuan',
    'appearance': 'Penampilan',
    'advanced': 'Lanjutan',
    'save_changes': 'Simpan Perubahan',
    'saving': 'Menyimpan...',
    'reset_to_defaults': 'Set Semula kepada Lalai',
    
    // Program Management
    'program_management_system': 'Sistem Pengurusan Program',
    'kedah_state_government': 'Kerajaan Negeri Kedah',
    'create_program': 'Cipta Program',
    'edit_program': 'Sunting Program',
    'edit_expense': 'Sunting Perbelanjaan',
    'edit_remaining_budget': 'Sunting Baki Bajet',
    'query_management': 'Pengurusan Pertanyaan',
    'query_management_subtitle': 'Urus pertanyaan dari Kewangan dan kemas kini butiran program',
    'active_queries': 'Pertanyaan Aktif',
    'answered_queries': 'Pertanyaan Dijawab',
    'total_programs_with_queries': 'Jumlah Program dengan Pertanyaan',
    'query_history': 'Sejarah Pertanyaan',
    'program_name': 'Nama Program',
    'budget_rm': 'Bajet (RM)',
    'queries': 'Pertanyaan',
    'answer_query': 'Jawab Pertanyaan',
    'edit_program': 'Sunting Program',
    'view_program': 'Lihat Program',
    'view_details': 'Lihat Butiran',
    'no_active_queries': 'Tiada pertanyaan aktif dijumpai',
    'no_query_history': 'Tiada sejarah pertanyaan dijumpai',
    'query_from_finance': 'Pertanyaan dari Kewangan:',
    'your_answer': 'Jawapan Anda:',
    'enter_answer_placeholder': 'Masukkan jawapan anda kepada pertanyaan...',
    'submit_answer': 'Hantar Jawapan',
    'query_answered_successfully': 'Pertanyaan berjaya dijawab!',
    'failed_to_submit_answer': 'Gagal menghantar jawapan. Sila cuba lagi.',
    'timeline': 'Garis Masa',
    'end_date': 'Tarikh Tamat',
    'submitted_at': 'Dihantar Pada',
    'not_available': 'Tidak tersedia',
    'all_status': 'Semua Status',
    'queried_by_finance': 'Ditanya oleh Kewangan',
    'query_answered': 'Pertanyaan Dijawab',
    'budget_deducted': 'Bajet Ditolak',
    'in_progress': 'Sedang Berjalan',
    'program_title': 'Tajuk Program',
    'program_description': 'Penerangan Program',
    'budget': 'Bajet',
    'status': 'Status',
    'created_date': 'Tarikh Dicipta',
    'approved_date': 'Tarikh Diluluskan',
    'rejected_date': 'Tarikh Ditolak',
    'approved_by': 'Diluluskan Oleh',
    'rejected_by': 'Ditolak Oleh',
    'letter_reference_number': 'Nombor Rujukan Surat',
    'objectives': 'Objektif',
    
    // Program Detail Modal
    'duration': 'Tempoh',
    'overall_progress': 'Kemajuan Keseluruhan',
    'completion_rate': 'Kadar Penyempurnaan',
    'program_objectives': 'Objektif Program',
    'key_performance_indicators': 'Petunjuk Prestasi Utama',
    'no_kpis_defined': 'Tiada KPI ditakrifkan untuk program ini',
    'no_documents_uploaded': 'Tiada dokumen dimuat naik untuk program ini',
    'last_updated': 'Terakhir Dikemas Kini',
    'finance_information': 'Maklumat Kewangan',
    'queries_and_answers': 'Soalan & Jawapan',
    'pending': 'Menunggu',
    'answered': 'Dijawab',
    'answer_query': 'Jawab Soalan',
    'answer_from': 'Jawapan dari',
    'approval_details': 'Butiran Kelulusan',
    'voucher_number': 'Nombor Baucer',
    'not_yet_provided_by_finance': 'Belum disediakan oleh kewangan',
    'eft_number': 'Nombor EFT',
    'rejection_details': 'Butiran Penolakan',
    'rejection_reason': 'Sebab Penolakan',
    'budget_deductions': 'Potongan Bajet',
    'by': 'Oleh',
    
    'document_history': 'Sejarah Dokumen',
    'no_history_available': 'Tiada sejarah tersedia',
    'current_version': 'Versi Semasa',
    'query': 'Soalan',
    'from': 'Dari',
    'your_answer': 'Jawapan Anda',
    'enter_answer_placeholder': 'Masukkan jawapan anda untuk soalan ini...',
    'submit_answer': 'Hantar Jawapan',
    
    // Additional Program Detail Keys
    'recipient_name': 'Nama Penerima',
    
    // Notifications
    'delete_all': 'Padam semua',
    'mark_all_read': 'Tandai semua dibaca',
    'delete_notification_confirm': 'Adakah anda pasti mahu memadam notifikasi ini?',
    'delete_all_notifications_confirm': 'Adakah anda pasti mahu memadam semua notifikasi? Tindakan ini tidak boleh dibatalkan.',
    'delete_all_notifications_question': 'Adakah anda pasti mahu memadam semua notifikasi?',
    'yes_delete_all': 'Ya, Padam Semua',
    'just_now': 'Baru sahaja',
    'minutes_ago': 'm yang lalu',
    'hours_ago': 'j yang lalu',
    'loading_notifications': 'Memuat notifikasi...',
    'no_notifications': 'Tiada notifikasi',
    'show_more': 'Tunjuk lagi',
    'show_less': 'Tunjuk kurang',
    'view_all_notifications': 'Lihat semua notifikasi',
    
    // User Program List
    'users_program_list': 'Senarai Program Pengguna',
    'show_programs': 'Tunjuk Program',
    'hide_programs': 'Sembunyi Program',
    'search_user_programs': 'Cari program pengguna...',
    'no_user_programs_match_search': 'Tiada program pengguna yang sepadan dengan kriteria carian anda',
    'no_user_programs_available': 'Tiada program pengguna tersedia',
    'program': 'Program',
    'submitted_date': 'Tarikh Dihantar',
    'view_options': 'Pilihan Paparan',
    'exco_users_budgets': 'Bajet Pengguna EXCO',
    'program_list': 'Senarai Program',
    'exco_users_budgets_subtitle': 'Tetapkan dan urus bajet pengguna EXces. Klik Lihat untuk melihat program untuk pengguna.',
    'total_programs': 'Jumlah Program',
    'pending_programs': 'Program Menunggu',
    'total_expense': 'Jumlah Perbelanjaan',
    'remaining_budget': 'Bajet Baki',
    'view_user_programs': 'Lihat Program Pengguna',
    'objectives_optional': 'Objektif (Pilihan)',
    'kpi': 'KPI',
    'kpi_optional': 'KPI (Pilihan)',
    'no_objectives_defined': 'Tiada objektif ditakrifkan',
    'no_kpi_defined': 'Tiada KPI ditakrifkan',
    
    // Status
    'draft': 'Draf',
    'submitted': 'Dalam Semakan',
    'approved': 'Diluluskan',
    'rejected': 'Ditolak',
    
    // Finance
    'finance': 'Kewangan',
    'finance_user': 'Pengguna Kewangan',
    'generate_report': 'Jana Laporan',
    'rejected_budget': 'Bajet Ditolak',
    'approved_budget': 'Bajet Diluluskan',
    'total_budget_finance': 'Jumlah Bajet',
    'total_programs_finance': 'Jumlah Program',
    
    // Reports
    'report_type': 'Jenis Laporan',
    'approved_programs_report': 'Program Diluluskan',
    'rejected_programs': 'Program Ditolak',
    'all_programs': 'Semua Program',
    'date_range': 'Julat Tarikh',
    'start_date': 'Tarikh Mula',
    'end_date': 'Tarikh Akhir',
    'generate_pdf_report': 'Jana Laporan PDF',
    'available_reports': 'Laporan Tersedia',
    
    // EXCO Users
    'exco_members': 'Ahli EXCO',
    'exco_user_profile': 'Profil Pengguna EXCO',
    'profile_details': 'Butiran Profil',
    'programs': 'Program',
    'search_exco': 'Cari ahli EXCO...',
    
    // Notifications
    'notifications_settings': 'Pemberitahuan',
    'email_notifications': 'Pemberitahuan E-mel',
    'push_notifications': 'Pemberitahuan Tolak',
    'program_updates': 'Kemaskini Program',
    'system_alerts': 'Amaran Sistem',
    'receive_email_notifications': 'Terima pemberitahuan melalui e-mel',
    'receive_browser_push_notifications': 'Terima pemberitahuan tolak pelayar',
    'notifications_about_program_status_changes': 'Pemberitahuan tentang perubahan status program',
    'important_system_maintenance_and_updates': 'Penyelenggaraan dan kemaskini sistem yang penting',
    
    // Appearance
    'theme': 'Tema',
    'light': 'Cahaya',
    'dark': 'Gelap',
    'auto_system': 'Auto (Sistem)',
    'compact_mode': 'Mod Padat',
    'use_compact_layout_for_better_space_utilization': 'Gunakan susun atur padat untuk penggunaan ruang yang lebih baik',
    
    // Advanced
    'advanced_settings': 'Tetapan Lanjutan',
    'advanced_settings_warning': 'Tetapan ini adalah untuk pengguna lanjutan. Perubahan mungkin mempengaruhi prestasi sistem.',
    
    // Messages
    'program_created_successfully': 'Program berjaya dicipta!',
    'program_updated_successfully': 'Program berjaya dikemas kini!',
    'program_deleted_successfully': 'Program berjaya dipadam!',
    'program_approved_successfully': 'Program berjaya diluluskan!',
    'program_rejected_successfully': 'Program berjaya ditolak!',
    
    'report_generated_successfully': 'Laporan berjaya dijana!',
    'settings_saved_successfully': 'Tetapan berjaya disimpan!',
    'profile_updated_successfully': 'Profil berjaya dikemas kini!',
    'password_changed_successfully': 'Kata laluan berjaya ditukar!',
    
    // Errors
    'failed_to_create_program': 'Gagal mencipta program. Sila cuba lagi.',
    'failed_to_update_program': 'Gagal mengemas kini program. Sila cuba lagi.',
    'failed_to_delete_program': 'Gagal memadam program. Sila cuba lagi.',
    'failed_to_approve_program': 'Gagal meluluskan program. Sila cuba lagi.',
    'failed_to_reject_program': 'Gagal menolak program. Sila cuba lagi.',
    
    'failed_to_generate_report': 'Gagal menjana laporan. Sila cuba lagi.',
    'failed_to_save_settings': 'Gagal menyimpan tetapan. Sila cuba lagi.',
    'failed_to_update_profile': 'Gagal mengemas kini profil. Sila cuba lagi.',
    'failed_to_change_password': 'Gagal menukar kata laluan. Sila cuba lagi.',
    
    // Queries
    'query_program': 'Soal Program',
    'query_message': 'Mesej Soalan',
    'query_history': 'Sejarah Soalan',
    'add_query': 'Tambah Soalan',
    'query_sent_successfully': 'Soalan berjaya dihantar!',
    'failed_to_send_query': 'Gagal menghantar soalan. Sila cuba lagi.',
    'no_queries': 'Tiada soalan dijumpai',
    

    
    // Authentication
    'login': 'Log Masuk',
    'logout': 'Log Keluar',
    'email': 'E-mel',
    'password': 'Kata Laluan',
    'confirm_password': 'Sahkan Kata Laluan',
    'current_password': 'Kata Laluan Semasa',
    'new_password': 'Kata Laluan Baharu',
    'login_successful': 'Log masuk berjaya!',
    'logout_successful': 'Log keluar berjaya!',
    'invalid_credentials': 'E-mel atau kata laluan tidak sah.',
    'passwords_do_not_match': 'Kata laluan tidak sepadan.',
    'password_too_short': 'Kata laluan mesti sekurang-kurangnya 6 aksara.',
    
    // PDF Report
    'kedah_state_government_logo': 'LOGO KERAJAAN NEGERI KEDAH',
    'sistem_pengurusan_peruntukan_exco': 'SISTEM PENGURUSAN PERUNTUKAN EXCO',
    'program_report': 'Laporan Program',
    'program_report_description': 'Laporan ini mengandungi program dengan status diluluskan & ditolak',
    'report_period': 'Tempoh Laporan',
    'programs_for_yab': 'Program untuk YAB Dato\'Seri Haji Muhammad Sanusi bin Md Nor, SPMK., AMK.',
    'program_name': 'Nama Program',
    'reference': 'Rujukan',
    'voucher': 'Baucer',
    'eft': 'EFT',
    'overall_summary': 'Ringkasan Keseluruhan',
    
    // Dashboard Content
    'good_morning': 'Selamat Pagi',
    'good_afternoon': 'Selamat Petang',
    'good_evening': 'Selamat Malam',
    'dashboard_summary': 'Berikut adalah ringkasan aktiviti pengurusan program amal hari ini',
    'total_programs_dashboard': 'Jumlah Program',
    'approved_programs_dashboard': 'Program Diluluskan',
    'submitted_programs_dashboard': 'Program Dalam Semakan',
    'total_budget_dashboard': 'Jumlah Bajet',
    'from_last_month': 'dari bulan lepas',
    'allocation': 'Peruntukan',
    'program_status': 'Status Program',
    'budget_allocation_by_department': 'Peruntukan Bajet mengikut Jabatan',
    'recent_activity': 'Aktiviti Terkini',
    'total_allocation': 'Jumlah Peruntukan',
    
    // Program Status
    'query_answered': 'Soalan Dijawab',
    'budget_deducted': 'Bajet Ditolak',
    'in_progress': 'Dalam Proses',
    'completed': 'Selesai',
    'no_recent_activity': 'Tiada aktiviti terkini',
    
    // Page Titles and Descriptions
    'program_management_title': 'Pengurusan Program',
    'program_management_subtitle': 'Semak dan urus program yang dihantar',
    'program_approval_title': 'Kelulusan Program',
    'program_approval_subtitle': 'Semak dan lulus permohonan program yang dihantar',
    'approved_programs_title': 'Program Diluluskan',
    'approved_programs_subtitle': 'Lihat semua permohonan program yang diluluskan',
    'budget_tracking_title': 'Penjejakan Bajet',
    'budget_tracking_subtitle': 'Pantau peruntukan dan perbelanjaan bajet merentasi program',
    'financial_reports_title': 'Laporan Kewangan',
    'financial_reports_subtitle': 'Jana dan muat turun laporan kewangan yang komprehensif',
    'exco_users_title': 'Pengguna EXCO',
    'exco_users_subtitle': 'Ahli EXCO',
    'messages_title': 'Mesej',
    'messages_subtitle': 'Mesej terus dengan pengguna sistem',
    'profile_title': 'Profil',
    'profile_subtitle': 'Urus tetapan dan keutamaan akaun anda',
    
    // Program Management Content
    'program_queries': 'Soalan Program',
    'show_queries': 'Tunjuk Soalan',
    'search_programs': 'Cari program...',
    'all_status': 'Semua Status',
    'programs_for_review': 'Program untuk Semakan',
    'no_pending_programs': 'Tiada Program Menunggu',
    'all_programs_reviewed': 'Semua program telah disemak',
    
    // Budget Tracking Content
    'budget_summary': 'Ringkasan Bajet',
    'approved_programs_budget': 'Program Diluluskan',
    'pending_programs_budget': 'Program Menunggu',
    'rejected_programs_budget': 'Program Ditolak',
    'total_budget_requested': 'Jumlah Bajet Diminta',
    
    // Financial Reports Content
    'program_report_generation': 'Penjanaan Laporan Program',
    'date_range_optional': 'Julat Tarikh: Penapis pilihan untuk mengehadkan laporan kepada julat tarikh tertentu',
    'monthly_budget_trends': 'Trend Bajet Bulanan',
    'monthly': 'Bulanan',
    
    // Messages Content
    'search_conversations': 'Cari perbualan...',
    'select_conversation': 'Pilih perbualan',
    'choose_conversation': 'Pilih perbualan dari bar sisi untuk mula menghantar mesej',
    
    // Profile Content
    'profile_information': 'Maklumat Profil',
    'change_password': 'Tukar Kata Laluan',
    'profile_photo': 'Foto Profil',
    'upload_profile_photo': 'Muat naik foto profil baharu. Imej sepatutnya sekurang-kurangnya 400x400 piksel.',
    'change_photo': 'Tukar Foto',
    'basic_information': 'Maklumat Asas',
    'full_name': 'Nama Penuh',
    'email_address': 'Alamat E-mel',
    'phone_number': 'Nombor Telefon',
    'account_status': 'Status Akaun',
    'member_since': 'Ahli Sejak',
    'update_profile': 'Kemas Kini Profil',
    
    // Additional missing keys
    'deduct_budget': 'Potong Bajet',
    
    // Additional missing keys for components
    'quarterly': 'Suku Tahunan',
    'yearly': 'Tahunan',
    'no_data_available': 'Tiada data tersedia untuk tempoh yang dipilih',
    'static_report_message': 'Ini adalah laporan statik. Gunakan butang "Jana Laporan" di atas untuk mencipta laporan baharu.',
    'download_report': 'Muat Turun Laporan',
    'no_reports_available': 'Tiada laporan tersedia',
    'generate_custom_report': 'Jana Laporan Tersuai',
    'recent_approved_programs': 'Program Diluluskan Terkini',
    'generating': 'Menjana...',
    
    // EXCO Users
    'loading_exco_users': 'Memuat Pengguna EXCO...',
    'exco_users_directory': 'Direktori Pengguna EXCO',
    'kedah_state_government_executive_council_members': 'Ahli Majlis Mesyuarat Kerajaan Negeri Kedah',
    'search_exco_members_placeholder': 'Cari ahli EXCO mengikut nama, jawatan, peranan, atau jabatan...',
    'no_exco_members_found': 'Tiada ahli EXCO yang sepadan dengan carian anda.',
    'no_exco_members_available': 'Tiada ahli EXCO tersedia.',
    'showing_exco_members': 'Menunjukkan {count} daripada {total} ahli EXCO',
    
    // Messaging
    'participants': 'peserta',
    'type_message_placeholder': 'Taip mesej...',
    'choose_conversation_message': 'Pilih perbualan dari bar sisi untuk mula menghantar mesej',
    'chat_with_finance_team': 'Bual dengan Pasukan Kewangan',
    'new_conversation': 'Perbualan Baharu',
    'conversation_title': 'Tajuk Perbualan',
    'enter_conversation_title': 'Masukkan tajuk perbualan...',
    'search_finance_team': 'Cari Pasukan Kewangan',
    'search_finance_team_placeholder': 'Cari pasukan kewangan...',
    
    // User Management
    'manage_system_users': 'Urus pengguna sistem dan peranan mereka',
    'total_users': 'Jumlah Pengguna',
    'admins': 'Pentadbir',
    'active_users': 'Pengguna Aktif',
    'inactive_users': 'Pengguna Tidak Aktif',
    'all_roles': 'Semua Peranan',
    'exco_user': 'Pengguna EXCO',
    'admin': 'Pentadbir',
    'finance_mmk': 'Kewangan MMK',
    'users': 'Pengguna',
    'phone': 'Telefon',
    'active': 'Aktif',
    'inactive': 'Tidak Aktif',
    'delete_user': 'Padam Pengguna',
    'delete_user_confirmation': 'Adakah anda pasti mahu memadamkan pengguna ini?',
    'user_deleted_successfully': 'Pengguna berjaya dipadamkan!',
    'failed_to_delete_user': 'Gagal memadamkan pengguna. Sila cuba lagi.',
    'user_status_updated_successfully': 'Status pengguna berjaya dikemas kini!',
    'failed_to_update_user_status': 'Gagal mengemas kini status pengguna. Sila cuba lagi.',
    'user_updated_successfully': 'Pengguna berjaya dikemas kini!',
    'failed_to_update_user': 'Gagal mengemas kini pengguna. Sila cuba lagi.',
    'user_added_successfully': 'Pengguna berjaya ditambah! Kata Laluan',
    'failed_to_add_user': 'Gagal menambah pengguna. Sila cuba lagi.',
    'update_user': 'Kemas Kini Pengguna',
    'add_new_user': 'Tambah Pengguna Baharu',
    'location': 'Lokasi',
    'password_placeholder': 'Minimum 6 aksara',
    'password_description': 'Ini akan menjadi kata laluan log masuk pengguna',
    'adding': 'Menambah...',
    'finance_officer': 'Pegawai Kewangan',
    'super_admin': 'Pentadbir Super',
  }
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    // Load language from localStorage
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ms')) {
      setLanguage(savedLanguage);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    console.log('Language changing from', language, 'to', lang);
    setLanguage(lang);
    localStorage.setItem('language', lang);
    console.log('Language changed to:', lang);
  };

  const t = (key: string): string => {
    const translation = translations[language][key as keyof typeof translations[typeof language]];
    if (!translation) {
      console.warn(`Translation missing for key: "${key}" in language: ${language}`);
      return key;
    }
    return translation;
  };

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage: handleSetLanguage,
      t
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}; 