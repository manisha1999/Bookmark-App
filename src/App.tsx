import React, { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import './App.css';
import { supabase } from './lib/supabaseClient';
import Signup from './components/Signup';
import Login from './components/Login';
import Home from './components/Home';

type ConnectionState = 'checking' | 'connected' | 'error';

function App() {
  const location = useLocation();
  const [status, setStatus] = useState<ConnectionState>('checking');
  const [message, setMessage] = useState('Checking Supabase connection...');

  const isAuthRoute =
    location.pathname === '/signup' || location.pathname === '/login';

  useEffect(() => {
    const checkSupabaseConnection = async () => {
      try {
        const { error } = await supabase.auth.getSession();

        if (error) {
          setStatus('error');
          setMessage(error.message);
          return;
        }

        setStatus('connected');
        setMessage('Supabase is connected and ready.');
      } catch (err) {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    void checkSupabaseConnection();
  }, []);

  if (isAuthRoute) {
    return (
      <main className="app-shell">
        <section className="card">
          <h1>React + Supabase</h1>
          <p className="subtitle">TypeScript app connected with Supabase.</p>

          <div className="status-row">
            <span className={`badge ${status}`}>{status.toUpperCase()}</span>
            <p>{message}</p>
          </div>

          <nav className="auth-nav" aria-label="Authentication pages">
            <Link to="/signup">Signup</Link>
            <Link to="/login">Login</Link>
          </nav>

          <Routes>
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/signup" replace />} />
          </Routes>

          <p className="hint">
            Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY in your
            .env file, then restart npm start.
          </p>
        </section>
      </main>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={<Home status={status.toUpperCase()} message={message} />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
