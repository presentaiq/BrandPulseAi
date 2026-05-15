import React, { useState } from 'react';
import '../styles/templates.css';

const PLATFORMS = [
  { value: 'linkedin', label: '💼 LinkedIn' },
  { value: 'instagram', label: '📸 Instagram' },
  { value: 'facebook', label: '📘 Facebook' },
  { value: 'whatsapp', label: '💬 WhatsApp' },
  { value: 'twitter', label: '🐦 Twitter / X' },
];

const FORMATS = [
  { value: 'post', label: 'Single Post', sub: '1080×1080 · Square' },
  { value: 'story', label: 'Story / Reel', sub: '1080×1920 · Vertical' },
  { value: 'landscape', label: 'Landscape Post', sub: '1200×628 · Horizontal' },
  { value: 'carousel', label: 'Carousel (Multi-slide)', sub: '1080×1080 · 3–10 slides' },
];

const STYLES = ['Minimal', 'Bold & Vibrant', 'Dark & Premium', 'Professional', 'Playful', 'Retro', 'Pastel / Soft'];

const SUGGESTIONS = [
  'Product launch post with bold colours',
  'LinkedIn carousel: 5 tips for founders',
  'Instagram story for a summer sale',
  'WhatsApp status for a new product drop',
];

const AI_VARIANTS = [
  { id: 1, gradient: 'linear-gradient(135deg,#1A0050,#5B4CF5,#FF4F81)', emoji: '✨', label: 'Variant A', tag: '✓ Best match', isBest: true },
  { id: 2, gradient: 'linear-gradient(135deg,#003040,#00D4A8,#0077B5)', emoji: '🌟', label: 'Variant B', tag: 'Alternative', isBest: false },
  { id: 3, gradient: 'linear-gradient(135deg,#1A1000,#FF8C00,#FF4F81)', emoji: '🎨', label: 'Variant C', tag: 'Alternative', isBest: false },
];

export default function AIGeneration({ onSelect }) {
  const [prompt, setPrompt] = useState('');
  const [platform, setPlatform] = useState('linkedin');
  const [format, setFormat] = useState('post');
  const [styles, setStyles] = useState(['Professional']);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [selected, setSelected] = useState(1);
  const [promptError, setPromptError] = useState(false);

  const toggleStyle = (s) => {
    setStyles(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) { setPromptError(true); setTimeout(() => setPromptError(false), 2000); return; }
    setLoading(true);
    // Simulate AI generation (replace with real Claude API call)
    await new Promise(r => setTimeout(r, 1800));
    setResults(AI_VARIANTS);
    setLoading(false);
  };

  const handleUseVariant = () => {
    if (results && onSelect) {
      const variant = results.find(v => v.id === selected);
      onSelect({
        id: `ai-${Date.now()}`,
        name: prompt.slice(0, 40),
        platform,
        category: format,
        template_data: {
          gradient: variant.gradient,
          emoji: variant.emoji,
          size: FORMATS.find(f => f.value === format)?.sub?.split(' · ')[0],
          aiGenerated: true,
          prompt,
          styles,
        },
        is_premium: false,
      });
    }
  };

  return (
    <div className="ai-gen-panel">
      <div className="ai-gen-header">
        <div className="ai-gen-icon">✦</div>
        <div>
          <div className="ai-gen-title">Describe your creative idea</div>
          <div className="ai-gen-sub">AI will generate a ready-to-edit design for you</div>
        </div>
      </div>

      <textarea
        className={`ai-prompt-box ${promptError ? 'error' : ''}`}
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        placeholder={`e.g. A bold product launch post for my new skincare line. Use vibrant pinks and purples. Include a headline and a CTA button.\n\nOr: LinkedIn carousel about 5 productivity tips for founders.`}
      />

      <div className="ai-suggestions">
        <span className="ai-suggestion-label">Try:</span>
        {SUGGESTIONS.map(s => (
          <button key={s} className="ai-sugg-btn" onClick={() => setPrompt(s)}>{s}</button>
        ))}
      </div>

      <div className="ai-options-grid">
        <div>
          <div className="ai-options-label">Platform</div>
          <div className="ai-radio-list">
            {PLATFORMS.map(p => (
              <label key={p.value} className={`ai-radio-item ${platform === p.value ? 'selected' : ''}`}>
                <input type="radio" name="ai-platform" value={p.value} checked={platform === p.value} onChange={() => setPlatform(p.value)} />
                <span className="ai-radio-text">{p.label}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <div className="ai-options-label">Format & Size</div>
          <div className="ai-radio-list">
            {FORMATS.map(f => (
              <label key={f.value} className={`ai-radio-item ${format === f.value ? 'selected' : ''}`}>
                <input type="radio" name="ai-format" value={f.value} checked={format === f.value} onChange={() => setFormat(f.value)} />
                <div>
                  <div className="ai-radio-text">{f.label}</div>
                  <div className="ai-radio-sub">{f.sub}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="ai-style-section">
        <div className="ai-options-label">Style Preference <span style={{textTransform:'none',letterSpacing:0,fontWeight:400,color:'var(--text-muted)'}}>(optional)</span></div>
        <div className="ai-style-tags">
          {STYLES.map(s => (
            <button key={s} className={`ai-style-tag ${styles.includes(s) ? 'selected' : ''}`} onClick={() => toggleStyle(s)}>{s}</button>
          ))}
        </div>
      </div>

      <button className="ai-generate-btn" onClick={handleGenerate} disabled={loading}>
        {loading ? <><div className="spinner" />Generating your creative...</> : '✦ Generate Creative'}
      </button>

      {results && (
        <div className="ai-results">
          <div className="ai-results-label">✓ Creative generated — pick a variant to customise</div>
          <div className="ai-results-grid">
            {results.map(v => (
              <div
                key={v.id}
                className={`ai-result-card ${selected === v.id ? 'selected' : ''}`}
                onClick={() => setSelected(v.id)}
              >
                <div className="ai-result-thumb" style={{ background: v.gradient }}>{v.emoji}</div>
                <div className="ai-result-info">
                  <div className="ai-result-name">{v.label}</div>
                  <div className={`ai-result-tag ${v.isBest ? 'best' : ''}`}>{v.tag}</div>
                </div>
              </div>
            ))}
          </div>
          <button
            className="ai-generate-btn"
            style={{ marginTop: '14px' }}
            onClick={handleUseVariant}
          >
            Use Variant {['A','B','C'][selected-1]} in Editor →
          </button>
        </div>
      )}
    </div>
  );
}
