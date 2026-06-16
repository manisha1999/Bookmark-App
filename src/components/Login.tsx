import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginAccount } from '../api/auth';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginMessage, setLoginMessage] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError('');
    setLoginMessage('');

    if (!email || !password) {
      setLoginError('Email and password are required.');
      return;
    }

    setLoading(true);
    const { user, error } = await loginAccount({ email, password });
    setLoading(false);

    if (error) {
      const normalized = error.message.toLowerCase();
      if (normalized.includes('invalid login credentials')) {
        setLoginError('No users exist with this account. Please sign up first.');
        return;
      }

      setLoginError(error.message);
      return;
    }

    if (!user) {
      setLoginError('No users exist with this account. Please sign up first.');
      return;
    }

    setLoginMessage('Login successful.');
    navigate('/');
  };

  return (
    <form className="auth-form" onSubmit={handleLogin}>
      <h2>Login</h2>

      <label htmlFor="login-email">Email</label>
      <input
        id="login-email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="you@example.com"
        autoComplete="email"
        required
      />

      <label htmlFor="login-password">Password</label>
      <input
        id="login-password"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Your password"
        autoComplete="current-password"
        required
      />

      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>

      {loginMessage ? <p className="success-text">{loginMessage}</p> : null}
      {loginError ? <p className="error-text">{loginError}</p> : null}
    </form>
  );
};

export default Login;
