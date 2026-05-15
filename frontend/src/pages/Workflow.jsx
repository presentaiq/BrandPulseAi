import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TemplateLibrary from '../components/TemplateLibrary';
import AIGeneration from '../components/AIGeneration';
import DesignEditor from '../components/DesignEditor';
import '../styles/workflow.css';

const STEPS = [
  { num: 1, label: 'Plan', desc: 'Choose your start' },
  { num: 2, label: 'Design', desc: 'Customise template' },
  { num: 3, label: 'Post', desc: 'Schedule & publish' },
  { num: 4, label: 'Analyse', desc: 'Track performance' },
];

export default function Workflow() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [planMode, setPlanMode] = useState('templates');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [designData, setDesignData] = useState(null); // { dataUrl, canvasJSON }

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setCurrentStep(1);
  };

  const handleDesignNext = (data) => {
    setDesignData(data);
    setCurrentStep(2);
  };

  const progressPct = ((currentStep) / STEPS.length) * 100 + 12.5;

  return (
    <div className="wf-shell">

      {/* Stepper header */}
      <div className="wf-stepper">
        {STEPS.map((step, i) => (
          <div
            key={i}
            className={`wf-step ${i === currentStep ? 'active' : ''} ${i < currentStep ? 'done' : ''}`}
            onClick={() => i < currentStep && setCurrentStep(i)}
          >
            <div className="wf-step-num">
              {i < currentStep ? '✓' : step.num}
            </div>
            <div className="wf-step-label">{step.label}</div>
            <div className="wf-step-desc">{step.desc}</div>
            {i < STEPS.length - 1 && <div className="wf-step-arrow">→</div>}
          </div>
        ))}
      </div>
      <div className="wf-progress">
        <div className="wf-progress-bar" style={{ width: `${progressPct}%` }} />
      </div>

      {/* Step content */}
      <div className="wf-body">

        {/* ── STEP 1: PLAN ── */}
        {currentStep === 0 && (
          <div className="wf-step-content">
            <div className="wf-step-heading">
              <h2>How do you want to start?</h2>
              <p>Choose a ready-made template or let AI generate a creative from your idea.</p>
            </div>

            {/* Mode switcher */}
            <div className="wf-mode-grid">
              <div
                className={`wf-mode-card ${planMode === 'templates' ? 'active' : ''}`}
                onClick={() => setPlanMode('templates')}
              >
                <div className="wf-mode-icon">◫</div>
                <div className="wf-mode-title">Browse Templates</div>
                <div className="wf-mode-desc">Pick from platform-specific templates organised by LinkedIn, Instagram, Facebook and more. Customise in the editor.</div>
                <div className={`wf-mode-status ${planMode === 'templates' ? 'selected' : ''}`}>
                  {planMode === 'templates' ? '✓ Selected' : 'Click to select'}
                </div>
              </div>
              <div
                className={`wf-mode-card ${planMode === 'ai' ? 'active' : ''}`}
                onClick={() => setPlanMode('ai')}
              >
                <div className="wf-mode-icon">✦</div>
                <div className="wf-mode-title">AI Generation</div>
                <div className="wf-mode-desc">Describe your idea in plain words. AI generates a creative tailored to your platform, size, and goal — ready to edit.</div>
                <div className={`wf-mode-status ${planMode === 'ai' ? 'selected' : ''}`}>
                  {planMode === 'ai' ? '✓ Selected' : 'Click to select'}
                </div>
              </div>
            </div>

            {/* Content based on mode */}
            <div className="wf-mode-content">
              {planMode === 'templates' ? (
                <TemplateLibrary onSelect={handleTemplateSelect} />
              ) : (
                <AIGeneration onSelect={handleTemplateSelect} />
              )}
            </div>

            <div className="wf-step-actions">
              <div className="wf-step-hint">Step 1 of 4 — Select a template or generate one to continue</div>
            </div>
          </div>
        )}

        {/* ── STEP 2: DESIGN ── */}
        {currentStep === 1 && (
          <div className="wf-step-content">
            <div className="wf-step-heading">
              <h2>Customise your creative</h2>
              <p>
                {selectedTemplate
                  ? <>Template: <strong>{selectedTemplate.name}</strong> · {selectedTemplate.platform} · {selectedTemplate.template_data?.size}</>
                  : 'Edit your design'}
              </p>
            </div>
            <DesignEditor
              template={selectedTemplate}
              onNext={handleDesignNext}
              onSave={(data) => console.log('Saved draft', data)}
            />
          </div>
        )}

        {/* ── STEP 3: POST ── */}
        {currentStep === 2 && (
          <div className="wf-step-content">
            <div className="wf-step-heading">
              <h2>Schedule & Publish</h2>
              <p>Your creative is ready. Add a caption and choose where to post.</p>
            </div>
            <div className="wf-post-layout">
              <div className="wf-post-form">
                <div className="wf-form-group">
                  <label className="wf-form-label">Caption</label>
                  <textarea className="wf-textarea" defaultValue="🚀 Excited to share our latest creative! This is what happens when design meets strategy.&#10;&#10;#Marketing #BrandPulseAI #Design" />
                </div>
                <div className="wf-form-group">
                  <label className="wf-form-label">Publish To</label>
                  <div className="wf-platform-row">
                    {['📸 Instagram', '💼 LinkedIn', '📘 Facebook', '💬 WhatsApp'].map((p, i) => (
                      <div key={p} className={`wf-plat-toggle ${i < 2 ? 'on' : ''}`}
                        onClick={e => e.currentTarget.classList.toggle('on')}>{p}</div>
                    ))}
                  </div>
                </div>
                <div className="wf-form-group">
                  <label className="wf-form-label">Schedule</label>
                  <div className="wf-schedule-row">
                    <input className="wf-input" type="date" defaultValue="2026-05-17" />
                    <input className="wf-input" type="time" defaultValue="09:00" />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="wf-btn-ghost" style={{ flex: 1 }}>Save Draft</button>
                  <button className="wf-btn-primary" style={{ flex: 2 }} onClick={() => setCurrentStep(3)}>
                    Schedule & Publish →
                  </button>
                </div>
              </div>
              <div className="wf-preview">
                <div className="wf-preview-title">Preview</div>
                <div className="wf-mock-post">
                  <div className="wf-mock-header">
                    <div className="wf-mock-avatar" />
                    <div><div className="wf-mock-name">@brandpulse.ai</div><div className="wf-mock-time">Just now</div></div>
                  </div>
                  <div className="wf-mock-image" style={{ background: selectedTemplate?.template_data?.gradient || 'linear-gradient(135deg,#1A0050,#5B4CF5)' }}>
                    {designData?.dataUrl
                      ? <img src={designData.dataUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : selectedTemplate?.template_data?.emoji || '🎨'
                    }
                  </div>
                  <div className="wf-mock-cap">🚀 Excited to share our latest creative! #Marketing #BrandPulseAI</div>
                  <div className="wf-mock-actions">
                    <span>❤️ Like</span><span>💬 Comment</span><span>↗ Share</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="wf-step-actions">
              <button className="wf-btn-ghost" onClick={() => setCurrentStep(1)}>← Back</button>
            </div>
          </div>
        )}

        {/* ── STEP 4: ANALYSE ── */}
        {currentStep === 3 && (
          <div className="wf-step-content">
            <div className="wf-step-heading">
              <h2>Post published! 🎉</h2>
              <p>Your creative has been scheduled. Here's your performance dashboard.</p>
            </div>
            <div className="wf-success-banner">
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
              <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>Scheduled for tomorrow at 9:00 AM</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Analytics will appear here once your post goes live</div>
            </div>
            <div className="wf-metrics-row">
              {[
                { icon: '👁', label: 'Impressions', val: '—', delta: 'Pending' },
                { icon: '📣', label: 'Reach', val: '—', delta: 'Pending' },
                { icon: '💬', label: 'Engagements', val: '—', delta: 'Pending' },
              ].map((m, i) => (
                <div key={i} className="wf-metric-box">
                  <div className="wf-metric-icon">{m.icon}</div>
                  <div className="wf-metric-val">{m.val}</div>
                  <div className="wf-metric-label">{m.label}</div>
                  <div className="wf-metric-delta">{m.delta}</div>
                </div>
              ))}
            </div>
            <div className="wf-step-actions">
              <button className="wf-btn-ghost" onClick={() => { setCurrentStep(0); setSelectedTemplate(null); }}>
                ← Create New Creative
              </button>
              <button className="wf-btn-primary" onClick={() => navigate('/recommendations')}>
                View Recommendations ✦
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
