-- Projection Checkpoint System
-- Phase 2 Week 7-8: Resumable projection processing

-- Projection checkpoints table
CREATE TABLE projection_checkpoint (
  projector_name TEXT NOT NULL,
  topic TEXT NOT NULL,
  partition INT NOT NULL,
  offset BIGINT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (projector_name, topic, partition)
);

-- Projection status table
CREATE TABLE projection_status (
  projector_name TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'stopped', -- stopped|running|paused|error
  last_processed_at TIMESTAMPTZ,
  last_error TEXT,
  processed_count BIGINT DEFAULT 0,
  error_count BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Projection metrics table
CREATE TABLE projection_metrics (
  projector_name TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (projector_name, metric_name, recorded_at)
);

-- Indexes for performance
CREATE INDEX idx_projection_checkpoint_updated_at ON projection_checkpoint(updated_at);
CREATE INDEX idx_projection_status_status ON projection_status(status);
CREATE INDEX idx_projection_metrics_recorded_at ON projection_metrics(recorded_at);

-- Row Level Security (RLS) for multi-tenancy
ALTER TABLE projection_checkpoint ENABLE ROW LEVEL SECURITY;
ALTER TABLE projection_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE projection_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies (projection tables are system-level, no tenant isolation needed)
CREATE POLICY projection_checkpoint_system_access ON projection_checkpoint
  FOR ALL TO PUBLIC
  USING (true);

CREATE POLICY projection_status_system_access ON projection_status
  FOR ALL TO PUBLIC
  USING (true);

CREATE POLICY projection_metrics_system_access ON projection_metrics
  FOR ALL TO PUBLIC
  USING (true);

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_projection_status_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_projection_status_updated_at 
    BEFORE UPDATE ON projection_status 
    FOR EACH ROW EXECUTE FUNCTION update_projection_status_updated_at_column();

-- Utility functions for projection management
CREATE OR REPLACE FUNCTION get_projection_lag(projector_name TEXT)
RETURNS TABLE (
  topic TEXT,
  partition INT,
  lag_ms BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pc.topic,
    pc.partition,
    EXTRACT(EPOCH FROM (NOW() - pc.updated_at)) * 1000 as lag_ms
  FROM projection_checkpoint pc
  WHERE pc.projector_name = get_projection_lag.projector_name
  ORDER BY pc.topic, pc.partition;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION reset_projection_checkpoint(projector_name TEXT, topic TEXT, partition INT)
RETURNS void AS $$
BEGIN
  DELETE FROM projection_checkpoint 
  WHERE projection_checkpoint.projector_name = reset_projection_checkpoint.projector_name
    AND projection_checkpoint.topic = reset_projection_checkpoint.topic
    AND projection_checkpoint.partition = reset_projection_checkpoint.partition;
    
  INSERT INTO projection_checkpoint (projector_name, topic, partition, offset)
  VALUES (reset_projection_checkpoint.projector_name, reset_projection_checkpoint.topic, reset_projection_checkpoint.partition, -1);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cleanup_old_projection_metrics(retention_days INT DEFAULT 30)
RETURNS void AS $$
BEGIN
  DELETE FROM projection_metrics 
  WHERE recorded_at < NOW() - INTERVAL '1 day' * retention_days;
END;
$$ LANGUAGE plpgsql;
