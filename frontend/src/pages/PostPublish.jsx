import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API } from '../context/AuthContext';
import '../styles/publish.css';

const PLATFORMS = [
  { key: 'instagram', label: 'Instagram', emoji: '📸', color: '#FF4F81' },
  { key: 'linkedin', label: 'LinkedIn', emoji: '💼', color: '#0077B5' },
  { key: 'facebook', label: 'Facebook', emoji: '📘', color: '#1877F2' },
  { key: 'whatsapp', label: 'WhatsApp', emoji: '💬', color: '#25D366' },
];

export default function PostPublish() {
  const navigate = useNavigate();
  const location = useLocation();
  const postData = location.state || {};

  const [caption, setCaption] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState(['instagram', 'linkedin']);
  const [scheduleType, setScheduleType] = useState('now'); // 'now' | 'schedule'
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(null);
  const [generatingCaption, setGeneratingCaption] = useState(false);
  const [captionPrompt, setCaptionPrompt] = useState('');
  const [connections, setConnections] = useState([]);
  const [previewPlatform, setPreviewPlatform] = useState('instagram');

  useEffect(() => {
    // Load connected accounts
    API.get('/publish/connections')
      .then(res => setConnections(res.data.connections || []))
      .catch(() => {});

    // Set default schedule date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setScheduleDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  const isConnected = (platform) => connections.some(c => c.platform === platform);

  const togglePlatform = (platform) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]
    );
  };

  const generateCaption = async () => {
    if (!captionPrompt.trim()) return;
    setGeneratingCaption(true);
    try {
      const res = await API.post('/recommendations/generate-caption', {
        prompt: captionPrompt,
        platform: selectedPlatforms[0] || 'instagram',
        tone: 'professional',
        hashtags: true,
      });
      setCaption(res.data.caption);
    } catch {
      setCaption(`✨ ${captionPrompt}\n\nWe're excited to share this! Drop your thoughts below. 👇\n\n#BrandPulseAI #Marketing`);
    } finally {
      setGeneratingCaption(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedPlatforms.length) return;
    if (!caption.trim()) { alert('Please add a caption'); return; }

    setPublishing(true);
    try {
      const payload = {
        postId: postData.postId || null,
        platforms: selectedPlatforms,
        caption,
        imageUrl: postData.imageUrl || `${window.location.origin}/placeholder.png`,
        ...(scheduleType === 'schedule' && {
          scheduledAt: new Date(`${scheduleDate}T${scheduleTime}`).toISOString(),
        }),
      };

      // If no postId, create a draft post first
      if (!payload.postId) {
        const draftRes = await API.post('/posts', {
          title: 'Untitled Post',
          caption,
          image_url: payload.imageUrl,
          platforms: selectedPlatforms,
          status: 'draft',
        });
        payload.postId = draftRes.data.post.id;
      }

      const res = await API.post('/publish', payload);
      setPublished(res.data);
    } catch (err) {
      setPublished({ success: false, message: err.response?.data?.message || 'Publishing failed' });
    } finally {
      setPublishing(false);
    }
  };

  if (published) {
    return (
      <div className="pub-result">
        <div className="pub-result-icon">{published.success ? '🎉' : '⚠️'}</div>
        <h2 className="pub-result-title">
          {published.success
            ? scheduleType === 'schedule' ? 'Post Scheduled!' : 'Post Published!'
            : 'Publishing had some issues'}
        </h2>
        <p className="pub-result-desc">{published.message}</p>
        {published.errors && Object.keys(published.errors).length > 0 && (
          <div className="pub-errors">
            {Object.entries(published.errors).map(([p, e]) => (
              <div key={p} className="pub-error-item">
                <span>⚠ {p}:</span> {e}
              </div>
            ))}
          </div>
        )}
        <div className="pub-result-actions">
          <button className="pub-btn-ghost" onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
          <button className="pub-btn-primary" onClick={() => navigate('/analytics')}>View Analytics →</button>
        </div>
      </div>
    );
  }

  return (
    <div className="pub-layout">
      {/* Left: Form */}
      <div className="pub-form">
        {/* Caption */}
        <div className="pub-section">
          <div className="pub-section-title">Caption</div>

          {/* AI Caption Generator */}
          <div className="pub-ai-row">
            <input
              className="pub-input"
              placeholder="Describe your post idea for AI caption generation..."
              value={captionPrompt}
              onChange={e => setCaptionPrompt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && generateCaption()}
            />
            <button className="pub-ai-btn" onClick={generateCaption} disabled={generatingCaption || !captionPrompt}>
              {generatingCaption ? '...' : '✦ AI'}
            </button>
          </div>

          <textarea
            className="pub-textarea"
            placeholder="Write your caption here... or use AI generation above"
            value={caption}
            onChange={e => setCaption(e.target.value)}
            maxLength={2200}
          />
          <div className="pub-char-count">{caption.length} / 2200</div>
        </div>

        {/* Platform selection */}
        <div className="pub-section">
          <div className="pub-section-title">Publish To</div>
          <div className="pub-platforms">
            {PLATFORMS.map(p => (
              <div
                key={p.key}
                className={`pub-platform ${selectedPlatforms.includes(p.key) ? 'on' : ''} ${!isConnected(p.key) ? 'disconnected' : ''}`}
                onClick={() => togglePlatform(p.key)}
              >
                <span className="pub-platform-emoji">{p.emoji}</span>
                <span className="pub-platform-label">{p.label}</span>
                {!isConnected(p.key) && (
                  <span className="pub-platform-status">Not connected</span>
                )}
                {isConnected(p.key) && selectedPlatforms.includes(p.key) && (
                  <span className="pub-platform-check">✓</span>
                )}
              </div>
            ))}
          </div>
          {connections.length === 0 && (
            <div className="pub-connect-hint">
              ⚠ No platforms connected.{' '}
              <span className="pub-link" onClick={() => navigate('/settings')}>
                Connect in Account Settings →
              </span>
            </div>
          )}
        </div>

        {/* Schedule */}
        <div className="pub-section">
          <div className="pub-section-title">When to Post</div>
          <div className="pub-schedule-tabs">
            <button
              className={`pub-schedule-tab ${scheduleType === 'now' ? 'active' : ''}`}
              onClick={() => setScheduleType('now')}
            >⚡ Post Now</button>
            <button
              className={`pub-schedule-tab ${scheduleType === 'schedule' ? 'active' : ''}`}
              onClick={() => setScheduleType('schedule')}
            >🕐 Schedule</button>
          </div>
          {scheduleType === 'schedule' && (
            <div className="pub-schedule-row">
              <input className="pub-input" type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} />
              <input className="pub-input" type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="pub-actions">
          <button className="pub-btn-ghost" onClick={() => navigate('/workflow')}>← Back to Editor</button>
          <button
            className="pub-btn-primary"
            onClick={handlePublish}
            disabled={publishing || !selectedPlatforms.length || !caption}
          >
            {publishing
              ? 'Publishing...'
              : scheduleType === 'schedule'
                ? '🕐 Schedule Post'
                : '🚀 Publish Now'}
          </button>
        </div>
      </div>

      {/* Right: Preview */}
      <div className="pub-preview-col">
        <div className="pub-preview-header">
          <div className="pub-preview-title">Preview</div>
          <div className="pub-preview-tabs">
            {PLATFORMS.slice(0, 2).map(p => (
              <button
                key={p.key}
                className={`pub-prev-tab ${previewPlatform === p.key ? 'active' : ''}`}
                onClick={() => setPreviewPlatform(p.key)}
              >{p.emoji}</button>
            ))}
          </div>
        </div>

        <div className="pub-mock">
          <div className="pub-mock-header">
            <div className="pub-mock-avatar" />
            <div>
              <div className="pub-mock-name">@brandpulse.ai</div>
              <div className="pub-mock-time">Just now · {PLATFORMS.find(p => p.key === previewPlatform)?.emoji}</div>
            </div>
          </div>
          <div className="pub-mock-image" style={{
            background: postData.gradient || 'linear-gradient(135deg,#1A0050,#5B4CF5)',
          }}>
            {postData.imageUrl
              ? <img src={postData.imageUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: '48px' }}>🎨</span>
            }
          </div>
          <div className="pub-mock-caption">
            {caption || 'Your caption will appear here...'}
          </div>
          <div className="pub-mock-actions">
            <span>❤️ Like</span>
            <span>💬 Comment</span>
            <span>↗ Share</span>
          </div>
        </div>

        {/* Best time tip */}
        <div className="pub-tip">
          <span className="pub-tip-icon">💡</span>
          <span>Best time to post: <strong>9AM–11AM weekdays</strong> based on your audience</span>
        </div>
      </div>
    </div>
  );
}
