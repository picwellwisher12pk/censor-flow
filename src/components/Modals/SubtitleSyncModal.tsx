import React, { useState } from 'react';
import { 
  X, 
  Clock, 
  FastForward, 
  Download, 
  Upload, 
  Plus, 
  Trash2, 
  Search, 
  Sparkles, 
  Check, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import type { SubtitleCue } from '../../types/subtitle';
import type { CensorCue } from '../../types/censor';
import { 
  shiftSubtitles, 
  applyTwoPointSync, 
  serializeSrt, 
  serializeVtt, 
  parseSrt, 
  formatTimeSrt 
} from '../../utils/subtitleUtils';
import { scanSrtForProfanity, profanityResultsToCues } from '../../ai/scanner';

interface SubtitleSyncModalProps {
  cues: SubtitleCue[];
  currentTimeMs: number;
  onUpdateSubtitles: (cues: SubtitleCue[]) => void;
  onSeekMs: (ms: number) => void;
  onAddCensorCues: (cues: CensorCue[]) => void;
  onClose: () => void;
}

export const SubtitleSyncModal: React.FC<SubtitleSyncModalProps> = ({
  cues,
  currentTimeMs,
  onUpdateSubtitles,
  onSeekMs,
  onAddCensorCues,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCueId, setSelectedCueId] = useState<string | null>(cues[0]?.id || null);
  const [customShiftMs, setCustomShiftMs] = useState(0);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // 2-point drift state
  const [showTwoPoint, setShowTwoPoint] = useState(false);
  const [anchor1Idx, setAnchor1Idx] = useState(0);
  const [anchor1Target, setAnchor1Target] = useState(cues[0]?.startMs || 0);
  const [anchor2Idx, setAnchor2Idx] = useState(Math.max(0, cues.length - 1));
  const [anchor2Target, setAnchor2Target] = useState(cues[cues.length - 1]?.startMs || 0);

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 2500);
  };

  const selectedCue = cues.find(c => c.id === selectedCueId) || null;

  // 1-Click "Snap Selected Subtitle to Playhead"
  const handleSnapToPlayhead = () => {
    if (!selectedCue) return;
    const delta = currentTimeMs - selectedCue.startMs;
    const shifted = shiftSubtitles(cues, delta);
    onUpdateSubtitles(shifted);
    triggerToast(`Shifted all subtitles by ${delta > 0 ? '+' : ''}${(delta / 1000).toFixed(2)}s to match playhead!`);
  };

  // Nudge all subtitles by delta
  const handleNudge = (deltaMs: number) => {
    const shifted = shiftSubtitles(cues, deltaMs);
    onUpdateSubtitles(shifted);
    triggerToast(`Nudged subtitles by ${deltaMs > 0 ? '+' : ''}${deltaMs}ms`);
  };

  // Apply custom shift
  const handleApplyCustomShift = () => {
    if (customShiftMs === 0) return;
    handleNudge(customShiftMs);
    setCustomShiftMs(0);
  };

  // Apply 2-point linear sync
  const handleApplyTwoPointSync = () => {
    if (cues.length < 2) return;
    const synced = applyTwoPointSync(
      cues,
      { index: anchor1Idx, targetMs: anchor1Target },
      { index: anchor2Idx, targetMs: anchor2Target }
    );
    onUpdateSubtitles(synced);
    setShowTwoPoint(false);
    triggerToast('2-point drift calibration applied successfully!');
  };

  // Auto-censor profanity from these subtitles
  const handleAutoCensorProfanity = () => {
    const srtText = serializeSrt(cues);
    const detections = scanSrtForProfanity(srtText);
    if (detections.length === 0) {
      triggerToast('No profanity found in current subtitles.');
      return;
    }
    const censorCues = profanityResultsToCues(detections, 'bleep');
    onAddCensorCues(censorCues);
    triggerToast(`Created ${censorCues.length} audio bleep cues from subtitles!`);
  };

  // File import
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = evt => {
        try {
          const content = evt.target?.result as string;
          const parsed = parseSrt(content);
          if (parsed.length > 0) {
            onUpdateSubtitles(parsed);
            setSelectedCueId(parsed[0].id);
            triggerToast(`Imported ${parsed.length} subtitle cues!`);
          } else {
            alert('No valid subtitle cues found in file.');
          }
        } catch {
          alert('Failed to parse subtitle file.');
        }
      };
      reader.readAsText(file);
    }
  };

  // Download export
  const handleDownload = (format: 'srt' | 'vtt') => {
    const content = format === 'srt' ? serializeSrt(cues) : serializeVtt(cues);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `synced_subtitles.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Edit single cue text or time
  const handleUpdateSingleCue = (updated: SubtitleCue) => {
    onUpdateSubtitles(cues.map(c => (c.id === updated.id ? updated : c)));
  };

  const handleDeleteSingleCue = (id: string) => {
    const next = cues.filter(c => c.id !== id);
    onUpdateSubtitles(next);
    if (selectedCueId === id) setSelectedCueId(next[0]?.id || null);
  };

  const handleAddNewCue = () => {
    const newCue: SubtitleCue = {
      id: `sub-${Date.now()}`,
      startMs: Math.round(currentTimeMs),
      endMs: Math.round(currentTimeMs + 3000),
      text: 'New subtitle dialogue line',
    };
    const next = [...cues, newCue].sort((a, b) => a.startMs - b.startMs);
    onUpdateSubtitles(next);
    setSelectedCueId(newCue.id);
  };

  // Filter cues
  const filteredCues = cues.filter(c =>
    c.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-white">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">Subtitle Synchronizer & Editor</h2>
                <span className="text-[11px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-mono">
                  {cues.length} lines
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Fix out-of-sync audio/dialogue, calibrate drift, and auto-censor profanity
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleAutoCensorProfanity}
              className="px-3 py-1.5 rounded-lg bg-amber-950/70 hover:bg-amber-900/80 text-amber-300 border border-amber-700/60 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Detect swear words in subtitles and auto-create bleep cues"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              Censor from Subtitles
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Toast Banner */}
        {successToast && (
          <div className="bg-emerald-600/90 text-slate-950 font-bold px-4 py-2 text-xs flex items-center gap-2 animate-in slide-in-from-top duration-200">
            <Check className="w-4 h-4" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Sync Controls Toolbar */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* 1-Click Snap to Playhead */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSnapToPlayhead}
              disabled={!selectedCue}
              className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-semibold flex items-center gap-1.5 shadow-md shadow-sky-600/20 cursor-pointer transition-all"
              title="Shift all subtitles so selected line starts exactly at current video position"
            >
              <FastForward className="w-3.5 h-3.5" />
              Snap Selected to Playhead ({(currentTimeMs / 1000).toFixed(2)}s)
            </button>

            <button
              onClick={() => setShowTwoPoint(!showTwoPoint)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                showTwoPoint
                  ? 'bg-purple-600 text-white border-purple-500'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              2-Point Drift Fix
            </button>
          </div>

          {/* Quick Nudges */}
          <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-xl border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">
              Nudge All:
            </span>
            {[-1000, -500, -100, 100, 500, 1000].map(delta => (
              <button
                key={delta}
                onClick={() => handleNudge(delta)}
                className="px-2 py-1 rounded-lg hover:bg-slate-800 text-slate-300 font-mono text-[11px] cursor-pointer"
              >
                {delta > 0 ? `+${delta}` : delta}ms
              </button>
            ))}
          </div>

          {/* Custom Shift Input */}
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              step="50"
              placeholder="±ms"
              value={customShiftMs || ''}
              onChange={e => setCustomShiftMs(parseInt(e.target.value) || 0)}
              className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono"
            />
            <button
              onClick={handleApplyCustomShift}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold cursor-pointer"
            >
              Shift
            </button>
          </div>
        </div>

        {/* Optional 2-Point Linear Drift Calibration Card */}
        {showTwoPoint && cues.length >= 2 && (
          <div className="p-4 bg-purple-950/40 border-b border-purple-800/40 flex flex-col gap-3 text-xs animate-in slide-in-from-top-2 duration-150">
            <div className="font-semibold text-purple-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>2-Point Progressive Drift Correction (Fix 23.976 fps vs 25 fps Stretch)</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Set where the first dialogue line should start, and where the last dialogue line should start. The engine will smoothly rescale and interpolate every line in between!
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold">Anchor 1 (First Reference)</span>
                  <select
                    value={anchor1Idx}
                    onChange={e => {
                      const idx = parseInt(e.target.value);
                      setAnchor1Idx(idx);
                      setAnchor1Target(cues[idx]?.startMs || 0);
                    }}
                    className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-[11px] text-slate-300 max-w-[140px] truncate"
                  >
                    {cues.map((c, i) => (
                      <option key={c.id} value={i}>
                        Line {i + 1}: "{c.text.slice(0, 16)}..."
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={anchor1Target}
                    onChange={e => setAnchor1Target(parseInt(e.target.value) || 0)}
                    className="w-28 bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-white"
                  />
                  <button
                    onClick={() => setAnchor1Target(Math.round(currentTimeMs))}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
                  >
                    Use Playhead
                  </button>
                </div>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold">Anchor 2 (Second Reference)</span>
                  <select
                    value={anchor2Idx}
                    onChange={e => {
                      const idx = parseInt(e.target.value);
                      setAnchor2Idx(idx);
                      setAnchor2Target(cues[idx]?.startMs || 0);
                    }}
                    className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-[11px] text-slate-300 max-w-[140px] truncate"
                  >
                    {cues.map((c, i) => (
                      <option key={c.id} value={i}>
                        Line {i + 1}: "{c.text.slice(0, 16)}..."
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={anchor2Target}
                    onChange={e => setAnchor2Target(parseInt(e.target.value) || 0)}
                    className="w-28 bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-white"
                  />
                  <button
                    onClick={() => setAnchor2Target(Math.round(currentTimeMs))}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
                  >
                    Use Playhead
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setShowTwoPoint(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyTwoPointSync}
                className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold cursor-pointer shadow"
              >
                Apply Progressive Drift Correction
              </button>
            </div>
          </div>
        )}

        {/* Main Subtitle Table / List */}
        <div className="flex-1 overflow-hidden flex flex-col p-4 gap-3">
          {/* Search & Actions Bar */}
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Search dialogue..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleAddNewCue}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-sky-400" />
                Add Line at Playhead
              </button>
            </div>
          </div>

          {/* Subtitle Rows Container */}
          <div className="flex-1 overflow-y-auto border border-slate-800 rounded-xl bg-slate-950/60 divide-y divide-slate-800/60">
            {filteredCues.map((cue, idx) => {
              const isSelected = cue.id === selectedCueId;
              return (
                <div
                  key={cue.id}
                  onClick={() => setSelectedCueId(cue.id)}
                  className={`p-2.5 flex items-start gap-3 transition-colors cursor-pointer text-xs ${
                    isSelected
                      ? 'bg-purple-950/40 border-l-4 border-purple-500'
                      : 'hover:bg-slate-900/60'
                  }`}
                >
                  <span className="font-mono text-slate-500 text-[11px] w-6 pt-1">
                    {idx + 1}
                  </span>

                  {/* Timing & Seek */}
                  <div className="flex flex-col gap-1 shrink-0 w-44 font-mono text-[11px]">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onSeekMs(cue.startMs);
                      }}
                      className="text-left text-sky-400 hover:underline flex items-center gap-1"
                      title="Seek to this timestamp"
                    >
                      <span>{formatTimeSrt(cue.startMs)}</span>
                      <ArrowRight className="w-3 h-3 text-slate-600" />
                      <span>{formatTimeSrt(cue.endMs)}</span>
                    </button>
                    <span className="text-slate-500 text-[10px]">
                      Duration: {((cue.endMs - cue.startMs) / 1000).toFixed(2)}s
                    </span>
                  </div>

                  {/* Subtitle Dialogue Input */}
                  <div className="flex-1">
                    <input
                      type="text"
                      value={cue.text}
                      onChange={e => handleUpdateSingleCue({ ...cue, text: e.target.value })}
                      className="w-full bg-slate-900/70 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  {/* Delete line */}
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleDeleteSingleCue(cue.id);
                    }}
                    className="p-1.5 rounded hover:bg-red-950/40 text-slate-500 hover:text-red-400 cursor-pointer"
                    title="Delete this line"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}

            {filteredCues.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-xs">
                No matching dialogue lines found.
              </div>
            )}
          </div>
        </div>

        {/* Footer with Import & Export Buttons */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <label className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5 text-sky-400" />
              Load .srt / .vtt
              <input
                type="file"
                accept=".srt,.vtt"
                className="hidden"
                onChange={handleImportFile}
              />
            </label>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDownload('srt')}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export Synced .SRT
            </button>
            <button
              onClick={() => handleDownload('vtt')}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export .VTT
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
