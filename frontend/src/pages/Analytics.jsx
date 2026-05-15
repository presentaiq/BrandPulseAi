import React, { useState, useEffect } from 'react';
import { API } from '../context/AuthContext';
import '../styles/analytics.css';

const PERIODS = [
  { label: '7D', value: '7' },
  { label: '30D', value: '30' },
  { label: '90D', value: '90' },
];

const PLATFORM_COLORS = {
  instagram: '#FF4F81',
  linkedin: '#0077B5',
  facebook: '#1877F2',
  whatsapp: '#25D366',
  twitter: '#1DA1F2',
};

export default function Analytics() {
  const [period, setPeriod] = useState('30');
  const [overview, setOverview] = useState(null);
  const [posts, setPosts] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ovRes, postsRes, chartRes] = await Promise.all([
        API.get(`/analytics/overview?period=${period}`),
        API.get(`/analytics/posts?period=${period}`),
        API.get(`/analytics/chart?period=${period}`),
      ]);
      setOverview(ovRes.data);
      setPosts(postsRes.data.posts || []);
      setChartData(chartRes.data.data || []);
    } catch (err) {
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [period]);

  const syncMetrics = async () => {
    setSyncing(true);
    try {
      await API.post('/analytics/sync');
      await fetchData();
    } catch (err) {
      console.error('Sync error:', err);
    } finally {
      setSyncing(false);
    }
  };

  const changeIcon = (val) => val > 0 ? `↑ ${val}%` : val < 0 ? `↓ ${Math.abs(val)}%` : '—';
  const changeClass = (val) => val > 0 ? 'an-delta-pos' : val < 0 ? 'an-delta-neg' : 'an-delta-neutral';

  const stats = overview?.stats;
  const changes = overview?.changes || {};

  // Build chart bars from data or show empty state
  const maxReach = Math.max(...chartData.map(d => parseInt(d.reach) || 0), 1);

  return (
    <div className="an-shell">
      {/* Header */}
      <div className="an-header">
        <div className="an-header-left">
          <div className="an-sub">All connected platforms · Last {period} days</div>
        </div>
        <div className="an-header-right">
          <div className="an-period-tabs">
            {PERIODS.map(p => (
              <button key={p.value} className={`an-period-btn ${period === p.value ? 'active' : ''}`} onClick={() => setPeriod(p.value)}>
                {p.label}
              </button>
            ))}
          </div>
          <button className="an-sync-btn" onClick={syncMetrics} disabled={syncing}>
            {syncing ? '⟳ Syncing...' : '⟳ Sync Metrics'}
          </button>
        </div>
      </div>

      {/* Metric cards */}
      <div className="an-metrics">
        {[
          { label: 'Total Impressions', val: parseInt(stats?.total_impressions || 0).toLocaleString(), icon: '👁', change: changes.impressions },
          { label: 'Total Reach', val: parseInt(stats?.total_reach || 0).toLocaleString(), icon: '📣', change: changes.reach },
          { label: 'Engagement Rate', val: `${stats?.engagement_rate || '0.00'}%`, icon: '💥', change: null },
          { label: 'Total Likes', val: parseInt(stats?.total_likes || 0).toLocaleString(), icon: '❤️', change: changes.likes },
          { label: 'Total Comments', val: parseInt(stats?.total_comments || 0).toLocaleString(), icon: '💬', change: null },
          { label: 'Posts Published', val: parseInt(stats?.total_posts || 0).toLocaleString(), icon: '📤', change: null },
        ].map((m, i) => (
          <div key={i} className="an-metric-card">
            <div className="an-metric-icon">{m.icon}</div>
            <div className="an-metric-val">{loading ? '—' : m.val}</div>
            <div className="an-metric-label">{m.label}</div>
            {m.change !== null && m.change !== undefined && (
              <div className={`an-metric-delta ${changeClass(m.change)}`}>{changeIcon(m.change)} vs prev period</div>
            )}
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="an-chart-card">
        <div className="an-chart-header">
          <div className="an-chart-title">Reach Over Time</div>
          <div className="an-chart-legend">
            {Object.entries(PLATFORM_COLORS).slice(0, 3).map(([p, c]) => (
              <span key={p} className="an-legend-item"><span className="an-legend-dot" style={{ background: c }} />{p}</span>
            ))}
          </div>
        </div>
        <div className="an-chart">
          {loading ? (
            <div className="an-chart-loading">Loading chart...</div>
          ) : chartData.length === 0 ? (
            <div className="an-chart-empty">
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📊</div>
              <div>No published posts in this period yet.</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Publish content to see your analytics here.</div>
            </div>
          ) : (
            <>
              <div className="an-chart-bars">
                {chartData.map((d, i) => {
                  const pct = Math.max((parseInt(d.reach) / maxReach) * 100, 2);
                  const platform = Array.isArray(d.platforms) ? d.platforms[0] : 'instagram';
                  return (
                    <div key={i} className="an-bar-col" title={`${d.date}: ${d.reach} reach`}>
                      <div className="an-bar" style={{ height: `${pct}%`, background: PLATFORM_COLORS[platform] || 'var(--primary)' }} />
                    </div>
                  );
                })}
              </div>
              <div className="an-chart-labels">
                {chartData.filter((_, i) => i % Math.ceil(chartData.length / 6) === 0).map((d, i) => (
                  <span key={i}>{new Date(d.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Posts table */}
      <div className="an-table-card">
        <div className="an-chart-header">
          <div className="an-chart-title">Post Performance</div>
        </div>
        {loading ? (
          <div className="an-loading-rows">
            {[1, 2, 3].map(i => <div key={i} className="an-skeleton-row" />)}
          </div>
        ) : posts.length === 0 ? (
          <div className="an-table-empty">No posts published in this period.</div>
        ) : (
          <table className="an-table">
            <thead>
              <tr>
                <th>Post</th>
                <th>Platforms</th>
                <th>Reach</th>
                <th>Impressions</th>
                <th>Likes</th>
                <th>Comments</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {posts.map(post => (
                <tr key={post.id}>
                  <td className="an-post-title">{post.title || 'Untitled'}</td>
                  <td>
                    <div className="an-platform-pills">
                      {(post.platforms || []).map(p => (
                        <span key={p} className="an-pill" style={{ background: `${PLATFORM_COLORS[p]}22`, color: PLATFORM_COLORS[p] }}>
                          {p}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="an-num">{parseInt(post.reach || 0).toLocaleString()}</td>
                  <td className="an-num">{parseInt(post.impressions || 0).toLocaleString()}</td>
                  <td className="an-num">{parseInt(post.likes || 0).toLocaleString()}</td>
                  <td className="an-num">{parseInt(post.comments || 0).toLocaleString()}</td>
                  <td>
                    <span className={`an-status an-status-${post.status}`}>{post.status}</span>
                  </td>
                  <td className="an-date">
                    {post.published_at
                      ? new Date(post.published_at).toLocaleDateString()
                      : new Date(post.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
