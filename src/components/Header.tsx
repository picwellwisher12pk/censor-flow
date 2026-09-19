import React, { useState } from 'react';
import { 
  Shield, 
  Sparkles, 
  Download, 
  Upload, 
  Terminal, 
  MoreHorizontal, 
  Film, 
  Sliders,
  MessageSquare
} from 'lucide-react';
import type { PlaybackSettings } from '../types/censor';

interface HeaderProps {
  settings: PlaybackSettings;
  onUpdateSettings: (newSettings: Partial<PlaybackSettings>) => void;
  onLoadDemo: () => void;
  onOpenVideoFile: () => void;
  onImportJson: () => void;
  onExportJson: () => void;
  onOpenFFmpegModal: () => void;
  onOpenAiScannerModal: () => void;
  onOpenSubtitleModal: () => void;
  subtitlesCount: number;
  cuesCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onUpdateSettings,
  onLoadDemo,
  onOpenVideoFile,
  onImportJson,
  onExportJson,
  onOpenFFmpegModal,
  onOpenAiScannerModal,
  onOpenSubtitleModal,
  subtitlesCount,
  cuesCount,
}) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  return (
    <header className="h-16 bg-slate-900/90 backdrop-blur border-b border-slate-800 px-4 flex items-center justify-between text-white select-none z-30 shrink-0">
      {/* Brand & Project Info */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-bold tracking-tight text-slate-100 flex items-center gap-1.5">
              CensorFlow
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30">
                v1.0
              </span>
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Smart Redaction & Auto-Skip Engine • {cuesCount} active rule{cuesCount === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      {/* Mode Switcher: Family Viewer vs Creator Studio */}
      <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
        <button
          onClick={() => onUpdateSettings({ mode: 'player' })}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            settings.mode === 'player'
              ? 'bg-sky-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          Family Mode
        </button>
        <button
          onClick={() => onUpdateSettings({ mode: 'studio' })}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            settings.mode === 'studio'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          Studio Editor
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onLoadDemo}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Load synthetic demo video with moving targets and bleeps"
        >
          <Film className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">Demo Video</span>
        </button>

        <button
          onClick={onOpenAiScannerModal}
          className="px-3 py-1.5 rounded-lg bg-indigo-950/70 hover:bg-indigo-900/80 text-indigo-200 text-xs font-medium border border-indigo-700/60 flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Auto-detect profanity or scan subtitles"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">AI Scanner</span>
        </button>

        <button
          onClick={onOpenSubtitleModal}
          className="px-3 py-1.5 rounded-lg bg-purple-950/70 hover:bg-purple-900/80 text-purple-200 text-xs font-medium border border-purple-700/60 flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Open Subtitle Sync & Editor"
        >
          <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden sm:inline">Subtitles ({subtitlesCount})</span>
        </button>

        <button
          onClick={onOpenFFmpegModal}
          className="px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/70 text-emerald-200 text-xs font-medium border border-emerald-700/60 flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Generate FFmpeg command to hard-burn redactions and cuts"
        >
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden md:inline">FFmpeg Export</span>
        </button>

        {/* More Actions Dropdown (Using MoreHorizontal as required) */}
        <div className="relative">
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            title="More Options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {showMoreMenu && (
            <div 
              className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100"
              onMouseLeave={() => setShowMoreMenu(false)}
            >
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                Media & Sidecars
              </div>

              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  onOpenVideoFile();
                }}
                className="w-full px-3 py-2 text-left text-slate-200 hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-sky-400" />
                Open Local Video (MP4/WebM)
              </button>

              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  onImportJson();
                }}
                className="w-full px-3 py-2 text-left text-slate-200 hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                Import .censor.json
              </button>

              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  onExportJson();
                }}
                className="w-full px-3 py-2 text-left text-slate-200 hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                Export .censor.json
              </button>

              <div className="my-1 border-t border-slate-800" />

              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Family Filters
              </div>

              <label className="px-3 py-1.5 flex items-center justify-between text-slate-300 hover:bg-slate-800 cursor-pointer">
                <span>Auto-Skip Graphic Scenes</span>
                <input
                  type="checkbox"
                  checked={settings.autoSkip}
                  onChange={e => onUpdateSettings({ autoSkip: e.target.checked })}
                  className="rounded text-sky-500 focus:ring-0"
                />
              </label>

              <label className="px-3 py-1.5 flex items-center justify-between text-slate-300 hover:bg-slate-800 cursor-pointer">
                <span>Filter Profanity (Audio)</span>
                <input
                  type="checkbox"
                  checked={settings.enabledCategories.profanity}
                  onChange={e => onUpdateSettings({
                    enabledCategories: { ...settings.enabledCategories, profanity: e.target.checked }
                  })}
                  className="rounded text-sky-500 focus:ring-0"
                />
              </label>

              <label className="px-3 py-1.5 flex items-center justify-between text-slate-300 hover:bg-slate-800 cursor-pointer">
                <span>Filter Nudity / Violence</span>
                <input
                  type="checkbox"
                  checked={settings.enabledCategories.violence || settings.enabledCategories.nudity}
                  onChange={e => onUpdateSettings({
                    enabledCategories: {
                      ...settings.enabledCategories,
                      violence: e.target.checked,
                      nudity: e.target.checked
                    }
                  })}
                  className="rounded text-sky-500 focus:ring-0"
                />
              </label>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
