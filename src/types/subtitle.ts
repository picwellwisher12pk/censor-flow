export interface SubtitleCue {
  id: string;
  startMs: number;
  endMs: number;
  text: string;
}

export interface SubtitleFile {
  fileName: string;
  format: 'srt' | 'vtt';
  cues: SubtitleCue[];
  offsetMs: number; // Applied cumulative offset
}
