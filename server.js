const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const ws = require('ws');

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error(
    'Missing server env vars. Set SUPABASE_URL (or REACT_APP_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.'
  );
  process.exit(1);
}

let supabase;

const initSupabase = async () => {
  const { createClient } = await import('@supabase/supabase-js');
  supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    realtime: {
      transport: ws,
    },
  });
};

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'server' });
});

app.get('/api/supabase/ping', async (_req, res) => {
  try {
    const { error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    });

    if (error) {
      return res.status(500).json({ ok: false, message: error.message });
    }

    return res.json({ ok: true, message: 'Supabase connection successful.' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown server error';
    return res.status(500).json({ ok: false, message });
  }
});

initSupabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize Supabase client:', error);
    process.exit(1);
  });
