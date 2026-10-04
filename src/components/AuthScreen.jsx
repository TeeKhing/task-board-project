import { useState } from 'react';
import './AuthScreen.css';

export const AuthScreen = ({ onAuthenticate, onContinueAsGuest }) => {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSignup = mode === 'signup';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (isSignup && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAuthenticate(mode, { email: email.trim(), password });
    } catch (authError) {
      setError(authError.message || 'Unable to authenticate.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const changeMode = (nextMode) => {
    setMode(nextMode);
    setError('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <main className="auth-screen">
      <section className="auth-panel" aria-labelledby="auth-title">
        <p className="eyebrow">Task Board 1.0</p>
        <h1 id="auth-title">{isSignup ? 'Create your account' : 'Welcome back'}</h1>
        <p className="auth-intro">
          {isSignup
            ? 'Create an account to keep your tasks connected to you.'
            : 'Sign in to continue to your task board.'}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field" htmlFor="auth-email">
            Email
            <input
              autoComplete="email"
              id="auth-email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>

          <label className="auth-field" htmlFor="auth-password">
            Password
            <input
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              id="auth-password"
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={isSignup ? 8 : undefined}
              placeholder={isSignup ? 'At least 8 characters' : 'Enter your password'}
              required
            />
          </label>

          {isSignup && (
            <label className="auth-field" htmlFor="auth-confirm-password">
              Confirm password
              <input
                autoComplete="new-password"
                id="auth-confirm-password"
                name="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                minLength={8}
                placeholder="Enter your password again"
                required
              />
            </label>
          )}

          {error && <p className="auth-error" role="alert">{error}</p>}

          <button className="primary-button auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Please wait...' : isSignup ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <p className="auth-switch">
          {isSignup ? 'Already have an account?' : 'New to Task Board?'}
          <button type="button" onClick={() => changeMode(isSignup ? 'login' : 'signup')}>
            {isSignup ? 'Sign in' : 'Create account'}
          </button>
        </p>

        <div className="auth-guest">
          <span>Or</span>
          <button className="secondary-button" type="button" onClick={onContinueAsGuest}>
            Continue without an account
          </button>
        </div>
      </section>
    </main>
  );
};
