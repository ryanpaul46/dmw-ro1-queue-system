import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import socket from '../socket';

export default function TVDisplay() {
  const [counters, setCounters] = useState([]);
  const [recent, setRecent] = useState([]);
  const [unlocked, setUnlocked] = useState(false);
  const pendingRef = useRef(null);

  const speak = useCallback((text) => {
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = 'en-US';
    msg.rate = 0.9;
    window.speechSynthesis.speak(msg);
  }, []);

  const fetchCounters = useCallback(async () => {
    try {
      const { data } = await api.get('/counters');
      // Deduplicate by id in case of any join duplicates
      const unique = data.filter((c, i, arr) => arr.findIndex((x) => x.id === c.id) === i);
      setCounters(unique);
    } catch {}
  }, []);

  const fetchRecent = useCallback(async () => {
    try {
      const { data } = await api.get('/queue');
      const done = data.filter((q) => q.status === 'done').slice(-10).reverse();
      setRecent(done);
    } catch {}
  }, []);

  useEffect(() => {
    fetchCounters();
    fetchRecent();

    socket.on('queueUpdated', () => {
      fetchCounters();
      fetchRecent();
    });

    socket.on('announce', ({ queue_number, counter_name }) => {
      const text = `Queue number ${queue_number}, please proceed to ${counter_name}.`;
      if (unlocked) {
        speak(text);
      } else {
        pendingRef.current = text;
      }
    });

    return () => {
      socket.off('queueUpdated');
      socket.off('announce');
    };
  }, [fetchCounters, fetchRecent]);

  const openCounters = counters.filter((c) => c.status === 'open');

  const handleUnlock = () => {
    setUnlocked(true);
    if (pendingRef.current) {
      speak(pendingRef.current);
      pendingRef.current = null;
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column bg-dark text-white" style={{ fontFamily: "'Segoe UI', sans-serif" }} onClick={!unlocked ? handleUnlock : undefined}>
      {/* Header */}
      <header className="bg-primary text-center py-3 shadow">
        <h1 className="fw-bold mb-0 fs-3 text-uppercase">
          Department of Migrant Workers — Regional Office I
        </h1>
        <p className="mb-0 opacity-75 small">Queue Display Board</p>
        {!unlocked && (
          <p className="mb-0 text-warning small mt-1">🔇 Click anywhere to enable voice announcements</p>
        )}
      </header>

      {/* Counter Grid */}
      <main className="flex-grow-1 p-4">
        <div className="row g-3 justify-content-center">
          {openCounters.map((counter) => (
            <div key={counter.id} className="col-6 col-md-4 col-xl-2">
              <div className="card border-0 h-100 text-center shadow" style={{ background: '#1e2a3a' }}>
                <div className="card-body py-4 px-2">
                  <p className="fw-bold text-uppercase text-info mb-0 small">{counter.name}</p>
                  <p className="text-white-50 mb-3" style={{ fontSize: '0.75rem' }}>{counter.service_name}</p>
                  <div className="fw-bold text-warning" style={{ fontSize: '4.5rem', lineHeight: 1 }}>
                    {counter.current_queue
                      ? String(counter.current_queue).padStart(3, '0')
                      : <span className="text-secondary">—</span>}
                  </div>
                  <p className="text-white-50 mt-2 mb-0" style={{ fontSize: '0.75rem' }}>NOW SERVING</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Recently Served */}
      {recent.length > 0 && (
        <footer className="py-3 px-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <p className="text-white-50 small mb-2 fw-bold text-uppercase">Recently Served</p>
          <div className="d-flex flex-wrap gap-2">
            {recent.map((q) => (
              <span key={q.id} className="badge bg-success fs-6 px-3 py-2">
                {q.service_name} — {String(q.queue_number).padStart(3, '0')}
              </span>
            ))}
          </div>
        </footer>
      )}

      {/* Clock */}
      <div className="text-center py-2" style={{ background: 'rgba(0,0,0,0.3)' }}>
        <Clock />
      </div>
    </div>
  );
}

function Clock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="text-white-50 fs-5 fw-bold">
      {time.toLocaleString('en-PH', { dateStyle: 'full', timeStyle: 'medium' })}
    </span>
  );
}
