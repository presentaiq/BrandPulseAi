import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ForgotPassword() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { setError('Please enter your email.'); return; }
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">Brand<span>Pulse</span> AI</div>
        <div className="auth-tagline">DESIGN · PUBLISH · ANALYSE</div>

        {!sent ? (
          <>
            <div className="auth-title">Reset your password</div>
            <div className="auth-subtitle">Enter your email and we'll send you a reset link</div>

            {error && <div className="alert alert-error"><span>⚠</span> {error}</div>}

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} autoFocus />
              </div>
              <button className="btn btn-primary" type="submit" disabled={loading} style={{marginTop:'8px'}}>
                {loading ? <><div className="spinner" />&nbsp;Sending...</> : 'Send Reset Link →'}
              </button>
            </form>
          </>
        ) : (
          <>
            <div style={{textAlign:'center',fontSize:'48px',margin:'8px 0 16px'}}>📬</div>
            <div className="auth-title">Check your inbox</div>
            <div className="auth-subtitle">We've sent a password reset link to <strong style={{color:'var(--text)'}}>{email}</strong>. Check your spam folder if you don't see it.</div>
            <div className="alert alert-success" style={{marginTop:'8px'}}><span>✓</span> Reset link sent successfully</div>
          </>
        )}

        <div className="auth-link">
          <Link to="/login">← Back to login</Link>
        </div>
      </div>
    </div>
  );
}

export function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resetPassword } = useAuth();
  const token = searchParams.get('token');

  const [form, setForm] = useState({ password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPw, setShowPw] = useState(false);

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-logo">Brand<span>Pulse</span> AI</div>
          <div className="alert alert-error" style={{marginTop:'16px'}}><span>⚠</span> Invalid or missing reset token. Please request a new reset link.</div>
          <div className="auth-link"><Link to="/forgot-password">Request new link</Link></div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    setError('');
    setLoading(true);
    try {
      await resetPassword(token, form.password);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired token. Please request a new reset link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">Brand<span>Pulse</span> AI</div>
        <div className="auth-tagline">DESIGN · PUBLISH · ANALYSE</div>

        {!success ? (
          <>
            <div className="auth-title">Set new password</div>
            <div className="auth-subtitle">Choose a strong password for your account</div>

            {error && <div className="alert alert-error"><span>⚠</span> {error}</div>}

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <div className="input-wrapper">
                  <input className="form-input" type={showPw ? 'text' : 'password'} placeholder="Min. 8 characters" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} style={{paddingRight:'40px'}} autoFocus />
                  <span className="input-icon" onClick={() => setShowPw(s => !s)}>{showPw ? '🙈' : '👁'}</span>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input className="form-input" type="password" placeholder="Re-enter password" value={form.confirm} onChange={e => setForm(f => ({...f, confirm: e.target.value}))} />
              </div>
              <button className="btn btn-primary" type="submit" disabled={loading} style={{marginTop:'8px'}}>
                {loading ? <><div className="spinner" />&nbsp;Resetting...</> : 'Reset Password →'}
              </button>
            </form>
          </>
        ) : (
          <>
            <div style={{textAlign:'center',fontSize:'48px',margin:'8px 0 16px'}}>✅</div>
            <div className="auth-title">Password reset!</div>
            <div className="auth-subtitle">Your password has been changed. Redirecting you to login...</div>
            <div className="alert alert-success"><span>✓</span> Redirecting in 3 seconds...</div>
          </>
        )}

        <div className="auth-link"><Link to="/login">← Back to login</Link></div>
      </div>
    </div>
  );
}
