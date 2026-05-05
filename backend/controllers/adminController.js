const pool = require('../db/pool');
const bcrypt = require('bcryptjs');

// GET /admin/users
const getUsers = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, username, role, division, created_at FROM users ORDER BY id'
    );
    res.json(rows);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

const DIVISIONS = [
  'Processing Division',
  'Welfare and Reintegration Services Division',
  'Protection Division',
];

// POST /admin/users
const createUser = async (req, res) => {
  const { username, password, role, division } = req.body;
  if (!username || !password || !['admin', 'staff'].includes(role)) {
    return res.status(400).json({ message: 'username, password, and valid role required' });
  }
  if (role === 'staff' && !DIVISIONS.includes(division)) {
    return res.status(400).json({ message: 'Valid division required for staff' });
  }
  try {
    const hashed = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      'INSERT INTO users (username, password, role, division) VALUES ($1, $2, $3, $4) RETURNING id, username, role, division',
      [username, hashed, role, role === 'staff' ? division : null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ message: 'Username already exists' });
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /admin/users/:id
const deleteUser = async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ message: 'User deleted' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getUsers, createUser, deleteUser };
