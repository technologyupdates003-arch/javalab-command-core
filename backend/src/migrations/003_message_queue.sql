-- Javalab Tech HQ System - Message Queue Schema
-- This migration creates tables for task queuing and tracking

-- Queued tasks table
CREATE TABLE queued_tasks (
  id VARCHAR(255) PRIMARY KEY,
  type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  retries INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  error TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP,
  INDEX idx_type (type),
  INDEX idx_status (status),
  INDEX idx_priority (priority),
  INDEX idx_created_at (created_at),
  INDEX idx_status_created (status, created_at),
  INDEX idx_type_status (type, status),
  INDEX idx_failed_tasks (status, created_at DESC)
);

-- Queue statistics table
CREATE TABLE queue_statistics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  queue_name VARCHAR(100) NOT NULL,
  pending_count INTEGER DEFAULT 0,
  processing_count INTEGER DEFAULT 0,
  completed_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  average_processing_time FLOAT,
  max_processing_time FLOAT,
  min_processing_time FLOAT,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_queue_name (queue_name),
  INDEX idx_recorded_at (recorded_at),
  INDEX idx_queue_recorded (queue_name, recorded_at DESC)
);

-- Task retry history table
CREATE TABLE task_retry_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id VARCHAR(255) NOT NULL REFERENCES queued_tasks(id),
  retry_number INTEGER NOT NULL,
  error_message TEXT,
  retry_at TIMESTAMP,
  completed_at TIMESTAMP,
  INDEX idx_task_id (task_id),
  INDEX idx_retry_number (retry_number),
  INDEX idx_retry_at (retry_at),
  INDEX idx_task_retry (task_id, retry_number)
);

-- Dead letter queue table
CREATE TABLE dead_letter_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id VARCHAR(255) NOT NULL,
  task_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  error_message TEXT,
  final_error TEXT,
  max_retries_exceeded BOOLEAN DEFAULT TRUE,
  moved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_task_id (task_id),
  INDEX idx_task_type (task_type),
  INDEX idx_moved_at (moved_at),
  INDEX idx_task_type_moved (task_type, moved_at DESC)
);

-- Queue event log table
CREATE TABLE queue_event_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('queued', 'processing', 'completed', 'failed', 'retried', 'dead_lettered')),
  event_details JSONB,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_task_id (task_id),
  INDEX idx_event_type (event_type),
  INDEX idx_timestamp (timestamp),
  INDEX idx_task_event (task_id, event_type),
  INDEX idx_event_timestamp (event_type, timestamp DESC)
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_queued_tasks_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER queued_tasks_update_timestamp BEFORE UPDATE ON queued_tasks
  FOR EACH ROW EXECUTE FUNCTION update_queued_tasks_timestamp();

-- Create function to log queue events
CREATE OR REPLACE FUNCTION log_queue_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO queue_event_logs (task_id, event_type, event_details)
  VALUES (NEW.id, 'queued', jsonb_build_object('priority', NEW.priority, 'type', NEW.type));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for queue event logging
CREATE TRIGGER queued_tasks_log_event AFTER INSERT ON queued_tasks
  FOR EACH ROW EXECUTE FUNCTION log_queue_event();

-- Create indexes for common queries
CREATE INDEX idx_queued_tasks_pending_priority ON queued_tasks(status, priority) WHERE status = 'pending';
CREATE INDEX idx_queued_tasks_failed_recent ON queued_tasks(status, created_at DESC) WHERE status = 'failed';
CREATE INDEX idx_queued_tasks_processing ON queued_tasks(status) WHERE status = 'processing';
CREATE INDEX idx_task_retry_history_task ON task_retry_history(task_id, retry_number DESC);
CREATE INDEX idx_dead_letter_queue_recent ON dead_letter_queue(moved_at DESC);

-- Create view for queue health
CREATE VIEW queue_health AS
SELECT
  COUNT(*) as total_tasks,
  SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_tasks,
  SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing_tasks,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_tasks,
  AVG(EXTRACT(EPOCH FROM (processed_at - created_at))) as avg_processing_time_seconds,
  MAX(EXTRACT(EPOCH FROM (processed_at - created_at))) as max_processing_time_seconds,
  MIN(EXTRACT(EPOCH FROM (processed_at - created_at))) as min_processing_time_seconds
FROM queued_tasks
WHERE processed_at IS NOT NULL;

-- Create view for failed tasks
CREATE VIEW failed_tasks_view AS
SELECT
  id,
  type,
  payload,
  priority,
  retries,
  max_retries,
  error,
  created_at,
  updated_at
FROM queued_tasks
WHERE status = 'failed'
ORDER BY updated_at DESC;

-- Create view for queue statistics
CREATE VIEW queue_stats_view AS
SELECT
  type,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
  SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
  AVG(retries) as avg_retries,
  MAX(retries) as max_retries_used
FROM queued_tasks
GROUP BY type;
