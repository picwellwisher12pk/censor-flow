import { describe, it, expect } from 'bun:test';
import { SkipEngine } from '../engine/skipEngine';
import { generateFFmpegCommand } from '../utils/ffmpegExport';
import { scanSrtForProfanity, profanityResultsToCues } from '../ai/scanner';
import { DEMO_PROJECT, parseCensorJson } from '../utils/sidecar';
import type { CensorCue, CensorProject } from '../types/censor';

describe('SkipEngine', () => {
  it('detects active skip cues and provides correct seek target', () => {
    const engine = new SkipEngine();
    const cues: CensorCue[] = [
      {
        id: 'skip-1',
        type: 'skip',
        action: 'skip',
        startMs: 5000,
        endMs: 10000,
        category: 'violence',
        enabled: true,
      },
    ];

    // Before skip interval: no skip
    expect(engine.checkAutoSkip(4000, cues, true)).toBeNull();

    // Inside skip interval: triggers seek past endMs
    const skip = engine.checkAutoSkip(6000, cues, true);
    expect(skip).not.toBeNull();
    expect(skip?.targetMs).toBeGreaterThan(10000);

    // Auto-skip disabled: should be null
    expect(engine.checkAutoSkip(6000, cues, false)).toBeNull();
  });

  it('detects approaching skip cues within threshold', () => {
    const engine = new SkipEngine();
    const cues: CensorCue[] = [
      {
        id: 'skip-2',
        type: 'skip',
        action: 'skip',
        startMs: 8000,
        endMs: 12000,
        category: 'nudity',
        enabled: true,
      },
    ];

    // At 6000ms (2s before startMs=8000ms): should detect
    const approaching = engine.getApproachingSkip(6000, cues, 3000);
    expect(approaching?.id).toBe('skip-2');

    // At 2000ms (6s before startMs=8000ms): should not detect with 3s threshold
    expect(engine.getApproachingSkip(2000, cues, 3000)).toBeNull();
  });
});

describe('FFmpeg Exporter', () => {
  it('generates scene-cut expressions and video/audio filters', () => {
    const project: CensorProject = {
      version: '1.0',
      metadata: { title: 'Test', durationMs: 30000, sourceFile: 'movie.mp4' },
      cues: [
        {
          id: 'c1',
          type: 'skip',
          action: 'skip',
          startMs: 2000,
          endMs: 5000,
          category: 'violence',
          enabled: true,
        },
        {
          id: 'c2',
          type: 'audio',
          action: 'bleep',
          startMs: 7000,
          endMs: 8000,
          category: 'profanity',
          enabled: true,
        },
        {
          id: 'c3',
          type: 'video',
          action: 'blackout',
          startMs: 12000,
          endMs: 15000,
          category: 'nudity',
          enabled: true,
          box: { x: 0.2, y: 0.2, w: 0.5, h: 0.5 },
        },
      ],
    };

    const { command, explanation } = generateFFmpegCommand(project, {
      includeSkipsAsHardCuts: true,
    });

    expect(command).toContain('ffmpeg -i "movie.mp4"');
    // Cuts skip interval
    expect(command).toContain('select=\'not(between(t,2.000,5.000))\'');
    // Silences audio
    expect(command).toContain('volume=enable=\'between(t,7.000,8.000)\':volume=0');
    // Blackout box
    expect(command).toContain('drawbox=');
    expect(explanation.length).toBe(3);
  });
});

describe('AI & Subtitle Scanner', () => {
  it('scans SRT text and maps profanity timestamps', () => {
    const srt = `1\n00:00:05,000 --> 00:00:08,000\nThis is holy shit dangerous!\n`;
    const results = scanSrtForProfanity(srt, ['shit']);
    expect(results.length).toBe(1);
    expect(results[0].word).toBe('shit');
    expect(results[0].startMs).toBe(5000);
    expect(results[0].endMs).toBe(8000);

    const cues = profanityResultsToCues(results, 'bleep');
    expect(cues.length).toBe(1);
    expect(cues[0].action).toBe('bleep');
    expect(cues[0].category).toBe('profanity');
  });
});

describe('Sidecar Parser', () => {
  it('parses valid .censor.json content', () => {
    const jsonStr = JSON.stringify(DEMO_PROJECT);
    const parsed = parseCensorJson(jsonStr);
    expect(parsed.version).toBe('1.0');
    expect(parsed.cues.length).toBe(DEMO_PROJECT.cues.length);
  });
});
