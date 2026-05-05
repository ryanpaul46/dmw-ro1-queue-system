const pool = require('../db/pool');

// Division → counter id range mapping
const DIVISION_COUNTERS = {
  'Processing Division': [1, 6],
  'Welfare and Reintegration Services Division': [7, 8],
  'Protection Division': [9, 10],
};

// GET /counters
const getCounters = async (req, res) => {
  try {
    // Admin sees all; staff sees only their division's counters
    const division = req.user?.division;
    const range = division ? DIVISION_COUNTERS[division] : null;

    const { rows } = await pool.query(`
      SELECT
        c.id, c.name, c.status,
        s.id AS service_id, s.name AS service_name,
        (
          SELECT q.queue_number FROM queues q
          WHERE q.counter_id = c.id AND q.status = 'serving'
          ORDER BY q.id DESC LIMIT 1
        ) AS current_queue
      FROM counters c
      JOIN services s ON s.id = c.service_id
      WHERE ($1::int IS NULL OR c.id BETWEEN $1 AND $2)
      ORDER BY c.id
    `, [range ? range[0] : null, range ? range[1] : null]);

    res.json(rows);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /counters/:id/status - toggle counter open/closed (admin only)
const updateCounterStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!['open', 'closed'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }
  try {
    const { rows } = await pool.query(
      'UPDATE counters SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Counter not found' });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getCounters, updateCounterStatus };
