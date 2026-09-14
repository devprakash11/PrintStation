import { useEffect, useState } from 'react';
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import BrandLogo from '../../../components/common/BrandLogo';
import { useAuth } from '../../../context/AuthContext.jsx';
import { request } from '../../../services/api.js';
import '../../../styles/adminAuth.css';

export default function AdminAuthSecure() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const [mode, setMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (isAuthenticated && !authLoading) navigate(location.state?.from || '/admin/dashboard', { replace: true });
  }, [authLoading, isAuthenticated, location.state, navigate]);

  const updateField = (event) => {
    setForm(current => ({ ...current, [event.target.name]: event.target.value }));
    setMessage({ type: '', text: '' });
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setMessage({ type: '', text: '' });
    setShowPassword(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const email = form.email.trim().toLowerCase();
    const name = form.name.trim();
    if (!email || !form.password || (mode === 'signup' && !name)) {
      setMessage({ type: 'error', text: mode === 'signup' ? 'Complete all fields.' : 'Enter your email address and password.' });
      return;
    }
    if (form.password.length < 8) {
      setMessage({ type: 'error', text: 'Password must contain at least 8 characters.' });
      return;
    }
    if (mode === 'signup' && form.password !== form.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      if (mode === 'login') {
        await login({ email, password: form.password });
        navigate(location.state?.from || '/admin/dashboard', { replace: true });
      } else {
        const response = await request('/auth/signup', {
          method: 'POST',
          body: JSON.stringify({ name, email, password: form.password }),
        });
        const user = response?.data?.user;
        const token = response?.data?.token;
        if (!user || !token) throw new Error('Account created but no session was returned.');
        localStorage.setItem('printstation_admin_token', token);
        localStorage.setItem('printstation_admin_session', JSON.stringify(user));
        setMessage({ type: 'success', text: response.message || 'Account created successfully.' });
        window.setTimeout(() => navigate('/admin/dashboard', { replace: true }), 500);
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Authentication failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const isSignup = mode === 'signup';

  return (
    <main className="admin-auth-page">
      <div className="admin-auth-grid" aria-hidden="true" />
      <div className="admin-auth-glow" aria-hidden="true" />
      <section className="admin-auth-shell" aria-label="Admin authentication">
        <Link className="admin-auth-back" to="/"><ArrowLeft size={16} /> Back to home</Link>
        <div className="admin-auth-card">
          <div className="admin-auth-brand"><BrandLogo /></div>
          <div className="admin-auth-heading">
            <span className="flow-eyebrow"><i />Admin Portal</span>
            <h1>{isSignup ? 'Create your account.' : 'Welcome back.'}</h1>
            <p>{isSignup ? 'Create a PrintStation account to access the management portal.' : 'Sign in to manage your PrintStation printer portal.'}</p>
          </div>
          <div className="admin-auth-tabs" role="tablist" aria-label="Authentication mode">
            <button type="button" className={!isSignup ? 'active' : ''} onClick={() => switchMode('login')}>Login</button>
            <button type="button" className={isSignup ? 'active' : ''} onClick={() => switchMode('signup')}>Sign up</button>
          </div>
          <form className="admin-auth-form" onSubmit={handleSubmit} noValidate>
            {isSignup && <label className="admin-auth-field"><span>Name</span><div className="admin-auth-input-wrap"><UserRound size={17} aria-hidden="true" /><input name="name" value={form.name} onChange={updateField} placeholder="Your name" autoComplete="name" /></div></label>}
            <label className="admin-auth-field"><span>Email address</span><div className="admin-auth-input-wrap"><Mail size={17} aria-hidden="true" /><input name="email" type="email" value={form.email} onChange={updateField} placeholder="admin@example.com" autoComplete="email" /></div></label>
            <label className="admin-auth-field"><span>Password</span><div className="admin-auth-input-wrap"><LockKeyhole size={17} aria-hidden="true" /><input name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={updateField} placeholder="Enter your password" autoComplete={isSignup ? 'new-password' : 'current-password'} /><button type="button" className="admin-auth-password-toggle" onClick={() => setShowPassword(current => !current)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
            {isSignup && <label className="admin-auth-field"><span>Confirm password</span><div className="admin-auth-input-wrap"><LockKeyhole size={17} aria-hidden="true" /><input name="confirmPassword" type={showPassword ? 'text' : 'password'} value={form.confirmPassword} onChange={updateField} placeholder="Confirm your password" autoComplete="new-password" /></div></label>}
            {message.text && <p className={`admin-auth-message is-${message.type}`} role="alert">{message.text}</p>}
            <button className="admin-auth-submit primary-button" type="submit" disabled={loading || authLoading}>{loading ? (isSignup ? 'Creating account...' : 'Signing in...') : (isSignup ? 'Create Account' : 'Login to Admin Portal')}</button>
          </form>
          <p className="admin-auth-note">Passwords are securely hashed on the server. The first account created gets administrator access; later public signups receive staff access.</p>
        </div>
      </section>
    </main>
  );
}
