import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API } from '../context/AuthContext';
import '../styles/settings.css';

const PLATFORMS = [
  { key: 'instagram', label: 'Instagram', emoji: '📸', desc: 'Post creatives and track engagement' },
  { key: 'linkedin', label: 'LinkedIn', emoji: '💼', desc: 'Publish posts and career content' },
  { key: 'facebook', label: 'Facebook', emoji: '📘', desc: 'Reach your Facebook audience' },
  { key: 'whatsapp', label: 'WhatsApp Business', emoji: '💬', desc: 'Post to WhatsApp channels' },
  { key: 'canva', label: 'Canva', emoji: '🎨', desc: 'Access thousands of Canva templates' },
];

const TABS = ['Profile', 'Connections', 'Notifications', 'Billing & Plan'];

export default function Settings() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('Profile');
  const [profile, setProfile] = useState({ full_name: user?.full_name || '', brand_name: user?.brand_name || '' });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [connections, setConnections] = useState([]);
  const [notifications, setNotifications] = useState({
    post_published: true, weekly_report: true,
    new_recommendations: true, post_failed: true, marketing: false,
  });

  useEffect(() => {
    API.get('/publish/connections')
      .then(res => setConnections(res.data.connections || []))
      .catch(() => {});
  }, []);

  const isConnected = (platform) => connections.some(c => c.platform === platform);

  const handleDisconnect = async (platform) => {
    try {
      await API.delete(`/publish/connect/${platform}`);
      setConnections(prev => prev.filter(c => c.platform !== platform));
    } catch (err) {
      alert('Failed to disconnect. Please try again.');
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      await updateProfile(profile);
      setSaveMsg('✓ Profile saved');
    } catch {
      setSaveMsg('Failed to save');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(''), 3000);
    }
  };

  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'BP';

  return (
    <div className="st-layout">
      {/* Sidebar nav */}
      <div className="st-nav">
        {TABS.map(tab => (
          <div
            key={tab}
            className={`st-nav-item ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'Profile' && '👤 '}
            {tab === 'Connections' && '🔗 '}
            {tab === 'Notifications' && '🔔 '}
            {tab === 'Billing & Plan' && '💳 '}
            {tab}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="st-content">

        {/* ── PROFILE ── */}
        {activeTab === 'Profile' && (
          <div className="st-panel">
            <div className="st-panel-title">Profile Information</div>

            <div className="st-avatar-row">
              <div className="st-avatar">{initials}</div>
              <div>
                <div className="st-avatar-name">{user?.full_name}</div>
                <div className="st-avatar-email">{user?.email}</div>
                <button className="st-text-btn">Change photo</button>
              </div>
            </div>

            <div className="st-form-grid">
              <div className="st-form-group">
                <label className="st-label">Full Name</label>
                <input className="st-input" value={profile.full_name} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))} />
              </div>
              <div className="st-form-group">
                <label className="st-label">Brand / Business Name</label>
                <input className="st-input" value={profile.brand_name} onChange={e => setProfile(p => ({ ...p, brand_name: e.target.value }))} placeholder="Your brand name" />
              </div>
            </div>

            <div className="st-form-group" style={{ marginTop: '12px' }}>
              <label className="st-label">Email Address</label>
              <input className="st-input" value={user?.email} disabled style={{ opacity: 0.6 }} />
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Email cannot be changed</div>
            </div>

            <div className="st-form-group" style={{ marginTop: '12px' }}>
              <label className="st-label">Password</label>
              <button className="st-text-btn" onClick={() => navigate('/forgot-password')}>Change password →</button>
            </div>

            <div className="st-actions">
              {saveMsg && <span className={`st-save-msg ${saveMsg.startsWith('✓') ? 'ok' : 'err'}`}>{saveMsg}</span>}
              <button className="st-btn-primary" onClick={handleSaveProfile} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        {/* ── CONNECTIONS ── */}
        {activeTab === 'Connections' && (
          <div className="st-panel">
            <div className="st-panel-title">Connected Platforms</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Connect your social accounts to publish and track analytics directly from BrandPulse AI.
            </div>
            {PLATFORMS.map(p => (
              <div key={p.key} className="st-connection-row">
                <div className="st-connection-left">
                  <span className="st-connection-emoji">{p.emoji}</span>
                  <div>
                    <div className="st-connection-name">{p.label}</div>
                    <div className="st-connection-desc">
                      {isConnected(p.key)
                        ? `Connected as @${connections.find(c => c.platform === p.key)?.platform_username || 'user'}`
                        : p.desc}
                    </div>
                  </div>
                </div>
                <div className="st-connection-right">
                  {isConnected(p.key) ? (
                    <>
                      <span className="st-connected-badge">✓ Connected</span>
                      <button className="st-disconnect-btn" onClick={() => handleDisconnect(p.key)}>Disconnect</button>
                    </>
                  ) : (
                    <button className="st-connect-btn">Connect →</button>
                  )}
                </div>
              </div>
            ))}
            <div className="st-api-note">
              ℹ️ Connecting Instagram and LinkedIn requires OAuth approval from Meta and LinkedIn. Follow the setup guide in the README for API credentials.
            </div>
          </div>
        )}

        {/* ── NOTIFICATIONS ── */}
        {activeTab === 'Notifications' && (
          <div className="st-panel">
            <div className="st-panel-title">Notification Preferences</div>
            {[
              { key: 'post_published', label: 'Post Published', desc: 'Alert when a scheduled post goes live' },
              { key: 'weekly_report', label: 'Weekly Performance Report', desc: 'Summary of your weekly engagement metrics' },
              { key: 'new_recommendations', label: 'New AI Recommendations', desc: 'When fresh insights are available for your content' },
              { key: 'post_failed', label: 'Post Failed Alert', desc: 'If a scheduled post fails to publish' },
              { key: 'marketing', label: 'Product Updates & Tips', desc: 'News and tips from BrandPulse AI' },
            ].map(n => (
              <div key={n.key} className="st-notif-row">
                <div>
                  <div className="st-notif-label">{n.label}</div>
                  <div className="st-notif-desc">{n.desc}</div>
                </div>
                <div
                  className={`st-toggle ${notifications[n.key] ? 'on' : ''}`}
                  onClick={() => setNotifications(prev => ({ ...prev, [n.key]: !prev[n.key] }))}
                />
              </div>
            ))}
            <button className="st-btn-primary" style={{ marginTop: '20px' }}>Save Preferences</button>
          </div>
        )}

        {/* ── BILLING ── */}
        {activeTab === 'Billing & Plan' && (
          <div className="st-panel">
            <div className="st-panel-title">Current Plan</div>

            <div className="st-current-plan">
              <div className="st-plan-header">
                <div>
                  <div className="st-plan-name">{user?.plan === 'pro' ? 'Pro Plan' : 'Free Plan'}</div>
                  <div className="st-plan-desc">
                    {user?.plan === 'pro'
                      ? 'Unlimited posts · All platforms · AI recommendations'
                      : 'Up to 10 posts/month · 2 platforms · Basic analytics'}
                  </div>
                </div>
                <span className={`st-plan-badge ${user?.plan === 'pro' ? 'pro' : 'free'}`}>
                  {user?.plan === 'pro' ? '✦ Pro' : 'Free'}
                </span>
              </div>
              {user?.plan !== 'pro' && (
                <div className="st-plan-limits">
                  <div className="st-limit-row"><span>Posts this month</span><span>0 / 10</span></div>
                  <div className="st-limit-bar"><div className="st-limit-fill" style={{ width: '0%' }} /></div>
                </div>
              )}
            </div>

            {user?.plan !== 'pro' && (
              <div className="st-upgrade-card">
                <div className="st-upgrade-badge">✦ Pro Plan</div>
                <div className="st-upgrade-price">₹999 <span>/month</span></div>
                <div className="st-upgrade-features">
                  {[
                    'Unlimited posts per month',
                    'All platforms (Instagram, LinkedIn, Facebook, WhatsApp, Twitter)',
                    'Claude AI-powered recommendations',
                    'Advanced analytics & reports',
                    'Canva integration',
                    'Priority support',
                  ].map(f => <div key={f} className="st-upgrade-feature">✓ {f}</div>)}
                </div>
                <button className="st-btn-primary st-upgrade-btn">Upgrade to Pro →</button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
