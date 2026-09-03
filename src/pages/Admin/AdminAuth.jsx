import { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react';
import BrandLogo from '../../components/BrandLogo';
import '../../styles/allPage.css';
import '../../styles/adminAuth.css';

const STORAGE_KEY = 'printstation_admin_accounts';
const SESSION_KEY = 'printstation_admin_session';
const AUTH_SUCCESS_REDIRECT = '/print/upload';

function getAccounts() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function createAccountId() {
  return crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function saveSession(account) {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      name: account.name,
      email: account.email,
    }),
  );
}

function redirectToPrintUpload() {
  window.location.href = AUTH_SUCCESS_REDIRECT;
}

export default function AdminAuth() {
  const [mode, setMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [message, setMessage] = useState({ type: '', text: '' });

  const updateField = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
    setMessage({ type: '', text: '' });
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setMessage({ type: '', text: '' });
    setShowPassword(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const password = form.password;

    if (!email || !password || (mode === 'signup' && !name)) {
      setMessage({
        type: 'error',
        text: 'Please complete all required fields.',
      });
      return;
    }

    const accounts = getAccounts();

    if (mode === 'signup') {
      if (password.length < 6) {
        setMessage({
          type: 'error',
          text: 'Password must contain at least 6 characters.',
        });
        return;
      }

      if (accounts.some((account) => account.email === email)) {
        setMessage({
          type: 'error',
          text: 'An admin account with this email already exists.',
        });
        return;
      }

      const account = {
        id: createAccountId(),
        name,
        email,
        password,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify([...accounts, account]));
      saveSession(account);
      setMessage({
        type: 'success',
        text: 'Account created successfully. Opening the upload workspace...',
      });

      setTimeout(redirectToPrintUpload, 500);
      return;
    }

    const account = accounts.find(
      (item) => item.email === email && item.password === password,
    );

    if (!account) {
      setMessage({
        type: 'error',
        text: 'Invalid email or password.',
      });
      return;
    }

    saveSession(account);
    setMessage({
      type: 'success',
      text: 'Login successful. Opening the upload workspace...',
    });

    setTimeout(redirectToPrintUpload, 500);
  };

  return (
    <main className="admin-auth-page">
      <div className="admin-auth-grid" aria-hidden="true" />
      <div className="admin-auth-glow" aria-hidden="true" />

      <section className="admin-auth-shell" aria-label="Admin authentication">
        <a
          className="admin-auth-back"
          href="/"
          aria-label="Back to PrintStation home"
        >
          <ArrowLeft size={16} />
          Back to home
        </a>

        <div className="admin-auth-card">
          <div className="admin-auth-brand">
            <BrandLogo />
          </div>

          <div className="admin-auth-heading">
            <span className="flow-eyebrow">
              <i />
              Admin Portal
            </span>

            <h1>
              {mode === 'login'
                ? 'Welcome back.'
                : 'Create your account.'}
            </h1>

            <p>
              {mode === 'login'
                ? 'Sign in to manage your PrintStation printer portal.'
                : 'Create an administrator account to access your printer portal.'}
            </p>
          </div>

          <div
            className="admin-auth-tabs"
            role="tablist"
            aria-label="Authentication mode"
          >
            <button
              type="button"
              className={mode === 'login' ? 'active' : ''}
              onClick={() => switchMode('login')}
              role="tab"
              aria-selected={mode === 'login'}
            >
              Login
            </button>

            <button
              type="button"
              className={mode === 'signup' ? 'active' : ''}
              onClick={() => switchMode('signup')}
              role="tab"
              aria-selected={mode === 'signup'}
            >
              Sign up
            </button>
          </div>

          <form className="admin-auth-form" onSubmit={handleSubmit} noValidate>
            {mode === 'signup' && (
              <label className="admin-auth-field">
                <span>Name</span>
                <div className="admin-auth-input-wrap">
                  <UserRound size={17} aria-hidden="true" />
                  <input
                    name="name"
                    value={form.name}
                    onChange={updateField}
                    placeholder="Admin name"
                    autoComplete="name"
                  />
                </div>
              </label>
            )}

            <label className="admin-auth-field">
              <span>Email address</span>
              <div className="admin-auth-input-wrap">
                <Mail size={17} aria-hidden="true" />
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={updateField}
                  placeholder="admin@example.com"
                  autoComplete="email"
                />
              </div>
            </label>

            <label className="admin-auth-field">
              <span>Password</span>
              <div className="admin-auth-input-wrap">
                <LockKeyhole size={17} aria-hidden="true" />
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={updateField}
                  placeholder="Enter your password"
                  autoComplete={
                    mode === 'login' ? 'current-password' : 'new-password'
                  }
                />

                <button
                  type="button"
                  className="admin-auth-password-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </label>

            {message.text && (
              <p
                className={`admin-auth-message is-${message.type}`}
                role="alert"
              >
                {message.text}
              </p>
            )}

            <button className="admin-auth-submit primary-button" type="submit">
              {mode === 'login'
                ? 'Login to Admin Portal'
                : 'Create Admin Account'}
            </button>
          </form>

          <p className="admin-auth-switch">
            {mode === 'login'
              ? 'Don’t have an admin account?'
              : 'Already have an admin account?'}{' '}
            <button
              type="button"
              onClick={() =>
                switchMode(mode === 'login' ? 'signup' : 'login')
              }
            >
              {mode === 'login' ? 'Sign up' : 'Login'}
            </button>
          </p>

          <p className="admin-auth-note">
            Demo authentication stores accounts locally in this browser.
            Connect a backend/auth provider before production use.
          </p>
        </div>
      </section>
    </main>
  );
}
