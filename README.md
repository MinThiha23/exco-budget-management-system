# SISTEM PENGURUSAN PERUNTUKAN EXCO (EXCO Budget Management System)

A comprehensive web-based budget management system for EXCO (Executive Council) members of the Kedah State Government.

## 🏛️ Overview

This system manages budget allocation, program tracking, and financial oversight for EXCO members. It provides role-based access control with different interfaces for users, finance officers, and administrators.

## ✨ Features

### 🔐 Authentication & Authorization
- Multi-role user system (User, Finance MMK, Finance Officer, Admin, Super Admin)
- Secure login with role-based permissions
- Session management and security

### 📊 Program Management
- Create, edit, and submit programs
- Document upload and version control
- Status tracking with timeline visualization
- Budget allocation and tracking

### 💰 Financial Management
- Budget allocation per EXCO user
- Expense tracking and reporting
- Voucher and EFT number management
- Payment status tracking

### 📋 Status Workflow
- **Draft** → **Under Review** → **Query** → **Query Answered** → **Complete and can be sent to MMK office** → **Document Accepted by MMK Office** → **Payment in Progress** → **Payment Completed**

### 🔔 Notifications
- Real-time notification system
- Query and response management
- Status change notifications
- Mark all read functionality

### 📈 Reporting
- Government report generation (PDF)
- Budget utilization reports
- Program status reports
- Export functionality

### 🎨 User Interface
- Modern, responsive design
- Dark/Light theme support
- Card and table view modes
- Status timeline visualization
- Multi-language support (English/Malay)

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **React Router** for navigation
- **Context API** for state management

### Backend
- **PHP 8+** with PDO
- **MySQL** database
- **FPDF** for PDF generation
- **RESTful API** architecture

### Development Tools
- **Vite** for build tooling
- **ESLint** for code quality
- **Git** for version control

## 🚀 Installation

### Prerequisites
- Node.js 16+ and npm
- PHP 8.0+
- MySQL 5.7+
- Web server (Apache/Nginx)

### Frontend Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Backend Setup
1. Configure your web server to serve the `api/` directory
2. Set up MySQL database and update `api/config.php`
3. Import the database schema
4. Configure CORS settings if needed

### Database Configuration
Update `api/config.php` with your database credentials:
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'your_database_name');
define('DB_USER', 'your_username');
define('DB_PASS', 'your_password');
```

## 📁 Project Structure

```
project/
├── src/
│   ├── components/          # React components
│   │   ├── Auth/           # Authentication components
│   │   ├── Finance/        # Finance-specific components
│   │   ├── Layout/         # Layout and navigation
│   │   └── Programs/       # Program management components
│   ├── contexts/           # React contexts
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   └── config/             # Configuration files
├── api/                    # PHP backend API
│   ├── config.php          # Database configuration
│   ├── programs.php        # Program management API
│   ├── users.php           # User management API
│   └── ...                 # Other API endpoints
├── public/                 # Static assets
└── uploads/                # File uploads
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:
```env
VITE_API_BASE_URL=http://localhost/your-api-path
VITE_APP_NAME="EXCO Budget Management System"
```

### API Endpoints
The system uses RESTful API endpoints for all operations:
- `GET /api/programs.php` - Fetch programs
- `POST /api/programs.php` - Create/update programs
- `GET /api/users.php` - User management
- `POST /api/auth.php` - Authentication

## 👥 User Roles

### User (EXCO Member)
- Create and manage programs
- Submit programs for review
- Respond to finance queries
- Track program status

### Finance MMK
- Review and approve programs
- Query programs for clarification
- Accept documents (skip MMK review)
- Manage budget allocations

### Finance Officer
- Process payments
- Update voucher and EFT numbers
- Track payment status

### Admin
- User management
- System configuration
- Report generation

### Super Admin
- Full system access
- Database management
- System maintenance

## 📊 Status Timeline

The system includes a visual status timeline showing program progression:

1. **Draft** - Initial program creation
2. **Under Review** - Submitted for finance review
3. **Query** - Finance has questions
4. **Query Answered** - User responded to queries
5. **Complete and can be sent to MMK office** - Ready for MMK review
6. **Document Accepted by MMK Office** - MMK approval received
7. **Payment in Progress** - Payment processing
8. **Payment Completed** - Final status

## 🔔 Notifications

The system provides real-time notifications for:
- Program status changes
- New queries from finance
- Document acceptance
- Payment updates

## 📈 Reporting

Generate comprehensive reports including:
- Government budget reports (PDF)
- Program status summaries
- Budget utilization analysis
- User activity reports

## 🚀 Deployment

### Production Deployment
1. Build the frontend: `npm run build`
2. Upload files to your web server
3. Configure database and API endpoints
4. Set up SSL certificates
5. Configure backup systems

### InfinityFree Deployment
The system includes specific configurations for InfinityFree hosting:
- Optimized PHP settings
- CORS configuration
- File upload handling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is developed for the Kedah State Government and is proprietary software.

## 🆘 Support

For technical support or questions:
- Check the documentation
- Review the API endpoints
- Contact the development team

## 🔄 Version History

### Current Version
- Status timeline feature
- Enhanced notification system
- Improved UI/UX
- Bug fixes and performance improvements

---

**Developed for the Kedah State Government**  
*SISTEM PENGURUSAN PERUNTUKAN EXCO*
