import React, { useRef, useEffect, useState, useCallback } from 'react';
import { FastForward, EyeOff, VolumeX, ShieldAlert, Plus, Sparkles, AlertTriangle, Copy, Check, Terminal, X } from 'lucide-react';
import type { BoundingBox, CensorCue, PlaybackSettings } from '../types/censor';
import type { SubtitleCue } from '../types/subtitle';
import { CanvasCensorRenderer } from '../engine/canvasRenderer';

interface VideoViewportProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  videoSrc: string | null;
  currentTimeMs: number;
  durationMs: number;
  cues: CensorCue[];
  subtitles?: SubtitleCue[];
  selectedCueId: string | null;
  onSelectCue: (cueId: string | null) => void;
  onAddBoxCue: (box: BoundingBox) => void;
  onManualSkip: (targetMs: number) => void;
  upcomingSkip: CensorCue | null;
  settings: PlaybackSettings;
  onLoadDemo: () => void;
  onOpenVideoFile: () => void;
  onDurationChange?: (durationMs: number) => void;
}

function formatExactTime(ms: number): string {
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

export const VideoViewport: React.FC<VideoViewportProps> = ({
  videoRef,
  videoSrc,
  currentTimeMs,
  cues,
  subtitles = [],
  selectedCueId,
  onSelectCue,
  onAddBoxCue,
  onManualSkip,
  upcomingSkip,
  settings,
  onLoadDemo,
  onOpenVideoFile,
  onDurationChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CanvasCensorRenderer>(new CanvasCensorRenderer());

  // Interactive drawing state (Studio mode)
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [currentBox, setCurrentBox] = useState<BoundingBox | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [copiedFFmpeg, setCopiedFFmpeg] = useState(false);

  useEffect(() => {
    setVideoError(null);
  }, [videoSrc]);

  const handleVideoError = () => {
    const video = videoRef.current;
    const err = video?.error;
    if (err && err.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
      setVideoError(
        'Browser Codec Limitation: This file uses H.265 / HEVC 10-bit color. Web browsers cannot decode 10-bit HEVC without OS hardware extensions or converting to H.264.'
      );
    } else if (err && err.code === MediaError.MEDIA_ERR_DECODE) {
      setVideoError('Video decode error: The browser encountered an error decoding this video stream.');
    } else {
      setVideoError('The browser could not decode or play this video format.');
    }
  };

  // Synchronize canvas size with video display dimensions
  const updateCanvasSize = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const rect = video.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      if (canvas.width !== rect.width || canvas.height !== rect.height) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    }
  }, [videoRef]);

  const handleLoadedMetadata = useCallback(() => {
    updateCanvasSize();
    const video = videoRef.current;
    if (video && video.duration && !isNaN(video.duration) && isFinite(video.duration)) {
      onDurationChange?.(video.duration * 1000);
    }
  }, [updateCanvasSize, videoRef, onDurationChange]);

  const handleDurationChange = useCallback(() => {
    const video = videoRef.current;
    if (video && video.duration && !isNaN(video.duration) && isFinite(video.duration)) {
      onDurationChange?.(video.duration * 1000);
    }
  }, [videoRef, onDurationChange]);

  // Frame render loop
  useEffect(() => {
    let animId: number;

    const render = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && rendererRef.current) {
        updateCanvasSize();
        rendererRef.current.render(
          canvas,
          video,
          currentTimeMs,
          cues,
          selectedCueId,
          settings.mode === 'studio'
        );

        // Draw in-progress box if currently drawing
        if (isDrawing && currentBox) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.save();
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 6]);
            ctx.strokeRect(
              currentBox.x * canvas.width,
              currentBox.y * canvas.height,
              currentBox.w * canvas.width,
              currentBox.h * canvas.height
            );
            ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
            ctx.fillRect(
              currentBox.x * canvas.width,
              currentBox.y * canvas.height,
              currentBox.w * canvas.width,
              currentBox.h * canvas.height
            );
            ctx.restore();
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [currentTimeMs, cues, selectedCueId, settings.mode, isDrawing, currentBox, updateCanvasSize, videoRef]);

  // Mouse handlers for drawing bounding boxes on canvas
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (settings.mode !== 'studio') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;

    // Check if clicked inside an existing active box
    const activeVideoCues = cues.filter(
      c => c.type === 'video' && c.enabled !== false && currentTimeMs >= c.startMs && currentTimeMs <= c.endMs
    );

    const hit = activeVideoCues.find(c => {
      const b = c.box || { x: 0, y: 0, w: 1, h: 1 };
      return nx >= b.x && nx <= b.x + b.w && ny >= b.y && ny <= b.y + b.h;
    });

    if (hit) {
      onSelectCue(hit.id);
      return;
    }

    // Otherwise start drawing a new box
    setIsDrawing(true);
    setDrawStart({ x: nx, y: ny });
    setCurrentBox({ x: nx, y: ny, w: 0, h: 0 });
    onSelectCue(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !drawStart) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const currentX = (e.clientX - rect.left) / rect.width;
    const currentY = (e.clientY - rect.top) / rect.height;

    const x = Math.min(drawStart.x, currentX);
    const y = Math.min(drawStart.y, currentY);
    const w = Math.abs(currentX - drawStart.x);
    const h = Math.abs(currentY - drawStart.y);

    setCurrentBox({
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y)),
      w: Math.min(1 - x, w),
      h: Math.min(1 - y, h),
    });
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentBox && currentBox.w > 0.03 && currentBox.h > 0.03) {
      onAddBoxCue(currentBox);
    }
    setDrawStart(null);
    setCurrentBox(null);
  };

  // Active cues right now
  const activeCues = cues.filter(
    c => c.enabled !== false && currentTimeMs >= c.startMs && currentTimeMs <= c.endMs
  );
  const activeMute = activeCues.find(c => c.type === 'audio');
  const activeVideo = activeCues.find(c => c.type === 'video');
  const activeSubtitle = subtitles.find(
    s => currentTimeMs >= s.startMs && currentTimeMs <= s.endMs
  );

  return (
    <div 
      ref={containerRef}
      className="relative flex-1 bg-black flex items-center justify-center overflow-hidden select-none min-h-[360px]"
    >
      {videoSrc ? (
        <div className="relative max-w-full max-h-full flex items-center justify-center">
          <video
            ref={videoRef}
            src={videoSrc}
            playsInline
            crossOrigin="anonymous"
            className="max-h-[calc(100vh-320px)] max-w-full object-contain pointer-events-auto"
            onLoadedMetadata={handleLoadedMetadata}
            onDurationChange={handleDurationChange}
            onCanPlay={handleDurationChange}
            onError={handleVideoError}
          />
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className={`absolute inset-0 w-full h-full ${
              settings.mode === 'studio' ? 'cursor-crosshair' : 'pointer-events-none'
            }`}
          />

          {/* Studio Mode Guide Banner */}
          {settings.mode === 'studio' && (
            <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur border border-slate-700/80 px-3 py-1.5 rounded-lg text-xs text-slate-300 pointer-events-none flex items-center gap-2">
              <Plus className="w-3.5 h-3.5 text-sky-400" />
              <span>Click & Drag to draw censor box on frame</span>
            </div>
          )}

          {/* Active Censor Badges HUD */}
          <div className="absolute top-3 right-3 flex flex-col gap-1.5 pointer-events-none">
            {activeMute && (
              <div className="bg-amber-500/90 text-slate-950 font-bold px-2.5 py-1 rounded-md text-xs shadow-lg flex items-center gap-1.5 animate-pulse">
                <VolumeX className="w-3.5 h-3.5" />
                <span>Audio {activeMute.action.toUpperCase()}: {activeMute.category}</span>
              </div>
            )}
            {activeVideo && (
              <div className="bg-sky-500/90 text-slate-950 font-bold px-2.5 py-1 rounded-md text-xs shadow-lg flex items-center gap-1.5">
                <EyeOff className="w-3.5 h-3.5" />
                <span>Video {activeVideo.action.toUpperCase()}: {activeVideo.category}</span>
              </div>
            )}
          </div>

          {/* Upcoming Scene Skip Alert Banner */}
          {upcomingSkip && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-amber-500/50 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-200 z-20">
              <div className="flex items-center gap-2 text-amber-400">
                <ShieldAlert className="w-5 h-5 animate-bounce" />
                <div>
                  <div className="text-xs font-bold text-white">
                    Approaching: {upcomingSkip.label || `${upcomingSkip.category.toUpperCase()} Scene`}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {upcomingSkip.reason || 'Flagged for censorship'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onManualSkip(upcomingSkip.endMs + 50)}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1 shadow cursor-pointer transition-colors"
                >
                  <FastForward className="w-3.5 h-3.5" />
                  Skip Now
                </button>
              </div>
            </div>
          )}

          {/* Active Subtitle Caption Overlay */}
          {activeSubtitle && (
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 max-w-[85%] text-center pointer-events-none z-10 animate-in fade-in zoom-in-95 duration-100">
              <span className="inline-block bg-black/85 text-white font-medium text-xs sm:text-sm md:text-base px-3.5 py-1.5 rounded-lg shadow-2xl border border-white/15 leading-snug">
                {activeSubtitle.text}
              </span>
            </div>
          )}

          {/* Exact Timecode Corner Overlay */}
          <div className="absolute bottom-2.5 left-2.5 bg-black/80 backdrop-blur border border-slate-700/80 px-2 py-0.5 rounded font-mono text-[11px] text-sky-400 pointer-events-none shadow-md flex items-center gap-1.5 z-10">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span>{formatExactTime(currentTimeMs)}</span>
          </div>

          {/* Codec Error Diagnostic Overlay */}
          {videoError && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-30 flex items-center justify-center p-6 animate-in fade-in duration-200">
              <div className="max-w-lg bg-slate-900 border border-amber-500/40 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 text-white">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-amber-300">Browser Codec Notice</h3>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {videoError}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setVideoError(null)}
                    className="p-1 text-slate-500 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs flex flex-col gap-2">
                  <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" /> Fast Transcode Command (Lossless Audio Copy):
                  </span>
                  <pre className="bg-slate-900 border border-slate-800 p-2 rounded-lg text-[11px] font-mono text-emerald-300 overflow-x-auto select-all leading-tight">
                    ffmpeg -i "input.mp4" -c:v libx264 -crf 20 -c:a copy "transcoded_h264.mp4"
                  </pre>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('ffmpeg -i "input.mp4" -c:v libx264 -crf 20 -c:a copy "transcoded_h264.mp4"');
                      setCopiedFFmpeg(true);
                      setTimeout(() => setCopiedFFmpeg(false), 2000);
                    }}
                    className="self-start px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow transition-colors cursor-pointer"
                  >
                    {copiedFFmpeg ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedFFmpeg ? 'Copied to Clipboard!' : 'Copy FFmpeg Command'}
                  </button>
                </div>

                <div className="flex justify-end gap-2 pt-1 border-t border-slate-800">
                  <button
                    onClick={() => setVideoError(null)}
                    className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Dismiss & Continue Editing
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty State / Welcome Dropzone */
        <div className="flex flex-col items-center justify-center p-8 max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 text-sky-400 shadow-xl">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Welcome to CensorFlow</h2>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Protect your viewers, prevent demonetization, and curate family-friendly playback with frame-accurate blur, pixelation, muting, and auto-skipping.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
            <button
              onClick={onLoadDemo}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Load Interactive Demo Video
            </button>
            <button
              onClick={onOpenVideoFile}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              Open Video File (MP4/WebM)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
