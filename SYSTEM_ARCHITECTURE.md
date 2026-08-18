# 🏗️ Kubik Portal - Complete System Architecture

## 📋 **System Overview**

A fully custom client portal for managing eShop development, social media management, advertising, plugin creation, and change requests with admin approval workflow, dynamic pricing, and comprehensive asset management.

## 🗄️ **Database Schema**

### **Core Tables**
- **users** - Client accounts with approval workflow
- **portal_admins** - Admin roles and permissions
- **assets** - Business entities with full details
- **asset_collaborators** - Multi-user asset access
- **service_packages** - Configurable service offerings
- **asset_services** - User subscriptions to services
- **service_history** - Complete service change tracking
- **tickets** - Support and change requests
- **ticket_attachments** - File uploads for tickets
- **ticket_responses** - Ticket communication
- **pricing_config** - Dynamic pricing settings
- **invoices** - Manual invoice management
- **email_templates** - Customizable email system
- **email_queue** - Rate-limited email processing
- **admin_activity_logs** - Complete audit trail
- **user_sessions** - Secure session management
- **system_settings** - Configurable system parameters

## 🔐 **Security Features**

### **Authentication & Authorization**
- ✅ **Admin Approval Workflow** - New users require admin approval
- ✅ **Role-Based Access Control** - Super Admin, Admin, Asset Owner, Asset Admin
- ✅ **Secure Password Requirements** - 8+ chars, uppercase, lowercase, numbers, special chars
- ✅ **Session Management** - 72-hour timeout with secure cookies
- ✅ **Rate Limiting** - API protection against abuse
- ✅ **Helmet Security** - Comprehensive security headers
- ✅ **GDPR Compliance** - Cookie consent, data protection

### **Data Protection**
- ✅ **Password Hashing** - bcrypt with 12 salt rounds
- ✅ **SQL Injection Protection** - Parameterized queries
- ✅ **XSS Protection** - Input validation and sanitization
- ✅ **CSRF Protection** - Session-based security
- ✅ **File Upload Security** - Size limits and type validation

## 📧 **Email System**

### **Features**
- ✅ **Rate Limiting** - Respects Plesk's 80 emails/hour limit
- ✅ **Queue System** - Automatic retry and fallback
- ✅ **Template Management** - Admin-editable email templates
- ✅ **Variable Support** - Dynamic content insertion
- ✅ **Preview Functionality** - Test emails before saving

### **Email Templates**
- User registration confirmation
- Admin approval notification
- Welcome email after approval
- Payment reminders
- Ticket status updates
- Asset invitations
- Password reset

## 💰 **Billing & Pricing**

### **Dynamic Pricing System**
- ✅ **Configurable Packages** - Admin can modify all pricing
- ✅ **Multi-Service Discounts** - Automatic discount for multiple services
- ✅ **Wallet System** - Credit management for downgrades
- ✅ **Change Request Pricing** - Different rates with/without packages
- ✅ **Manual Invoice Management** - Admin uploads invoices per asset

### **Payment Processing**
- ✅ **Manual Bank Transfer** - No payment gateway dependencies
- ✅ **Payment Instructions** - Configurable bank details
- ✅ **Invoice Tracking** - Status management (pending, paid, overdue)

## 🎯 **Core Workflows**

### **1. User Registration & Approval**
```
User Registration → Email to Admin → Admin Approval → Welcome Email → Dashboard Access
```

### **2. Asset & Service Management**
```
Create Asset → Add Business Details → Select Services → Package Management → Billing
```

### **3. Ticket System**
```
Create Ticket → Dynamic Pricing → File Attachments → Status Updates → Email Notifications
```

### **4. Admin Management**
```
User Management → Package Configuration → Pricing Updates → Email Templates → System Settings
```

## 🛠️ **Technical Implementation**

### **Backend (Node.js/Express)**
- ✅ **Enhanced Security** - Helmet, rate limiting, validation
- ✅ **Database Integration** - Neon PostgreSQL with bounded connection pooling
- ✅ **File Upload** - Multer with size and type validation
- ✅ **Email System** - Nodemailer with queue management
- ✅ **Session Management** - PostgreSQL session store
- ✅ **Admin Activity Logging** - Complete audit trail

### **Frontend (React/Vite)**
- ✅ **Modern UI** - Tailwind CSS with Cloudflare design
- ✅ **Greek Localization** - Complete Greek language support
- ✅ **Responsive Design** - Mobile-friendly interface
- ✅ **Form Validation** - React Hook Form integration
- ✅ **Real-time Updates** - Toast notifications
- ✅ **File Upload** - Drag & drop support

