-- Database schema for Program Management System
-- Run this SQL in your cPanel phpMyAdmin

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin', 'finance') DEFAULT 'user',
    phone VARCHAR(50),
    location VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create programs table
CREATE TABLE IF NOT EXISTS programs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    department VARCHAR(255),
    recipient_name VARCHAR(255) NOT NULL,
    budget DECIMAL(15,2) NOT NULL DEFAULT 0,
    start_date DATE,
    end_date DATE,
    status ENUM('draft', 'pending', 'approved', 'rejected', 'in-progress', 'completed') DEFAULT 'draft',
    user_id INT NOT NULL,
    submitted_by VARCHAR(255),
    objectives TEXT,
    kpi_data TEXT,
    documents TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert default admin user (password: admin123)
INSERT INTO users (name, email, password, role, phone, location) VALUES 
('System Admin', 'admin@kedah.gov.my', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', '04-1234567', 'Alor Setar'),
('Finance Officer', 'finance@kedah.gov.my', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'finance', '04-7654321', 'Sungai Petani'),
('EXCO User', 'exco@kedah.gov.my', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', '04-1111111', 'Kulim');

-- Insert sample programs
INSERT INTO programs (title, description, department, recipient_name, budget, start_date, end_date, status, user_id, submitted_by, objectives, kpi_data) VALUES 
('Rural Education Support Program', 'Providing educational supplies and scholarships to underprivileged children in rural areas', 'Education', 'Rural Education Foundation', 2500000.00, '2024-03-01', '2024-12-31', 'approved', 3, 'EXCO User', '["Distribute school supplies to 500 underprivileged children", "Provide scholarships to 100 deserving students", "Establish 10 community learning centers in rural areas"]', '[{"target": 500, "current": 150, "unit": "children helped"}, {"target": 100, "current": 25, "unit": "scholarships awarded"}]'),
('Senior Citizens Care Program', 'Providing healthcare support and daily necessities to elderly citizens in need', 'Health & Welfare', 'Senior Citizens Welfare Association', 1800000.00, '2024-02-15', '2024-11-30', 'pending', 3, 'EXCO User', '["Provide healthcare checkups to 300 senior citizens", "Distribute food packages to 200 elderly households", "Establish 5 senior citizen care centers"]', '[{"target": 300, "current": 0, "unit": "seniors helped"}, {"target": 200, "current": 0, "unit": "food packages"}]');