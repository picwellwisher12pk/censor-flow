import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  FastForward, 
  Eye, 
  Volume2, 
  MoreHorizontal, 
  Copy, 
  Power
} from 'lucide-react';
import type { CensorCue, CensorCategory, CensorActionType, CensorSeverity } from '../types/censor';

interface CueInspectorProps {
  cue: CensorCue | null;
  onUpdateCue: (updated: CensorCue) => void;
  onDeleteCue: (id: string) => void;
  onDuplicateCue: (cue: CensorCue) => void;
  onClose: () => void;
}

const CATEGORIES: { value: CensorCategory; label: string }[] = [
  { value: 'profanity', label: 'Profanity / Language' },
  { value: 'violence', label: 'Violence & Combat' },
  { value: 'nudity', label: 'Nudity & Explicit' },
  { value: 'gore', label: 'Gore & Blood' },
  { value: 'sensitive_pii', label: 'PII / License / Private' },
  { value: 'filler', label: 'Filler / Intro / Outro' },
  { value: 'spoiler', label: 'Spoiler Content' },
  { value: 'custom', label: 'Custom' },
];

export const CueInspector: React.FC<CueInspectorProps> = ({
  cue,
  onUpdateCue,
  onDeleteCue,
  onDuplicateCue,
  onClose,
}) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  if (!cue) return null;

  return (
    <div className="w-80 bg-slate-900 border-l border-slate-800 p-4 flex flex-col gap-4 text-white overflow-y-auto shrink-0 z-20">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          {cue.type === 'skip' && <FastForward className="w-4 h-4 text-amber-400" />}
          {cue.type === 'video' && <Eye className="w-4 h-4 text-sky-400" />}
          {cue.type === 'audio' && <Volume2 className="w-4 h-4 text-emerald-400" />}
          <span className="font-bold text-sm text-slate-100">
            Edit {cue.type.toUpperCase()} Cue
          </span>
        </div>

        <div className="flex items-center space-x-1">
          {/* More options menu with MoreHorizontal */}
          <div className="relative">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="More Actions"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showMoreMenu && (
              <div 
                className="absolute right-0 mt-1 w-40 bg-slate-950 border border-slate-700 rounded-xl shadow-xl py-1 z-30 text-xs"
                onMouseLeave={() => setShowMoreMenu(false)}
              >
                <button
                  onClick={() => {
                    onDuplicateCue(cue);
                    setShowMoreMenu(false);
                  }}
                  className="w-full px-3 py-1.5 text-left text-slate-300 hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-sky-400" /> Duplicate
                </button>
                <button
                  onClick={() => {
                    onUpdateCue({ ...cue, enabled: !cue.enabled });
                    setShowMoreMenu(false);
                  }}
                  className="w-full px-3 py-1.5 text-left text-slate-300 hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                >
                  <Power className="w-3.5 h-3.5 text-amber-400" />
                  {cue.enabled === false ? 'Enable' : 'Disable'}
                </button>
                <button
                  onClick={() => {
                    onDeleteCue(cue.id);
                    setShowMoreMenu(false);
                  }}
                  className="w-full px-3 py-1.5 text-left text-red-400 hover:bg-red-950/40 flex items-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Action Type */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-400">Action Effect</label>
        <select
          value={cue.action}
          onChange={e => onUpdateCue({ ...cue, action: e.target.value as CensorActionType })}
          className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
        >
          {cue.type === 'skip' && <option value="skip">Instant Scene Skip (Jump)</option>}
          {cue.type === 'video' && (
            <>
              <option value="blur">Gaussian Blur</option>
              <option value="pixelate">Pixelate / Mosaic</option>
              <option value="blackout">Solid Blackout Box</option>
            </>
          )}
          {cue.type === 'audio' && (
            <>
              <option value="bleep">1000 Hz Bleep Tone</option>
              <option value="mute">Complete Silence (Mute)</option>
              <option value="duck">Volume Ducking (-80%)</option>
            </>
          )}
        </select>
      </div>

      {/* Category */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-400">Content Category</label>
        <select
          value={cue.category}
          onChange={e => onUpdateCue({ ...cue, category: e.target.value as CensorCategory })}
          className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
        >
          {CATEGORIES.map(cat => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      {/* Severity */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-400">Severity Rating</label>
        <div className="grid grid-cols-4 gap-1">
          {(['low', 'medium', 'high', 'critical'] as CensorSeverity[]).map(sev => (
            <button
              key={sev}
              onClick={() => onUpdateCue({ ...cue, severity: sev })}
              className={`py-1 rounded text-[11px] font-semibold uppercase border transition-all cursor-pointer ${
                cue.severity === sev
                  ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Time Span */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-slate-400">Start Time (ms)</label>
          <input
            type="number"
            step="100"
            value={Math.round(cue.startMs)}
            onChange={e => onUpdateCue({ ...cue, startMs: Math.max(0, parseInt(e.target.value) || 0) })}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-slate-400">End Time (ms)</label>
          <input
            type="number"
            step="100"
            value={Math.round(cue.endMs)}
            onChange={e => onUpdateCue({ ...cue, endMs: Math.max(cue.startMs + 50, parseInt(e.target.value) || 0) })}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
          />
        </div>
      </div>

      {/* Label / Reason */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-400">Label / Description</label>
        <input
          type="text"
          value={cue.label || ''}
          placeholder="e.g. Swearing or Violent weapon"
          onChange={e => onUpdateCue({ ...cue, label: e.target.value })}
          className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-400">Reason / Moderation Note</label>
        <textarea
          rows={2}
          value={cue.reason || ''}
          placeholder="Detailed justification for family viewer or YouTube compliance"
          onChange={e => onUpdateCue({ ...cue, reason: e.target.value })}
          className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 resize-none"
        />
      </div>

      {/* Action-specific Parameters */}
      {cue.action === 'blur' && (
        <div className="flex flex-col gap-1.5 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>Blur Strength</span>
            <span className="font-mono text-sky-400">{cue.params?.blurRadius ?? 24}px</span>
          </div>
          <input
            type="range"
            min="6"
            max="60"
            step="2"
            value={cue.params?.blurRadius ?? 24}
            onChange={e => onUpdateCue({
              ...cue,
              params: { ...cue.params, blurRadius: parseInt(e.target.value) }
            })}
            className="w-full accent-sky-400"
          />
        </div>
      )}

      {cue.action === 'pixelate' && (
        <div className="flex flex-col gap-1.5 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>Pixel Block Size</span>
            <span className="font-mono text-sky-400">{cue.params?.pixelBlockSize ?? 16}px</span>
          </div>
          <input
            type="range"
            min="6"
            max="40"
            step="2"
            value={cue.params?.pixelBlockSize ?? 16}
            onChange={e => onUpdateCue({
              ...cue,
              params: { ...cue.params, pixelBlockSize: parseInt(e.target.value) }
            })}
            className="w-full accent-sky-400"
          />
        </div>
      )}

      {/* Video Bounding Box Info */}
      {cue.type === 'video' && cue.box && (
        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-400 flex flex-col gap-1">
          <span className="font-semibold text-slate-300">Bounding Box (Normalized):</span>
          <div className="grid grid-cols-2 gap-1 font-mono">
            <span>X: {(cue.box.x * 100).toFixed(1)}%</span>
            <span>Y: {(cue.box.y * 100).toFixed(1)}%</span>
            <span>W: {(cue.box.w * 100).toFixed(1)}%</span>
            <span>H: {(cue.box.h * 100).toFixed(1)}%</span>
          </div>
          <span className="text-[10px] text-slate-500 italic mt-1">
            Tip: Click and drag directly on the video frame to reposition or redraw.
          </span>
        </div>
      )}

      {/* Delete button */}
      <button
        onClick={() => onDeleteCue(cue.id)}
        className="mt-auto w-full py-2 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-red-300 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" />
        Delete Cue
      </button>
    </div>
  );
};
