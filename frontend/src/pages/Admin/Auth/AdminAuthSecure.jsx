import { useEffect, useState } from 'react';
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import BrandLogo from '../../../components/common/BrandLogo';
import { useAuth } from '../../../context/AuthContext.jsx';
import '../../../styles/adminAuth.css';

export default function AdminAuthSecure() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate(location.state?.from || '/admin/dashboard', { replace: true });
    }
  }, [authLoading, isAuthenticated, location.state, navigate]);

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setMessage({ type: '', text: '' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const email = form.email.trim().toLowerCase();
    const password = form.password;

    if (!email || !password) {
      setMessage({ type: 'error', text: 'Enter your email address and password.' });
      return;
    }
    if (password.length < 8) {
      setMessage({ type: 'error', text: 'Password must contain at least 8 characters.' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      await login({ email, password });
      navigate(location.state?.from || '/admin/dashboard', { replace: true });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Authentication failed. Please try again.' });
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
          <ArrowLeft size={16} /> Back to home
        </Link>

        <div className="admin-auth-card">
          <div className="admin-auth-brand"><BrandLogo /></div>
          <div className="admin-auth-heading">
            <span className="flow-eyebrow"><i />Admin Portal</span>
            <h1>Welcome back.</h1>
            <p>Sign in to manage your PrintStation printer portal.</p>
          </div>

          <form className="admin-auth-form" onSubmit={handleSubmit} noValidate>
            <label className="admin-auth-field">
              <span>Email address</span>
              <div className="admin-auth-input-wrap">
                <Mail size={17} aria-hidden="true" />
                <input name="email" type="email" value={form.email} onChange={updateField} placeholder="admin@example.com" autoComplete="username" />
              </div>
            </label>

            <label className="admin-auth-field">
              <span>Password</span>
              <div className="admin-auth-input-wrap">
                <LockKeyhole size={17} aria-hidden="true" />
                <input name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={updateField} placeholder="Enter your password" autoComplete="current-password" />
                <button type="button" className="admin-auth-password-toggle" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </label>

            {message.text && <p className={`admin-auth-message is-${message.type}`} role="alert">{message.text}</p>}

            <button className="admin-auth-submit primary-button" type="submit" disabled={loading || authLoading}>
              {loading ? 'Signing in...' : 'Login to Admin Portal'}
            </button>
          </form>

          <p className="admin-auth-note">Authentication is handled by the PrintStation backend. Account creation and password recovery are managed by the server administrator.</p>
        </div>
      </section>
    </main>
  );
}
