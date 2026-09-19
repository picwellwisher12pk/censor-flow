import type { CensorCue } from '../types/censor';

// Common profanity and sensitive keyword catalog
const DEFAULT_PROFANITY_LIST = [
  'damn', 'hell', 'crap', 'shit', 'fuck', 'bitch', 'asshole', 'bastard', 'piss'
];

export interface DetectedProfanityResult {
  word: string;
  startMs: number;
  endMs: number;
  confidence: number;
}

/**
 * Parses SRT subtitle content and detects timestamps of profane words.
 */
export function scanSrtForProfanity(
  srtContent: string,
  wordList: string[] = DEFAULT_PROFANITY_LIST
): DetectedProfanityResult[] {
  const results: DetectedProfanityResult[] = [];
  const blocks = srtContent.trim().split(/\n\s*\n/);

  const timeRegex = /(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/;

  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;

    const timeLine = lines.find(l => timeRegex.test(l));
    if (!timeLine) continue;

    const match = timeLine.match(timeRegex);
    if (!match) continue;

    const startMs =
      parseInt(match[1]) * 3600000 +
      parseInt(match[2]) * 60000 +
      parseInt(match[3]) * 1000 +
      parseInt(match[4]);

    const endMs =
      parseInt(match[5]) * 3600000 +
      parseInt(match[6]) * 60000 +
      parseInt(match[7]) * 1000 +
      parseInt(match[8]);

    const textLines = lines.slice(lines.indexOf(timeLine) + 1).join(' ').toLowerCase();

    for (const word of wordList) {
      const regex = new RegExp(`\\b${word}\\w*\\b`, 'i');
      if (regex.test(textLines)) {
        results.push({
          word,
          startMs,
          endMs,
          confidence: 0.95,
        });
      }
    }
  }

  return results;
}

/**
 * Converts detected profanity intervals into CensorCue records.
 */
export function profanityResultsToCues(
  detections: DetectedProfanityResult[],
  action: 'bleep' | 'mute' = 'bleep'
): CensorCue[] {
  return detections.map((d, index) => ({
    id: `auto-audio-${Date.now()}-${index}`,
    type: 'audio',
    action,
    startMs: Math.max(0, d.startMs - 50), // 50ms pre-roll pad
    endMs: d.endMs + 100, // 100ms post-roll pad
    category: 'profanity',
    severity: 'medium',
    label: `Profanity detected: "${d.word}"`,
    reason: `Automated speech scan detected keyword "${d.word}"`,
    enabled: true,
  }));
}
