-- =====================================================
-- COMPLETE CHARITY PROGRAM MANAGEMENT SYSTEM DATABASE
-- =====================================================
-- This file contains the complete database structure and data
-- for the Kedah State Government Charity Program Management System
-- Generated on: 2024-12-19
-- =====================================================

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS charity_programs;
USE charity_programs;

-- =====================================================
-- 1. USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'manager', 'coordinator', 'user', 'finance', 'finance_officer', 'super_admin') NOT NULL DEFAULT 'user',
    phone VARCHAR(20),
    location VARCHAR(255),
    avatar VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================================
-- 2. PROGRAMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS programs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    department VARCHAR(100),
    recipient_name VARCHAR(255) NOT NULL,
    budget DECIMAL(15,2) NOT NULL,
    start_date DATE,
    end_date DATE,
    letter_reference_number VARCHAR(255),
    status ENUM('draft', 'submitted', 'queried', 'answered_query', 'approved', 'rejected', 'budget_deducted', 'in_progress', 'completed') DEFAULT 'draft',
    user_id INT NOT NULL,
    submitted_by VARCHAR(255),
    submitted_at TIMESTAMP NULL,
    objectives JSON,
    kpi_data JSON,
    documents JSON,
    voucher_number VARCHAR(100),
    eft_number VARCHAR(100),
    approved_by INT NULL,
    approved_at TIMESTAMP NULL,
    rejected_by INT NULL,
    rejected_at TIMESTAMP NULL,
    rejection_reason TEXT,
    budget_deducted DECIMAL(15,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (rejected_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =====================================================
-- 3. PROGRAM QUERIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS program_queries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    program_id INT NOT NULL,
    queried_by INT NOT NULL,
    query_text TEXT NOT NULL,
    query_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    answered_by INT NULL,
    answer_text TEXT,
    answered_at TIMESTAMP NULL,
    status ENUM('pending', 'answered') DEFAULT 'pending',
    FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
    FOREIGN KEY (queried_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (answered_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =====================================================
-- 4. PROGRAM REMARKS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS program_remarks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    program_id INT NOT NULL,
    remarked_by INT NOT NULL,
    remark_text TEXT NOT NULL,
    remark_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
    FOREIGN KEY (remarked_by) REFERENCES users(id) ON DELETE CASCADE
);

-- =====================================================
-- 5. BUDGET DEDUCTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS budget_deductions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    program_id INT NOT NULL,
    deducted_by INT NOT NULL,
    deduction_amount DECIMAL(15,2) NOT NULL,
    deduction_reason TEXT NOT NULL,
    deduction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
    FOREIGN KEY (deducted_by) REFERENCES users(id) ON DELETE CASCADE
);

-- =====================================================
-- 6. PROGRAM APPROVALS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS program_approvals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    program_id INT NOT NULL,
    approver_id INT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    comments TEXT,
    voucher_number VARCHAR(100),
    eft_number VARCHAR(100),
    approved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
    FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =====================================================
-- 7. BUDGET TRACKING TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS budget_tracking (
    id INT AUTO_INCREMENT PRIMARY KEY,
    program_id INT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    transaction_type ENUM('income', 'expense', 'deduction') NOT NULL,
    description TEXT,
    transaction_date DATE NOT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- =====================================================
-- 8. ACTIVITY LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(50),
    record_id INT,
    details JSON,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- =====================================================
-- 9. NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =====================================================
-- 10. EXCO USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS exco_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    image_url VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    department VARCHAR(255),
    position VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- CREATE INDEXES FOR BETTER PERFORMANCE
-- =====================================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_programs_user_id ON programs(user_id);
CREATE INDEX idx_programs_status ON programs(status);
CREATE INDEX idx_programs_created_at ON programs(created_at);
CREATE INDEX idx_program_queries_program_id ON program_queries(program_id);
CREATE INDEX idx_program_queries_status ON program_queries(status);
CREATE INDEX idx_program_remarks_program_id ON program_remarks(program_id);
CREATE INDEX idx_budget_deductions_program_id ON budget_deductions(program_id);
CREATE INDEX idx_budget_tracking_program_id ON budget_tracking(program_id);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- =====================================================
-- INSERT DEFAULT USERS
-- =====================================================
-- Password for all users: password123 (hashed with password_hash)
INSERT INTO users (name, email, password, role, phone, location) VALUES 
('Admin User', 'admin@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', '+60123456789', 'Kedah State Government'),
('EXCO User', 'user1exco@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', '+60123456790', 'Kedah State Government'),
('Finance User', 'finance@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'finance', '+60123456791', 'Kedah State Government'),
('Finance Officer Demo', 'finance_officer@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'finance_officer', '0123456789', 'Kedah State Government'),
('Super Admin Demo', 'super_admin@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'super_admin', '0123456790', 'Kedah State Government'),
('System Admin', 'admin@kedah.gov.my', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', '04-1234567', 'Alor Setar'),
('Finance Officer', 'finance@kedah.gov.my', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'finance', '04-7654321', 'Sungai Petani'),
('EXCO User', 'exco@kedah.gov.my', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', '04-1111111', 'Kulim');

-- =====================================================
-- INSERT SAMPLE PROGRAMS
-- =====================================================
INSERT INTO programs (title, description, department, recipient_name, budget, start_date, end_date, status, user_id, submitted_by, objectives, kpi_data, documents) VALUES 
('Kedah Orphan Support Initiative', 'Provide comprehensive support and care for orphaned children in Kedah state', 'Social Welfare', 'Kedah Orphan Care Foundation', 3200000.00, '2024-04-01', '2025-03-31', 'in_progress', 1, 'Admin User', '["Support 500 orphaned children", "Provide education and healthcare", "Improve living standards"]', '["Children supported: 190", "Education provided: 85%", "Healthcare coverage: 90%"]', '["orphan_support_proposal.pdf", "implementation_plan.docx", "budget_breakdown.xlsx"]');

INSERT INTO programs (title, description, department, recipient_name, budget, start_date, end_date, status, user_id, submitted_by, objectives, kpi_data, documents) VALUES 
('Kedah Rural Education Support Program', 'Enhance educational opportunities for children in rural areas of Kedah', 'Education', 'Kedah Rural Schools Network', 2500000.00, '2024-03-01', '2024-12-31', 'approved', 2, 'EXCO User', '["Improve school infrastructure", "Provide learning materials", "Train teachers"]', '["Schools upgraded: 15", "Students benefited: 1200", "Teachers trained: 45"]', '["education_program_proposal.pdf", "infrastructure_plan.pdf"]');

INSERT INTO programs (title, description, department, recipient_name, budget, start_date, end_date, status, user_id, submitted_by, objectives, kpi_data, documents) VALUES 
('Kedah Community Food Bank Program', 'Establish food banks to support vulnerable communities in Kedah', 'Community Services', 'Kedah Community Centers', 1500000.00, '2024-05-01', '2024-10-31', 'draft', 3, 'Finance User', '["Establish 10 food banks", "Serve 2000 families", "Reduce food insecurity"]', '["Food banks established: 0", "Families served: 0", "Food insecurity reduction: 0%"]', '["food_bank_proposal.pdf"]');

INSERT INTO programs (title, description, department, recipient_name, budget, start_date, end_date, status, user_id, submitted_by, objectives, kpi_data) VALUES 
('Kedah Senior Citizens Care Program', 'Provide healthcare and social support for elderly citizens in Kedah', 'Healthcare', 'Kedah Senior Care Association', 1800000.00, '2024-02-15', '2024-11-30', 'submitted', 1, 'Admin User', '["Provide healthcare services", "Social activities for seniors", "Home care support"]', '["Seniors served: 0", "Healthcare visits: 0", "Social activities: 0"]', '["senior_care_proposal.pdf", "healthcare_plan.pdf"]');

INSERT INTO programs (title, description, department, recipient_name, budget, start_date, end_date, status, user_id, submitted_by, objectives, kpi_data) VALUES 
('Rural Education Support Program', 'Providing educational supplies and scholarships to underprivileged children in rural areas', 'Education', 'Rural Education Foundation', 2500000.00, '2024-03-01', '2024-12-31', 'approved', 3, 'EXCO User', '["Distribute school supplies to 500 underprivileged children", "Provide scholarships to 100 deserving students", "Establish 10 community learning centers in rural areas"]', '[{"target": 500, "current": 150, "unit": "children helped"}, {"target": 100, "current": 25, "unit": "scholarships awarded"}]');

INSERT INTO programs (title, description, department, recipient_name, budget, start_date, end_date, status, user_id, submitted_by, objectives, kpi_data) VALUES 
('Senior Citizens Care Program', 'Providing healthcare support and daily necessities to elderly citizens in need', 'Health & Welfare', 'Senior Citizens Welfare Association', 1800000.00, '2024-02-15', '2024-11-30', 'pending', 3, 'EXCO User', '["Provide healthcare checkups to 300 senior citizens", "Distribute food packages to 200 elderly households", "Establish 5 senior citizen care centers"]', '[{"target": 300, "current": 0, "unit": "seniors helped"}, {"target": 200, "current": 0, "unit": "food packages"}]');

-- =====================================================
-- INSERT EXCO MEMBERS DATA
-- =====================================================
INSERT INTO exco_users (name, title, role, image_url, email, phone, department, position) VALUES
('YAB Dato\'Seri Haji Muhammad Sanusi bin Md Nor, SPMK., AMK.', 'Chief Minister of Kedah Darul Aman', 'Chief Minister', '/images/exco/chief-minister.jpg', 'pmb@kedah.gov.my', '04-7029000 (No.Tel)', 'Office of the Chief Minister of Kedah Darul Aman', 'Chief Minister'),
('YB. Dato\' Ustazah Hjh. Siti Ashah binti Haji Ghazali, DSDK., AMK.', 'Member of the Kedah State Executive Council', 'Chairman of the Rural Development, Poverty, Human Development Committee', '/images/exco/siti-ashah.jpg', 'ashahghazali@kedah.gov.my', '04-702 7000', 'Rural Development Department', 'EXCO Member'),
('YB. Dato\' Ustaz Mohd Azam Bin Abd Samat, DSSS., SDK., PJK.', 'Member of the Kedah State Executive Council', 'Chairman of the Education, Religion, Communication and Information Committee', '/images/exco/mohd-azam.jpg', 'mohdazam@kedah.gov.my', '04-702 7000', 'Education Department', 'EXCO Member'),
('YB. Prof. Dr. Haim Hilman Bin Abdullah, AMK.', 'Member of the Kedah State Government Council', 'Chairman of the Industry & Investment, Higher Education and Science, Technology & Innovation Committees', '/images/exco/haim-hilman.jpg', 'haimhilman@kedah.gov.my', '04-702 7703 (No.Tel)', 'Industry & Investment Department', 'EXCO Member'),
('YB. Dato\' Hjh. Halimaton Shaadiah Binti Saad, DSSS., SSS., BKM.', 'Member of the Kedah State Government Council', 'Chairman of the Welfare, Women, Family & Community Solidarity Committee', '/images/exco/halimaton.jpg', 'halimatonsaadiah@kedah.gov', '04-702 7705 (No.Tel)', 'Welfare Department', 'EXCO Member'),
('YB DATO\' HJ. MOHAMAD YUSOFF BIN HJ. ZAKARIA., DSSS., SSS., AMK., BKM.', 'Member of the Kedah State Government Council', 'Chairman of the Public Works, Natural Resources, Water Supply, Water Resources and Environment Committee', '/images/exco/mohamad-yusoff.jpg', 'myusoff@kedah.gov.my', '04-702 7709 (No.Tel)', 'Public Works Department', 'EXCO Member'),
('YB. Major (Rtd) Mansor Bin Zakaria, AMK., PCK., PNBB., PPS', 'Member of the Kedah State Government Council', 'Chairman of the Housing, Local Government, Health Committee', '/images/exco/mansor.jpg', 'mansorzakaria@kedah.gov.my', '04-702 7713 (No.Tel)', 'Housing Department', 'EXCO Member'),
('His Holiness Tuan Haji Dzowahir Bin Haji Ab. Ghani', 'Member of the Kedah State Executive Council', 'Chairman of the Agriculture, Plantation, Transportation Committee', '/images/exco/dzowahir.jpg', 'dzowahir@kedah.gov.my', '04-702 7695 (No.Tel)', 'Agriculture Department', 'EXCO Member'),
('YB. Dato\' Haji Mohd Salleh Bin Saidin, DIMP., DPSM.', 'Member of the Kedah State Government Council', 'Chairman of the Tourism, Culture, Entrepreneurship Committee', '/images/exco/mohd-salleh.jpg', 'sallehsaidin@kedah.gov.my', '04-702 7707 (No.Tel)', 'Tourism Department', 'EXCO Member'),
('YB. Tuan Haji Muhammad Radhi Bin Haji Mat Din, SDK., AMK., ASK., PJK.', 'Member of the Kedah State Government Council', 'Chairman of the Consumerism & Cost of Living, Youth and Sports Committee', '/images/exco/muhammad-radhi.jpg', 'muhammadradhi@kedah.gov.my', '04-702 7699', 'Youth and Sports Department', 'EXCO Member'),
('YB. Wong Chia Zhen', 'Member of the Kedah State Executive Council', 'Chairman of the Human Resources Committee, Chinese, Indian & Siamese Communities & NGOs', '/images/exco/wong-chia-zhen.jpg', 'wongchiazhen@kedah.gov.my', '04-702 7710', 'Human Resources Department', 'EXCO Member');

-- =====================================================
-- INSERT SAMPLE NOTIFICATIONS
-- =====================================================
INSERT INTO notifications (user_id, title, message, type, is_read, created_at) VALUES 
(NULL, 'System Maintenance', 'Scheduled maintenance will occur on Sunday at 2:00 AM. System may be temporarily unavailable.', 'info', 0, NOW()),
(NULL, 'New Feature Available', 'Document upload feature is now available for all program submissions.', 'success', 0, NOW()),
(NULL, 'Budget Update', '2024 budget allocation has been updated. Please review your program budgets.', 'warning', 0, NOW());

-- =====================================================
-- DATABASE SYSTEM INFORMATION SUMMARY
-- =====================================================
/*
DATABASE NAME: charity_programs
TOTAL TABLES: 10

1. users - User management and authentication
2. programs - Main program data and status tracking
3. program_queries - Query system for program clarifications
4. program_remarks - Remarks and comments on programs
5. budget_deductions - Budget deduction tracking
6. program_approvals - Program approval workflow
7. budget_tracking - Financial transaction tracking
8. activity_logs - System activity logging
9. notifications - User notification system
10. exco_users - EXCO members information

USER ROLES:
- admin: System administrator
- manager: Program manager
- coordinator: Program coordinator
- user: Regular user
- finance: Finance officer
- finance_officer: Finance officer (specific role)
- super_admin: Super administrator

PROGRAM STATUSES:
- draft: Initial draft
- submitted: Submitted for review
- queried: Under query
- answered_query: Query answered
- approved: Approved
- rejected: Rejected
- budget_deducted: Budget deducted
- in_progress: Program in progress
- completed: Program completed

DEFAULT LOGIN CREDENTIALS:
All users have password: password123
Email addresses are provided in the users table above.

SYSTEM FEATURES:
- Multi-role user management
- Program lifecycle management
- Budget tracking and deductions
- Query and remark system
- Activity logging
- Notification system
- EXCO member management
- Document upload support
- PDF report generation
- Financial reporting
*/
