const pool = require('../db/pool');

// GET /services - list all services
const getServices = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM services ORDER BY id');
    res.json(rows);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getServices };
