# KubikPortal Setup Guide

This guide will help you get the KubikPortal application running on your system.

## Prerequisites

1. **Node.js** (v16 or higher) - Download from [nodejs.org](https://nodejs.org/)
2. **MySQL** (v8.0 or higher) - Download from [mysql.com](https://dev.mysql.com/downloads/)
3. **Git** (optional, for version control)

## 1. Database Setup

### Install MySQL

1. Download and install MySQL from the official website
2. During installation, remember your root password
3. Make sure MySQL server is running

### Create Database

1. Open MySQL Command Line or MySQL Workbench
2. Run the following commands:

```sql
CREATE DATABASE kubikportal;
```

### Import Database Schema

1. Navigate to the project root directory
2. Import the database schema:

```bash
mysql -u root -p kubikportal < database/database.sql
```

### Setup Default Data

1. Run the setup script to populate default data:

```bash
node setup_missing_tables.js
```

## 2. Backend Setup

### Install Dependencies

```bash
cd backend
npm install
```

### Environment Configuration

Create a `.env` file in the `backend` directory with the following content:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=kubikportal
DB_PORT=3306

# Server Configuration
PORT=5000
NODE_ENV=development

# Security
SESSION_SECRET=your-super-secret-session-key-change-this
JWT_SECRET=your-jwt-secret-key

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Email Configuration (optional for testing)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### Start Backend Server

```bash
npm start
```

The backend will run on `http://localhost:5000`

## 3. Frontend Setup

### Install Dependencies

```bash
cd frontend
npm install
```

### Start Frontend Development Server

```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## 4. Create Super Admin Account

1. Open your browser and go to `http://localhost:3000`
2. Click "Register" and create a new account
3. Connect to your MySQL database and run:

```sql
-- Update the user status to approved
UPDATE users SET status = 'approved' WHERE email = 'your-email@example.com';

-- Add super admin role
INSERT INTO portal_admins (user_id, role) 
SELECT id, 'super_admin' FROM users WHERE email = 'your-email@example.com';
```

4. Now you can log in with super admin privileges

## 5. Application Structure

### Main Features

- **User Management**: Register, approve, and manage users
- **Asset Management**: Track client assets and services
- **Billing System**: Generate invoices and manage payments
- **Ticket System**: Handle support requests
- **Admin Dashboard**: Comprehensive overview for administrators

### Default Login

After setting up a super admin account as described above, you can access:

- Client Portal: `http://localhost:3000`
- Admin Panel: `http://localhost:3000/admin`

## 6. Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify MySQL is running
   - Check database credentials in `.env` file
   - Ensure database `kubikportal` exists

2. **Port Already in Use**
   - Backend (port 5000): Change `PORT` in `.env` file
   - Frontend (port 3000): It will automatically use the next available port

3. **Module Not Found Errors**
   - Run `npm install` in both `frontend` and `backend` directories
   - Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`

4. **CORS Errors**
   - Ensure `FRONTEND_URL` in backend `.env` matches your frontend URL
   - Check that both servers are running

### Verification Steps

1. Backend health check: `http://localhost:5000/api/health`
2. Frontend loads without errors
3. Can register a new user
4. Can log in with approved user
5. Admin panel accessible with super admin account

## 7. Development Commands

### Backend
```bash
cd backend
npm start          # Start production server
npm run dev        # Start development server with nodemon
```

### Frontend
```bash
cd frontend
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
```

## 8. Production Deployment

### Build Frontend
```bash
cd frontend
npm run build
```

### Environment Variables
Update your production `.env` file with:
- Secure database credentials
- Strong session and JWT secrets
- Production frontend URL
- Real SMTP configuration

### Security Considerations
- Enable HTTPS in production
- Use strong passwords for database
- Configure firewall rules
- Set up regular database backups
- Enable rate limiting (uncomment in `backend/src/app.js`)

## Need Help?

If you encounter any issues during setup, please check:
1. All prerequisites are installed
2. Database is running and accessible
3. Environment variables are correctly set
4. Both frontend and backend servers are running
5. No port conflicts exist

The application should now be fully functional with all features working correctly.

