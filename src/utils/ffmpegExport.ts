import type { CensorProject } from '../types/censor';

export interface FFmpegExportOptions {
  inputFileName: string;
  outputFileName: string;
  includeSkipsAsHardCuts: boolean;
  videoCodec: string; // 'libx264'
  audioCodec: string; // 'aac'
  crf: number; // 20
}

export function generateFFmpegCommand(
  project: CensorProject,
  options: Partial<FFmpegExportOptions> = {}
): { command: string; explanation: string[] } {
  const input = options.inputFileName || project.metadata.sourceFile || 'input_video.mp4';
  const output = options.outputFileName || 'censored_output.mp4';
  const videoCodec = options.videoCodec || 'libx264';
  const audioCodec = options.audioCodec || 'aac';
  const crf = options.crf ?? 20;
  const includeSkips = options.includeSkipsAsHardCuts ?? true;

  const videoFilters: string[] = [];
  const audioFilters: string[] = [];
  const explanations: string[] = [];

  const cues = project.cues.filter(c => c.enabled !== false);
  const skipCues = cues.filter(c => c.type === 'skip');
  const videoCues = cues.filter(c => c.type === 'video');
  const audioCues = cues.filter(c => c.type === 'audio');

  // 1. Handle Hard Cuts for Skip Cues
  if (includeSkips && skipCues.length > 0) {
    const skipConditions = skipCues
      .map(c => `between(t,${(c.startMs / 1000).toFixed(3)},${(c.endMs / 1000).toFixed(3)})`)
      .join('+');
    // Keep everything EXCEPT skip intervals
    videoFilters.push(`select='not(${skipConditions})',setpts=N/FRAME_RATE/TB`);
    audioFilters.push(`aselect='not(${skipConditions})',asetpts=N/SR/TB`);
    explanations.push(`Cut out ${skipCues.length} skip cue interval(s) to remove unrated/sensitive scenes`);
  }

  // 2. Handle Video Censorship (Blur, Pixelate, Blackout)
  for (const cue of videoCues) {
    const s = (cue.startMs / 1000).toFixed(3);
    const e = (cue.endMs / 1000).toFixed(3);
    const timeCond = `between(t,${s},${e})`;
    const box = cue.box || { x: 0, y: 0, w: 1, h: 1 };

    // Format coordinates for FFmpeg dynamic expressions
    const exprX = `iw*${box.x.toFixed(4)}`;
    const exprY = `ih*${box.y.toFixed(4)}`;
    const exprW = `iw*${box.w.toFixed(4)}`;
    const exprH = `ih*${box.h.toFixed(4)}`;

    if (cue.action === 'blackout') {
      videoFilters.push(
        `drawbox=x=${exprX}:y=${exprY}:w=${exprW}:h=${exprH}:color=black:t=fill:enable='${timeCond}'`
      );
      explanations.push(`Blackout at [${s}s - ${e}s] for ${cue.category}`);
    } else if (cue.action === 'blur') {
      const radius = cue.params?.blurRadius ?? 20;
      // Use boxblur or delogo filter
      videoFilters.push(
        `boxblur=luma_radius=${radius}:enable='${timeCond}*between(x,${exprX},${exprX}+${exprW})*between(y,${exprY},${exprY}+${exprH})'`
      );
      explanations.push(`Blur (radius ${radius}) at [${s}s - ${e}s] for ${cue.category}`);
    } else if (cue.action === 'pixelate') {
      // Pixelation via drawbox or scale down/up overlay
      videoFilters.push(
        `drawbox=x=${exprX}:y=${exprY}:w=${exprW}:h=${exprH}:color=0x1a1a1a@0.9:t=fill:enable='${timeCond}'`
      );
      explanations.push(`Pixelate/obscure block at [${s}s - ${e}s] for ${cue.category}`);
    }
  }

  // 3. Handle Audio Censorship (Mute, Duck)
  for (const cue of audioCues) {
    const s = (cue.startMs / 1000).toFixed(3);
    const e = (cue.endMs / 1000).toFixed(3);
    const timeCond = `between(t,${s},${e})`;

    if (cue.action === 'mute' || cue.action === 'bleep') {
      audioFilters.push(`volume=enable='${timeCond}':volume=0`);
      explanations.push(`Silence audio at [${s}s - ${e}s] for ${cue.category}`);
    } else if (cue.action === 'duck') {
      const ratio = cue.params?.duckRatio ?? 0.2;
      audioFilters.push(`volume=enable='${timeCond}':volume=${ratio}`);
      explanations.push(`Duck audio to ${(ratio * 100).toFixed(0)}% at [${s}s - ${e}s] for ${cue.category}`);
    }
  }

  // Assemble full command
  let vfArg = videoFilters.length > 0 ? `-vf "${videoFilters.join(',')}"` : '';
  let afArg = audioFilters.length > 0 ? `-af "${audioFilters.join(',')}"` : '';

  const parts = [
    'ffmpeg',
    `-i "${input}"`,
    vfArg,
    afArg,
    `-c:v ${videoCodec}`,
    `-crf ${crf}`,
    `-c:a ${audioCodec}`,
    `-b:a 192k`,
    `-movflags +faststart`,
    `"${output}"`,
  ].filter(Boolean);

  return {
    command: parts.join(' '),
    explanation: explanations,
  };
}
