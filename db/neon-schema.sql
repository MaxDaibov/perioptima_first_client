CREATE TABLE IF NOT EXISTS workspace_state (
  workspace_id text PRIMARY KEY,
  state jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
