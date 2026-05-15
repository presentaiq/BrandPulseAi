import React, { useEffect, useRef, useState, useCallback } from 'react';
import { fabric } from 'fabric';
import { API } from '../context/AuthContext';
import '../styles/editor.css';

const CANVAS_SIZES = {
  'Instagram Post': { w: 1080, h: 1080, display: 600 },
  'Instagram Story': { w: 1080, h: 1920, display: 338 },
  'LinkedIn Post': { w: 1200, h: 628, display: 600 },
  'Facebook Post': { w: 1200, h: 630, display: 600 },
  'Twitter Post': { w: 1200, h: 675, display: 600 },
  'WhatsApp Status': { w: 1080, h: 1920, display: 338 },
};

const GRADIENTS = [
  { label: 'Purple', colors: ['#1A0050', '#5B4CF5'] },
  { label: 'Pink', colors: ['#400030', '#FF4F81'] },
  { label: 'Teal', colors: ['#003040', '#00D4A8'] },
  { label: 'Blue', colors: ['#001A40', '#1877F2'] },
  { label: 'Amber', colors: ['#1A1A00', '#FFB800'] },
  { label: 'Dark', colors: ['#0B0B18', '#232342'] },
  { label: 'Ocean', colors: ['#001830', '#0EA5E9'] },
  { label: 'Sunset', colors: ['#1A0A00', '#FF6B35'] },
];

const FONTS = ['Clash Display', 'Satoshi', 'Arial', 'Georgia', 'Verdana', 'Times New Roman', 'Courier New'];

const SHAPES = ['rect', 'circle', 'triangle', 'line'];

