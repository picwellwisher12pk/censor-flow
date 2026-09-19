import type { SubtitleCue } from '../types/subtitle';

function padZero(num: number, size: number): string {
  let s = num.toString();
  while (s.length < size) s = '0' + s;
  return s;
}

export function formatTimeSrt(ms: number): string {
  const totalMs = Math.max(0, Math.floor(ms));
  const hours = Math.floor(totalMs / 3600000);
  const minutes = Math.floor((totalMs % 3600000) / 60000);
  const seconds = Math.floor((totalMs % 60000) / 1000);
  const millis = totalMs % 1000;
  return `${padZero(hours, 2)}:${padZero(minutes, 2)}:${padZero(seconds, 2)},${padZero(millis, 3)}`;
}

export function formatTimeVtt(ms: number): string {
  return formatTimeSrt(ms).replace(',', '.');
}

export function parseSrtTime(timeStr: string): number {
  const parts = timeStr.trim().split(/[:,.]/);
  if (parts.length < 4) return 0;
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  const s = parseInt(parts[2], 10) || 0;
  const ms = parseInt(parts[3], 10) || 0;
  return h * 3600000 + m * 60000 + s * 1000 + ms;
}

export function parseSrt(content: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  const blocks = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split(/\n\s*\n/);
  const timeRegex = /(\d{2}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.]\d{3})/;

  for (let i = 0; i < blocks.length; i++) {
    const lines = blocks[i].split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;

    const timeLineIndex = lines.findIndex(l => timeRegex.test(l));
    if (timeLineIndex === -1) continue;

    const match = lines[timeLineIndex].match(timeRegex);
    if (!match) continue;

    const startMs = parseSrtTime(match[1]);
    const endMs = parseSrtTime(match[2]);
    const text = lines.slice(timeLineIndex + 1).join('\n');

    if (text) {
      cues.push({
        id: `sub-${Date.now()}-${i}`,
        startMs,
        endMs,
        text,
      });
    }
  }

  return cues;
}

export function parseVtt(content: string): SubtitleCue[] {
  // WebVTT is very similar to SRT but starts with WEBVTT header
  const cleaned = content.replace(/^WEBVTT[^\n]*\n+/i, '');
  return parseSrt(cleaned);
}

export function serializeSrt(cues: SubtitleCue[]): string {
  const sorted = [...cues].sort((a, b) => a.startMs - b.startMs);
  return sorted
    .map((cue, idx) => {
      return `${idx + 1}\n${formatTimeSrt(cue.startMs)} --> ${formatTimeSrt(cue.endMs)}\n${cue.text}\n`;
    })
    .join('\n');
}

export function serializeVtt(cues: SubtitleCue[]): string {
  const sorted = [...cues].sort((a, b) => a.startMs - b.startMs);
  const body = sorted
    .map((cue, idx) => {
      return `${idx + 1}\n${formatTimeVtt(cue.startMs)} --> ${formatTimeVtt(cue.endMs)}\n${cue.text}\n`;
    })
    .join('\n');
  return `WEBVTT\n\n${body}`;
}

/**
 * Shifts all subtitles by a specified delta in milliseconds.
 */
export function shiftSubtitles(cues: SubtitleCue[], deltaMs: number): SubtitleCue[] {
  return cues.map(cue => ({
    ...cue,
    startMs: Math.max(0, cue.startMs + deltaMs),
    endMs: Math.max(100, cue.endMs + deltaMs),
  }));
}

/**
 * Applies 2-point linear interpolation sync to fix framerate drift.
 */
export function applyTwoPointSync(
  cues: SubtitleCue[],
  anchor1: { index: number; targetMs: number },
  anchor2: { index: number; targetMs: number }
): SubtitleCue[] {
  if (
    anchor1.index === anchor2.index ||
    anchor1.index < 0 ||
    anchor2.index >= cues.length
  ) {
    return cues;
  }

  const orig1 = cues[anchor1.index].startMs;
  const orig2 = cues[anchor2.index].startMs;

  if (orig1 === orig2) return cues;

  // Linear scaling factor: target = A * original + B
  const scale = (anchor2.targetMs - anchor1.targetMs) / (orig2 - orig1);
  const offset = anchor1.targetMs - scale * orig1;

  return cues.map(cue => {
    const newStart = Math.max(0, Math.round(scale * cue.startMs + offset));
    const duration = cue.endMs - cue.startMs;
    const newEnd = Math.max(newStart + 100, Math.round(newStart + duration * scale));
    return {
      ...cue,
      startMs: newStart,
      endMs: newEnd,
    };
  });
}

export const DEMO_SUBTITLES: SubtitleCue[] = [
  {
    id: 'sub-demo-1',
    startMs: 2000,
    endMs: 6500,
    text: "HQ, we've arrived at the designated target sector.",
  },
  {
    id: 'sub-demo-2',
    startMs: 8500,
    endMs: 12500,
    text: 'Hostile contact dead ahead! Engaging combat maneuvers!',
  },
  {
    id: 'sub-demo-3',
    startMs: 16500,
    endMs: 18000,
    text: 'Holy shit, they breached the secondary perimeter!',
  },
  {
    id: 'sub-demo-4',
    startMs: 22000,
    endMs: 27500,
    text: 'Look at the visual sensors on the starboard viewport.',
  },
  {
    id: 'sub-demo-5',
    startMs: 32000,
    endMs: 36000,
    text: 'Identify the vehicle registration: 4920-8192-3021.',
  },
  {
    id: 'sub-demo-6',
    startMs: 38500,
    endMs: 42000,
    text: 'Damn it, we need to extract immediately!',
  },
];
