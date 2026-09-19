import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { 
  CensorProject, 
  CensorCue, 
  PlaybackSettings, 
  BoundingBox
} from './types/censor';
import type { SubtitleCue } from './types/subtitle';
import { AudioCensorEngine } from './engine/audioEngine';
import { SkipEngine } from './engine/skipEngine';
import { DEMO_PROJECT, exportCensorJson, parseCensorJson } from './utils/sidecar';
import { createSyntheticDemoVideo } from './utils/syntheticMedia';
import { DEMO_SUBTITLES, parseSrt, parseVtt } from './utils/subtitleUtils';
import { generateSyntheticPeaks, extractWaveformPeaks } from './utils/waveformUtils';
import { UploadCloud, CheckCircle2, Film, Music, MessageSquare, Shield } from 'lucide-react';
import { Header } from './components/Header';
import { VideoViewport } from './components/VideoViewport';
import { PlayerControls } from './components/PlayerControls';
import { Timeline } from './components/Timeline';
import { CueInspector } from './components/CueInspector';
import { FFmpegModal } from './components/Modals/FFmpegModal';
import { AiScannerModal } from './components/Modals/AiScannerModal';
import { SubtitleSyncModal } from './components/Modals/SubtitleSyncModal';
import { LandingPage } from './components/LandingPage';

const isDesktopApp = typeof window !== 'undefined' && ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);

const getInitialPage = (): 'landing' | 'studio' => {
  if (isDesktopApp) return 'studio';
  const hash = window.location.hash.toLowerCase();
  const search = window.location.search.toLowerCase();
  if (hash === '#app' || hash === '#/app' || hash === '#studio' || search.includes('app')) {
    return 'studio';
  }
  return 'landing';
};

