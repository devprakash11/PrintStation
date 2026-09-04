import { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import BrandLogo from '../../../components/common/BrandLogo';
import { useAuth } from '../../../context/AuthContext.jsx';

export default function AdminAuth() {
  const [mode, setMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [message, setMessage] = useState({ type: '', text: '' });
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setMessage({ type: '', text: '' });
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setMessage({ type: '', text: '' });
    setShowPassword(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const password = form.password;

    if (!email || !password || (mode === 'signup' && !name)) {
      setMessage({ type: 'error', text: 'Please complete all required fields.' });
      return;
    }
    if (mode === 'signup' && password.length < 8) {
      setMessage({ type: 'error', text: 'Password must contain at least 8 characters.' });
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        await signup({ name, email, password });
      } else {
        await login({ email, password });
      }
      const destination = location.state?.from || '/admin/dashboard';
      navigate(destination, { replace: true });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Authentication failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-auth-page">
      <div className="admin-auth-grid" aria-hidden="true" />
      <div className="admin-auth-glow" aria-hidden="true" />
      <section className="admin-auth-shell" aria-label="Admin authentication">
        <Link className="admin-auth-back" to="/">
          <ArrowLeft size={16} />
          Back to home
        </Link>

        <div className="admin-auth-card">
          <div className="admin-auth-brand"><BrandLogo /></div>

          <div className="admin-auth-heading">
            <span className="flow-eyebrow"><i />Admin Portal</span>
            <h1>{mode === 'login' ? 'Welcome back.' : 'Create your account.'}</h1>
            <p>
              {mode === 'login'
                ? 'Sign in to manage your PrintStation printer portal.'
                : 'Create the initial administrator account for your printer portal.'}
            </p>
          </div>

          <div className="admin-auth-tabs" role="tablist" aria-label="Authentication mode">
            <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => switchMode('login')}>Login</button>
            <button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => switchMode('signup')}>Sign up</button>
          </div>

          <form className="admin-auth-form" onSubmit={handleSubmit} noValidate>
            {mode === 'signup' && (
              <label className="admin-auth-field">
                <span>Name</span>
                <div className="admin-auth-input-wrap">
                  <UserRound size={17} aria-hidden="true" />
                  <input name="name" value={form.name} onChange={updateField} placeholder="Admin name" autoComplete="name" />
                </div>
              </label>
            )}

            <label className="admin-auth-field">
              <span>Email address</span>
              <div className="admin-auth-input-wrap">
                <Mail size={17} aria-hidden="true" />
                <input name="email" type="email" value={form.email} onChange={updateField} placeholder="admin@example.com" autoComplete="email" />
              </div>
            </label>

            <label className="admin-auth-field">
              <span>Password</span>
              <div className="admin-auth-input-wrap">
                <LockKeyhole size={17} aria-hidden="true" />
                <input name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={updateField} placeholder="Enter your password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
                <button type="button" className="admin-auth-password-toggle" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </label>

            {message.text && <p className={`admin-auth-message is-${message.type}`} role="alert">{message.text}</p>}

            <button className="admin-auth-submit primary-button" type="submit" disabled={loading}>
              {loading ? 'Processing...' : mode === 'login' ? 'Login to Admin Portal' : 'Create Admin Account'}
            </button>
          </form>

          <p className="admin-auth-switch">
            {mode === 'login' ? 'Don’t have an admin account?' : 'Already have an admin account?'}{' '}
            <button type="button" onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}>
              {mode === 'login' ? 'Sign up' : 'Login'}
            </button>
          </p>

          <p className="admin-auth-note">
            Admin access is verified by the PrintStation backend on every protected session.
          </p>
        </div>
      </section>
    </main>
  );
}
