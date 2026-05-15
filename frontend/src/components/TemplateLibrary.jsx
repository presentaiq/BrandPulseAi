import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../context/AuthContext';
import '../styles/templates.css';

const PLATFORMS = [
  { key: 'all', label: 'All Templates', emoji: '⊞' },
  { key: 'linkedin', label: 'LinkedIn', emoji: '💼' },
  { key: 'instagram', label: 'Instagram', emoji: '📸' },
  { key: 'facebook', label: 'Facebook', emoji: '📘' },
  { key: 'whatsapp', label: 'WhatsApp', emoji: '💬' },
  { key: 'twitter', label: 'Twitter / X', emoji: '🐦' },
];

const CATEGORIES = {
  linkedin: [
    { key: 'all', label: 'All' },
    { key: 'carousel', label: '🎠 Carousel' },
    { key: 'post', label: '📄 Single Post' },
    { key: 'story', label: '📱 Story' },
    { key: 'ads', label: '📣 Ads' },
  ],
  instagram: [
    { key: 'all', label: 'All' },
    { key: 'post', label: '📄 Post' },
    { key: 'carousel', label: '🎠 Carousel' },
    { key: 'story', label: '📱 Story' },
    { key: 'reel', label: '🎬 Reel Cover' },
    { key: 'ads', label: '📣 Ads' },
  ],
  facebook: [
    { key: 'all', label: 'All' },
    { key: 'post', label: '📄 Post' },
    { key: 'story', label: '📱 Story' },
    { key: 'ads', label: '📣 Ads' },
    { key: 'cover', label: '🖼 Cover' },
  ],
  whatsapp: [
    { key: 'all', label: 'All' },
    { key: 'status', label: '📱 Status' },
    { key: 'promo', label: '🛒 Promo' },
    { key: 'channel', label: '📣 Channel' },
  ],
  twitter: [
    { key: 'all', label: 'All' },
    { key: 'post', label: '🐦 Tweet Image' },
    { key: 'header', label: '🖼 Header' },
    { key: 'thread', label: '📄 Thread Card' },
  ],
};

export default function TemplateLibrary({ onSelect }) {
  const navigate = useNavigate();
  const [activePlatform, setActivePlatform] = useState('all');
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState(null);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 50 });
      if (activePlatform !== 'all') params.set('platform', activePlatform);
      if (activeCategory !== 'all') params.set('category', activeCategory);
      if (search) params.set('search', search);
      const res = await API.get(`/templates?${params}`);
      setTemplates(res.data.templates);
    } catch (err) {
      console.error('Failed to load templates', err);
    } finally {
      setLoading(false);
    }
  }, [activePlatform, activeCategory, search]);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const handlePlatformChange = (platform) => {
    setActivePlatform(platform);
    setActiveCategory('all');
  };

  const handleSelect = (template) => {
    if (onSelect) {
      onSelect(template);
    } else {
      navigate(`/editor/${template.id}`);
    }
  };

  const categories = activePlatform !== 'all' ? CATEGORIES[activePlatform] : [];

  return (
    <div className="tl-shell">
      {/* Platform tabs */}
      <div className="tl-platform-tabs">
        {PLATFORMS.map(p => (
          <button
            key={p.key}
            className={`tl-ptab ${activePlatform === p.key ? 'active' : ''}`}
            onClick={() => handlePlatformChange(p.key)}
          >
            <span>{p.emoji}</span> {p.label}
          </button>
        ))}
      </div>

      {/* Category + Search row */}
      <div className="tl-controls">
        <div className="tl-cats">
          {categories.map(c => (
            <button
              key={c.key}
              className={`tl-cat ${activeCategory === c.key ? 'active' : ''}`}
              onClick={() => setActiveCategory(c.key)}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="tl-search">
          <span className="tl-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="tl-search-input"
          />
          {search && <span className="tl-search-clear" onClick={() => setSearch('')}>✕</span>}
        </div>
      </div>

      {/* Count */}
      <div className="tl-count">
        {loading ? 'Loading templates...' : `${templates.length} template${templates.length !== 1 ? 's' : ''} found`}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="tl-loading">
          {[...Array(8)].map((_, i) => <div key={i} className="tl-skeleton" />)}
        </div>
      ) : templates.length === 0 ? (
        <div className="tl-empty">
          <div className="tl-empty-icon">🔍</div>
          <div className="tl-empty-title">No templates found</div>
          <div className="tl-empty-desc">Try a different platform or search term</div>
        </div>
      ) : (
        <div className="tl-grid">
          {templates.map(t => {
            const data = t.template_data || {};
            const isStory = t.category === 'story' || t.category === 'reel' || t.category === 'status';
            return (
              <div
                key={t.id}
                className={`tl-card ${hoveredId === t.id ? 'hovered' : ''}`}
                onMouseEnter={() => setHoveredId(t.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => handleSelect(t)}
              >
                <div
                  className={`tl-thumb ${isStory ? 'story' : ''}`}
                  style={{ background: data.gradient || 'var(--dark3)' }}
                >
                  <span className="tl-emoji">{data.emoji || '🎨'}</span>
                  {t.is_premium && <span className="tl-premium-badge">PRO</span>}
                  <div className="tl-overlay">
                    <button className="tl-use-btn">Use Template →</button>
                  </div>
                </div>
                <div className="tl-info">
                  <div className="tl-name">{t.name}</div>
                  <div className="tl-meta">
                    <span className={`tl-platform-pill tl-pp-${t.platform}`}>
                      {PLATFORMS.find(p => p.key === t.platform)?.emoji} {t.platform}
                    </span>
                    <span className="tl-size">{data.size}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Canva integration banner */}
      <div className="tl-canva-banner">
        <div className="tl-canva-icon">🎨</div>
        <div className="tl-canva-text">
          <strong>Design with Canva</strong>
          <span>Connect Canva to access thousands of additional templates</span>
        </div>
        <button className="tl-canva-btn">Connect Canva</button>
      </div>
    </div>
  );
}
