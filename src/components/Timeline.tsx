import React, { useRef, useState, useCallback, useEffect } from 'react';
import { FastForward, Eye, Volume2, ZoomIn, ZoomOut, Scissors, MessageSquare, Plus, Trash2 } from 'lucide-react';
import type { CensorCue } from '../types/censor';
import type { SubtitleCue } from '../types/subtitle';
import { drawWaveform } from '../utils/waveformUtils';

interface TimelineProps {
  durationMs: number;
  currentTimeMs: number;
  cues: CensorCue[];
  subtitles?: SubtitleCue[];
  selectedCueId: string | null;
  selectedSubtitleId?: string | null;
  onSeekMs: (ms: number) => void;
  onSelectCue: (id: string | null) => void;
  onSelectSubtitle?: (id: string | null) => void;
  onUpdateCueTimes: (id: string, startMs: number, endMs: number) => void;
  onUpdateSubtitleTimes?: (id: string, startMs: number, endMs: number) => void;
  audioPeaks?: number[];
  isStudioMode: boolean;
  onAddQuickCue?: (type: 'skip' | 'blur' | 'bleep') => void;
  onDeleteCue?: (id: string) => void;
}

function formatRulerTimeAdaptive(ms: number, stepMs: number): string {
  const totalSeconds = Math.max(0, ms) / 1000;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const millis = Math.floor((totalSeconds % 1) * 1000);

  if (stepMs < 100) {
    const millisStr = millis.toString().padStart(3, '0');
    const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${millisStr}`;
    return hours > 0 ? `${hours}:${timeStr}` : timeStr;
  }

  if (stepMs < 1000) {
    const tenths = Math.floor(millis / 100);
    const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${tenths}`;
    return hours > 0 ? `${hours}:${timeStr}` : timeStr;
  }

  const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${timeStr}`;
  }
  return timeStr;
}

export const Timeline: React.FC<TimelineProps> = ({
  durationMs,
  currentTimeMs,
  cues,
  subtitles = [],
  selectedCueId,
  selectedSubtitleId,
  onSeekMs,
  onSelectCue,
  onSelectSubtitle,
  onUpdateCueTimes,
  onUpdateSubtitleTimes,
  audioPeaks = [],
  isStudioMode,
  onAddQuickCue,
  onDeleteCue,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const customScrollTrackRef = useRef<HTMLDivElement>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1); // 1x to 8x
  const [isScrubbing, setIsScrubbing] = useState(false);

  // Custom scrollbar tracking state
  const [scrollInfo, setScrollInfo] = useState({ scrollLeft: 0, scrollWidth: 1, clientWidth: 1 });
  const [isDraggingScrollThumb, setIsDraggingScrollThumb] = useState(false);
  const dragScrollRef = useRef<{ initialMouseX: number; initialScrollLeft: number } | null>(null);

  const updateScrollInfo = useCallback(() => {
    const el = scrollContainerRef.current;
    if (el) {
      setScrollInfo({
        scrollLeft: el.scrollLeft,
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
      });
    }
  }, []);

  // Mouse wheel zoom and horizontal pan over timeline
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      // Horizontal scroll with Shift+Wheel or touchpad horizontal swipe
      if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        el.scrollLeft += e.shiftKey ? e.deltaY : e.deltaX;
        updateScrollInfo();
        return;
      }

      e.preventDefault();
      // Smooth proportional zoom factor
      const zoomMultiplier = e.deltaY < 0 ? 1.25 : 0.8;
      setZoom(prev => {
        const raw = prev * zoomMultiplier;
        const nextZoom = Math.min(256.0, Math.max(1.0, Number(raw.toFixed(1))));
        if (el && nextZoom !== prev) {
          const rect = el.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const ratio = (el.scrollLeft + mouseX) / (el.scrollWidth || 1);
          requestAnimationFrame(() => {
            if (el) {
              el.scrollLeft = ratio * el.scrollWidth - mouseX;
              updateScrollInfo();
            }
          });
        }
        return nextZoom;
      });
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [updateScrollInfo]);

  // Update scroll metrics on zoom change or window resize
  useEffect(() => {
    updateScrollInfo();
    const handleResize = () => updateScrollInfo();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [zoom, updateScrollInfo]);

  // Dragging cue or subtitle handles state
  const [draggingItem, setDraggingItem] = useState<{
    id: string;
    itemType: 'censor' | 'subtitle';
    handle: 'start' | 'end' | 'move';
    initialMouseX: number;
    initialStartMs: number;
    initialEndMs: number;
  } | null>(null);

  const duration = Math.max(1000, durationMs);
  const playheadPercent = Math.min(100, Math.max(0, (currentTimeMs / duration) * 100));

  // Custom scrollbar thumb geometry & calculations (zero native layout shift)
  const maxScrollLeft = Math.max(0, scrollInfo.scrollWidth - scrollInfo.clientWidth);
  const visibleRatio = scrollInfo.scrollWidth > 0 ? scrollInfo.clientWidth / scrollInfo.scrollWidth : 1;
  const thumbWidthPercent = Math.min(100, Math.max(4, visibleRatio * 100));
  const thumbLeftPercent = maxScrollLeft > 0
    ? (scrollInfo.scrollLeft / maxScrollLeft) * (100 - thumbWidthPercent)
    : 0;

  const handleThumbMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDraggingScrollThumb(true);
    const el = scrollContainerRef.current;
    dragScrollRef.current = {
      initialMouseX: e.clientX,
      initialScrollLeft: el ? el.scrollLeft : 0,
    };
  };

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const track = customScrollTrackRef.current;
    const el = scrollContainerRef.current;
    if (!track || !el || maxScrollLeft <= 0) return;

    const rect = track.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickRatio = Math.max(0, Math.min(1, clickX / rect.width));
    const thumbRatio = thumbWidthPercent / 100;
    const targetRatio = Math.max(0, Math.min(1, (clickRatio - thumbRatio / 2) / (1 - thumbRatio)));
    el.scrollLeft = targetRatio * maxScrollLeft;
    updateScrollInfo();
  };

  useEffect(() => {
    if (!isDraggingScrollThumb) return;

    const handleMouseMove = (e: MouseEvent) => {
      const el = scrollContainerRef.current;
      const track = customScrollTrackRef.current;
      if (!el || !track || !dragScrollRef.current) return;

      const deltaX = e.clientX - dragScrollRef.current.initialMouseX;
      const trackWidth = track.getBoundingClientRect().width;
      const availableTrackPx = trackWidth * (1 - thumbWidthPercent / 100);
      if (availableTrackPx <= 0) return;

      const scrollDelta = (deltaX / availableTrackPx) * maxScrollLeft;
      el.scrollLeft = Math.max(0, Math.min(maxScrollLeft, dragScrollRef.current.initialScrollLeft + scrollDelta));
      updateScrollInfo();
    };

    const handleMouseUp = () => {
      setIsDraggingScrollThumb(false);
      dragScrollRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingScrollThumb, maxScrollLeft, thumbWidthPercent, updateScrollInfo]);

  // Render waveform canvas whenever audioPeaks, zoom, or scroll changes
  useEffect(() => {
    const canvas = waveformCanvasRef.current;
    const el = scrollContainerRef.current;
    if (!canvas || !el) return;

    const clientWidth = el.clientWidth || 1000;
    const scrollWidth = el.scrollWidth || clientWidth;
    const scrollLeft = el.scrollLeft || 0;

    const startRatio = scrollWidth > 0 ? scrollLeft / scrollWidth : 0;
    const endRatio = scrollWidth > 0 ? (scrollLeft + clientWidth) / scrollWidth : 1;

    canvas.width = clientWidth;
    canvas.height = 40; // Track 3 height
    const ctx = canvas.getContext('2d');
    if (ctx) {
      drawWaveform(ctx, audioPeaks, canvas.width, canvas.height, startRatio, endRatio);
    }
  }, [audioPeaks, zoom, scrollInfo.scrollLeft, scrollInfo.clientWidth, scrollInfo.scrollWidth]);

  // Convert mouse X position inside timeline to milliseconds
  const getMsFromEvent = useCallback(
    (e: MouseEvent | React.MouseEvent) => {
      if (!containerRef.current) return 0;
      const rect = containerRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percent = Math.max(0, Math.min(1, clickX / rect.width));
      return percent * duration;
    },
    [duration]
  );

  const handleMouseDownTrack = (e: React.MouseEvent) => {
    if (draggingItem) return;
    setIsScrubbing(true);
    const ms = getMsFromEvent(e);
    onSeekMs(ms);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isScrubbing) {
        const ms = getMsFromEvent(e);
        onSeekMs(ms);
      } else if (draggingItem && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const deltaPx = e.clientX - draggingItem.initialMouseX;
        const deltaMs = (deltaPx / rect.width) * duration;

        let newStart = draggingItem.initialStartMs;
        let newEnd = draggingItem.initialEndMs;

        if (draggingItem.handle === 'start') {
          newStart = Math.max(0, Math.min(draggingItem.initialEndMs - 200, draggingItem.initialStartMs + deltaMs));
        } else if (draggingItem.handle === 'end') {
          newEnd = Math.max(draggingItem.initialStartMs + 200, Math.min(duration, draggingItem.initialEndMs + deltaMs));
        } else if (draggingItem.handle === 'move') {
          const span = draggingItem.initialEndMs - draggingItem.initialStartMs;
          newStart = draggingItem.initialStartMs + deltaMs;
          newEnd = draggingItem.initialEndMs + deltaMs;
          if (newStart < 0) {
            newStart = 0;
            newEnd = span;
          }
          if (newEnd > duration) {
            newEnd = duration;
            newStart = duration - span;
          }
        }

        if (draggingItem.itemType === 'censor') {
          onUpdateCueTimes(draggingItem.id, newStart, newEnd);
        } else if (draggingItem.itemType === 'subtitle' && onUpdateSubtitleTimes) {
          onUpdateSubtitleTimes(draggingItem.id, newStart, newEnd);
        }
      }
    };

    const handleMouseUp = () => {
      setIsScrubbing(false);
      setDraggingItem(null);
    };

    if (isScrubbing || draggingItem) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isScrubbing, draggingItem, getMsFromEvent, onSeekMs, onUpdateCueTimes, onUpdateSubtitleTimes, duration]);

  // Separate cues into tracks
  const skipCues = cues.filter(c => c.type === 'skip');
  const videoCues = cues.filter(c => c.type === 'video');
  const audioCues = cues.filter(c => c.type === 'audio');

  // Adaptive time ruler ticks calculation
  // Automatically selects human time intervals (100ms up to 2 hours) so seconds are always easy to read
  const clientWidth = scrollInfo.clientWidth || 1000;
  const totalWidthPx = clientWidth * zoom;
  const msPerPx = duration / Math.max(1, totalWidthPx);
  const targetMajorStepMs = msPerPx * 85; // Target roughly 85px between major tick labels

  const NICE_STEPS_MS = [
    25,         // ~40fps frame
    33.33,      // 30fps frame (33.3ms)
    41.67,      // 24fps cinema frame (41.7ms)
    50,         // 50ms
    100,        // 0.1s
    250,        // 0.25s
    500,        // 0.5s
    1000,       // 1s
    2000,       // 2s
    5000,       // 5s
    10000,      // 10s
    15000,      // 15s
    30000,      // 30s
    60000,      // 1m
    120000,     // 2m
    300000,     // 5m
    600000,     // 10m
    900000,     // 15m
    1800000,    // 30m
    3600000,    // 1h
    7200000,    // 2h
  ];

  let majorStepMs = NICE_STEPS_MS.find(s => s >= targetMajorStepMs);
  if (!majorStepMs) {
    const hours = Math.ceil(targetMajorStepMs / 3600000);
    majorStepMs = hours * 3600000;
  }

  // Sub-tick divisions (minor ticks between major labels)
  let subDivisions = 5;
  if (majorStepMs <= 50) subDivisions = 2;
  else if (majorStepMs <= 100) subDivisions = 2;
  else if (majorStepMs <= 500) subDivisions = 2;
  else if (majorStepMs === 1000) subDivisions = 2; // 0.5s marks
  else if (majorStepMs === 2000) subDivisions = 2; // 1s marks
  else if (majorStepMs === 5000) subDivisions = 5; // 1s marks
  else if (majorStepMs === 10000) subDivisions = 5; // 2s marks
  else if (majorStepMs === 15000) subDivisions = 3; // 5s marks
  else if (majorStepMs === 30000) subDivisions = 6; // 5s marks
  else if (majorStepMs === 60000) subDivisions = 4; // 15s marks
  else if (majorStepMs === 120000) subDivisions = 4; // 30s marks
  else if (majorStepMs >= 300000) subDivisions = 5; // 1m / 2m / 5m marks

  const subStepMs = majorStepMs / subDivisions;

  interface RulerTick {
    ms: number;
    percent: number;
    isMajor: boolean;
    label?: string;
  }

  // Virtual window: only generate ticks within visible viewport plus 1 screen margin on each side
  const visibleStartMs = Math.max(0, ((scrollInfo.scrollLeft - clientWidth) / totalWidthPx) * duration);
  const visibleEndMs = Math.min(duration, ((scrollInfo.scrollLeft + clientWidth * 2) / totalWidthPx) * duration);

  const startStepIndex = Math.max(0, Math.floor(visibleStartMs / subStepMs));
  const endStepIndex = Math.min(Math.floor(duration / subStepMs), Math.ceil(visibleEndMs / subStepMs));

  const ticks: RulerTick[] = [];
  for (let i = startStepIndex; i <= endStepIndex; i++) {
    const ms = i * subStepMs;
    const isMajor = (i % subDivisions === 0);
    const percent = (ms / duration) * 100;
    ticks.push({
      ms,
      percent,
      isMajor,
      label: isMajor ? formatRulerTimeAdaptive(ms, majorStepMs) : undefined,
    });
  }

  const renderCueBlock = (cue: CensorCue, colorClass: string, icon: React.ReactNode) => {
    const left = `${(cue.startMs / duration) * 100}%`;
    const width = `${Math.max(0.5, ((cue.endMs - cue.startMs) / duration) * 100)}%`;
    const isSelected = cue.id === selectedCueId;

    return (
      <div
        key={cue.id}
        onClick={e => {
          e.stopPropagation();
          onSelectCue(cue.id);
          if (onSelectSubtitle) onSelectSubtitle(null);
          onSeekMs(cue.startMs);
        }}
        onMouseDown={e => {
          if (!isStudioMode) return;
          if (e.target !== e.currentTarget) return;
          setDraggingItem({
            id: cue.id,
            itemType: 'censor',
            handle: 'move',
            initialMouseX: e.clientX,
            initialStartMs: cue.startMs,
            initialEndMs: cue.endMs,
          });
        }}
        style={{ left, width }}
        className={`absolute top-1 bottom-1 rounded-md px-2 flex items-center justify-between text-[11px] font-semibold select-none cursor-pointer transition-all border ${colorClass} ${
          isSelected
            ? 'ring-2 ring-white z-10 brightness-110 shadow-lg'
            : 'hover:brightness-105'
        }`}
        title={`${cue.action.toUpperCase()}: ${cue.category} (${((cue.endMs - cue.startMs) / 1000).toFixed(1)}s)`}
      >
        {isStudioMode && (
          <div
            onMouseDown={e => {
              e.stopPropagation();
              setDraggingItem({
                id: cue.id,
                itemType: 'censor',
                handle: 'start',
                initialMouseX: e.clientX,
                initialStartMs: cue.startMs,
                initialEndMs: cue.endMs,
              });
            }}
            className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/40 rounded-l-md"
          />
        )}

        <div className="flex items-center gap-1.5 truncate pointer-events-none flex-1 min-w-0">
          {icon}
          <span className="truncate">{cue.label || `${cue.action}: ${cue.category}`}</span>
        </div>

        {isSelected && isStudioMode && onDeleteCue && (
          <button
            onClick={e => {
              e.stopPropagation();
              onDeleteCue(cue.id);
            }}
            className="p-1 ml-auto hover:bg-rose-500/40 text-rose-300 hover:text-white rounded cursor-pointer pointer-events-auto transition-colors shrink-0 z-10"
            title="Delete Cue (Del / Backspace)"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}

        {isStudioMode && (
          <div
            onMouseDown={e => {
              e.stopPropagation();
              setDraggingItem({
                id: cue.id,
                itemType: 'censor',
                handle: 'end',
                initialMouseX: e.clientX,
                initialStartMs: cue.startMs,
                initialEndMs: cue.endMs,
              });
            }}
            className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/40 rounded-r-md"
          />
        )}
      </div>
    );
  };

  const renderSubtitleBlock = (sub: SubtitleCue) => {
    const left = `${(sub.startMs / duration) * 100}%`;
    const width = `${Math.max(0.5, ((sub.endMs - sub.startMs) / duration) * 100)}%`;
    const isSelected = sub.id === selectedSubtitleId;

    return (
      <div
        key={sub.id}
        onClick={e => {
          e.stopPropagation();
          if (onSelectSubtitle) onSelectSubtitle(sub.id);
          onSelectCue(null);
          onSeekMs(sub.startMs);
        }}
        onMouseDown={e => {
          if (!isStudioMode) return;
          if (e.target !== e.currentTarget) return;
          setDraggingItem({
            id: sub.id,
            itemType: 'subtitle',
            handle: 'move',
            initialMouseX: e.clientX,
            initialStartMs: sub.startMs,
            initialEndMs: sub.endMs,
          });
        }}
        style={{ left, width }}
        className={`absolute top-1 bottom-1 rounded-md px-2 flex items-center justify-between text-[11px] font-medium select-none cursor-pointer transition-all border bg-purple-500/25 text-purple-200 border-purple-500/60 ${
          isSelected
            ? 'ring-2 ring-white z-10 brightness-110 shadow-lg'
            : 'hover:brightness-105'
        }`}
        title={`Subtitle: "${sub.text}" (${((sub.endMs - sub.startMs) / 1000).toFixed(1)}s)`}
      >
        {isStudioMode && (
          <div
            onMouseDown={e => {
              e.stopPropagation();
              setDraggingItem({
                id: sub.id,
                itemType: 'subtitle',
                handle: 'start',
                initialMouseX: e.clientX,
                initialStartMs: sub.startMs,
                initialEndMs: sub.endMs,
              });
            }}
            className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/40 rounded-l-md"
          />
        )}

        <div className="flex items-center gap-1.5 truncate pointer-events-none">
          <MessageSquare className="w-3 h-3 text-purple-400 shrink-0" />
          <span className="truncate italic">"{sub.text}"</span>
        </div>

        {isStudioMode && (
          <div
            onMouseDown={e => {
              e.stopPropagation();
              setDraggingItem({
                id: sub.id,
                itemType: 'subtitle',
                handle: 'end',
                initialMouseX: e.clientX,
                initialStartMs: sub.startMs,
                initialEndMs: sub.endMs,
              });
            }}
            className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/40 rounded-r-md"
          />
        )}
      </div>
    );
  };

  return (
    <div className="bg-slate-950 border-t border-slate-800 p-3 select-none flex flex-col gap-2 shrink-0">
      {/* Timeline Toolbar */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <div className="flex items-center space-x-4">
          <span className="font-semibold text-slate-300">Timeline Tracks</span>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-amber-500/60 inline-block" /> Auto-Skips
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-sky-500/60 inline-block" /> Video Mask
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500/60 inline-block" /> Audio + Waveform
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-purple-500/60 inline-block" /> Subtitles
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Quick Add Cue Buttons */}
          {onAddQuickCue && (
            <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 font-semibold px-0.5 hidden sm:inline">Add:</span>
              <button
                onClick={() => onAddQuickCue('skip')}
                className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 rounded transition-colors cursor-pointer"
                title="Add 3s Scene Skip at Playhead (Hotkey: S)"
              >
                <Plus className="w-3 h-3" />
                <span>Skip</span>
                <span className="text-[9px] opacity-60 font-mono">S</span>
              </button>
              <button
                onClick={() => onAddQuickCue('blur')}
                className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-500/30 rounded transition-colors cursor-pointer"
                title="Add 3s Video Mask at Playhead (Hotkey: V)"
              >
                <Plus className="w-3 h-3" />
                <span>Mask</span>
                <span className="text-[9px] opacity-60 font-mono">V</span>
              </button>
              <button
                onClick={() => onAddQuickCue('bleep')}
                className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 rounded transition-colors cursor-pointer"
                title="Add 1.5s Audio Bleep / Mute at Playhead (Hotkey: M)"
              >
                <Plus className="w-3 h-3" />
                <span>Bleep</span>
                <span className="text-[9px] opacity-60 font-mono">M</span>
              </button>
            </div>
          )}

          {/* Zoom Controls */}
          <div className="flex items-center space-x-1.5 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setZoom(prev => Math.max(1, Number((prev <= 2 ? prev - 0.5 : prev / 1.35).toFixed(1))))}
            className="p-1 hover:text-white cursor-pointer transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-mono text-slate-300 min-w-[36px] text-center">{zoom.toFixed(1)}x</span>
          <button
            onClick={() => setZoom(prev => Math.min(256, Number((prev < 2 ? prev + 0.5 : prev * 1.35).toFixed(1))))}
            className="p-1 hover:text-white cursor-pointer transition-colors"
            title="Zoom In (or Wheel Up to 256x)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          {/* Quick Zoom Presets */}
          <div className="flex items-center gap-1 border-l border-slate-800 pl-1.5">
            {zoom > 1 && (
              <button
                onClick={() => setZoom(1)}
                className="px-1.5 py-0.5 text-[9px] bg-slate-800 hover:bg-slate-700 text-sky-400 font-semibold rounded cursor-pointer transition-colors"
                title="Fit Whole Timeline (1x)"
              >
                Fit
              </button>
            )}
            <button
              onClick={() => setZoom(32)}
              className={`px-1.5 py-0.5 text-[9px] rounded font-mono cursor-pointer transition-colors ${
                Math.round(zoom) === 32 ? 'bg-sky-500 text-slate-950 font-bold' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
              title="32x Scene Zoom"
            >
              32x
            </button>
            <button
              onClick={() => setZoom(128)}
              className={`px-1.5 py-0.5 text-[9px] rounded font-mono cursor-pointer transition-colors ${
                Math.round(zoom) === 128 ? 'bg-sky-500 text-slate-950 font-bold' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
              title="128x Second-Level Zoom"
            >
              128x
            </button>
            <button
              onClick={() => setZoom(256)}
              className={`px-1.5 py-0.5 text-[9px] rounded font-mono cursor-pointer transition-colors ${
                Math.round(zoom) === 256 ? 'bg-sky-500 text-slate-950 font-bold' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
              title="256x Frame Precision"
            >
              256x
            </button>
          </div>
        </div>
      </div>
    </div>

      {/* Tracks Container with Horizontal Scroll */}
      <div 
        ref={scrollContainerRef}
        onScroll={updateScrollInfo}
        className="overflow-x-auto overflow-y-hidden select-none no-scrollbar"
        title="Scroll mouse wheel over timeline to zoom in/out, Shift+Wheel to scroll horizontally"
      >
        <div
          ref={containerRef}
          onMouseDown={handleMouseDownTrack}
          style={{ width: `${zoom * 100}%` }}
          className="relative min-w-full bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden cursor-pointer"
        >
          {/* Time Ruler */}
          <div className="h-6 bg-slate-900 border-b border-slate-800 relative pointer-events-none overflow-hidden">
            {ticks.map((t, idx) => (
              <div
                key={idx}
                style={{ left: `${t.percent}%` }}
                className={`absolute top-0 bottom-0 flex flex-col justify-between ${
                  t.isMajor
                    ? 'border-l border-slate-700/90 text-[9px] font-mono text-slate-300 pl-1 z-10'
                    : 'border-l border-slate-800/60 z-0'
                }`}
              >
                {t.isMajor ? (
                  <>
                    <span className="leading-none mt-1 tracking-tight select-none">{t.label}</span>
                    <div className="w-0.5 h-2 bg-slate-500" />
                  </>
                ) : (
                  <div className="w-px h-1 bg-slate-700/60 self-start mt-auto" />
                )}
              </div>
            ))}
          </div>

          {/* Track 1: Scene Skips */}
          <div className="h-8 border-b border-slate-800/80 relative bg-slate-950/40">
            <div className="absolute left-2 top-2 text-[9px] uppercase font-bold text-amber-500/70 pointer-events-none flex items-center gap-1 z-0">
              <FastForward className="w-3 h-3" /> Skips
            </div>
            {skipCues.map(c =>
              renderCueBlock(
                c,
                'bg-amber-500/20 text-amber-200 border-amber-500/50 bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,rgba(245,158,11,0.15)_6px,rgba(245,158,11,0.15)_12px)]',
                <Scissors className="w-3 h-3 shrink-0" />
              )
            )}
          </div>

          {/* Track 2: Video Censor (Blur, Pixelate, Blackout) */}
          <div className="h-8 border-b border-slate-800/80 relative bg-slate-950/30">
            <div className="absolute left-2 top-2 text-[9px] uppercase font-bold text-sky-400/70 pointer-events-none flex items-center gap-1 z-0">
              <Eye className="w-3 h-3" /> Video Mask
            </div>
            {videoCues.map(c =>
              renderCueBlock(
                c,
                'bg-sky-500/25 text-sky-200 border-sky-500/60',
                <Eye className="w-3 h-3 shrink-0" />
              )
            )}
          </div>

          {/* Track 3: Audio Censor + Waveform Background */}
          <div className="h-10 border-b border-slate-800/80 relative bg-slate-950/20 overflow-hidden">
            {/* Viewport-pinned Waveform Canvas (Sticky to current scroll window) */}
            <div
              className="sticky left-0 top-0 bottom-0 pointer-events-none"
              style={{ width: scrollInfo.clientWidth || '100%' }}
            >
              <canvas
                ref={waveformCanvasRef}
                className="w-full h-full opacity-80"
              />
            </div>

            <div className="absolute left-2 top-2 text-[9px] uppercase font-bold text-emerald-400/80 pointer-events-none flex items-center gap-1 z-10">
              <Volume2 className="w-3 h-3" /> Audio & Waveform
            </div>
            {audioCues.map(c =>
              renderCueBlock(
                c,
                'bg-emerald-500/35 text-emerald-100 border-emerald-500/80 backdrop-blur-xs',
                <Volume2 className="w-3 h-3 shrink-0" />
              )
            )}
          </div>

          {/* Track 4: Subtitles Track */}
          <div className="h-8 relative bg-slate-950/10">
            <div className="absolute left-2 top-2 text-[9px] uppercase font-bold text-purple-400/80 pointer-events-none flex items-center gap-1 z-0">
              <MessageSquare className="w-3 h-3" /> Subtitles ({subtitles.length})
            </div>
            {subtitles.map(s => renderSubtitleBlock(s))}
          </div>

          {/* Playhead Indicator Bar & Needle */}
          <div
            style={{ left: `${playheadPercent}%` }}
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none z-30 shadow-[0_0_8px_rgba(239,68,68,0.9)]"
          >
            {/* Playhead Handle */}
            <div className="w-3 h-3 -ml-[5px] bg-red-500 rotate-45 rounded-sm shadow-md" />
          </div>
        </div>
      </div>

      {/* Custom Horizontal Scrollbar (Zero Layout Shift - Always Fixed Height) */}
      <div className="h-2.5 w-full px-1 flex items-center shrink-0">
        <div
          ref={customScrollTrackRef}
          onClick={handleTrackClick}
          className={`relative w-full h-1.5 rounded-full transition-colors ${
            zoom > 1 ? 'bg-slate-800/80 hover:bg-slate-800 cursor-pointer' : 'bg-transparent cursor-default'
          }`}
        >
          {zoom > 1 && (
            <div
              onMouseDown={handleThumbMouseDown}
              style={{
                left: `${thumbLeftPercent}%`,
                width: `${thumbWidthPercent}%`,
              }}
              className={`absolute top-0 bottom-0 rounded-full transition-colors shadow-sm ${
                isDraggingScrollThumb
                  ? 'bg-sky-400 cursor-grabbing ring-2 ring-sky-400/40'
                  : 'bg-slate-600 hover:bg-sky-500 cursor-grab'
              }`}
              title="Drag to scroll timeline horizontally"
            />
          )}
        </div>
      </div>
    </div>
  );
};
