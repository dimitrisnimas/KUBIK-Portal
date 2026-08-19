BEGIN;

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(320) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  wallet_balance NUMERIC(10, 2) NOT NULL DEFAULT 0,
  reset_token VARCHAR(255),
  reset_expires TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS portal_admins (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'admin'
    CHECK (role IN ('admin', 'super_admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR NOT NULL PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_expire ON sessions(expire);

CREATE TABLE IF NOT EXISTS auth_otp_challenges (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(320) NOT NULL,
  requested_role VARCHAR(10) NOT NULL
    CHECK (requested_role IN ('admin', 'user')),
  code_hash CHAR(64) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts SMALLINT NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  consumed_at TIMESTAMPTZ,
  request_ip VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_auth_otp_email_created
  ON auth_otp_challenges(email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_otp_ip_created
  ON auth_otp_challenges(request_ip, created_at DESC);

CREATE TABLE IF NOT EXISTS demo_workspaces (
  schema_name VARCHAR(40) PRIMARY KEY,
  verified_email VARCHAR(320) NOT NULL,
  demo_role VARCHAR(10) NOT NULL CHECK (demo_role IN ('admin', 'user')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (schema_name ~ '^demo_[a-f0-9]{32}$')
);
CREATE INDEX IF NOT EXISTS idx_demo_workspaces_expires
  ON demo_workspaces(expires_at);

CREATE TABLE IF NOT EXISTS categories (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  color VARCHAR(50) NOT NULL DEFAULT '#6B7280'
);

CREATE TABLE IF NOT EXISTS packages (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'EUR',
  billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly'
    CHECK (billing_cycle IN ('monthly', 'yearly', 'one_time')),
  category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
  features TEXT,
  is_active SMALLINT NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_packages_category ON packages(category_id);

CREATE TABLE IF NOT EXISTS assets (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(255),
  package_id BIGINT REFERENCES packages(id) ON DELETE SET NULL,
  business_name VARCHAR(255),
  vat_number VARCHAR(50),
  billing_email VARCHAR(320),
  address TEXT,
  billing_phone VARCHAR(50),
  website VARCHAR(500),
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_assets_user ON assets(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_package ON assets(package_id);

CREATE TABLE IF NOT EXISTS asset_collaborators (
  id BIGSERIAL PRIMARY KEY,
  asset_id BIGINT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(30) NOT NULL DEFAULT 'viewer',
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'revoked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (asset_id, user_id)
);

CREATE TABLE IF NOT EXISTS invoices (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asset_id BIGINT REFERENCES assets(id) ON DELETE SET NULL,
  invoice_number VARCHAR(255) NOT NULL UNIQUE,
  amount NUMERIC(10, 2) NOT NULL,
  vat_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(10, 2) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  due_date DATE NOT NULL,
  uploaded_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  filename VARCHAR(255),
  file_path VARCHAR(1000),
  file_size BIGINT,
  paid_at TIMESTAMPTZ,
  payment_method VARCHAR(50),
  payment_reference VARCHAR(255),
  payment_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_invoices_user ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_asset ON invoices(asset_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

CREATE TABLE IF NOT EXISTS tickets (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asset_id BIGINT REFERENCES assets(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  price_type VARCHAR(30) NOT NULL DEFAULT 'without_package'
    CHECK (price_type IN ('with_package', 'without_package')),
  category VARCHAR(30) NOT NULL DEFAULT 'support'
    CHECK (category IN ('support', 'change_request', 'bug_report', 'feature_request')),
  status VARCHAR(30) NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'answered', 'customer-reply', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_tickets_user ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_asset ON tickets(asset_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);

CREATE TABLE IF NOT EXISTS ticket_messages (
  id BIGSERIAL PRIMARY KEY,
  ticket_id BIGINT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('client', 'admin')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket ON ticket_messages(ticket_id);

CREATE TABLE IF NOT EXISTS ticket_attachments (
  id BIGSERIAL PRIMARY KEY,
  ticket_message_id BIGINT NOT NULL REFERENCES ticket_messages(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  file_path VARCHAR(1000) NOT NULL,
  file_size BIGINT NOT NULL,
  mimetype VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pricing_config (
  id BIGSERIAL PRIMARY KEY,
  change_request_with_package NUMERIC(10, 2) NOT NULL DEFAULT 50,
  change_request_without_package NUMERIC(10, 2) NOT NULL DEFAULT 150,
  support_ticket_with_package NUMERIC(10, 2) NOT NULL DEFAULT 25,
  support_ticket_without_package NUMERIC(10, 2) NOT NULL DEFAULT 75,
  multi_service_discount_percentage NUMERIC(5, 2) NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_settings (
  id BIGSERIAL PRIMARY KEY,
  setting_key VARCHAR(255) NOT NULL UNIQUE,
  setting_value TEXT,
  setting_type VARCHAR(50) NOT NULL DEFAULT 'string',
  updated_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_templates (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  variables TEXT,
  is_active SMALLINT NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_queue (
  id BIGSERIAL PRIMARY KEY,
  template_name VARCHAR(255),
  to_email VARCHAR(320) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  variables TEXT,
  priority INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  error_message TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_email_queue_pending
  ON email_queue(status, priority DESC, scheduled_at);

CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id BIGSERIAL PRIMARY KEY,
  admin_id BIGINT REFERENCES portal_admins(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(100),
  record_id BIGINT,
  old_values TEXT,
  new_values TEXT,
  ip_address VARCHAR(64),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE VIEW service_packages AS
SELECT id, name, description, price, currency, billing_cycle, features,
       is_active, created_at
FROM packages;

INSERT INTO users (id, first_name, last_name, email, password_hash, status)
VALUES (
  1,
  'Demo',
  'Administrator',
  'test@test.gr',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'approved'
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (first_name, last_name, email, password_hash, status)
VALUES (
  'Demo',
  'Client',
  'demo-client@kubik.local',
  '!passwordless-demo-persona',
  'approved'
)
ON CONFLICT (email) DO NOTHING;

SELECT setval(pg_get_serial_sequence('users', 'id'), GREATEST((SELECT MAX(id) FROM users), 1));

INSERT INTO portal_admins (user_id, role)
VALUES (1, 'super_admin')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO categories (id, name, color) VALUES
  (1, 'Hosting', '#3B82F6'),
  (2, 'Ιστοσελίδες', '#22C55E'),
  (3, 'Eshop', '#8B5CF6'),
  (4, 'Social Media', '#F97316'),
  (5, 'SEO', '#EF4444'),
  (6, 'Συντήρηση', '#EAB308')
ON CONFLICT (name) DO NOTHING;

SELECT setval(pg_get_serial_sequence('categories', 'id'), GREATEST((SELECT MAX(id) FROM categories), 1));

INSERT INTO packages
  (id, name, description, price, billing_cycle, category_id, features, is_active)
VALUES
  (1, 'Βασικό Πακέτο', 'Βασικές υπηρεσίες για μικρές επιχειρήσεις', 99, 'monthly', 2,
   '["Βασική υποστήριξη","Email υποστήριξη","Ενημέρωση συστήματος"]', 1),
  (2, 'Premium Πακέτο', 'Προηγμένες υπηρεσίες για μεγάλες επιχειρήσεις', 199, 'monthly', 3,
   '["24/7 υποστήριξη","Προτεραιότητα","Προηγμένες λειτουργίες","Απομακρυσμένη υποστήριξη"]', 1)
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('packages', 'id'), GREATEST((SELECT MAX(id) FROM packages), 1));

INSERT INTO pricing_config
  (id, change_request_with_package, change_request_without_package,
   support_ticket_with_package, support_ticket_without_package,
   multi_service_discount_percentage)
VALUES (1, 50, 150, 25, 75, 10)
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('pricing_config', 'id'), GREATEST((SELECT MAX(id) FROM pricing_config), 1));

INSERT INTO system_settings (setting_key, setting_value, setting_type) VALUES
  ('billing.vat_rate', '24', 'number'),
  ('contact_email', 'info@kubik.gr', 'string')
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO email_templates (name, subject, body, variables, is_active) VALUES
  ('user_registration', 'Καλώς ήρθατε στο KUBIK Portal',
   '<p>Γεια σας {{first_name}},</p><p>Η demo εγγραφή σας δημιουργήθηκε.</p>',
   '["first_name"]', 1),
  ('new_user_notification', 'Νέα demo εγγραφή',
   '<p>Νέα εγγραφή: {{first_name}} {{last_name}} ({{email}})</p>',
   '["first_name","last_name","email"]', 1),
  ('user_approved', 'Ο λογαριασμός σας εγκρίθηκε',
   '<p>Γεια σας {{first_name}},</p><p>Ο λογαριασμός σας εγκρίθηκε.</p>',
   '["first_name"]', 1),
  ('password_reset', 'Επαναφορά κωδικού πρόσβασης',
   '<p>Γεια σας {{first_name}},</p><p><a href="{{reset_url}}">Επαναφορά κωδικού</a></p>',
   '["first_name","reset_url"]', 1),
  ('invoice_notification', 'Demo Invoice #{{invoice_number}}',
   '<p>Το demo invoice #{{invoice_number}} είναι διαθέσιμο.</p>',
   '["invoice_number"]', 1),
  ('ticket_status_update', 'Ενημέρωση αιτήματος #{{ticket_id}}',
   '<p>Το αίτημα {{ticket_title}} έχει νέα κατάσταση: {{status}}.</p>',
   '["ticket_id","ticket_title","status"]', 1),
  ('asset_invitation', 'Πρόσκληση στο {{asset_name}}',
   '<p>Έχετε προσκληθεί στο {{asset_name}} με ρόλο {{role}}.</p>',
   '["asset_name","role"]', 1),
  ('payment_reminder', 'Υπενθύμιση πληρωμής',
   '<p>Η υπηρεσία {{service_name}} έχει υπόλοιπο {{amount}}.</p>',
   '["service_name","amount"]', 1)
ON CONFLICT (name) DO NOTHING;

COMMIT;
