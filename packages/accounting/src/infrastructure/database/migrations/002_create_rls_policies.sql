-- 002_rls_policies.sql - Enhanced RLS with FORCE RLS and secure tenant context

-- Enable & force RLS on accounting event table
ALTER TABLE acc_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE acc_event FORCE ROW LEVEL SECURITY;

-- Enable & force RLS on account table
ALTER TABLE account ENABLE ROW LEVEL SECURITY;
ALTER TABLE account FORCE ROW LEVEL SECURITY;

-- Enable & force RLS on general ledger table
ALTER TABLE gl_entry ENABLE ROW LEVEL SECURITY;
ALTER TABLE gl_entry FORCE ROW LEVEL SECURITY;

-- Enable & force RLS on outbox event table
ALTER TABLE outbox_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbox_event FORCE ROW LEVEL SECURITY;

-- Create a safe role for tenant context management
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_tenant_context') THEN
    CREATE ROLE app_tenant_context NOLOGIN;
  END IF;
END$$;

-- Enhanced tenant context setter with security definer
CREATE OR REPLACE FUNCTION set_tenant_context(tenant_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Optional: verify the current_user is allowed for this tenant
  -- IF NOT EXISTS (
  --   SELECT 1 FROM tenant_members tm WHERE tm.tenant_id = tenant_uuid AND tm.user_name = current_user
  -- ) THEN
  --   RAISE EXCEPTION 'User % is not a member of tenant %', current_user, tenant_uuid;
  -- END IF;

  PERFORM set_config('app.tenant_id', tenant_uuid::text, true);
END;
$$;

-- Ensure only the safe role can execute (grant to your API role, not to PUBLIC)
REVOKE ALL ON FUNCTION set_tenant_context(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION set_tenant_context(uuid) TO app_tenant_context;

-- RLS policies for accounting events: visibility and write restrictions
DROP POLICY IF EXISTS acc_event_tenant_select ON acc_event;
CREATE POLICY acc_event_tenant_select ON acc_event
  FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

DROP POLICY IF EXISTS acc_event_tenant_insert ON acc_event;
CREATE POLICY acc_event_tenant_insert ON acc_event
  FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- RLS policies for accounts
DROP POLICY IF EXISTS account_tenant_select ON account;
CREATE POLICY account_tenant_select ON account
  FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

DROP POLICY IF EXISTS account_tenant_insert ON account;
CREATE POLICY account_tenant_insert ON account
  FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

DROP POLICY IF EXISTS account_tenant_update ON account;
CREATE POLICY account_tenant_update ON account
  FOR UPDATE
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- RLS policies for general ledger entries
DROP POLICY IF EXISTS gl_entry_tenant_select ON gl_entry;
CREATE POLICY gl_entry_tenant_select ON gl_entry
  FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

DROP POLICY IF EXISTS gl_entry_tenant_insert ON gl_entry;
CREATE POLICY gl_entry_tenant_insert ON gl_entry
  FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- RLS policies for outbox events
DROP POLICY IF EXISTS outbox_event_tenant_select ON outbox_event;
CREATE POLICY outbox_event_tenant_select ON outbox_event
  FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

DROP POLICY IF EXISTS outbox_event_tenant_insert ON outbox_event;
CREATE POLICY outbox_event_tenant_insert ON outbox_event
  FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

DROP POLICY IF EXISTS outbox_event_tenant_update ON outbox_event;
CREATE POLICY outbox_event_tenant_update ON outbox_event
  FOR UPDATE
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);
