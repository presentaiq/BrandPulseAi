import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setApiError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setApiError(err.response?.data?.message || 'Incorrect email or password.');
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">Brand<span>Pulse</span> AI</div>
        <div className="auth-tagline">DESIGN · PUBLISH · ANALYSE</div>
        <div className="auth-title">Welcome back</div>
        <div className="auth-subtitle">Log in to your BrandPulse AI account</div>

        {apiError && (
          <div className="alert alert-error">
            <span>⚠</span> {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className={`form-input ${errors.email ? 'error' : ''}`} type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} autoFocus />
            {errors.email && <div className="field-error">{errors.email}</div>}
          </div>

          <div className="form-group">
            <label className="form-label" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span>Password</span>
              <Link to="/forgot-password" style={{color:'var(--primary)',fontSize:'11px',fontWeight:'500',textDecoration:'none',textTransform:'none',letterSpacing:0}}>Forgot password?</Link>
            </label>
            <div className="input-wrapper">
              <input className={`form-input ${errors.password ? 'error' : ''}`} type={showPw ? 'text' : 'password'} placeholder="Your password" value={form.password} onChange={set('password')} style={{paddingRight:'40px'}} />
              <span className="input-icon" onClick={() => setShowPw(s => !s)}>{showPw ? '🙈' : '👁'}</span>
            </div>
            {errors.password && <div className="field-error">{errors.password}</div>}
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading} style={{marginTop:'8px'}}>
            {loading ? <><div className="spinner" />&nbsp;Logging in...</> : 'Log In →'}
          </button>
        </form>

        <div className="divider">or</div>

        <button className="btn btn-google" type="button">
          <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/></svg>
          Continue with Google
        </button>

        <div className="auth-link">
          Don't have an account? <Link to="/signup">Sign up free</Link>
        </div>
      </div>
    </div>
  );
}
