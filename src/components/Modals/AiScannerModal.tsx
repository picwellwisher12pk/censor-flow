import React, { useState } from 'react';
import { X, Sparkles, FileText, Check, Plus } from 'lucide-react';
import { scanSrtForProfanity, profanityResultsToCues } from '../../ai/scanner';
import type { DetectedProfanityResult } from '../../ai/scanner';
import type { CensorCue } from '../../types/censor';

interface AiScannerModalProps {
  onAddCues: (cues: CensorCue[]) => void;
  onClose: () => void;
}

const SAMPLE_SRT = `1
00:00:04,100 --> 00:00:07,300
Get down! He has a gun!

2
00:00:16,500 --> 00:00:17,800
Holy shit, that was close!

3
00:00:23,000 --> 00:00:26,000
Run to the car right now!

4
00:00:38,500 --> 00:00:40,000
Damn it, the engine won't start!
`;

export const AiScannerModal: React.FC<AiScannerModalProps> = ({ onAddCues, onClose }) => {
  const [srtText, setSrtText] = useState(SAMPLE_SRT);
  const [actionType, setActionType] = useState<'bleep' | 'mute'>('bleep');
  const [results, setResults] = useState<DetectedProfanityResult[]>([]);
  const [hasScanned, setHasScanned] = useState(false);

  const handleScan = () => {
    const detected = scanSrtForProfanity(srtText);
    setResults(detected);
    setHasScanned(true);
  };

  const handleApply = () => {
    const newCues = profanityResultsToCues(results, actionType);
    onAddCues(newCues);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-white">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Automated Profanity & Transcript Scanner</h2>
              <p className="text-xs text-slate-400">
                Scan subtitles or speech transcripts to auto-generate bleep/mute markers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-4 overflow-y-auto">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-400" /> Subtitle / Transcript Content (SRT format)
            </label>
            <button
              onClick={() => setSrtText(SAMPLE_SRT)}
              className="text-[11px] text-indigo-400 hover:underline cursor-pointer"
            >
              Reset Sample SRT
            </button>
          </div>

          <textarea
            rows={6}
            value={srtText}
            onChange={e => {
              setSrtText(e.target.value);
              setHasScanned(false);
            }}
            placeholder="Paste SRT subtitles here..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 font-mono text-xs text-slate-300 focus:outline-none focus:border-indigo-500 leading-relaxed"
          />

          <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-300 font-medium">Censor Action for Matches:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActionType('bleep')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  actionType === 'bleep'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                1000Hz Bleep
              </button>
              <button
                onClick={() => setActionType('mute')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  actionType === 'mute'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                Silence Mute
              </button>
            </div>
          </div>

          <button
            onClick={handleScan}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Scan Transcript for Inappropriate Language
          </button>

          {/* Results section */}
          {hasScanned && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col gap-2">
              <div className="text-xs font-semibold text-slate-300">
                Scan Results: Found {results.length} term{results.length === 1 ? '' : 's'}
              </div>

              {results.length > 0 ? (
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                  {results.map((r: DetectedProfanityResult, i: number) => (
                    <div
                      key={i}
                      className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center justify-between text-xs font-mono"
                    >
                      <span className="text-amber-400 font-bold">"{r.word}"</span>
                      <span className="text-slate-400 text-[11px]">
                        {(r.startMs / 1000).toFixed(2)}s → {(r.endMs / 1000).toFixed(2)}s
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-emerald-400 flex items-center gap-1.5 py-1">
                  <Check className="w-4 h-4" /> No vulgar or profane keywords found in transcript.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex justify-between items-center">
          <span className="text-[11px] text-slate-500">
            Offline & privacy safe • Runs 100% locally
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            {results.length > 0 && (
              <button
                onClick={handleApply}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add {results.length} Cue{results.length === 1 ? '' : 's'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
