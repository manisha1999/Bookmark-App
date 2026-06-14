import React, { useEffect, useState } from 'react';
import './App.css';
import { supabase } from './lib/supabaseClient';
import Signup from './components/Signup';

type ConnectionState = 'checking' | 'connected' | 'error';

function App() {
  const [status, setStatus] = useState<ConnectionState>('checking');
  const [message, setMessage] = useState('Checking Supabase connection...');

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

  return (
    <main className="app-shell">
      <section className="card">
        <h1>React + Supabase</h1>
        <p className="subtitle">TypeScript app connected with Supabase.</p>

        <div className="status-row">
          <span className={`badge ${status}`}>{status.toUpperCase()}</span>
          <p>{message}</p>
        </div>

        <Signup />

        <p className="hint">
          Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY in your
          .env file, then restart npm start.
        </p>
      </section>
    </main>
  );
}

export default App;
