import { useState, useEffect } from 'react';
import api from '../services/api';

const DIVISIONS = [
  'Processing Division',
  'Welfare and Reintegration Services Division',
  'Protection Division',
];

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ username: '', password: '', role: 'staff', division: DIVISIONS[0] });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data);
    } catch {
      setError('Failed to load users');
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const createUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post('/admin/users', form);
      setSuccess('User created successfully');
      setForm({ username: '', password: '', role: 'staff', division: DIVISIONS[0] });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user');
    }
  };

  const deleteUser = async (id) => {
    if (!confirm('Delete this user?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      fetchUsers();
    } catch {
      setError('Failed to delete user');
    }
  };

  return (
    <div className="row g-4">
      {/* Create User Form */}
      <div className="col-md-4">
        <div className="card shadow-sm border-0">
          <div className="card-body">
            <h5 className="fw-bold mb-3">Add New User</h5>
            {error && <div className="alert alert-danger py-2 small">{error}</div>}
            {success && <div className="alert alert-success py-2 small">{success}</div>}
            <form onSubmit={createUser}>
              <div className="mb-3">
                <label className="form-label">Username</label>
                <input
                  className="form-control"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Role</label>
                <select
                  className="form-select"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {/* Division only required for staff */}
              {form.role === 'staff' && (
                <div className="mb-3">
                  <label className="form-label">Division</label>
                  <select
                    className="form-select"
                    value={form.division}
                    onChange={(e) => setForm({ ...form, division: e.target.value })}
                    required
                  >
                    {DIVISIONS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              )}
              <button className="btn btn-primary w-100">Create User</button>
            </form>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="col-md-8">
        <div className="card shadow-sm border-0">
          <div className="card-body p-0">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Division</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="fw-semibold">{u.username}</td>
                    <td>
                      <span className={`badge ${u.role === 'admin' ? 'bg-danger' : 'bg-secondary'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="small">{u.division || <span className="text-muted">—</span>}</td>
                    <td className="small text-muted">
                      {new Date(u.created_at).toLocaleDateString('en-PH')}
                    </td>
                    <td>
                      {u.id !== currentUser.id && (
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => deleteUser(u.id)}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
