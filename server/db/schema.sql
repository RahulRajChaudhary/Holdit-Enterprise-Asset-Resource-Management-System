
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS departments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL,
  code                  TEXT NOT NULL UNIQUE,
  head_user_id          UUID,
  parent_department_id  UUID REFERENCES departments(id),
  status                TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  email               TEXT NOT NULL UNIQUE,
  password_hash       TEXT NOT NULL,
  role                TEXT NOT NULL DEFAULT 'EMPLOYEE'
                        CHECK (role IN ('EMPLOYEE', 'DEPARTMENT_HEAD', 'ASSET_MANAGER', 'ADMIN')),
  department_id       UUID REFERENCES departments(id),
  status              TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'LOCKED')),
  failed_login_count  INT NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE departments
  DROP CONSTRAINT IF EXISTS departments_head_user_id_fkey;
ALTER TABLE departments
  ADD CONSTRAINT departments_head_user_id_fkey
  FOREIGN KEY (head_user_id) REFERENCES users(id);

CREATE TABLE IF NOT EXISTS asset_categories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL UNIQUE,
  custom_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE SEQUENCE IF NOT EXISTS asset_tag_seq;

CREATE TABLE IF NOT EXISTS assets (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_tag         TEXT NOT NULL UNIQUE
                      DEFAULT ('AF-' || lpad(nextval('asset_tag_seq')::text, 4, '0')),
  name              TEXT NOT NULL,
  category_id       UUID REFERENCES asset_categories(id),
  serial_number     TEXT,
  acquisition_date  DATE,
  acquisition_cost  NUMERIC(12, 2) CHECK (acquisition_cost IS NULL OR acquisition_cost > 0),
  condition         TEXT NOT NULL DEFAULT 'GOOD' CHECK (condition IN ('NEW', 'GOOD', 'FAIR', 'DAMAGED')),
  location          TEXT,
  is_bookable       BOOLEAN NOT NULL DEFAULT false,
  status            TEXT NOT NULL DEFAULT 'AVAILABLE'
                      CHECK (status IN ('AVAILABLE', 'ALLOCATED', 'RESERVED', 'UNDER_MAINTENANCE',
                                         'LOST', 'RETIRED', 'DISPOSED')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);

CREATE TABLE IF NOT EXISTS allocations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id              UUID NOT NULL REFERENCES assets(id),
  holder_type           TEXT NOT NULL CHECK (holder_type IN ('EMPLOYEE', 'DEPARTMENT')),
  employee_id           UUID REFERENCES users(id),
  department_id         UUID REFERENCES departments(id),
  expected_return_date  DATE,
  status                TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'RETURNED')),
  allocated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  returned_at           TIMESTAMPTZ,
  return_condition      TEXT CHECK (return_condition IS NULL OR return_condition IN ('NEW', 'GOOD', 'FAIR', 'DAMAGED')),
  return_notes          TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (holder_type = 'EMPLOYEE' AND employee_id IS NOT NULL AND department_id IS NULL) OR
    (holder_type = 'DEPARTMENT' AND department_id IS NOT NULL AND employee_id IS NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_allocations_one_active_per_asset
  ON allocations(asset_id) WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_allocations_asset ON allocations(asset_id);

ALTER TABLE allocations ADD COLUMN IF NOT EXISTS return_requested_at TIMESTAMPTZ;
ALTER TABLE allocations ADD COLUMN IF NOT EXISTS return_requested_by UUID REFERENCES users(id);

CREATE TABLE IF NOT EXISTS transfer_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id          UUID NOT NULL REFERENCES assets(id),
  allocation_id     UUID NOT NULL REFERENCES allocations(id),
  to_employee_id    UUID REFERENCES users(id),
  to_department_id  UUID REFERENCES departments(id),
  reason            TEXT,
  status            TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  requested_by      UUID NOT NULL REFERENCES users(id),
  decided_by        UUID REFERENCES users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (to_employee_id IS NOT NULL AND to_department_id IS NULL) OR
    (to_employee_id IS NULL AND to_department_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_transfer_requests_status ON transfer_requests(status);
CREATE INDEX IF NOT EXISTS idx_transfer_requests_asset ON transfer_requests(asset_id);

CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS bookings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id    UUID NOT NULL REFERENCES assets(id),
  booked_by   UUID NOT NULL REFERENCES users(id),
  start_time  TIMESTAMPTZ NOT NULL,
  end_time    TIMESTAMPTZ NOT NULL,
  purpose     TEXT,
  status      TEXT NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED', 'CANCELLED')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_time > start_time)
);

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_no_overlap;
ALTER TABLE bookings ADD CONSTRAINT bookings_no_overlap
  EXCLUDE USING gist (
    asset_id WITH =,
    tstzrange(start_time, end_time) WITH &&
  ) WHERE (status = 'CONFIRMED');

CREATE INDEX IF NOT EXISTS idx_bookings_asset ON bookings(asset_id);

CREATE TABLE IF NOT EXISTS maintenance_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id          UUID NOT NULL REFERENCES assets(id),
  raised_by         UUID NOT NULL REFERENCES users(id),
  issue_description TEXT NOT NULL,
  priority          TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
  status            TEXT NOT NULL DEFAULT 'PENDING'
                      CHECK (status IN ('PENDING', 'REJECTED', 'APPROVED', 'TECHNICIAN_ASSIGNED', 'IN_PROGRESS', 'RESOLVED')),
  technician_name   TEXT,
  decided_by        UUID REFERENCES users(id),
  resolved_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_requests_asset ON maintenance_requests(asset_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_status ON maintenance_requests(status);

CREATE TABLE IF NOT EXISTS audit_cycles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  location    TEXT,
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  status      TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
  created_by  UUID NOT NULL REFERENCES users(id),
  closed_at   TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS audit_cycle_auditors (
  cycle_id  UUID NOT NULL REFERENCES audit_cycles(id),
  user_id   UUID NOT NULL REFERENCES users(id),
  PRIMARY KEY (cycle_id, user_id)
);

CREATE TABLE IF NOT EXISTS audit_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id      UUID NOT NULL REFERENCES audit_cycles(id),
  asset_id      UUID NOT NULL REFERENCES assets(id),
  verification  TEXT CHECK (verification IS NULL OR verification IN ('VERIFIED', 'MISSING', 'DAMAGED')),
  verified_by   UUID REFERENCES users(id),
  verified_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cycle_id, asset_id)
);

CREATE INDEX IF NOT EXISTS idx_audit_items_cycle ON audit_items(cycle_id);

CREATE TABLE IF NOT EXISTS activity_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id     UUID REFERENCES users(id),
  action       TEXT NOT NULL,
  entity_type  TEXT NOT NULL,
  entity_id    UUID,
  message      TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
