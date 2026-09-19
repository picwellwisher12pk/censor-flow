import type { CensorCue } from '../types/censor';

export interface SkipEvent {
  cue: CensorCue;
  fromMs: number;
  toMs: number;
}

export class SkipEngine {
  private lastSkipTimestamp: number = 0;
  private cooldownMs: number = 250; // Prevent rapid bounce seeking

  /**
   * Checks if video should seek past an active skip cue.
   * Returns target seek timestamp in ms if a jump should occur, or null if no skip needed.
   */
  public checkAutoSkip(
    currentTimeMs: number,
    cues: CensorCue[],
    autoSkipEnabled: boolean
  ): { targetMs: number; cue: CensorCue } | null {
    if (!autoSkipEnabled) return null;

    const now = Date.now();
    if (now - this.lastSkipTimestamp < this.cooldownMs) {
      return null;
    }

    // Find any active skip cue covering the current time
    const activeSkip = cues.find(
      c => c.type === 'skip' && c.enabled !== false && currentTimeMs >= c.startMs && currentTimeMs < c.endMs
    );

    if (activeSkip) {
      this.lastSkipTimestamp = now;
      // Seek slightly past the end of the cue (50ms) to ensure we exit the interval
      return {
        targetMs: Math.min(activeSkip.endMs + 50, activeSkip.endMs + 100),
        cue: activeSkip,
      };
    }

    return null;
  }

  /**
   * Check if a skip cue is approaching within the preview threshold (e.g. 3000ms).
   * Useful for displaying a "Skip Scene [Space]" prompt.
   */
  public getApproachingSkip(
    currentTimeMs: number,
    cues: CensorCue[],
    thresholdMs: number = 3000
  ): CensorCue | null {
    return cues.find(
      c => c.type === 'skip' &&
           c.enabled !== false &&
           currentTimeMs < c.startMs &&
           c.startMs - currentTimeMs <= thresholdMs
    ) || null;
  }
}
