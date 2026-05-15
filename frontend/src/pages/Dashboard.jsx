import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { icon: '⊞', label: 'Dashboard', path: '/dashboard' },
  { icon: '◈', label: 'Plan → Design → Post → Analyse', path: '/workflow', badge: '4' },
  { icon: '✦', label: 'Recommendations', path: '/recommendations', dot: true },
  { icon: '⚙', label: 'Account Settings', path: '/settings' },
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || 'BP';

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-name">Brand<span>Pulse</span> AI</div>
          <div className="sidebar-logo-tag">Creative Command Centre</div>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-label">Overview</div>
          {navItems.slice(0,1).map(item => (
            <Link key={item.path} to={item.path} className="nav-item active">
              <span>{item.icon}</span> {item.label}
            </Link>
          ))}
          <div className="nav-label" style={{marginTop:'8px'}}>Workflow</div>
          {navItems.slice(1,2).map(item => (
            <Link key={item.path} to={item.path} className="nav-item">
              <span>{item.icon}</span> {item.label}
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </Link>
          ))}
          <div className="nav-label" style={{marginTop:'8px'}}>Insights</div>
          {navItems.slice(2,3).map(item => (
            <Link key={item.path} to={item.path} className="nav-item">
              <span>{item.icon}</span> {item.label}
              {item.dot && <span className="nav-dot" />}
            </Link>
          ))}
          <div className="nav-label" style={{marginTop:'8px'}}>Account</div>
          {navItems.slice(3).map(item => (
            <Link key={item.path} to={item.path} className="nav-item">
              <span>{item.icon}</span> {item.label}
            </Link>
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
          <div className="topbar-title">Dashboard</div>
          <div className="topbar-actions">
            <button className="topbar-btn">🔔</button>
            <button className="topbar-btn primary">+ New Creative</button>
          </div>
        </div>
        <div className="page-content">

          {/* Welcome band */}
          <div style={{background:'linear-gradient(135deg,#180A50 0%,#0B0B18 50%,#180A30 100%)',border:'1px solid var(--border)',borderRadius:'14px',padding:'24px 28px',marginBottom:'22px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',top:'-80px',right:'-80px',width:'240px',height:'240px',background:'radial-gradient(circle,rgba(91,76,245,0.25) 0%,transparent 70%)',pointerEvents:'none'}} />
            <div>
              <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:'24px',fontWeight:600,marginBottom:'5px'}}>
                Welcome back, {user?.full_name?.split(' ')[0]} 👋
              </div>
              <div style={{color:'var(--text-muted)',fontSize:'13px'}}>
                You're on the <strong style={{color:'var(--text)'}}>{user?.plan === 'pro' ? 'Pro' : 'Free'}</strong> plan. Ready to create something amazing?
              </div>
            </div>
            <div style={{display:'flex',gap:'10px'}}>
              <button className="topbar-btn">View Analytics</button>
              <button className="topbar-btn primary">+ New Creative</button>
            </div>
          </div>

          {/* Stats */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'14px',marginBottom:'22px'}}>
            {[
              {label:'Total Reach',val:'0',delta:'Connect platforms to track'},
              {label:'Engagement Rate',val:'0%',delta:'No data yet'},
              {label:'Posts Published',val:'0',delta:'Start by creating a post'},
              {label:'Scheduled',val:'0',delta:'Nothing scheduled yet'},
            ].map((s,i) => (
              <div key={i} style={{background:'var(--dark2)',border:'1px solid var(--border)',borderRadius:'12px',padding:'18px'}}>
                <div style={{fontSize:'11px',color:'var(--text-muted)',fontWeight:500,marginBottom:'8px'}}>{s.label}</div>
                <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:'28px',fontWeight:600,marginBottom:'4px'}}>{s.val}</div>
                <div style={{fontSize:'11px',color:'var(--text-muted)'}}>{s.delta}</div>
              </div>
            ))}
          </div>

          {/* Getting started */}
          <div style={{background:'var(--dark2)',border:'1px solid var(--border)',borderRadius:'12px',padding:'20px'}}>
            <div style={{fontSize:'14px',fontWeight:600,marginBottom:'16px'}}>Get started with BrandPulse AI</div>
            {[
              {num:'1',title:'Connect your social accounts',desc:'Link Instagram, LinkedIn, Facebook to publish and track analytics.',done:false},
              {num:'2',title:'Create your first creative',desc:'Use the Plan → Design → Post → Analyse workflow.',done:false},
              {num:'3',title:'View your analytics',desc:'Track reach, engagement, and get AI recommendations.',done:false},
            ].map((step,i) => (
              <div key={i} style={{display:'flex',alignItems:'flex-start',gap:'14px',padding:'12px 0',borderBottom:i<2?'1px solid var(--border)':'none'}}>
                <div style={{width:'28px',height:'28px',borderRadius:'50%',background:step.done?'var(--accent2)':'var(--dark3)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:700,flexShrink:0,color:step.done?'#003830':'var(--text-muted)'}}>
                  {step.done ? '✓' : step.num}
                </div>
                <div>
                  <div style={{fontSize:'13px',fontWeight:500,marginBottom:'3px'}}>{step.title}</div>
                  <div style={{fontSize:'12px',color:'var(--text-muted)'}}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