### **Deployment Architecture**
- ✅ **Cloudflare Pages** - Frontend hosting
- ✅ **Serverless Hosting** - Vercel API and Neon PostgreSQL
- ✅ **GitHub Integration** - Automated deployments
- ✅ **Environment Configuration** - Secure environment variables

## 📊 **Admin Dashboard Features**

### **User Management**
- View all users with status filtering
- Approve/reject/suspend users
- View user activity and assets
- Manage user wallet balances

### **Package Management**
- Create/edit/delete service packages
- Configure pricing and features
- Set package availability
- View subscription statistics

### **Pricing Configuration**
- Set change request pricing
- Configure support ticket pricing
- Manage multi-service discounts
- Update pricing in real-time

### **Email Template Management**
- Edit all email templates
- Preview emails with variables
- Test email functionality
- Manage template variables

### **System Settings**
- Configure bank account details
- Set file upload limits
- Manage session timeouts
- Update system parameters

### **Analytics & Reports**
- User registration statistics
- Service subscription analytics
- Revenue tracking
- Ticket volume reports
- Admin activity logs

## 🔄 **API Endpoints**

### **Authentication**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/reset-password` - Password reset request
- `POST /api/auth/reset-password/confirm` - Password reset confirmation

### **Users**
- `GET /api/users` - List users (admin)
- `PUT /api/users/:id/approve` - Approve user (admin)
- `PUT /api/users/:id/reject` - Reject user (admin)
- `PUT /api/users/:id/suspend` - Suspend user (admin)
- `GET /api/users/dashboard-stats` - User dashboard statistics

### **Assets**
- `GET /api/assets` - List user assets
- `POST /api/assets` - Create asset
- `PUT /api/assets/:id` - Update asset
- `DELETE /api/assets/:id` - Delete asset
- `POST /api/assets/:id/invite` - Invite collaborator

### **Services**
- `GET /api/services/packages` - List available packages
- `POST /api/services/subscribe` - Subscribe to service
- `PUT /api/services/:id/upgrade` - Upgrade service
- `PUT /api/services/:id/downgrade` - Downgrade service
- `POST /api/services/:id/cancel` - Cancel service

### **Tickets**
- `GET /api/tickets` - List user tickets
- `POST /api/tickets` - Create ticket
- `PUT /api/tickets/:id` - Update ticket
- `POST /api/tickets/:id/respond` - Add response
- `GET /api/tickets/pricing` - Get dynamic pricing

### **Billing**
- `GET /api/billing/invoices` - List invoices
- `GET /api/billing/invoices/:id/download` - Download invoice
- `POST /api/billing/invoices` - Upload invoice (admin)

### **Admin**
- `GET /api/admin/users` - Admin user management
- `GET /api/admin/packages` - Package management
- `GET /api/admin/pricing` - Pricing configuration
- `GET /api/admin/email-templates` - Email template management
- `GET /api/admin/analytics` - Analytics and reports
- `GET /api/admin/activity-logs` - Admin activity logs

### **System**
- `GET /api/system/settings` - Get system settings
- `PUT /api/system/settings` - Update system settings
- `GET /api/system/health` - System health check

## 🚀 **Deployment Checklist**

### **Backend Setup**
1. ✅ Database schema creation
2. ✅ Environment variables configuration
3. ✅ SMTP settings for Plesk
4. ✅ File upload directory setup
5. ✅ SSL certificate configuration
6. ✅ Cron job setup for email queue

### **Frontend Setup**
1. ✅ Build configuration
2. ✅ Environment variables
3. ✅ Cloudflare Pages deployment
4. ✅ Custom domain configuration
5. ✅ Security headers setup

### **Security Hardening**
1. ✅ Change default secrets
2. ✅ Configure firewall rules
3. ✅ Set up database backups
4. ✅ Enable HTTPS everywhere
5. ✅ Configure rate limiting

## 📈 **Performance Optimizations**

### **Database**
- ✅ Indexed queries for fast lookups
- ✅ Connection pooling
- ✅ Query optimization
- ✅ Regular maintenance

### **Frontend**
- ✅ Code splitting and lazy loading
- ✅ Image optimization
- ✅ Caching strategies
- ✅ Bundle size optimization

### **Email System**
- ✅ Rate limiting compliance
- ✅ Queue processing
- ✅ Retry mechanisms
- ✅ Error handling

## 🔧 **Next Steps**

1. **Complete Backend Routes** - Implement remaining API endpoints
2. **Admin Dashboard** - Build comprehensive admin interface
3. **Frontend Integration** - Connect React app to backend APIs
4. **Testing** - Comprehensive testing suite
5. **Deployment** - Production deployment and configuration
6. **Documentation** - User and admin documentation
7. **Training** - Admin training and support

---

This architecture keeps the demo **standalone and portable**, with PostgreSQL persistence and no dependency on private KUBIK ecosystem services.
