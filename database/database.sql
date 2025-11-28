-- KubikPortal Complete Database Schema
-- This script creates all necessary tables if they do not already exist.

--
-- Table structure for table `users`
--
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `status` enum('pending','approved','rejected','suspended') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `last_login` timestamp NULL DEFAULT NULL,
  `wallet_balance` decimal(10,2) DEFAULT 0.00,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `portal_admins`
--
CREATE TABLE IF NOT EXISTS `portal_admins` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `role` enum('admin','super_admin') NOT NULL DEFAULT 'admin',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `portal_admins_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `sessions` (for express-mysql-session)
--
CREATE TABLE IF NOT EXISTS `sessions` (
  `session_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `expires` int(11) unsigned NOT NULL,
  `data` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `categories`
--
CREATE TABLE IF NOT EXISTS `categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `color` varchar(50) DEFAULT '#6B7280',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_category_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `packages`
--
CREATE TABLE IF NOT EXISTS `packages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `currency` varchar(10) DEFAULT 'EUR',
  `billing_cycle` enum('monthly','yearly','one_time') DEFAULT 'monthly',
  `category_id` int(11) DEFAULT NULL,
  `features` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `packages_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `assets`
--
CREATE TABLE IF NOT EXISTS `assets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `category` varchar(255) DEFAULT NULL,
  `package_id` int(11) DEFAULT NULL,
  `business_name` varchar(255) DEFAULT NULL,
  `vat_number` varchar(50) DEFAULT NULL,
  `billing_email` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `billing_phone` varchar(50) DEFAULT NULL,
  `status` enum('active','inactive','suspended') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `website` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `package_id` (`package_id`),
  CONSTRAINT `assets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `assets_ibfk_2` FOREIGN KEY (`package_id`) REFERENCES `packages` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `invoices`
--
CREATE TABLE IF NOT EXISTS `invoices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `asset_id` int(11) DEFAULT NULL,
  `invoice_number` varchar(255) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `vat_amount` decimal(10,2) DEFAULT 0.00,
  `total_amount` decimal(10,2) NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('pending','paid','overdue','cancelled') NOT NULL DEFAULT 'pending',
  `due_date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `uploaded_by` int(11) DEFAULT NULL,
  `filename` varchar(255) DEFAULT NULL,
  `file_path` varchar(255) DEFAULT NULL,
  `file_size` int(11) DEFAULT NULL,
  `paid_at` timestamp NULL DEFAULT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  `payment_reference` varchar(255) DEFAULT NULL,
  `payment_notes` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoice_number` (`invoice_number`),
  KEY `user_id` (`user_id`),
  KEY `asset_id` (`asset_id`),
  CONSTRAINT `invoices_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `invoices_ibfk_2` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `tickets`
--
CREATE TABLE IF NOT EXISTS `tickets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `asset_id` int(11) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
  `price` decimal(10,2) DEFAULT 0.00,
  `price_type` enum('with_package','without_package') DEFAULT 'without_package',
  `category` enum('support','change_request','bug_report','feature_request') DEFAULT 'support',
  `status` enum('open','answered','customer-reply','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `resolved_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `asset_id` (`asset_id`),
  CONSTRAINT `tickets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tickets_ibfk_2` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `ticket_messages`
--
CREATE TABLE IF NOT EXISTS `ticket_messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ticket_id` int(11) NOT NULL,
  `sender_type` enum('client','admin') NOT NULL,
  `content` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `ticket_id` (`ticket_id`),
  CONSTRAINT `ticket_messages_ibfk_1` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `ticket_attachments`
--
CREATE TABLE IF NOT EXISTS `ticket_attachments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ticket_message_id` int(11) NOT NULL,
  `filename` varchar(255) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `file_size` int(11) NOT NULL,
  `mimetype` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `ticket_message_id` (`ticket_message_id`),
  CONSTRAINT `ticket_attachments_ibfk_1` FOREIGN KEY (`ticket_message_id`) REFERENCES `ticket_messages` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `pricing_config`
--
CREATE TABLE IF NOT EXISTS `pricing_config` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `support_ticket_with_package` decimal(10,2) DEFAULT 25.00,
  `support_ticket_without_package` decimal(10,2) DEFAULT 75.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `system_settings`
--
CREATE TABLE IF NOT EXISTS `system_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(255) NOT NULL,
  `setting_value` longtext DEFAULT NULL,
  `setting_type` varchar(50) DEFAULT 'string',
  `updated_by` int(11) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `email_templates`
--
CREATE TABLE IF NOT EXISTS `email_templates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `body` text NOT NULL,
  `variables` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Seed Data
--

-- Default Super Admin User
-- email: admin@kubik.gr
-- password: password
INSERT IGNORE INTO `users` (`id`, `first_name`, `last_name`, `email`, `password_hash`, `status`) VALUES
(1, 'Admin', 'User', 'test@test.gr', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'approved');

INSERT IGNORE INTO `portal_admins` (`user_id`, `role`) VALUES
(1, 'super_admin');

-- Default Categories
INSERT IGNORE INTO `categories` (`id`, `name`, `color`) VALUES
(1, 'Hosting', '#3B82F6'),
(2, 'Ιστοσελίδες', '#22C55E'),
(3, 'Eshop', '#8B5CF6'),
(4, 'Social Media', '#F97316'),
(5, 'SEO', '#EF4444'),
(6, 'Συντήρηση', '#EAB308');

-- Default Packages
INSERT IGNORE INTO `packages` (`id`, `name`, `description`, `price`, `billing_cycle`, `category_id`, `features`, `is_active`) VALUES
(1, 'Βασικό Πακέτο', 'Βασικές υπηρεσίες για μικρές επιχειρήσεις', 99.00, 'monthly', 2, '["Βασική υποστήριξη","Email υποστήριξη","Ενημέρωση συστήματος"]', 1),
(2, 'Premium Πακέτο', 'Προηγμένες υπηρεσίες για μεγάλες επιχειρήσεις', 199.00, 'monthly', 3, '["24/7 υποστήριξη","Προτεραιότητα","Προηγμένες λειτουργίες","Απομακρυσμένη υποστήριξη"]', 1);

-- Default Pricing Configuration
INSERT IGNORE INTO `pricing_config` (`id`, `support_ticket_with_package`, `support_ticket_without_package`) VALUES
(1, 25.00, 75.00);

-- Default System Settings
INSERT IGNORE INTO `system_settings` (`setting_key`, `setting_value`, `setting_type`) VALUES
('billing.vat_rate', '24', 'number');

-- Default Email Templates
INSERT IGNORE INTO `email_templates` (`name`, `subject`, `body`, `variables`, `is_active`) VALUES
('user_registration', 'Καλώς ήρθατε στο KubikPortal', '<p>Γεια σας {{first_name}},</p><p>Σας ευχαριστούμε για την εγγραφή σας στο KubikPortal. Ο λογαριασμός σας έχει δημιουργηθεί και αναμένει έγκριση από τον διαχειριστή.</p><p>Με εκτίμηση,<br>Η ομάδα του KubikPortal</p>', '["first_name"]', 1),
('forgot_password', 'Επαναφορά Κωδικού Πρόσβασης', '<p>Γεια σας {{first_name}},</p><p>Λάβαμε ένα αίτημα για επαναφορά του κωδικού πρόσβασής σας. Κάντε κλικ στον παρακάτω σύνδεσμο για να ορίσετε έναν νέο κωδικό:</p><p><a href="{{reset_link}}">Επαναφορά Κωδικού</a></p><p>Αν δεν κάνατε εσείς αυτό το αίτημα, παρακαλώ αγνοήστε αυτό το email.</p>', '["first_name", "reset_link"]', 1),
('invoice_notification', 'Νέο Τιμολόγιο #{{invoice_number}}', '<p>Αγαπητέ/ή {{first_name}},</p><p>Ένα νέο τιμολόγιο με αριθμό #{{invoice_number}} έχει εκδοθεί για το περιουσιακό στοιχείο "{{asset_name}}".</p><p>Το συνολικό ποσό είναι €{{total_amount}} και η ημερομηνία λήξης είναι {{due_date}}.</p><p>Μπορείτε να δείτε και να κατεβάσετε το τιμολόγιο από τον λογαριασμό σας.</p>', '["first_name", "invoice_number", "asset_name", "total_amount", "due_date"]', 1),
('ticket_reply_client', 'Νέα Απάντηση στο Εισιτήριο #{{ticket_id}}', '<p>Γεια σας {{first_name}},</p><p>Ένας διαχειριστής απάντησε στο εισιτήριό σας με τίτλο "{{ticket_title}}".</p><p>Παρακαλώ συνδεθείτε στον λογαριασμό σας για να δείτε την απάντηση.</p>', '["first_name", "ticket_id", "ticket_title"]', 1),
('new_ticket_admin', 'Νέο Εισιτήριο Υποστήριξης #{{ticket_id}}', '<p>Ένα νέο εισιτήριο υποστήριξης με αριθμό #{{ticket_id}} έχει δημιουργηθεί από τον χρήστη {{client_name}}.</p><p><strong>Τίτλος:</strong> {{ticket_title}}</p><p>Παρακαλώ συνδεθείτε στο admin panel για να το διαχειριστείτε.</p>', '["ticket_id", "client_name", "ticket_title"]', 1);