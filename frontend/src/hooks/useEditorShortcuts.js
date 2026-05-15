import { useEffect } from 'react';

export function useEditorShortcuts(fabricRef, deleteSelected, duplicateSelected) {
  useEffect(() => {
    const handleKey = (e) => {
      const canvas = fabricRef?.current;
      if (!canvas) return;

      // Don't fire shortcuts when typing in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const obj = canvas.getActiveObject();

      // Delete / Backspace
      if ((e.key === 'Delete' || e.key === 'Backspace') && obj && obj.name !== 'background') {
        if (obj.type === 'i-text' && obj.isEditing) return;
        e.preventDefault();
        deleteSelected && deleteSelected();
      }

      // Ctrl+D — Duplicate
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        duplicateSelected && duplicateSelected();
      }

      // Ctrl+Z — Undo (basic: remove last added)
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        const objs = canvas.getObjects();
        const last = objs[objs.length - 1];
        if (last && last.name !== 'background') {
          canvas.remove(last);
          canvas.discardActiveObject();
          canvas.renderAll();
        }
      }

      // Arrow keys — nudge selected object
      if (obj && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        if (obj.type === 'i-text' && obj.isEditing) return;
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        if (e.key === 'ArrowLeft') obj.set('left', obj.left - step);
        if (e.key === 'ArrowRight') obj.set('left', obj.left + step);
        if (e.key === 'ArrowUp') obj.set('top', obj.top - step);
        if (e.key === 'ArrowDown') obj.set('top', obj.top + step);
        obj.setCoords();
        canvas.renderAll();
      }

      // Escape — deselect
      if (e.key === 'Escape') {
        canvas.discardActiveObject();
        canvas.renderAll();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [fabricRef, deleteSelected, duplicateSelected]);
}
