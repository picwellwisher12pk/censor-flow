import React, { useState } from 'react';
import { X, Copy, Check, Terminal, Info } from 'lucide-react';
import type { CensorProject } from '../../types/censor';
import { generateFFmpegCommand } from '../../utils/ffmpegExport';

interface FFmpegModalProps {
  project: CensorProject;
  onClose: () => void;
}

export const FFmpegModal: React.FC<FFmpegModalProps> = ({ project, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [includeSkips, setIncludeSkips] = useState(true);
  const [videoCodec, setVideoCodec] = useState('libx264');
  const [crf, setCrf] = useState(20);
  const [inputName, setInputName] = useState(project.metadata.sourceFile || 'input_video.mp4');
  const [outputName, setOutputName] = useState('censored_master.mp4');

  const { command, explanation } = generateFFmpegCommand(project, {
    inputFileName: inputName,
    outputFileName: outputName,
    includeSkipsAsHardCuts: includeSkips,
    videoCodec,
    crf,
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-white">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">FFmpeg Hard-Burn Exporter</h2>
              <p className="text-xs text-slate-400">
                Bake blur, pixelate, audio mutes, and scene cuts directly into a final MP4
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
          {/* Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs">
            <div className="flex flex-col gap-1">
              <label className="text-slate-400 font-semibold">Input Video File</label>
              <input
                type="text"
                value={inputName}
                onChange={e => setInputName(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-slate-200"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-slate-400 font-semibold">Output Destination File</label>
              <input
                type="text"
                value={outputName}
                onChange={e => setOutputName(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-slate-200"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-slate-400 font-semibold">Video Codec</label>
              <select
                value={videoCodec}
                onChange={e => setVideoCodec(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-slate-200"
              >
                <option value="libx264">libx264 (H.264 - Universal)</option>
                <option value="libx265">libx265 (HEVC - High Efficiency)</option>
                <option value="copy">copy (Stream Copy)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-slate-400 font-semibold">Quality CRF ({crf})</label>
              <input
                type="range"
                min="16"
                max="28"
                step="1"
                value={crf}
                onChange={e => setCrf(parseInt(e.target.value))}
                className="accent-emerald-400"
              />
            </div>

            <div className="flex items-center justify-between sm:col-span-2 pt-2 border-t border-slate-800/80">
              <span className="text-slate-300 font-medium">Physically Cut Out Skipped Scenes</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSkips}
                  onChange={e => setIncludeSkips(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600" />
              </label>
            </div>
          </div>

          {/* Generated Command Box */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" /> Executable FFmpeg Command
              </label>
              <button
                onClick={handleCopy}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy Command'}
              </button>
            </div>

            <div className="relative">
              <pre className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-emerald-300 overflow-x-auto whitespace-pre-wrap break-all max-h-36 leading-relaxed">
                {command}
              </pre>
            </div>
          </div>

          {/* Explanation checklist */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-400 flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
              <Info className="w-4 h-4 text-sky-400" />
              <span>Compilation Breakdown ({explanation.length} operation{explanation.length === 1 ? '' : 's'})</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px] pl-1">
              {explanation.length > 0 ? (
                explanation.map((exp, idx) => <li key={idx}>{exp}</li>)
              ) : (
                <li>No active cues found to render.</li>
              )}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
