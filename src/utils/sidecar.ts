import type { CensorProject } from '../types/censor';

export const DEMO_PROJECT: CensorProject = {
  $schema: 'https://censorflow.dev/schema/v1.json',
  version: '1.0',
  metadata: {
    title: 'Action Movie Trailer (Family Edit)',
    durationMs: 45000,
    fps: 30,
    sourceFile: 'action_sample.mp4',
  },
  cues: [
    {
      id: 'cue-skip-1',
      type: 'skip',
      action: 'skip',
      startMs: 8000,
      endMs: 13000,
      category: 'violence',
      severity: 'high',
      label: 'Graphic combat sequence',
      reason: 'Contains intense physical violence and blood splatter',
      enabled: true,
    },
    {
      id: 'cue-audio-1',
      type: 'audio',
      action: 'bleep',
      startMs: 16500,
      endMs: 17800,
      category: 'profanity',
      severity: 'medium',
      label: 'Expletive in dialogue',
      reason: 'F-bomb during car chase scene',
      enabled: true,
    },
    {
      id: 'cue-video-1',
      type: 'video',
      action: 'blur',
      startMs: 22000,
      endMs: 28000,
      category: 'nudity',
      severity: 'high',
      label: 'Swimsuit wardrobe malfunction',
      reason: 'Exposed skin region on right side',
      enabled: true,
      box: {
        x: 0.35,
        y: 0.25,
        w: 0.3,
        h: 0.45,
      },
      params: {
        blurRadius: 30,
      },
    },
    {
      id: 'cue-video-2',
      type: 'video',
      action: 'pixelate',
      startMs: 32000,
      endMs: 36500,
      category: 'sensitive_pii',
      severity: 'critical',
      label: 'License plate & phone number',
      reason: 'Avoid displaying private personal info on screen',
      enabled: true,
      box: {
        x: 0.55,
        y: 0.65,
        w: 0.35,
        h: 0.25,
      },
      params: {
        pixelBlockSize: 20,
      },
    },
    {
      id: 'cue-audio-2',
      type: 'audio',
      action: 'mute',
      startMs: 38500,
      endMs: 40000,
      category: 'profanity',
      severity: 'low',
      label: 'Mild swearing',
      reason: 'Mild profanity in background shout',
      enabled: true,
    },
  ],
};

export function exportCensorJson(project: CensorProject, fileName?: string) {
  const data = JSON.stringify(project, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName || `${project.metadata.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.censor.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseCensorJson(jsonString: string): CensorProject {
  const parsed = JSON.parse(jsonString);
  if (!parsed.metadata || !Array.isArray(parsed.cues)) {
    throw new Error('Invalid .censor.json format: Missing metadata or cues array.');
  }
  return parsed as CensorProject;
}
