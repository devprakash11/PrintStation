import { useEffect, useState } from 'react';
import { ArrowLeft, Eye, EyeOff, KeyRound, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import BrandLogo from '../../../components/common/BrandLogo';
import { useAuth } from '../../../context/AuthContext.jsx';
import { authService } from '../../../services/authService.js';
import '../../../styles/adminAuth.css';
import '../../../styles/adminAuthPasswordReset.css';

export default function AdminAuthSecure() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, signup } = useAuth();
  const resetToken = new URLSearchParams(location.search).get('token');
  const [mode, setMode] = useState(resetToken ? 'reset' : 'login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => { if (resetToken) setMode('reset'); }, [resetToken]);
  const updateField = (event) => { setForm((current) => ({ ...current, [event.target.name]: event.target.value })); setMessage({ type: '', text: '' }); };
  const switchMode = (nextMode) => { setMode(nextMode); setMessage({ type: '', text: '' }); setShowPassword(false); };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const email = form.email.trim().toLowerCase();
    const password = form.password;

    if (mode === 'forgot') {
      if (!email) return setMessage({ type: 'error', text: 'Enter your admin email address.' });
      setLoading(true);
      try { const response = await authService.forgotPassword(email); setMessage({ type: 'success', text: response.message || 'If an active admin account exists, a reset link has been sent.' }); }
      catch (err) { setMessage({ type: 'error', text: err.message || 'Unable to send the reset link. Please try again.' }); }
      finally { setLoading(false); }
      return;
    }

    if (mode === 'reset') {
      if (!resetToken) return setMessage({ type: 'error', text: 'The reset link is missing or invalid.' });
      if (password.length < 8) return setMessage({ type: 'error', text: 'Password must contain at least 8 characters.' });
      if (password !== form.confirmPassword) return setMessage({ type: 'error', text: 'Passwords do not match.' });
      setLoading(true);
      try { const response = await authService.resetPassword({ token: resetToken, password }); setMessage({ type: 'success', text: response.message || 'Password reset successfully.' }); setForm({ name: '', email: '', password: '', confirmPassword: '' }); window.setTimeout(() => navigate('/admin', { replace: true }), 1200); }
      catch (err) { setMessage({ type: 'error', text: err.message || 'This reset link is invalid or expired.' }); }
      finally { setLoading(false); }
      return;
    }

    const name = form.name.trim();
    if (!email || !password || (mode === 'signup' && !name)) return setMessage({ type: 'error', text: 'Please complete all required fields.' });
    if (mode === 'signup' && password.length < 8) return setMessage({ type: 'error', text: 'Password must contain at least 8 characters.' });
    setLoading(true);
    try { if (mode === 'signup') await signup({ name, email, password }); else await login({ email, password }); navigate(location.state?.from || '/admin/dashboard', { replace: true }); }
    catch (err) { setMessage({ type: 'error', text: err.message || 'Authentication failed. Please try again.' }); }
    finally { setLoading(false); }
  };

  const isLogin = mode === 'login';
  const isSignup = mode === 'signup';
  const isForgot = mode === 'forgot';
  const isReset = mode === 'reset';

  return (
    <main className="admin-auth-page">
      <div className="admin-auth-grid" aria-hidden="true" />
      <div className="admin-auth-glow" aria-hidden="true" />
      <section className="admin-auth-shell" aria-label="Admin authentication">
        <Link className="admin-auth-back" to={isReset ? '/admin' : '/'}><ArrowLeft size={16} />{isReset ? 'Back to login' : 'Back to home'}</Link>
        <div className="admin-auth-card">
          <div className="admin-auth-brand"><BrandLogo /></div>
          <div className="admin-auth-heading">
            <span className="flow-eyebrow"><i />Admin Portal</span>
            <h1>{isLogin ? 'Welcome back.' : isSignup ? 'Create your account.' : isForgot ? 'Forgot password?' : 'Set a new password.'}</h1>
            <p>{isLogin ? 'Sign in to manage your PrintStation printer portal.' : isSignup ? 'Create the initial administrator account for your printer portal.' : isForgot ? 'Enter your admin email and we will send you a secure password reset link.' : 'Choose a new password for your PrintStation admin account.'}</p>
          </div>
          {(isLogin || isSignup) && <div className="admin-auth-tabs" role="tablist" aria-label="Authentication mode"><button type="button" className={isLogin ? 'active' : ''} onClick={() => switchMode('login')}>Login</button><button type="button" className={isSignup ? 'active' : ''} onClick={() => switchMode('signup')}>Sign up</button></div>}
          <form className="admin-auth-form" onSubmit={handleSubmit} noValidate>
            {isSignup && <label className="admin-auth-field"><span>Name</span><div className="admin-auth-input-wrap"><UserRound size={17} aria-hidden="true" /><input name="name" value={form.name} onChange={updateField} placeholder="Admin name" autoComplete="name" /></div></label>}
            {(isLogin || isSignup || isForgot) && <label className="admin-auth-field"><span>Email address</span><div className="admin-auth-input-wrap"><Mail size={17} aria-hidden="true" /><input name="email" type="email" value={form.email} onChange={updateField} placeholder="admin@example.com" autoComplete="email" /></div></label>}
            {(isLogin || isSignup || isReset) && <label className="admin-auth-field"><span>{isReset ? 'New password' : 'Password'}</span><div className="admin-auth-input-wrap"><LockKeyhole size={17} aria-hidden="true" /><input name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={updateField} placeholder={isReset ? 'Enter new password' : 'Enter your password'} autoComplete={isLogin ? 'current-password' : 'new-password'} /><button type="button" className="admin-auth-password-toggle" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>}
            {isReset && <label className="admin-auth-field"><span>Confirm password</span><div className="admin-auth-input-wrap"><KeyRound size={17} aria-hidden="true" /><input name="confirmPassword" type={showPassword ? 'text' : 'password'} value={form.confirmPassword} onChange={updateField} placeholder="Confirm new password" autoComplete="new-password" /></div></label>}
            {message.text && <p className={`admin-auth-message is-${message.type}`} role="alert">{message.text}</p>}
            <button className="admin-auth-submit primary-button" type="submit" disabled={loading}>{loading ? 'Processing...' : isLogin ? 'Login to Admin Portal' : isSignup ? 'Create Admin Account' : isForgot ? 'Send Reset Link' : 'Reset Password'}</button>
          </form>
          {isLogin && <button type="button" className="admin-auth-forgot" onClick={() => switchMode('forgot')}>Forgot your password?</button>}
          {(isLogin || isSignup) && <p className="admin-auth-switch">{isLogin ? 'Don’t have an admin account?' : 'Already have an admin account?'}{' '}<button type="button" onClick={() => switchMode(isLogin ? 'signup' : 'login')}>{isLogin ? 'Sign up' : 'Login'}</button></p>}
          {(isForgot || isReset) && <p className="admin-auth-switch"><button type="button" onClick={() => switchMode('login')}>Return to Login</button></p>}
          <p className="admin-auth-note">Admin access is verified by the PrintStation backend on every protected session.</p>
        </div>
      </section>
    </main>
  );
}
