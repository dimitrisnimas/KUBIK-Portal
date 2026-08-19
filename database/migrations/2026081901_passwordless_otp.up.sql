BEGIN;

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

COMMIT;
