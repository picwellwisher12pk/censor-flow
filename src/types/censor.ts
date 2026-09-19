export type CensorActionType = 
  | 'blur' 
  | 'pixelate' 
  | 'blackout' 
  | 'mute' 
  | 'bleep' 
  | 'duck' 
  | 'skip';

export type CensorCategory = 
  | 'profanity' 
  | 'violence' 
  | 'nudity' 
  | 'gore' 
  | 'filler' 
  | 'spoiler' 
  | 'sensitive_pii' 
  | 'custom';

export type CensorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface BoundingBox {
  x: number; // 0.0 to 1.0 (normalized)
  y: number; // 0.0 to 1.0 (normalized)
  w: number; // 0.0 to 1.0 (normalized)
  h: number; // 0.0 to 1.0 (normalized)
}

export interface CensorCue {
  id: string;
  type: 'video' | 'audio' | 'skip';
  action: CensorActionType;
  startMs: number;
  endMs: number;
  category: CensorCategory;
  severity?: CensorSeverity;
  label?: string;
  reason?: string;
  enabled?: boolean;
  box?: BoundingBox; // Spatial box for video region actions
  params?: {
    blurRadius?: number; // e.g. 15-40
    pixelBlockSize?: number; // e.g. 12-32
    duckRatio?: number; // 0.0 to 1.0 (e.g. 0.2 = 80% lower)
    bleepFreq?: number; // default 1000 Hz
  };
}

export interface CensorMetadata {
  title: string;
  durationMs: number;
  fps?: number;
  width?: number;
  height?: number;
  sourceFile?: string;
}

export interface CensorProject {
  $schema?: string;
  version: string;
  metadata: CensorMetadata;
  cues: CensorCue[];
}

export interface PlaybackSettings {
  autoSkip: boolean; // Automatically seek forward through 'skip' cues
  enabledCategories: Record<CensorCategory, boolean>;
  mode: 'player' | 'studio'; // Player (Family Mode) vs Studio (Creator Mode)
  defaultBlurRadius: number;
  defaultPixelBlock: number;
  bleepVolume: number;
}
