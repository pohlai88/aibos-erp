-- 001_acc_event.sql - Create accounting event store table with append-only enforcement

CREATE TABLE IF NOT EXISTS acc_event (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL,
  stream_id         uuid NOT NULL,
  version           integer NOT NULL CHECK (version >= 1),
  event_type        varchar(255) NOT NULL,
  event_data        jsonb NOT NULL,
  metadata          jsonb,
  occurred_at       timestamptz NOT NULL DEFAULT now(),
  correlation_id    uuid,
  causation_id      uuid,
  idempotency_key   varchar(128) UNIQUE,

  -- Optimistic concurrency per stream + tenant
  UNIQUE (tenant_id, stream_id, version)
);

-- Hot-path indexes
CREATE INDEX IF NOT EXISTS acc_event_tenant_time_idx ON acc_event (tenant_id, occurred_at);
CREATE INDEX IF NOT EXISTS acc_event_tenant_type_idx ON acc_event (tenant_id, event_type);

-- Enforce append-only (no UPDATE/DELETE)
CREATE OR REPLACE FUNCTION forbid_mutations_on_acc_event()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP IN ('UPDATE','DELETE') THEN
    RAISE EXCEPTION 'acc_event is append-only. Operation % is not allowed', TG_OP
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS acc_event_no_update_delete ON acc_event;
CREATE TRIGGER acc_event_no_update_delete
  BEFORE UPDATE OR DELETE ON acc_event
  FOR EACH ROW EXECUTE FUNCTION forbid_mutations_on_acc_event();