export default function DesignEditor({ template, onSave, onNext }) {
  const canvasRef = useRef(null);
  const fabricRef = useRef(null);
  const fileInputRef = useRef(null);

  const [canvasSize, setCanvasSize] = useState('Instagram Post');
  const [activeObj, setActiveObj] = useState(null);
  const [layers, setLayers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [uploading, setUploading] = useState(false);

  // Text properties
  const [textProps, setTextProps] = useState({
    text: '', fontSize: 32, fontFamily: 'Clash Display',
    fill: '#ffffff', bold: false, italic: false, underline: false,
    align: 'center',
  });

  // Shape / object properties
  const [objProps, setObjProps] = useState({
    fill: '#5B4CF5', stroke: '#ffffff', strokeWidth: 0, opacity: 1,
  });

  const getScale = () => {
    const size = CANVAS_SIZES[canvasSize];
    return size.display / size.w;
  };

  // Init Fabric canvas
  useEffect(() => {
    const size = CANVAS_SIZES[canvasSize];
    const scale = size.display / size.w;
    const displayH = size.h * scale;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: size.display,
      height: displayH,
      backgroundColor: '#0B0B18',
      preserveObjectStacking: true,
    });
    fabricRef.current = canvas;

    // Load template background if provided
    if (template?.template_data?.gradient) {
      applyGradientToCanvas(canvas, template.template_data.gradient, size.display, displayH);
    }

    // Add default text objects
    addDefaultText(canvas, template?.name || 'Your Headline Here', size.display);

    // Selection events
    canvas.on('selection:created', (e) => updateActiveObj(e.selected[0]));
    canvas.on('selection:updated', (e) => updateActiveObj(e.selected[0]));
    canvas.on('selection:cleared', () => { setActiveObj(null); });
    canvas.on('object:modified', () => syncLayers(canvas));
    canvas.on('object:added', () => syncLayers(canvas));
    canvas.on('object:removed', () => syncLayers(canvas));

    syncLayers(canvas);

    return () => canvas.dispose();
    // eslint-disable-next-line
  }, [canvasSize]);

  const applyGradientToCanvas = (canvas, gradientStr, w, h) => {
    // Parse CSS gradient to fabric gradient
    const colorMatch = gradientStr.match(/#[0-9A-Fa-f]{6}/g) || ['#1A0050', '#5B4CF5'];
    const grad = new fabric.Gradient({
      type: 'linear',
      gradientUnits: 'pixels',
      coords: { x1: 0, y1: 0, x2: w, y2: h },
      colorStops: [
        { offset: 0, color: colorMatch[0] || '#1A0050' },
        { offset: 1, color: colorMatch[1] || '#5B4CF5' },
      ],
    });
    const bg = new fabric.Rect({
      width: w, height: h, left: 0, top: 0,
      fill: grad, selectable: false, evented: false,
      name: 'background', excludeFromExport: false,
    });
    canvas.add(bg);
    canvas.sendToBack(bg);
  };

  const addDefaultText = (canvas, headline, canvasW) => {
    const text = new fabric.IText(headline, {
      left: canvasW / 2, top: canvasW * 0.35,
      fontFamily: 'Clash Display', fontSize: 36,
      fill: '#ffffff', fontWeight: 'bold',
      originX: 'center', originY: 'center',
      textAlign: 'center', width: canvasW * 0.85,
      name: 'Headline',
    });
    const sub = new fabric.IText('Your subheading here', {
      left: canvasW / 2, top: canvasW * 0.52,
      fontFamily: 'Satoshi', fontSize: 18,
      fill: 'rgba(255,255,255,0.75)',
      originX: 'center', originY: 'center',
      textAlign: 'center', width: canvasW * 0.8,
      name: 'Subheading',
    });
    canvas.add(text, sub);
    canvas.setActiveObject(text);
    canvas.renderAll();
  };

  const updateActiveObj = (obj) => {
    if (!obj) return;
    setActiveObj(obj);
    if (obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox') {
      setTextProps({
        text: obj.text || '',
        fontSize: Math.round(obj.fontSize || 32),
        fontFamily: obj.fontFamily || 'Clash Display',
        fill: obj.fill || '#ffffff',
        bold: obj.fontWeight === 'bold',
        italic: obj.fontStyle === 'italic',
        underline: obj.underline || false,
        align: obj.textAlign || 'center',
      });
    } else {
      setObjProps({
        fill: typeof obj.fill === 'string' ? obj.fill : '#5B4CF5',
        stroke: obj.stroke || '#ffffff',
        strokeWidth: obj.strokeWidth || 0,
        opacity: obj.opacity || 1,
      });
    }
  };

  const syncLayers = (canvas) => {
    const objs = canvas.getObjects().map((o, i) => ({
      id: i, name: o.name || o.type || `Layer ${i + 1}`,
      type: o.type, visible: o.visible !== false,
      obj: o,
    })).reverse();
    setLayers(objs);
  };

  // ── Text actions ──
  const addText = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const text = new fabric.IText('Double-click to edit', {
      left: canvas.width / 2, top: canvas.height / 2,
      fontFamily: 'Satoshi', fontSize: 24, fill: '#ffffff',
      originX: 'center', originY: 'center',
      textAlign: 'center', name: 'Text',
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  };

  const updateTextProp = (prop, value) => {
    const canvas = fabricRef.current;
    const obj = canvas?.getActiveObject();
    if (!obj) return;
    if (prop === 'bold') obj.set('fontWeight', value ? 'bold' : 'normal');
    else if (prop === 'italic') obj.set('fontStyle', value ? 'italic' : 'normal');
    else if (prop === 'align') obj.set('textAlign', value);
    else obj.set(prop, value);
    canvas.renderAll();
    setTextProps(p => ({ ...p, [prop]: value }));
  };

  // ── Shape actions ──
  const addShape = (shape) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    let obj;
    const cx = canvas.width / 2, cy = canvas.height / 2;
    switch (shape) {
      case 'rect':
        obj = new fabric.Rect({ left: cx - 80, top: cy - 50, width: 160, height: 100, fill: '#5B4CF5', rx: 8, ry: 8, name: 'Rectangle' }); break;
      case 'circle':
        obj = new fabric.Circle({ left: cx - 60, top: cy - 60, radius: 60, fill: '#FF4F81', name: 'Circle' }); break;
      case 'triangle':
        obj = new fabric.Triangle({ left: cx - 60, top: cy - 60, width: 120, height: 100, fill: '#00D4A8', name: 'Triangle' }); break;
      case 'line':
        obj = new fabric.Line([cx - 100, cy, cx + 100, cy], { stroke: '#ffffff', strokeWidth: 3, name: 'Line' }); break;
      default: return;
    }
    canvas.add(obj);
    canvas.setActiveObject(obj);
    canvas.renderAll();
  };

  const updateObjProp = (prop, value) => {
    const canvas = fabricRef.current;
    const obj = canvas?.getActiveObject();
    if (!obj) return;
    obj.set(prop, prop === 'opacity' ? parseFloat(value) : value);
    canvas.renderAll();
    setObjProps(p => ({ ...p, [prop]: value }));
  };

  // ── Image upload ──
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await API.post('/uploads/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      addImageToCanvas(res.data.url);
    } catch (err) {
      // Fallback: load locally using FileReader
      const reader = new FileReader();
      reader.onload = (ev) => addImageToCanvas(ev.target.result);
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const addImageToCanvas = (src) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    fabric.Image.fromURL(src, (img) => {
      const scale = Math.min(
        (canvas.width * 0.6) / img.width,
        (canvas.height * 0.6) / img.height
      );
      img.set({
        left: canvas.width / 2, top: canvas.height / 2,
        originX: 'center', originY: 'center',
        scaleX: scale, scaleY: scale,
        name: 'Image',
      });
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
    }, { crossOrigin: 'anonymous' });
  };

  // ── Background ──
  const applyGradient = (colors) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const bg = canvas.getObjects().find(o => o.name === 'background');
    const w = canvas.width, h = canvas.height;
    const grad = new fabric.Gradient({
      type: 'linear',
      gradientUnits: 'pixels',
      coords: { x1: 0, y1: 0, x2: w, y2: h },
      colorStops: [
        { offset: 0, color: colors[0] },
        { offset: 1, color: colors[1] },
      ],
    });
    if (bg) { bg.set('fill', grad); }
    else {
      const newBg = new fabric.Rect({
        width: w, height: h, left: 0, top: 0,
        fill: grad, selectable: false, evented: false, name: 'background',
      });
      canvas.add(newBg);
      canvas.sendToBack(newBg);
    }
    canvas.renderAll();
  };

  // ── Layer management ──
  const selectLayer = (obj) => {
    const canvas = fabricRef.current;
    if (!canvas || !obj) return;
    canvas.setActiveObject(obj.obj);
    canvas.renderAll();
    updateActiveObj(obj.obj);
  };

  const deleteSelected = () => {
    const canvas = fabricRef.current;
    const obj = canvas?.getActiveObject();
    if (!obj || obj.name === 'background') return;
    canvas.remove(obj);
    canvas.discardActiveObject();
    canvas.renderAll();
  };

  const bringForward = () => {
    const canvas = fabricRef.current;
    canvas?.getActiveObject() && canvas.bringForward(canvas.getActiveObject());
    canvas?.renderAll();
  };

  const sendBackward = () => {
    const canvas = fabricRef.current;
    const obj = canvas?.getActiveObject();
    if (obj && obj.name !== 'background') {
      canvas.sendBackwards(obj);
      canvas.renderAll();
    }
  };

  const duplicateSelected = () => {
    const canvas = fabricRef.current;
    const obj = canvas?.getActiveObject();
    if (!obj) return;
    obj.clone((cloned) => {
      cloned.set({ left: obj.left + 20, top: obj.top + 20, name: `${obj.name} copy` });
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.renderAll();
    });
  };

  // ── Canvas size change ──
  const handleSizeChange = (sizeName) => {
    setCanvasSize(sizeName);
    // Canvas re-initialises via useEffect
  };

  // ── Export & Save ──
  const exportCanvas = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return null;
    const size = CANVAS_SIZES[canvasSize];
    const scale = size.w / canvas.width;
    return canvas.toDataURL({ format: 'png', multiplier: scale, quality: 1 });
  }, [canvasSize]);

  const saveDesign = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      const canvas = fabricRef.current;
      const canvasJSON = canvas.toJSON(['name']);
      const dataUrl = exportCanvas();

      // Convert dataUrl to blob for upload
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const formData = new FormData();
      formData.append('image', blob, 'design.png');

      let imageUrl = dataUrl; // fallback
      try {
        const uploadRes = await API.post('/uploads/design', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        imageUrl = uploadRes.data.url;
      } catch (_) {}

      await API.post('/posts', {
        title: template?.name || 'My Design',
        image_url: imageUrl,
        canvas_json: canvasJSON,
        platforms: [],
        status: 'draft',
      });

      setSaveMsg('✓ Saved to drafts');
      if (onSave) onSave({ imageUrl, canvasJSON });
    } catch (err) {
      setSaveMsg('Failed to save');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(''), 3000);
    }
  };

  const handleNext = () => {
    const dataUrl = exportCanvas();
    if (onNext) onNext({ dataUrl, canvasJSON: fabricRef.current?.toJSON(['name']) });
  };

  const isText = activeObj && (activeObj.type === 'i-text' || activeObj.type === 'text' || activeObj.type === 'textbox');
  const isShape = activeObj && !isText && activeObj.name !== 'background';

  return (
    <div className="editor-shell">
      {/* ── TOP TOOLBAR ── */}
      <div className="editor-topbar">
        <div className="editor-tools">
          <button className="ed-tool" onClick={addText} title="Add Text">
            <span className="ed-tool-icon">T</span> Text
          </button>
          <button className="ed-tool" onClick={() => fileInputRef.current?.click()} title="Upload Image" disabled={uploading}>
            <span className="ed-tool-icon">🖼</span> {uploading ? 'Uploading...' : 'Image'}
          </button>
          <div className="ed-tool-divider" />
          <button className="ed-tool" onClick={() => addShape('rect')} title="Rectangle">⬛ Rect</button>
          <button className="ed-tool" onClick={() => addShape('circle')} title="Circle">⭕ Circle</button>
          <button className="ed-tool" onClick={() => addShape('triangle')} title="Triangle">🔺 Triangle</button>
          <button className="ed-tool" onClick={() => addShape('line')} title="Line">➖ Line</button>
          <div className="ed-tool-divider" />
          <button className="ed-tool" onClick={duplicateSelected} title="Duplicate" disabled={!activeObj}>⧉ Copy</button>
          <button className="ed-tool" onClick={bringForward} title="Bring Forward" disabled={!activeObj}>↑ Forward</button>
          <button className="ed-tool" onClick={sendBackward} title="Send Backward" disabled={!activeObj}>↓ Back</button>
          <button className="ed-tool danger" onClick={deleteSelected} title="Delete" disabled={!activeObj}>🗑 Delete</button>
        </div>

        <div className="editor-topbar-right">
          {saveMsg && <span className={`ed-save-msg ${saveMsg.startsWith('✓') ? 'ok' : 'err'}`}>{saveMsg}</span>}
          <button className="ed-btn-ghost" onClick={saveDesign} disabled={saving}>
            {saving ? '...' : '💾 Save Draft'}
          </button>
          <button className="ed-btn-primary" onClick={handleNext}>
            Next: Post →
          </button>
        </div>
      </div>

      <div className="editor-body">
        {/* ── LEFT PANEL: Properties ── */}
        <div className="editor-left-panel">

          {/* Canvas size */}
          <div className="ed-panel-section">
            <div className="ed-panel-label">Canvas Size</div>
            <select className="ed-select" value={canvasSize} onChange={e => handleSizeChange(e.target.value)}>
              {Object.keys(CANVAS_SIZES).map(s => (
                <option key={s} value={s}>{s} ({CANVAS_SIZES[s].w}×{CANVAS_SIZES[s].h})</option>
              ))}
            </select>
          </div>

          {/* Text properties */}
          {isText && (
            <div className="ed-panel-section">
              <div className="ed-panel-label">Text</div>
              <input
                className="ed-input"
                value={textProps.text}
                onChange={e => updateTextProp('text', e.target.value)}
                placeholder="Edit text..."
              />
              <div className="ed-row">
                <div style={{ flex: 1 }}>
                  <div className="ed-sub-label">Size</div>
                  <input
                    className="ed-input"
                    type="number"
                    value={textProps.fontSize}
                    min={8} max={200}
                    onChange={e => updateTextProp('fontSize', parseInt(e.target.value))}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="ed-sub-label">Colour</div>
                  <input
                    className="ed-color"
                    type="color"
                    value={textProps.fill}
                    onChange={e => updateTextProp('fill', e.target.value)}
                  />
                </div>
              </div>
              <div className="ed-sub-label">Font</div>
              <select className="ed-select" value={textProps.fontFamily} onChange={e => updateTextProp('fontFamily', e.target.value)}>
                {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <div className="ed-style-btns">
                <button className={`ed-style-btn ${textProps.bold ? 'active' : ''}`} onClick={() => updateTextProp('bold', !textProps.bold)} style={{ fontWeight: 'bold' }}>B</button>
                <button className={`ed-style-btn ${textProps.italic ? 'active' : ''}`} onClick={() => updateTextProp('italic', !textProps.italic)} style={{ fontStyle: 'italic' }}>I</button>
                <button className={`ed-style-btn ${textProps.underline ? 'active' : ''}`} onClick={() => updateTextProp('underline', !textProps.underline)} style={{ textDecoration: 'underline' }}>U</button>
                <button className={`ed-style-btn ${textProps.align === 'left' ? 'active' : ''}`} onClick={() => updateTextProp('align', 'left')}>⬛L</button>
                <button className={`ed-style-btn ${textProps.align === 'center' ? 'active' : ''}`} onClick={() => updateTextProp('align', 'center')}>⬛C</button>
                <button className={`ed-style-btn ${textProps.align === 'right' ? 'active' : ''}`} onClick={() => updateTextProp('align', 'right')}>⬛R</button>
              </div>
            </div>
          )}

          {/* Shape/object properties */}
          {isShape && (
            <div className="ed-panel-section">
              <div className="ed-panel-label">Object</div>
              <div className="ed-row">
                <div style={{ flex: 1 }}>
                  <div className="ed-sub-label">Fill</div>
                  <input className="ed-color" type="color" value={objProps.fill} onChange={e => updateObjProp('fill', e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="ed-sub-label">Stroke</div>
                  <input className="ed-color" type="color" value={objProps.stroke} onChange={e => updateObjProp('stroke', e.target.value)} />
                </div>
              </div>
              <div className="ed-sub-label">Stroke Width</div>
              <input className="ed-input" type="number" min={0} max={20} value={objProps.strokeWidth} onChange={e => updateObjProp('strokeWidth', parseInt(e.target.value))} />
              <div className="ed-sub-label">Opacity: {Math.round(objProps.opacity * 100)}%</div>
              <input className="ed-range" type="range" min={0} max={1} step={0.01} value={objProps.opacity} onChange={e => updateObjProp('opacity', e.target.value)} />
            </div>
          )}

          {/* No selection hint */}
          {!activeObj && (
            <div className="ed-panel-section ed-hint">
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>👆</div>
              <div>Click an element on the canvas to edit its properties</div>
            </div>
          )}

          {/* Background gradients */}
          <div className="ed-panel-section">
            <div className="ed-panel-label">Background</div>
            <div className="ed-gradient-grid">
              {GRADIENTS.map(g => (
                <div
                  key={g.label}
                  className="ed-gradient-swatch"
                  style={{ background: `linear-gradient(135deg, ${g.colors[0]}, ${g.colors[1]})` }}
                  onClick={() => applyGradient(g.colors)}
                  title={g.label}
                />
              ))}
            </div>
            <div className="ed-sub-label" style={{ marginTop: '8px' }}>Custom BG Colour</div>
            <input
              className="ed-color"
              type="color"
              defaultValue="#0B0B18"
              onChange={e => {
                const canvas = fabricRef.current;
                const bg = canvas?.getObjects().find(o => o.name === 'background');
                if (bg) { bg.set('fill', e.target.value); canvas.renderAll(); }
                else canvas.setBackgroundColor(e.target.value, () => canvas.renderAll());
              }}
            />
          </div>
        </div>

        {/* ── CANVAS ── */}
        <div className="editor-canvas-wrapper">
          <div className="editor-canvas-container">
            <canvas ref={canvasRef} />
          </div>
          <div className="editor-canvas-label">
            {canvasSize} — {CANVAS_SIZES[canvasSize].w}×{CANVAS_SIZES[canvasSize].h}px
            <span style={{ marginLeft: '8px', color: 'var(--text-muted)' }}>
              (Preview at {CANVAS_SIZES[canvasSize].display}px)
            </span>
          </div>
        </div>

        {/* ── RIGHT PANEL: Layers ── */}
        <div className="editor-right-panel">
          <div className="ed-panel-section">
            <div className="ed-panel-label">Layers</div>
            {layers.length === 0 ? (
              <div className="ed-hint" style={{ fontSize: '12px' }}>No layers yet</div>
            ) : (
              <div className="ed-layers">
                {layers.map((layer, i) => (
                  <div
                    key={i}
                    className={`ed-layer-item ${activeObj === layer.obj ? 'active' : ''}`}
                    onClick={() => selectLayer(layer)}
                  >
                    <span className="ed-layer-icon">
                      {layer.type === 'i-text' || layer.type === 'text' ? '📝' :
                       layer.type === 'image' ? '🖼' :
                       layer.type === 'rect' ? '⬛' :
                       layer.type === 'circle' ? '⭕' :
                       layer.type === 'triangle' ? '🔺' :
                       layer.type === 'line' ? '➖' : '◈'}
                    </span>
                    <span className="ed-layer-name">{layer.name}</span>
                    {layer.obj.name === 'background' && (
                      <span style={{ fontSize: '9px', color: 'var(--text-muted)', marginLeft: 'auto' }}>BG</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Export options */}
          <div className="ed-panel-section">
            <div className="ed-panel-label">Export</div>
            <button className="ed-export-btn" onClick={() => {
              const url = exportCanvas();
              const a = document.createElement('a');
              a.href = url; a.download = 'brandpulse-design.png'; a.click();
            }}>
              ⬇ Download PNG
            </button>
            <button className="ed-export-btn" onClick={() => {
              const canvas = fabricRef.current;
              const json = JSON.stringify(canvas?.toJSON(['name']), null, 2);
              const blob = new Blob([json], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = 'design.json'; a.click();
            }}>
              ⬇ Download JSON
            </button>
          </div>

          {/* Keyboard shortcuts */}
          <div className="ed-panel-section">
            <div className="ed-panel-label">Shortcuts</div>
            <div className="ed-shortcuts">
              {[
                ['Delete', 'Remove selected'],
                ['Ctrl+Z', 'Undo'],
                ['Ctrl+D', 'Duplicate'],
                ['Arrow keys', 'Nudge object'],
                ['Dbl-click text', 'Edit text'],
                ['Scroll', 'Zoom canvas'],
              ].map(([key, desc]) => (
                <div key={key} className="ed-shortcut-row">
                  <span className="ed-shortcut-key">{key}</span>
                  <span className="ed-shortcut-desc">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
    </div>
  );
}
