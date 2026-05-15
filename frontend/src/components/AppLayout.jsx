import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { section: 'Overview', items: [{ icon: '⊞', label: 'Dashboard', path: '/dashboard' }] },
  { section: 'Workflow', items: [{ icon: '◈', label: 'Plan → Design → Post → Analyse', path: '/workflow', badge: '4' }] },
  { section: 'Insights', items: [
    { icon: '📊', label: 'Analytics', path: '/analytics' },
    { icon: '✦', label: 'Recommendations', path: '/recommendations', dot: true },
  ]},
  { section: 'Account', items: [{ icon: '⚙', label: 'Account Settings', path: '/settings' }] },
];

export default function AppLayout({ children, title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'BP';

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-name">Brand<span>Pulse</span> AI</div>
          <div className="sidebar-logo-tag">Creative Command Centre</div>
        </div>
        <nav className="sidebar-nav">
          {NAV.map(section => (
            <div key={section.section}>
              <div className="nav-label">{section.section}</div>
              {section.items.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                  {item.badge && <span className="nav-badge">{item.badge}</span>}
                  {item.dot && <span className="nav-dot" />}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="user-card" onClick={handleLogout} title="Click to log out">
            <div className="user-avatar">{initials}</div>
            <div>
              <div className="user-name">{user?.full_name || 'User'}</div>
              <div className="user-plan">{user?.plan === 'pro' ? 'Pro Plan' : 'Free Plan'} · Log out</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="main-area">
        <div className="topbar">
          <div className="topbar-title">{title}</div>
          <div className="topbar-actions">
            <button className="topbar-btn">🔔</button>
            <button className="topbar-btn primary" onClick={() => navigate('/workflow')}>+ New Creative</button>
          </div>
        </div>
        <div className="page-content">
          {children}
        </div>
      </div>
    </div>
  );
}
