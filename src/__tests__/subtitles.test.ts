import { describe, it, expect } from 'bun:test';
import { 
  parseSrt, 
  parseVtt, 
  serializeSrt, 
  serializeVtt, 
  shiftSubtitles, 
  applyTwoPointSync 
} from '../utils/subtitleUtils';
import type { SubtitleCue } from '../types/subtitle';

describe('Subtitle Utilities', () => {
  const sampleSrt = `1
00:00:01,000 --> 00:00:04,000
First subtitle line.

2
00:00:05,500 --> 00:00:08,200
Second subtitle line with multiple
words in dialogue.
`;

  it('correctly parses standard SRT format', () => {
    const cues = parseSrt(sampleSrt);
    expect(cues.length).toBe(2);
    expect(cues[0].startMs).toBe(1000);
    expect(cues[0].endMs).toBe(4000);
    expect(cues[0].text).toBe('First subtitle line.');

    expect(cues[1].startMs).toBe(5500);
    expect(cues[1].endMs).toBe(8200);
  });

  it('correctly parses WebVTT format', () => {
    const vtt = `WEBVTT\n\n1\n00:00:02.000 --> 00:00:05.000\nHello VTT world!\n`;
    const cues = parseVtt(vtt);
    expect(cues.length).toBe(1);
    expect(cues[0].startMs).toBe(2000);
    expect(cues[0].endMs).toBe(5000);
    expect(cues[0].text).toBe('Hello VTT world!');
  });

  it('serializes cues to valid SRT and VTT string', () => {
    const cues: SubtitleCue[] = [
      { id: '1', startMs: 1500, endMs: 3500, text: 'Testing serializing.' }
    ];
    const srtOut = serializeSrt(cues);
    expect(srtOut).toContain('00:00:01,500 --> 00:00:03,500');
    expect(srtOut).toContain('Testing serializing.');

    const vttOut = serializeVtt(cues);
    expect(vttOut).toContain('WEBVTT');
    expect(vttOut).toContain('00:00:01.500 --> 00:00:03.500');
  });

  it('shifts all subtitles by a positive or negative delta', () => {
    const cues: SubtitleCue[] = [
      { id: '1', startMs: 1000, endMs: 3000, text: 'Line 1' },
      { id: '2', startMs: 5000, endMs: 7000, text: 'Line 2' },
    ];

    const shifted = shiftSubtitles(cues, 500);
    expect(shifted[0].startMs).toBe(1500);
    expect(shifted[0].endMs).toBe(3500);
    expect(shifted[1].startMs).toBe(5500);
    expect(shifted[1].endMs).toBe(7500);

    const negativeShifted = shiftSubtitles(cues, -600);
    expect(negativeShifted[0].startMs).toBe(400);
    expect(negativeShifted[1].startMs).toBe(4400);
  });

  it('applies 2-point linear interpolation drift calibration', () => {
    // Simulate a 10% drift between first and last line
    const cues: SubtitleCue[] = [
      { id: '1', startMs: 1000, endMs: 2000, text: 'First' },
      { id: '2', startMs: 5000, endMs: 6000, text: 'Middle' },
      { id: '3', startMs: 10000, endMs: 11000, text: 'Last' },
    ];

    // Anchor 1 shifts from 1000 to 2000, Anchor 3 shifts from 10000 to 20000 (2x stretch)
    const synced = applyTwoPointSync(
      cues,
      { index: 0, targetMs: 2000 },
      { index: 2, targetMs: 20000 }
    );

    expect(synced[0].startMs).toBe(2000);
    expect(synced[2].startMs).toBe(20000);
    // Middle line at 5000 should interpolate to 10000
    expect(synced[1].startMs).toBe(10000);
  });
});
