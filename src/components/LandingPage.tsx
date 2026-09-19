import {
  Shield,
  FastForward,
  Eye,
  Volume2,
  Sparkles,
  Download,
  Play,
  CheckCircle2,
  MessageSquare,
  Terminal,
  ArrowRight,
  Lock,
  Cpu,
  Zap,
} from 'lucide-react';

const GithubIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
  </svg>
);

interface LandingPageProps {
  onLaunchApp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunchApp }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-sky-500 selection:text-white flex flex-col font-sans">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-white tracking-tight">CensorFlow</span>
              <span className="text-[10px] font-semibold bg-sky-500/20 text-sky-400 border border-sky-500/30 px-2 py-0.5 rounded-full">
                v0.1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 -mt-0.5">Smart Censorship & Auto-Skip Studio</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm text-slate-300 font-medium">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
          <a href="#modes" className="hover:text-white transition-colors">Dual Modes</a>
          <a href="#downloads" className="hover:text-white transition-colors">Downloads</a>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://github.com/picwellwisher12pk/censor-flow"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all shadow-sm"
          >
            <GithubIcon className="w-4 h-4" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
          <button
            onClick={onLaunchApp}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-sky-400 to-sky-300 hover:from-sky-300 hover:to-sky-200 rounded-xl transition-all shadow-lg shadow-sky-500/25 cursor-pointer transform active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Launch Web Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-28 px-6 flex flex-col items-center text-center">
        {/* Glow ambient background circles */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[380px] bg-gradient-to-tr from-sky-600/20 via-indigo-500/15 to-purple-600/10 blur-[130px] rounded-full pointer-events-none -z-10" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-sky-500/30 text-sky-300 text-xs font-medium mb-8 shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          <span>Non-destructive censorship using open <code>.censor.json</code> sidecars</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl text-white leading-[1.12]">
          Smart Video & Audio Censorship, Redaction &{' '}
          <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            Auto-Skip Studio
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-xl text-slate-300 max-w-2xl font-normal leading-relaxed">
          Curate family-friendly playback, prevent platform demonetization, and edit frame-accurate video masks, audio bleeps, and seamless scene skips without re-encoding original media.
        </p>

        {/* Hero CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <button
            onClick={onLaunchApp}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-7 py-3.5 text-sm font-bold text-slate-950 bg-gradient-to-r from-sky-400 to-sky-300 hover:from-sky-300 hover:to-sky-200 rounded-2xl shadow-xl shadow-sky-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Open Interactive Web Studio</span>
            <span className="text-[10px] bg-slate-950/15 px-2 py-0.5 rounded font-mono font-bold">No Install</span>
          </button>

          <a
            href="#downloads"
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 text-sm font-semibold text-slate-200 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-2xl transition-all shadow-md"
          >
            <Download className="w-4 h-4 text-sky-400" />
            <span>Download Desktop App</span>
          </a>
        </div>

        {/* Feature Badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>100% Private (Runs locally in your browser / OS)</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">
            <Cpu className="w-3.5 h-3.5 text-sky-400" />
            <span>Native 60fps Playhead & Hardware Waveform</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Tauri v2 Desktop Binary (8.2MB)</span>
          </div>
        </div>

        {/* Visual Showcase Card */}
        <div className="mt-16 w-full max-w-5xl rounded-2xl border border-slate-800 bg-slate-900/80 p-3 shadow-2xl shadow-sky-950/40 relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-sky-500/20 via-indigo-500/20 to-purple-500/20 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition duration-500 -z-10" />

          {/* Browser / App Header bar mock */}
          <div className="bg-slate-950 rounded-t-xl px-4 py-3 flex items-center justify-between border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="text-[11px] font-mono text-slate-400 ml-2">CensorFlow Studio v0.1.0</span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="px-2.5 py-1 bg-sky-500/20 text-sky-300 font-semibold rounded-lg text-[11px]">
                Family Mode & Studio Editor
              </span>
            </div>
          </div>

          {/* Studio UI Preview Container */}
          <div className="bg-slate-950 p-6 rounded-b-xl flex flex-col gap-5 text-left">
            {/* Upper Player Area Mock */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 relative aspect-video bg-slate-900 rounded-xl overflow-hidden border border-slate-800 flex flex-col justify-between p-4 shadow-inner">
                {/* Simulated blurred face box */}
                <div className="absolute top-[22%] left-[34%] w-[32%] h-[48%] border-2 border-dashed border-sky-400 bg-sky-500/10 backdrop-blur-md rounded-xl flex items-start justify-between p-2 shadow-lg">
                  <span className="text-[10px] font-mono font-bold bg-sky-500 text-slate-950 px-1.5 py-0.5 rounded">
                    Gaussian Blur (30px)
                  </span>
                  <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                </div>

                {/* Corner Timecode */}
                <div className="flex items-center justify-between z-10">
                  <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur px-2.5 py-1 rounded-md border border-slate-800 text-[11px] font-mono text-white">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    <span>00:22.450 / 01:37:16.800</span>
                  </div>
                  <span className="text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded">
                    Auto-Skip Engaged
                  </span>
                </div>

                {/* Subtitle Dialogue Overlay */}
                <div className="self-center bg-slate-950/80 backdrop-blur border border-slate-800 text-white px-4 py-1.5 rounded-xl text-xs shadow-lg z-10">
                  "HQ, we've arrived at the target coordinates."
                </div>
              </div>

              {/* Sidebar Inspector Mock */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                    <span className="text-xs font-bold text-slate-200">Edit VIDEO Mask</span>
                    <span className="text-[10px] bg-rose-500/20 text-rose-300 font-semibold px-1.5 py-0.5 rounded">High Severity</span>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Effect</span>
                      <div className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs">
                        Gaussian Blur (Adjustable Radius)
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Category</span>
                      <div className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs">
                        Nudity & Explicit Content
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>Start: 22,000ms</span>
                  <span>End: 28,000ms</span>
                </div>
              </div>
            </div>

            {/* Timeline Mock */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800/80 pb-2">
                <span className="font-semibold text-slate-300">Timeline Tracks (Multi-Channel)</span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-amber-500" /> Skips</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-sky-500" /> Masks</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-emerald-500" /> Audio Waveform</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-purple-500" /> Subtitles</span>
                </div>
              </div>

              {/* Simulated tracks */}
              <div className="space-y-1.5 pt-1 font-mono text-[10px]">
                <div className="h-6 bg-slate-950 rounded flex items-center px-2 relative overflow-hidden">
                  <div className="absolute left-[15%] w-[25%] h-5 bg-amber-500/30 border border-amber-500/60 rounded flex items-center px-2 text-amber-200">
                    Auto-Skip: Combat violence
                  </div>
                </div>
                <div className="h-6 bg-slate-950 rounded flex items-center px-2 relative overflow-hidden">
                  <div className="absolute left-[45%] w-[20%] h-5 bg-sky-500/30 border border-sky-500/60 rounded flex items-center px-2 text-sky-200">
                    Mask: License plate blur
                  </div>
                </div>
                <div className="h-7 bg-slate-950 rounded flex items-center px-2 relative overflow-hidden">
                  <div className="absolute inset-x-0 h-4 bg-gradient-to-r from-emerald-500/15 via-emerald-400/30 to-emerald-500/15 rounded flex items-center justify-center text-emerald-400">
                    ─── Analog Oscilloscope Audio Waveform ───
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" className="py-24 px-6 max-w-6xl mx-auto w-full border-t border-slate-900">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Comprehensive Content Moderation Suite
          </h2>
          <p className="mt-4 text-slate-400 text-sm sm:text-base">
            Everything you need to scrub, redact, censor, and synchronize full-length movies and videos without permanent file destruction.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between hover:border-sky-500/40 transition-all">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 mb-5">
                <FastForward className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Automated Scene Skipping</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Leap seamlessly past graphic scenes, gore, or mature sequences during playback. Includes upcoming skip countdown banners and instant manual override buttons.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] font-mono text-amber-300">
              Zero audio/video desync
            </div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between hover:border-sky-500/40 transition-all">
            <div>
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-center text-sky-400 mb-5">
                <Eye className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Dynamic Video Masking</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Draw bounding boxes directly on the video player to apply Gaussian Blur, Mosaic Pixelation, or solid Blackout masks over faces, text, or private areas.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] font-mono text-sky-300">
              Canvas viewport interactive drawing
            </div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between hover:border-sky-500/40 transition-all">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 mb-5">
                <Volume2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Audio Bleeping & Muting</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Replace offensive language with 1000 Hz broadcast bleep tones or smooth de-clicked silence ramps. Fully aligned with the analog audio waveform track.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] font-mono text-emerald-300">
              Waveform peaks & 256x zoom
            </div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between hover:border-sky-500/40 transition-all">
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400 mb-5">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Subtitle Synchronizer</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Import SRT or VTT subtitles. Snap lines to playhead, nudge timestamps, calibrate framerate drift with 2-point linear interpolation, and export clean subtitles.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] font-mono text-purple-300">
              SRT / WebVTT calibration & export
            </div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between hover:border-sky-500/40 transition-all">
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 mb-5">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">AI Profanity Scanner</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Scan dialogue transcripts offline for profanity and slurs. Automatically generates frame-accurate bleep cues along the timeline with one click.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] font-mono text-indigo-300">
              100% offline & private scanning
            </div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between hover:border-sky-500/40 transition-all">
            <div>
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400 mb-5">
                <Terminal className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">FFmpeg Hard-Burn Exporter</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Export an executable FFmpeg terminal command compiling all scene cuts, boxblur filters, and audio volume gates to permanently bake redactions into a master MP4.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] font-mono text-rose-300">
              Ready-to-run FFmpeg commands
            </div>
          </div>
        </div>
      </section>

      {/* Dual Modes Section */}
      <section id="modes" className="py-20 px-6 bg-slate-900/40 border-t border-b border-slate-900">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-extrabold text-white">Two Purpose-Built Modes</h2>
            <p className="mt-3 text-slate-400 text-sm">
              Seamlessly switch between watching movies with family and fine-tuning censorship rules.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Viewer Mode
                </span>
                <h3 className="text-2xl font-bold text-white mt-4 mb-3">Family Mode</h3>
                <p className="text-slate-400 text-xs leading-relaxed mb-6">
                  Clean, distraction-free player interface for living rooms and family watching. Editing controls are locked to prevent accidental modifications while all active censorship rules are enforced automatically in real time.
                </p>
                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Automatic seamless scene skips</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>User-selectable filter rules (Violence, Explicit, Audio)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Clean subtitle overlay & millisecond timecodes</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-sky-400 bg-sky-500/10 border border-sky-500/30 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  NLE Editing Mode
                </span>
                <h3 className="text-2xl font-bold text-white mt-4 mb-3">Studio Editor</h3>
                <p className="text-slate-400 text-xs leading-relaxed mb-6">
                  Professional multi-track NLE workstation. Simply click any block on the timeline or press quick hotkeys (<kbd className="font-mono bg-slate-800 px-1 rounded">S</kbd>, <kbd className="font-mono bg-slate-800 px-1 rounded">V</kbd>, <kbd className="font-mono bg-slate-800 px-1 rounded">M</kbd>) to edit trim handles, draw masks, and tweak severity.
                </p>
                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>Ultra 256x zoom with single-frame trimming (33ms)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>Interactive canvas bounding box drawing</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>Hardware audio waveform oscilloscope display</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Downloads & Distribution Section */}
      <section id="downloads" className="py-24 px-6 max-w-5xl mx-auto w-full text-center">
        <div className="max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Get CensorFlow</h2>
          <p className="mt-4 text-slate-400 text-sm sm:text-base">
            Available on any modern web browser or as a lightweight native desktop app powered by Tauri v2.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Web Studio Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 flex flex-col justify-between text-left shadow-xl hover:border-sky-500/40 transition-all">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-semibold text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-full border border-sky-500/30">
                  Instant Web App
                </span>
                <span className="text-xs text-slate-400 font-medium">Any Modern Browser</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">CensorFlow Web Studio</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                Zero installation required. Drop any MP4/WebM video, subtitles, or existing <code className="text-sky-300">.censor.json</code> sidecar files and edit immediately.
              </p>
            </div>
            <button
              onClick={onLaunchApp}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-sky-400 to-sky-300 hover:from-sky-300 hover:to-sky-200 rounded-xl transition-all cursor-pointer shadow-lg shadow-sky-500/20"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Launch in Browser Now</span>
            </button>
          </div>

          {/* Windows Desktop App Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 flex flex-col justify-between text-left shadow-xl hover:border-sky-500/40 transition-all">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                  Native Desktop
                </span>
                <span className="text-xs text-slate-400 font-medium">Windows 64-bit</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Windows App (Tauri v2)</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                Ultra-lightweight native executable with system window controls and local file performance. Built with Rust and WebView2.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="https://github.com/picwellwisher12pk/censor-flow/releases"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all"
              >
                <Download className="w-3.5 h-3.5 text-sky-400" />
                <span>Setup Installer (.exe)</span>
              </a>
              <a
                href="https://github.com/picwellwisher12pk/censor-flow/releases"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-3 text-xs font-semibold text-slate-300 hover:text-white bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all"
              >
                <span>MSI Package</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 py-10 px-6 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-sky-400" />
            <span className="font-semibold text-slate-400">CensorFlow Studio</span>
            <span>— Open-source content moderation</span>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={onLaunchApp} className="hover:text-slate-300 transition-colors cursor-pointer">
              Launch Web App
            </button>
            <a
              href="https://github.com/picwellwisher12pk/censor-flow"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-300 transition-colors flex items-center gap-1"
            >
              <GithubIcon className="w-3.5 h-3.5" />
              <span>GitHub Repository</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
