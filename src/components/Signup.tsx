import { useState } from 'react';
import { signUpAccount } from '../api/auth';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signUpMessage, setSignUpMessage] = useState('');
  const [signUpError, setSignUpError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSignUpError('');
    setSignUpMessage('');

    if (!email || !password) {
      setSignUpError('Email and password are required.');
      return;
    }

    setLoading(true);
    const { error } = await signUpAccount({ email, password });
    setLoading(false);

    if (error) {
      setSignUpError(error.message);
      return;
    }

    setSignUpMessage(
      'Account created. Check your inbox for a confirmation email if email verification is enabled.'
    );
  };

  return (
    <form className="auth-form" onSubmit={handleSignUp}>
      <h2>Create account</h2>

      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="you@example.com"
        autoComplete="email"
        required
      />

      <label htmlFor="password">Password</label>
      <input
        id="password"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Minimum 6 characters"
        autoComplete="new-password"
        minLength={6}
        required
      />

      <button type="submit" disabled={loading}>
        {loading ? 'Creating account...' : 'Sign up'}
      </button>

      {signUpMessage ? <p className="success-text">{signUpMessage}</p> : null}
      {signUpError ? <p className="error-text">{signUpError}</p> : null}
    </form>
  );
};

export default Signup;