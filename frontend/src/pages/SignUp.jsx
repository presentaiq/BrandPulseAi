import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const getPasswordStrength = (pw) => {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
};

export default function SignUp() {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm_password: '', brand_name: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const strength = getPasswordStrength(form.password);
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthClass = ['', 'weak', 'medium', 'strong', 'strong'][strength];

  const validate = () => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = 'Full name is required';
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Must be at least 8 characters';
    if (form.password !== form.confirm_password) e.confirm_password = 'Passwords do not match';
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
      await signup({ full_name: form.full_name, email: form.email, password: form.password, brand_name: form.brand_name });
      navigate('/dashboard');
    } catch (err) {
      setApiError(err.response?.data?.message || 'Something went wrong. Please try again.');
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
        <div className="auth-title">Create your account</div>
        <div className="auth-subtitle">Start managing your brand creatives in one place</div>

        {apiError && (
          <div className="alert alert-error">
            <span>⚠</span> {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className={`form-input ${errors.full_name ? 'error' : ''}`} type="text" placeholder="Anmol Kumar" value={form.full_name} onChange={set('full_name')} />
            {errors.full_name && <div className="field-error">{errors.full_name}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input className={`form-input ${errors.email ? 'error' : ''}`} type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} />
            {errors.email && <div className="field-error">{errors.email}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Brand / Business Name <span style={{fontWeight:400,textTransform:'none',letterSpacing:0,color:'var(--text-muted)'}}>  (optional)</span></label>
            <input className="form-input" type="text" placeholder="e.g. My Startup" value={form.brand_name} onChange={set('brand_name')} />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-wrapper">
              <input className={`form-input ${errors.password ? 'error' : ''}`} type={showPw ? 'text' : 'password'} placeholder="Min. 8 characters" value={form.password} onChange={set('password')} style={{paddingRight:'40px'}} />
              <span className="input-icon" onClick={() => setShowPw(s => !s)}>{showPw ? '🙈' : '👁'}</span>
            </div>
            {form.password && (
              <>
                <div className="pw-strength" style={{marginTop:'6px'}}>
                  {[1,2,3,4].map(i => <div key={i} className={`pw-bar ${i <= strength ? strengthClass : ''}`} />)}
                </div>
                <div className="pw-label">{strengthLabel}</div>
              </>
            )}
            {errors.password && <div className="field-error">{errors.password}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input className={`form-input ${errors.confirm_password ? 'error' : ''}`} type="password" placeholder="Re-enter password" value={form.confirm_password} onChange={set('confirm_password')} />
            {errors.confirm_password && <div className="field-error">{errors.confirm_password}</div>}
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading} style={{marginTop:'8px'}}>
            {loading ? <><div className="spinner" />&nbsp;Creating account...</> : 'Create Account →'}
          </button>
        </form>

        <div className="divider">or</div>

        <button className="btn btn-google" type="button">
          <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/></svg>
          Continue with Google
        </button>

        <div className="auth-link">
          Already have an account? <Link to="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
}
