import { useState, useEffect } from 'react';
import api from '../services/api';

// Kiosk page - public, no auth required
// Touchscreen-friendly service selection
export default function Kiosk() {
  const [services, setServices] = useState([]);
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/services').then((r) => setServices(r.data)).catch(() => setError('Failed to load services'));
  }, []);

  const selectService = async (service) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/queue', { service_id: service.id });
      const ticketData = { ...data, service_name: service.name };
      setTicket(ticketData);
      // Auto-print after short delay to allow render
      setTimeout(() => window.print(), 500);
    } catch {
      setError('Failed to create queue. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => setTicket(null);

  if (ticket) {
    return (
      <div className="kiosk-ticket d-flex flex-column align-items-center justify-content-center min-vh-100 bg-white">
        {/* Print-only ticket */}
        <div className="ticket-card text-center p-5 border rounded-4 shadow-lg" style={{ maxWidth: 420 }}>
          <div className="mb-3">
            <img src="/favicon.svg" alt="DMW" height={48} />
          </div>
          <h6 className="text-muted text-uppercase fw-bold letter-spacing-2">Department of Migrant Workers</h6>
          <h6 className="text-muted mb-4">Regional Office I</h6>
          <hr />
          <p className="fs-5 text-muted mb-1">{ticket.service_name}</p>
          <div className="display-1 fw-bold text-primary my-3">{String(ticket.queue_number).padStart(3, '0')}</div>
          <p className="text-muted small">
            {new Date(ticket.created_at).toLocaleString('en-PH', {
              dateStyle: 'long',
              timeStyle: 'short',
            })}
          </p>
          <hr />
          <p className="text-muted small">Please wait for your number to be called.</p>
        </div>
        <button className="btn btn-outline-secondary btn-lg mt-4 no-print" onClick={reset}>
          ← Back to Services
        </button>
      </div>
    );
  }

  return (
    <div className="min-vh-100 d-flex flex-column bg-light">
      {/* Header */}
      <header className="bg-primary text-white text-center py-4 shadow">
        <h1 className="fw-bold mb-0 fs-2">Department of Migrant Workers</h1>
        <p className="mb-0 opacity-75">Regional Office I — Queue Management System</p>
      </header>

      <main className="flex-grow-1 d-flex flex-column align-items-center justify-content-center p-4">
        <h2 className="fw-bold mb-2 text-center">Select a Service</h2>
        <p className="text-muted mb-4 text-center fs-5">Touch the service you need</p>

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="row g-3 w-100" style={{ maxWidth: 800 }}>
          {services.map((svc) => (
            <div key={svc.id} className="col-6 col-md-4">
              <button
                className="btn btn-primary w-100 h-100 py-4 fs-5 fw-semibold rounded-4 shadow-sm"
                style={{ minHeight: 120 }}
                onClick={() => selectService(svc)}
                disabled={loading}
              >
                {svc.name}
              </button>
            </div>
          ))}
        </div>

        {loading && (
          <div className="mt-4 text-center">
            <div className="spinner-border text-primary" role="status" />
            <p className="mt-2 text-muted">Generating your ticket...</p>
          </div>
        )}
      </main>
    </div>
  );
}
