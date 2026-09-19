import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw, 
  ChevronLeft, 
  ChevronRight, 
  Volume2, 
  VolumeX, 
  FastForward, 
  Plus, 
  MoreHorizontal,
  Maximize2,
  Gauge
} from 'lucide-react';
import type { PlaybackSettings } from '../types/censor';

interface PlayerControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentTimeMs: number;
  durationMs: number;
  onSeekMs: (ms: number) => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  settings: PlaybackSettings;
  onUpdateSettings: (s: Partial<PlaybackSettings>) => void;
  onAddQuickCue: (type: 'skip' | 'blur' | 'bleep') => void;
  onToggleFullscreen: () => void;
  playbackRate: number;
  onPlaybackRateChange: (rate: number) => void;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, ms) / 1000;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const millis = Math.floor((totalSeconds % 1) * 1000);
  const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}.${millis.toString().padStart(3, '0')}`;
  return hours > 0 ? `${hours.toString().padStart(2, '0')}:${timeStr}` : timeStr;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  isPlaying,
  onTogglePlay,
  currentTimeMs,
  durationMs,
  onSeekMs,
  volume,
  onVolumeChange,
  isMuted,
  onToggleMute,
  settings,
  onUpdateSettings,
  onAddQuickCue,
  onToggleFullscreen,
  playbackRate,
  onPlaybackRateChange,
}) => {
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  return (
    <div className="bg-slate-900 border-t border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-white select-none z-20 shrink-0">
      {/* Primary Transport Controls */}
      <div className="flex items-center space-x-1.5">
        <button
          onClick={() => onSeekMs(currentTimeMs - 5000)}
          className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Rewind 5s (Left Arrow)"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={() => onSeekMs(currentTimeMs - 33.33)}
          className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Previous Frame (,)"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          onClick={onTogglePlay}
          className="w-10 h-10 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 flex items-center justify-center transition-transform active:scale-95 shadow-md shadow-sky-500/20 cursor-pointer"
          title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 fill-slate-950" />
          ) : (
            <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
          )}
        </button>

        <button
          onClick={() => onSeekMs(currentTimeMs + 33.33)}
          className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Next Frame (.)"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <button
          onClick={() => onSeekMs(currentTimeMs + 5000)}
          className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Forward 5s (Right Arrow)"
        >
          <RotateCw className="w-4 h-4" />
        </button>

        {/* Timecode display */}
        <div className="ml-2 font-mono text-xs text-slate-300 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
          <span className="text-sky-400 font-semibold">{formatTime(currentTimeMs)}</span>
          <span className="text-slate-600 mx-1">/</span>
          <span>{formatTime(durationMs)}</span>
        </div>
      </div>

      {/* Center Studio Quick Tools (when in studio mode) */}
      {settings.mode === 'studio' && (
        <div className="flex items-center space-x-2 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">
            Quick Add:
          </span>
          <button
            onClick={() => onAddQuickCue('skip')}
            className="px-2.5 py-1 rounded-lg bg-amber-950/70 hover:bg-amber-900/80 text-amber-300 border border-amber-800/60 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            title="Mark section to auto-skip"
          >
            <FastForward className="w-3.5 h-3.5" />
            + Skip
          </button>
          <button
            onClick={() => onAddQuickCue('blur')}
            className="px-2.5 py-1 rounded-lg bg-sky-950/70 hover:bg-sky-900/80 text-sky-300 border border-sky-800/60 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            title="Add blur censor box"
          >
            <Plus className="w-3.5 h-3.5" />
            + Blur Box
          </button>
          <button
            onClick={() => onAddQuickCue('bleep')}
            className="px-2.5 py-1 rounded-lg bg-indigo-950/70 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-800/60 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            title="Add audio bleep/mute"
          >
            <Plus className="w-3.5 h-3.5" />
            + Bleep Audio
          </button>
        </div>
      )}

      {/* Right Controls: Auto-Skip Toggle, Volume, Speed Menu */}
      <div className="flex items-center space-x-3">
        {/* Auto-Skip Toggle */}
        <button
          onClick={() => onUpdateSettings({ autoSkip: !settings.autoSkip })}
          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            settings.autoSkip
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
          }`}
          title="Toggle Auto-Skip (automatically jumps past sensitive scenes)"
        >
          <FastForward className={`w-3.5 h-3.5 ${settings.autoSkip ? 'text-amber-400' : ''}`} />
          <span>Auto-Skip: {settings.autoSkip ? 'ON' : 'OFF'}</span>
        </button>

        {/* Volume */}
        <div className="flex items-center space-x-2 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
          <button
            onClick={onToggleMute}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-red-400" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={e => onVolumeChange(parseFloat(e.target.value))}
            className="w-16 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-400"
          />
        </div>

        {/* Playback speed / More Menu using MoreHorizontal */}
        <div className="relative">
          <button
            onClick={() => setShowSpeedMenu(!showSpeedMenu)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            title="Playback Speed & Fullscreen"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {showSpeedMenu && (
            <div
              className="absolute right-0 bottom-full mb-2 w-44 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100"
              onMouseLeave={() => setShowSpeedMenu(false)}
            >
              <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Gauge className="w-3 h-3" /> Speed
              </div>
              {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map(rate => (
                <button
                  key={rate}
                  onClick={() => {
                    onPlaybackRateChange(rate);
                    setShowSpeedMenu(false);
                  }}
                  className={`w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-slate-800 cursor-pointer ${
                    playbackRate === rate ? 'text-sky-400 font-bold' : 'text-slate-300'
                  }`}
                >
                  <span>{rate}x</span>
                  {playbackRate === rate && <span className="text-xs">✓</span>}
                </button>
              ))}

              <div className="my-1 border-t border-slate-800" />

              <button
                onClick={() => {
                  setShowSpeedMenu(false);
                  onToggleFullscreen();
                }}
                className="w-full px-3 py-1.5 text-left text-slate-300 hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
                Fullscreen
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
