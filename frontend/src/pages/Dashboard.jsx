import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import socket from '../socket';
import UserManagement from '../components/UserManagement';

export default function Dashboard() {
  const [counters, setCounters] = useState([]);
  const [queues, setQueues] = useState([]);
  const [activeTab, setActiveTab] = useState('counters');
  const [calling, setCalling] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchData = useCallback(async () => {
    try {
      const [cRes, qRes] = await Promise.all([api.get('/counters'), api.get('/queue')]);
      // Deduplicate counters by id as safety net
      const unique = cRes.data.filter((c, i, arr) => arr.findIndex((x) => x.id === c.id) === i);
      setCounters(unique);
      setQueues(qRes.data);
    } catch {
      setError('Failed to load data');
    }
  }, []);

  useEffect(() => {
    fetchData();
    socket.on('queueUpdated', fetchData);
    return () => socket.off('queueUpdated', fetchData);
  }, [fetchData]);

  const callNext = async (counterId) => {
    setCalling(counterId);
    setError('');
    try {
      await api.post(`/queue/next/${counterId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'No waiting queues');
    } finally {
      setCalling(null);
    }
  };

  const toggleCounter = async (counter) => {
    const newStatus = counter.status === 'open' ? 'closed' : 'open';
    try {
      await api.patch(`/counters/${counter.id}/status`, { status: newStatus });
      fetchData();
    } catch {
      setError('Failed to update counter');
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const waitingCount = (serviceId) =>
    queues.filter((q) => q.service_id === serviceId && q.status === 'waiting').length;

  return (
    <div className="min-vh-100 bg-light">
      {/* Navbar */}
      <nav className="navbar navbar-dark bg-primary px-4">
        <span className="navbar-brand fw-bold">DMW RO1 — Queue Dashboard</span>
        <div className="d-flex align-items-center gap-3">
          <span className="text-white opacity-75 small">
            {user.username} ({user.role}{user.division ? ` · ${user.division}` : ''})
          </span>
          <button className="btn btn-outline-light btn-sm" onClick={logout}>Logout</button>
        </div>
      </nav>

      <div className="container-fluid p-4">
        {error && (
          <div className="alert alert-warning alert-dismissible" role="alert">
            {error}
            <button className="btn-close" onClick={() => setError('')} />
          </div>
        )}

        {/* Tabs */}
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'counters' ? 'active' : ''}`}
              onClick={() => setActiveTab('counters')}
            >
              Counters
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'queues' ? 'active' : ''}`}
              onClick={() => setActiveTab('queues')}
            >
              Queue List
            </button>
          </li>
          {user.role === 'admin' && (
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => setActiveTab('users')}
              >
                Users
              </button>
            </li>
          )}
        </ul>

        {/* Counters Tab */}
        {activeTab === 'counters' && (
          <div className="row g-3">
            {counters.map((counter) => (
              <div key={counter.id} className="col-12 col-sm-6 col-lg-4 col-xl-3">
                <div className={`card h-100 border-0 shadow-sm ${counter.status === 'closed' ? 'opacity-50' : ''}`}>
                  <div className="card-header d-flex justify-content-between align-items-center py-2 bg-white border-bottom">
                    <span className="fw-bold">{counter.name}</span>
                    <span className={`badge ${counter.status === 'open' ? 'bg-success' : 'bg-danger'}`}>
                      {counter.status}
                    </span>
                  </div>
                  <div className="card-body text-center py-3">
                    <p className="text-muted small mb-1 text-uppercase">{counter.service_name}</p>
                    <div className="display-3 fw-bold text-primary lh-1 my-2">
                      {counter.current_queue
                        ? String(counter.current_queue).padStart(3, '0')
                        : <span className="text-muted">—</span>}
                    </div>
                    <p className="text-muted small mb-0">
                      Waiting: <strong className="text-dark">{waitingCount(counter.service_id)}</strong>
                    </p>
                  </div>
                  <div className="card-footer bg-white border-top d-flex gap-2 py-2">
                    <button
                      className="btn btn-primary btn-sm flex-grow-1"
                      onClick={() => callNext(counter.id)}
                      disabled={calling === counter.id || counter.status === 'closed'}
                    >
                      {calling === counter.id
                        ? <span className="spinner-border spinner-border-sm me-1" />
                        : null}
                      Call Next
                    </button>
                    {user.role === 'admin' && (
                      <button
                        className={`btn btn-sm ${counter.status === 'open' ? 'btn-outline-danger' : 'btn-outline-success'}`}
                        onClick={() => toggleCounter(counter)}
                      >
                        {counter.status === 'open' ? 'Close' : 'Open'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Queue List Tab */}
        {activeTab === 'queues' && (
          <div className="card shadow-sm border-0">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Service</th>
                      <th>Status</th>
                      <th>Counter</th>
                      <th>Created</th>
                      <th>Served</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queues.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center text-muted py-4">No queues today</td>
                      </tr>
                    ) : (
                      queues.map((q) => (
                        <tr key={q.id}>
                          <td className="fw-bold">{String(q.queue_number).padStart(3, '0')}</td>
                          <td>{q.service_name}</td>
                          <td>
                            <span className={`badge ${
                              q.status === 'waiting' ? 'bg-warning text-dark' :
                              q.status === 'serving' ? 'bg-primary' : 'bg-success'
                            }`}>
                              {q.status}
                            </span>
                          </td>
                          <td>{q.counter_name || '—'}</td>
                          <td className="small text-muted">
                            {new Date(q.created_at).toLocaleTimeString('en-PH')}
                          </td>
                          <td className="small text-muted">
                            {q.served_at ? new Date(q.served_at).toLocaleTimeString('en-PH') : '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab (admin only) */}
        {activeTab === 'users' && user.role === 'admin' && <UserManagement />}
      </div>
    </div>
  );
}
