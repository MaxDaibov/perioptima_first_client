import { Pool } from '@neondatabase/serverless'

const WORKSPACE_ID = 'default'

function getPool() {
  const connectionString = globalThis.process?.env?.DATABASE_URL
  if (!connectionString) {
    return null
  }

  return new Pool({ connectionString })
}

async function ensureTable(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS workspace_state (
      workspace_id text PRIMARY KEY,
      state jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `)
}

export default async function handler(request, response) {
  const pool = getPool()
  if (!pool) {
    response.status(503).json({ error: 'DATABASE_URL is not configured' })
    return
  }

  try {
    await ensureTable(pool)

    if (request.method === 'GET') {
      const result = await pool.query(
        'SELECT state, updated_at FROM workspace_state WHERE workspace_id = $1',
        [WORKSPACE_ID],
      )

      const row = result.rows[0]
      response.status(200).json({
        state: row?.state ?? null,
        updatedAt: row?.updated_at ?? null,
      })
      return
    }

    if (request.method === 'POST') {
      const { state } = request.body ?? {}
      if (!state) {
        response.status(400).json({ error: 'state is required' })
        return
      }

      const result = await pool.query(
        `
          INSERT INTO workspace_state (workspace_id, state, updated_at)
          VALUES ($1, $2::jsonb, now())
          ON CONFLICT (workspace_id)
          DO UPDATE SET state = EXCLUDED.state, updated_at = now()
          RETURNING updated_at
        `,
        [WORKSPACE_ID, JSON.stringify(state)],
      )

      response.status(200).json({
        ok: true,
        updatedAt: result.rows[0]?.updated_at ?? new Date().toISOString(),
      })
      return
    }

    response.setHeader('Allow', 'GET, POST')
    response.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    response.status(500).json({
      error: 'Workspace persistence failed',
      detail: error instanceof Error ? error.message : 'Unknown error',
    })
  } finally {
    await pool.end()
  }
}
