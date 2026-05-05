const pool = require('../db/pool');

// POST /queue - create a new queue entry for a service
const createQueue = async (req, res) => {
  const { service_id } = req.body;
  if (!service_id) return res.status(400).json({ message: 'service_id required' });

  try {
    // Verify service exists
    const svc = await pool.query('SELECT * FROM services WHERE id = $1', [service_id]);
    if (!svc.rows[0]) return res.status(404).json({ message: 'Service not found' });

    // Generate next queue number per service (reset daily)
    const today = new Date().toISOString().split('T')[0];
    const countResult = await pool.query(
      `SELECT COALESCE(MAX(queue_number), 0) AS last_num
       FROM queues
       WHERE service_id = $1 AND DATE(created_at) = $2`,
      [service_id, today]
    );
    const nextNumber = countResult.rows[0].last_num + 1;

    const { rows } = await pool.query(
      `INSERT INTO queues (queue_number, service_id, status)
       VALUES ($1, $2, 'waiting') RETURNING *`,
      [nextNumber, service_id]
    );

    const queue = { ...rows[0], service_name: svc.rows[0].name };

    // Emit real-time update
    const io = req.app.get('io');
    io.emit('queueUpdated');

    res.status(201).json(queue);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /queue - list all queues for today with service and counter info
const getQueues = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { rows } = await pool.query(
      `SELECT q.*, s.name AS service_name, c.name AS counter_name
       FROM queues q
       JOIN services s ON s.id = q.service_id
       LEFT JOIN counters c ON c.id = q.counter_id
       WHERE DATE(q.created_at) = $1
       ORDER BY q.service_id, q.queue_number`,
      [today]
    );
    res.json(rows);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /queue/next/:counterId - call next waiting queue for counter's service
const callNext = async (req, res) => {
  const { counterId } = req.params;

  try {
    // Get counter and its assigned service
    const counterResult = await pool.query(
      'SELECT * FROM counters WHERE id = $1',
      [counterId]
    );
    const counter = counterResult.rows[0];
    if (!counter) return res.status(404).json({ message: 'Counter not found' });
    if (counter.status === 'closed') {
      return res.status(400).json({ message: 'Counter is closed' });
    }

    // Mark ALL current serving queues for this counter as done (cleans up stale data)
    await pool.query(
      `UPDATE queues SET status = 'done', served_at = NOW()
       WHERE counter_id = $1 AND status = 'serving'`,
      [counterId]
    );

    // Get next waiting queue for this service (oldest first)
    const today = new Date().toISOString().split('T')[0];
    const nextResult = await pool.query(
      `SELECT q.*, s.name AS service_name
       FROM queues q
       JOIN services s ON s.id = q.service_id
       WHERE q.service_id = $1 AND q.status = 'waiting' AND DATE(q.created_at) = $2
       ORDER BY q.queue_number ASC
       LIMIT 1`,
      [counter.service_id, today]
    );

    if (!nextResult.rows[0]) {
      return res.status(404).json({ message: 'No waiting queues for this service' });
    }

    const next = nextResult.rows[0];

    // Assign queue to counter and mark as serving
    const { rows } = await pool.query(
      `UPDATE queues SET status = 'serving', counter_id = $1, served_at = NOW()
       WHERE id = $2 RETURNING *`,
      [counterId, next.id]
    );

    const updatedQueue = { ...rows[0], service_name: next.service_name, counter_name: counter.name };

    // Emit real-time events
    const io = req.app.get('io');
    io.emit('queueUpdated');
    io.emit('announce', {
      queue_number: updatedQueue.queue_number,
      service_name: updatedQueue.service_name,
      counter_name: counter.name,
    });

    res.json(updatedQueue);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const announceAgain = async (req, res) => {
  const { counterId } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT q.queue_number, s.name AS service_name, c.name AS counter_name
       FROM queues q
       JOIN services s ON s.id = q.service_id
       JOIN counters c ON c.id = q.counter_id
       WHERE q.counter_id = $1 AND q.status = 'serving'
       LIMIT 1`,
      [counterId]
    );
    if (!rows[0]) return res.status(404).json({ message: 'No active queue for this counter' });
    const io = req.app.get('io');
    io.emit('announce', rows[0]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createQueue, getQueues, callNext, announceAgain };
