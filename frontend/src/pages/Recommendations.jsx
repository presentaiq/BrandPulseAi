import React, { useState, useEffect } from 'react';
import { API } from '../context/AuthContext';
import '../styles/recommendations.css';

const IMPACT_CONFIG = {
  high: { label: '↑ High Impact', className: 'imp-high' },
  medium: { label: '↗ Medium Impact', className: 'imp-med' },
  low: { label: '→ Low Impact', className: 'imp-low' },
};

const CATEGORY_ICONS = {
  timing: '⏰', content: '🎨', format: '🎠', hashtags: '#️⃣',
  platform: '📱', engagement: '💬',
};

export default function Recommendations() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecommendations = async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const res = await API.get('/recommendations');
      setData(res.data);
    } catch (err) {
      setError('Failed to load recommendations. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchRecommendations(); }, []);

  if (loading) {
    return (
      <div className="rec-shell">
        <div className="rec-loading">
          <div className="spinner" style={{ width: '32px', height: '32px', margin: '0 auto 12px' }} />
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {data?.powered_by === 'claude-ai' ? 'Analysing your content with Claude AI...' : 'Loading insights...'}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rec-shell">
        <div className="rec-error">
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚠️</div>
          <div style={{ marginBottom: '12px' }}>{error}</div>
          <button className="rec-btn-primary" onClick={() => fetchRecommendations()}>Try Again</button>
        </div>
      </div>
    );
  }

  const { recommendations = [], content_mix = {}, best_posting_times = [], stats, summary, powered_by } = data || {};

  return (
    <div className="rec-shell">
      {/* Header */}
      <div className="rec-header">
        <div>
          <div className="rec-summary">{summary}</div>
          <div className="rec-meta">
            {powered_by === 'claude-ai'
              ? '✦ Powered by Claude AI · Based on your last 30 days'
              : '📊 Rule-based insights · Connect Anthropic API for AI recommendations'}
          </div>
        </div>
        <button className="rec-refresh-btn" onClick={() => fetchRecommendations(true)} disabled={refreshing}>
          {refreshing ? '⟳ Refreshing...' : '⟳ Refresh'}
        </button>
      </div>

      {/* Quick stats */}
      {stats && (
        <div className="rec-stats-row">
          {[
            { label: 'Reach', val: parseInt(stats.total_reach).toLocaleString() },
            { label: 'Engagement', val: `${stats.engagement_rate}%` },
            { label: 'Posts', val: stats.total_posts },
            { label: 'Likes', val: parseInt(stats.total_likes).toLocaleString() },
          ].map((s, i) => (
            <div key={i} className="rec-stat-chip">
              <span className="rec-stat-val">{s.val}</span>
              <span className="rec-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Recommendation cards */}
      {recommendations.length === 0 ? (
        <div className="rec-empty">
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>✦</div>
          <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px' }}>No recommendations yet</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Start publishing content to get personalised AI insights.</div>
        </div>
      ) : (
        <div className="rec-grid">
          {recommendations.map((rec, i) => {
            const impact = IMPACT_CONFIG[rec.impact] || IMPACT_CONFIG.medium;
            const borderColors = ['#5B4CF5', '#FF4F81', '#00D4A8', '#4A9EFF', '#FFB800', '#FF4F81'];
            return (
              <div key={rec.id || i} className="rec-card" style={{ '--rec-color': borderColors[i % borderColors.length] }}>
                <div className="rec-card-top">
                  <span className="rec-category-icon">{CATEGORY_ICONS[rec.category] || '💡'}</span>
                  <span className={`rec-impact-badge ${impact.className}`}>{impact.label}</span>
                </div>
                <div className="rec-card-title">{rec.title}</div>
                <div className="rec-card-desc">{rec.description}</div>
                {rec.action && (
                  <div className="rec-action">
                    <span className="rec-action-label">Next action:</span> {rec.action}
                  </div>
                )}
                {rec.metric && (
                  <div className="rec-metric-tag">Improves: {rec.metric}</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Two-column: Content mix + Posting times */}
      <div className="rec-bottom-grid">
        {/* Content mix */}
        <div className="rec-section-card">
          <div className="rec-section-title">Recommended Content Mix</div>
          <div className="rec-mix-grid">
            {[
              { label: 'Visuals', val: content_mix.visuals || 40, color: 'var(--primary)', emoji: '🎨' },
              { label: 'Carousels', val: content_mix.carousels || 25, color: 'var(--accent)', emoji: '🎠' },
              { label: 'Text Posts', val: content_mix.text_posts || 20, color: 'var(--accent2)', emoji: '💬' },
              { label: 'Videos', val: content_mix.videos || 15, color: '#FFB800', emoji: '🎬' },
            ].map((m, i) => (
              <div key={i} className="rec-mix-item">
                <div className="rec-mix-emoji">{m.emoji}</div>
                <div className="rec-mix-label">{m.label}</div>
                <div className="rec-mix-val" style={{ color: m.color }}>{m.val}%</div>
                <div className="rec-mix-bar-bg">
                  <div className="rec-mix-bar" style={{ width: `${m.val}%`, background: m.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Best posting times */}
        <div className="rec-section-card">
          <div className="rec-section-title">Best Posting Times</div>
          <div className="rec-times">
            {best_posting_times.map((t, i) => {
              const engColors = { high: 'var(--accent2)', medium: '#FFB800', low: '#FF6B6B' };
              return (
                <div key={i} className="rec-time-row">
                  <span className="rec-time-day">{t.day}</span>
                  <span className="rec-time-slot">{t.time}</span>
                  <span className="rec-time-eng" style={{ color: engColors[t.engagement] || 'var(--text-muted)' }}>
                    {t.engagement}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