export const App: React.FC = () => {
  // Page routing: 'landing' marketing page vs 'studio' editor app
  const [currentPage, setCurrentPage] = useState<'landing' | 'studio'>(getInitialPage);

  useEffect(() => {
    if (isDesktopApp) return;
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();
      if (hash === '#app' || hash === '#/app' || hash === '#studio' || search.includes('app')) {
        setCurrentPage('studio');
      } else if (hash === '' || hash === '#' || hash === '#home') {
        setCurrentPage('landing');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  const handleLaunchApp = () => {
    setCurrentPage('studio');
    window.location.hash = '#app';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToLanding = () => {
    setCurrentPage('landing');
    window.location.hash = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  // Video and playback state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [durationMs, setDurationMs] = useState(45000);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);

  // Audio Waveform Peaks
  const [audioPeaks, setAudioPeaks] = useState<number[]>(() => generateSyntheticPeaks(800));

  // Censor Project state
  const [project, setProject] = useState<CensorProject>(DEMO_PROJECT);
  const [selectedCueId, setSelectedCueId] = useState<string | null>(null);

  // Subtitles state
  const [subtitles, setSubtitles] = useState<SubtitleCue[]>(DEMO_SUBTITLES);
  const [selectedSubtitleId, setSelectedSubtitleId] = useState<string | null>(null);

  // Settings
  const [settings, setSettings] = useState<PlaybackSettings>({
    autoSkip: true,
    enabledCategories: {
      profanity: true,
      violence: true,
      nudity: true,
      gore: true,
      filler: true,
      spoiler: true,
      sensitive_pii: true,
      custom: true,
    },
    mode: 'player', // Default to viewer/family mode
    defaultBlurRadius: 24,
    defaultPixelBlock: 16,
    bleepVolume: 0.3,
  });

  // Modal dialog states
  const [showFFmpegModal, setShowFFmpegModal] = useState(false);
  const [showAiScannerModal, setShowAiScannerModal] = useState(false);
  const [showSubtitleModal, setShowSubtitleModal] = useState(false);

  // Engines
  const audioEngineRef = useRef<AudioCensorEngine>(new AudioCensorEngine());
  const skipEngineRef = useRef<SkipEngine>(new SkipEngine());

  // Upcoming skip cue alert
  const [upcomingSkip, setUpcomingSkip] = useState<CensorCue | null>(null);

  // Hidden file inputs
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);

  // Connect Web Audio API when video source changes
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      audioEngineRef.current.init(video);
    }
  }, [videoSrc]);

  // Handle Play/Pause
  const handleTogglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    audioEngineRef.current.resumeContext();

    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  // Handle Seek
  const handleSeekMs = useCallback((targetMs: number) => {
    const video = videoRef.current;
    if (!video) return;
    const clampedMs = Math.max(0, Math.min(durationMs, targetMs));
    video.currentTime = clampedMs / 1000;
    setCurrentTimeMs(clampedMs);
  }, [durationMs]);

  // High-frequency 60fps playhead animation loop when isPlaying
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let animId: number;

    const tick = () => {
      if (!video.paused && !video.ended) {
        const curMs = video.currentTime * 1000;
        setCurrentTimeMs(curMs);

        // Check auto-skip
        const skipResult = skipEngineRef.current.checkAutoSkip(
          curMs,
          project.cues,
          settings.autoSkip
        );

        if (skipResult) {
          video.currentTime = skipResult.targetMs / 1000;
          setCurrentTimeMs(skipResult.targetMs);
        }

        // Check upcoming skip notification
        const approaching = skipEngineRef.current.getApproachingSkip(
          curMs,
          project.cues,
          3000
        );
        setUpcomingSkip(approaching);

        // Apply real-time Web Audio muting and bleep tones
        audioEngineRef.current.update(curMs, project.cues, isMuted ? 0 : volume);
      }

      if (isPlaying) {
        animId = requestAnimationFrame(tick);
      }
    };

    if (isPlaying) {
      animId = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPlaying, project.cues, settings.autoSkip, isMuted, volume]);

  const handleDurationUpdated = useCallback((dMs: number) => {
    if (dMs && !isNaN(dMs) && isFinite(dMs) && dMs > 0) {
      setDurationMs(dMs);
      setProject(prev => ({
        ...prev,
        metadata: { ...prev.metadata, durationMs: dMs }
      }));
    }
  }, []);

  // Video event listeners for playback state and metadata
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      // Keep playhead synchronized even when paused and scrubbing
      const curMs = video.currentTime * 1000;
      setCurrentTimeMs(curMs);
      audioEngineRef.current.update(curMs, project.cues, isMuted ? 0 : volume);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleLoadedMetadata = () => {
      if (video.duration && !isNaN(video.duration) && isFinite(video.duration)) {
        const dMs = video.duration * 1000;
        setDurationMs(dMs);
        setProject(prev => ({
          ...prev,
          metadata: { ...prev.metadata, durationMs: dMs }
        }));
      }
    };

    // If metadata is already loaded when the effect attaches
    if (video.duration && !isNaN(video.duration) && isFinite(video.duration)) {
      handleLoadedMetadata();
    }

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('durationchange', handleLoadedMetadata);
    video.addEventListener('canplay', handleLoadedMetadata);

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('durationchange', handleLoadedMetadata);
      video.removeEventListener('canplay', handleLoadedMetadata);
    };
  }, [videoSrc, project.cues, isMuted, volume]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          handleTogglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleSeekMs(currentTimeMs - (e.shiftKey ? 10000 : 5000));
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleSeekMs(currentTimeMs + (e.shiftKey ? 10000 : 5000));
          break;
        case 'Comma':
          e.preventDefault();
          handleSeekMs(currentTimeMs - 33.33);
          break;
        case 'Period':
          e.preventDefault();
          handleSeekMs(currentTimeMs + 33.33);
          break;
        case 'KeyM':
          if (settings.mode === 'studio') {
            handleAddQuickCue('bleep');
          } else {
            setIsMuted(prev => !prev);
          }
          break;
        case 'KeyS':
          if (settings.mode === 'studio') {
            handleAddQuickCue('skip');
          }
          break;
        case 'KeyB':
          if (settings.mode === 'studio') {
            handleAddQuickCue('blur');
          }
          break;
        case 'Delete':
        case 'Backspace':
          if (selectedCueId) {
            handleDeleteCue(selectedCueId);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTimeMs, handleTogglePlay, handleSeekMs, settings.mode, selectedCueId]);

  // Load in-memory synthetic demo video
  const handleLoadDemo = async () => {
    try {
      const url = await createSyntheticDemoVideo(45);
      setVideoSrc(url);
      setProject(DEMO_PROJECT);
      setSubtitles(DEMO_SUBTITLES);
      setAudioPeaks(generateSyntheticPeaks(800));
      setDurationMs(45000);
      handleSeekMs(0);
    } catch (err) {
      console.error('Failed to generate demo video:', err);
    }
  };

  // Toast and Drag & Drop states
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Universal File Processing (Video, Audio, Subtitles, Censor JSON)
  const processFile = useCallback(async (file: File) => {
    const name = file.name.toLowerCase();

    if (name.endsWith('.srt') || name.endsWith('.vtt')) {
      try {
        const text = await file.text();
        const parsed = name.endsWith('.vtt') ? parseVtt(text) : parseSrt(text);
        if (parsed.length > 0) {
          setSubtitles(parsed);
          showToast(`Loaded ${parsed.length} subtitles from ${file.name}`);
        } else {
          showToast(`No subtitles found in ${file.name}`);
        }
      } catch {
        showToast(`Failed to parse subtitle file ${file.name}`);
      }
    } else if (name.endsWith('.json')) {
      try {
        const text = await file.text();
        const parsed = parseCensorJson(text);
        setProject(parsed);
        if (parsed.metadata.durationMs) setDurationMs(parsed.metadata.durationMs);
        showToast(`Loaded ${parsed.cues.length} censor rules from ${file.name}`);
      } catch {
        showToast(`Failed to parse censor JSON ${file.name}`);
      }
    } else {
      // Media file (video or audio)
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setProject(prev => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          title: file.name.replace(/\.[^/.]+$/, ''),
          sourceFile: file.name,
        }
      }));
      handleSeekMs(0);
      showToast(`Loaded media: ${file.name}`);

      // Memory-safe audio waveform handling:
      // Never attempt in-memory decodeAudioData on large files/movies (>40MB) as it causes browser OOM tab crash!
      if (file.size > 40 * 1024 * 1024) {
        setAudioPeaks(generateSyntheticPeaks(800));
      } else {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          const tempCtx = new AudioCtx();
          const decoded = await tempCtx.decodeAudioData(arrayBuffer);
          const peaks = await extractWaveformPeaks(decoded, 800);
          setAudioPeaks(peaks);
          tempCtx.close();
        } catch {
          setAudioPeaks(generateSyntheticPeaks(800));
        }
      }
    }
  }, [handleSeekMs, showToast]);

  // Open user local video via file picker
  const handleVideoFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  // Import JSON sidecar via file picker
  const handleJsonFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  // Drag and drop event handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDraggingOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      for (const f of files) {
        await processFile(f);
      }
    }
  };

  // Quick Add Cues (Studio mode)
  const handleAddQuickCue = (type: 'skip' | 'blur' | 'bleep') => {
    const start = Math.max(0, currentTimeMs);
    const durationSpan = type === 'skip' ? 4000 : 2000;
    const end = Math.min(durationMs, start + durationSpan);

    const newCue: CensorCue = {
      id: `cue-${Date.now()}`,
      type: type === 'skip' ? 'skip' : type === 'blur' ? 'video' : 'audio',
      action: type === 'skip' ? 'skip' : type === 'blur' ? 'blur' : 'bleep',
      startMs: start,
      endMs: end,
      category: type === 'skip' ? 'violence' : type === 'blur' ? 'nudity' : 'profanity',
      severity: 'high',
      label: `New ${type.toUpperCase()}`,
      enabled: true,
      ...(type === 'blur' && {
        box: { x: 0.3, y: 0.3, w: 0.4, h: 0.4 },
        params: { blurRadius: settings.defaultBlurRadius },
      }),
    };

    setProject(prev => ({ ...prev, cues: [...prev.cues, newCue] }));
    setSelectedCueId(newCue.id);
    if (settings.mode !== 'studio') {
      setSettings(prev => ({ ...prev, mode: 'studio' }));
      showToast(`Added ${type} cue (Studio mode active)`);
    }
  };

  const handleSelectCue = useCallback((cueId: string | null) => {
    setSelectedCueId(cueId);
    if (cueId && settings.mode !== 'studio') {
      setSettings(prev => ({ ...prev, mode: 'studio' }));
      showToast('Switched to Studio Editor mode');
    }
  }, [settings.mode, showToast]);

  // Add Bounding Box Cue from canvas drawing
  const handleAddBoxCue = (box: BoundingBox) => {
    const start = Math.max(0, currentTimeMs);
    const end = Math.min(durationMs, start + 3000);

    const newCue: CensorCue = {
      id: `cue-box-${Date.now()}`,
      type: 'video',
      action: 'blur',
      startMs: start,
      endMs: end,
      category: 'nudity',
      severity: 'high',
      label: 'Region Blur',
      enabled: true,
      box,
      params: { blurRadius: settings.defaultBlurRadius },
    };

    setProject(prev => ({ ...prev, cues: [...prev.cues, newCue] }));
    setSelectedCueId(newCue.id);
  };

  // Cue manipulations
  const handleUpdateCue = (updated: CensorCue) => {
    setProject(prev => ({
      ...prev,
      cues: prev.cues.map(c => (c.id === updated.id ? updated : c)),
    }));
  };

  const handleDeleteCue = (id: string) => {
    setProject(prev => ({
      ...prev,
      cues: prev.cues.filter(c => c.id !== id),
    }));
    if (selectedCueId === id) setSelectedCueId(null);
  };

  const handleDuplicateCue = (cue: CensorCue) => {
    const dup: CensorCue = {
      ...cue,
      id: `cue-${Date.now()}`,
      startMs: Math.min(durationMs - 1000, cue.startMs + 500),
      endMs: Math.min(durationMs, cue.endMs + 500),
      label: `${cue.label || cue.action} (Copy)`,
    };
    setProject(prev => ({ ...prev, cues: [...prev.cues, dup] }));
    setSelectedCueId(dup.id);
  };

  const handleUpdateCueTimes = (id: string, startMs: number, endMs: number) => {
    setProject(prev => ({
      ...prev,
      cues: prev.cues.map(c => (c.id === id ? { ...c, startMs, endMs } : c)),
    }));
  };

  const handleUpdateSubtitleTimes = (id: string, startMs: number, endMs: number) => {
    setSubtitles(prev =>
      prev.map(s => (s.id === id ? { ...s, startMs, endMs } : s))
    );
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const selectedCue = project.cues.find(c => c.id === selectedCueId) || null;

  if (currentPage === 'landing' && !isDesktopApp) {
    return <LandingPage onLaunchApp={handleLaunchApp} />;
  }

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="flex flex-col h-screen w-screen bg-slate-950 text-white overflow-hidden font-sans relative"
    >
      {/* Hidden file pickers */}
      <input
        ref={videoFileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/ogg,video/quicktime"
        className="hidden"
        onChange={handleVideoFilePicked}
      />
      <input
        ref={jsonFileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleJsonFilePicked}
      />

      {/* Top Navigation / App Header */}
      <Header
        settings={settings}
        onUpdateSettings={s => setSettings(prev => ({ ...prev, ...s }))}
        onLoadDemo={handleLoadDemo}
        onOpenVideoFile={() => videoFileInputRef.current?.click()}
        onImportJson={() => jsonFileInputRef.current?.click()}
        onExportJson={() => exportCensorJson(project)}
        onOpenFFmpegModal={() => setShowFFmpegModal(true)}
        onOpenAiScannerModal={() => setShowAiScannerModal(true)}
        onOpenSubtitleModal={() => setShowSubtitleModal(true)}
        subtitlesCount={subtitles.length}
        cuesCount={project.cues.length}
        onGoToHome={!isDesktopApp ? handleGoToLanding : undefined}
      />

      {/* Main Workspace (Viewport + Optional Cue Inspector Sidebar) */}
      <div className="flex flex-1 overflow-hidden relative">
        <VideoViewport
          videoRef={videoRef}
          videoSrc={videoSrc}
          currentTimeMs={currentTimeMs}
          durationMs={durationMs}
          cues={project.cues}
          subtitles={subtitles}
          selectedCueId={selectedCueId}
          onSelectCue={handleSelectCue}
          onAddBoxCue={handleAddBoxCue}
          onManualSkip={handleSeekMs}
          upcomingSkip={upcomingSkip}
          settings={settings}
          onLoadDemo={handleLoadDemo}
          onOpenVideoFile={() => videoFileInputRef.current?.click()}
          onDurationChange={handleDurationUpdated}
        />

        {/* Studio Mode Inspector Sidebar */}
        {settings.mode === 'studio' && selectedCue && (
          <CueInspector
            cue={selectedCue}
            onUpdateCue={handleUpdateCue}
            onDeleteCue={handleDeleteCue}
            onDuplicateCue={handleDuplicateCue}
            onClose={() => setSelectedCueId(null)}
          />
        )}
      </div>

      {/* Transport & Playback HUD */}
      <PlayerControls
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        currentTimeMs={currentTimeMs}
        durationMs={durationMs}
        onSeekMs={handleSeekMs}
        volume={volume}
        onVolumeChange={v => {
          setVolume(v);
          setIsMuted(false);
          if (videoRef.current) videoRef.current.volume = v;
        }}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted(prev => !prev)}
        settings={settings}
        onUpdateSettings={s => setSettings(prev => ({ ...prev, ...s }))}
        onAddQuickCue={handleAddQuickCue}
        onToggleFullscreen={handleToggleFullscreen}
        playbackRate={playbackRate}
        onPlaybackRateChange={handlePlaybackRateChange}
      />

      {/* Multi-Track Scrubbable Timeline (with Waveform & Subtitles Track) */}
      <Timeline
        durationMs={durationMs}
        currentTimeMs={currentTimeMs}
        cues={project.cues}
        subtitles={subtitles}
        selectedCueId={selectedCueId}
        selectedSubtitleId={selectedSubtitleId}
        onSeekMs={handleSeekMs}
        onSelectCue={handleSelectCue}
        onSelectSubtitle={setSelectedSubtitleId}
        onUpdateCueTimes={handleUpdateCueTimes}
        onUpdateSubtitleTimes={handleUpdateSubtitleTimes}
        audioPeaks={audioPeaks}
        isStudioMode={settings.mode === 'studio'}
        onAddQuickCue={handleAddQuickCue}
        onDeleteCue={handleDeleteCue}
      />

      {/* FFmpeg Hard-Burn Command Generator Modal */}
      {showFFmpegModal && (
        <FFmpegModal
          project={project}
          onClose={() => setShowFFmpegModal(false)}
        />
      )}

      {/* AI & Subtitle Profanity Scanner Modal */}
      {showAiScannerModal && (
        <AiScannerModal
          onAddCues={newCues => {
            setProject(prev => ({ ...prev, cues: [...prev.cues, ...newCues] }));
          }}
          onClose={() => setShowAiScannerModal(false)}
        />
      )}

      {/* Subtitle Synchronizer & Editor Modal */}
      {showSubtitleModal && (
        <SubtitleSyncModal
          cues={subtitles}
          currentTimeMs={currentTimeMs}
          onUpdateSubtitles={setSubtitles}
          onSeekMs={handleSeekMs}
          onAddCensorCues={newCues => {
            setProject(prev => ({ ...prev, cues: [...prev.cues, ...newCues] }));
          }}
          onClose={() => setShowSubtitleModal(false)}
        />
      )}

      {/* Drag & Drop Visual Overlay */}
      {isDraggingOver && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-8 pointer-events-none animate-in fade-in duration-150">
          <div className="w-full max-w-xl border-2 border-dashed border-sky-400 bg-sky-950/25 rounded-3xl p-10 flex flex-col items-center justify-center text-center shadow-2xl">
            <div className="w-20 h-20 rounded-2xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 mb-6 shadow-inner animate-bounce">
              <UploadCloud className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Drop Media or Subtitles to Load</h3>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed mb-6">
              Drop any video, audio track, subtitle file (<span className="text-purple-300 font-mono">.srt, .vtt</span>), or censor metadata (<span className="text-amber-300 font-mono">.json</span>).
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-300">
              <span className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                <Film className="w-4 h-4 text-sky-400" /> Video
              </span>
              <span className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                <Music className="w-4 h-4 text-emerald-400" /> Audio
              </span>
              <span className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                <MessageSquare className="w-4 h-4 text-purple-400" /> Subtitles
              </span>
              <span className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                <Shield className="w-4 h-4 text-amber-400" /> Censor Rules
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 bg-slate-900/95 border border-sky-500/60 text-white px-4 py-2.5 rounded-xl shadow-2xl z-50 flex items-center gap-2.5 text-xs font-medium animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
export default App;
