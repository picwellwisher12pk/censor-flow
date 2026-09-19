import type { BoundingBox, CensorCue } from '../types/censor';

export class CanvasCensorRenderer {
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D | null;

  constructor() {
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCtx = this.offscreenCanvas.getContext('2d');
  }

  public render(
    canvas: HTMLCanvasElement,
    video: HTMLVideoElement,
    currentTimeMs: number,
    cues: CensorCue[],
    selectedCueId: string | null = null,
    isStudioMode: boolean = false
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx || !video.videoWidth || !video.videoHeight) {
      return;
    }

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Get active video cues
    const activeVideoCues = cues.filter(
      c => c.type === 'video' && c.enabled !== false && currentTimeMs >= c.startMs && currentTimeMs <= c.endMs
    );

    // 1. Render censor effects
    for (const cue of activeVideoCues) {
      const box = cue.box || { x: 0, y: 0, w: 1, h: 1 };
      const px = box.x * width;
      const py = box.y * height;
      const pw = box.w * width;
      const ph = box.h * height;

      if (pw <= 0 || ph <= 0) continue;

      if (cue.action === 'blackout') {
        this.renderBlackout(ctx, px, py, pw, ph, cue.category);
      } else if (cue.action === 'pixelate') {
        const blockSize = cue.params?.pixelBlockSize ?? 16;
        this.renderPixelate(ctx, video, px, py, pw, ph, width, height, blockSize);
      } else if (cue.action === 'blur') {
        const radius = cue.params?.blurRadius ?? 24;
        this.renderBlur(ctx, video, px, py, pw, ph, width, height, radius);
      }
    }

    // 2. In Studio Mode, render bounding box outlines and resize handles for interactive editing
    if (isStudioMode) {
      for (const cue of activeVideoCues) {
        const box = cue.box || { x: 0, y: 0, w: 1, h: 1 };
        const isSelected = cue.id === selectedCueId;
        this.renderStudioHandles(ctx, box, width, height, cue, isSelected);
      }
    }
  }

  private renderBlackout(
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    pw: number,
    ph: number,
    category: string
  ) {
    ctx.save();
    ctx.fillStyle = '#0a0a0c';
    ctx.fillRect(px, py, pw, ph);

    // Subtle redaction texture
    ctx.fillStyle = '#1e1e24';
    ctx.font = 'bold 12px monospace';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    
    if (pw > 80 && ph > 30) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillText(`[REDACTED: ${category.toUpperCase()}]`, px + pw / 2, py + ph / 2);
    }
    ctx.restore();
  }

  private renderPixelate(
    ctx: CanvasRenderingContext2D,
    video: HTMLVideoElement,
    px: number,
    py: number,
    pw: number,
    ph: number,
    canvasWidth: number,
    canvasHeight: number,
    blockSize: number
  ) {
    if (!this.offscreenCtx) return;

    // Calculate source video coordinates
    const sx = (px / canvasWidth) * video.videoWidth;
    const sy = (py / canvasHeight) * video.videoHeight;
    const sw = (pw / canvasWidth) * video.videoWidth;
    const sh = (ph / canvasHeight) * video.videoHeight;

    const tinyW = Math.max(1, Math.floor(pw / blockSize));
    const tinyH = Math.max(1, Math.floor(ph / blockSize));

    this.offscreenCanvas.width = tinyW;
    this.offscreenCanvas.height = tinyH;

    // Draw sub-rect downscaled to tiny canvas
    this.offscreenCtx.imageSmoothingEnabled = false;
    this.offscreenCtx.drawImage(video, sx, sy, sw, sh, 0, 0, tinyW, tinyH);

    // Draw back upscaled without smoothing
    ctx.save();
    ctx.beginPath();
    ctx.rect(px, py, pw, ph);
    ctx.clip();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.offscreenCanvas, 0, 0, tinyW, tinyH, px, py, pw, ph);
    ctx.restore();
  }

  private renderBlur(
    ctx: CanvasRenderingContext2D,
    video: HTMLVideoElement,
    px: number,
    py: number,
    pw: number,
    ph: number,
    canvasWidth: number,
    canvasHeight: number,
    blurRadius: number
  ) {
    const sx = (px / canvasWidth) * video.videoWidth;
    const sy = (py / canvasHeight) * video.videoHeight;
    const sw = (pw / canvasWidth) * video.videoWidth;
    const sh = (ph / canvasHeight) * video.videoHeight;

    ctx.save();
    ctx.beginPath();
    ctx.rect(px, py, pw, ph);
    ctx.clip();

    ctx.filter = `blur(${blurRadius}px)`;
    // Draw enlarged to prevent edge bleed
    const bleed = blurRadius * 1.5;
    ctx.drawImage(
      video,
      sx,
      sy,
      sw,
      sh,
      px - bleed,
      py - bleed,
      pw + bleed * 2,
      ph + bleed * 2
    );
    ctx.restore();
  }

  private renderStudioHandles(
    ctx: CanvasRenderingContext2D,
    box: BoundingBox,
    width: number,
    height: number,
    cue: CensorCue,
    isSelected: boolean
  ) {
    const px = box.x * width;
    const py = box.y * height;
    const pw = box.w * width;
    const ph = box.h * height;

    ctx.save();
    // Bounding outline
    ctx.strokeStyle = isSelected ? '#38bdf8' : '#f59e0b';
    ctx.lineWidth = isSelected ? 2.5 : 1.5;
    ctx.setLineDash(isSelected ? [] : [4, 4]);
    ctx.strokeRect(px, py, pw, ph);

    // Label badge above the box
    const label = `${cue.action.toUpperCase()}: ${cue.category}`;
    ctx.font = '11px sans-serif';
    const textWidth = ctx.measureText(label).width;
    const badgeX = Math.max(px, 4);
    const badgeY = Math.max(py - 20, 4);

    ctx.fillStyle = isSelected ? '#0284c7' : '#d97706';
    ctx.fillRect(badgeX, badgeY, textWidth + 10, 18);
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, badgeX + 5, badgeY + 9);

    // If selected, draw corner handles
    if (isSelected) {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      const handleSize = 7;
      const corners = [
        [px, py],
        [px + pw, py],
        [px, py + ph],
        [px + pw, py + ph],
      ];
      for (const [cx, cy] of corners) {
        ctx.fillRect(cx - handleSize / 2, cy - handleSize / 2, handleSize, handleSize);
        ctx.strokeRect(cx - handleSize / 2, cy - handleSize / 2, handleSize, handleSize);
      }
    }

    ctx.restore();
  }
}
