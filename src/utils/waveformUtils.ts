/**
 * Extracts normalized peak amplitudes from an AudioBuffer or generates procedural waveform peaks.
 */
export async function extractWaveformPeaks(
  audioBuffer: AudioBuffer,
  numPeaks: number = 800
): Promise<number[]> {
  const rawData = audioBuffer.getChannelData(0); // Use left/first channel
  const blockSize = Math.floor(rawData.length / numPeaks);
  const peaks: number[] = [];

  for (let i = 0; i < numPeaks; i++) {
    const start = i * blockSize;
    let sum = 0;
    for (let j = 0; j < blockSize; j++) {
      sum += Math.abs(rawData[start + j]);
    }
    const avg = sum / blockSize;
    peaks.push(Math.min(1.0, avg * 3.5)); // Boost dynamic range
  }

  return peaks;
}

/**
 * Generates procedural realistic audio waveform peaks for demo videos.
 */
export function generateSyntheticPeaks(numPeaks: number = 800): number[] {
  const peaks: number[] = [];
  for (let i = 0; i < numPeaks; i++) {
    const t = i / numPeaks;
    // Generate natural dialogue clusters and quieter pauses
    const speechCluster = Math.sin(t * Math.PI * 12);
    const envelope = speechCluster > -0.2 ? Math.abs(Math.sin(t * Math.PI * 36)) * 0.75 + 0.15 : 0.08;
    const harmonic = Math.sin(i * 0.3) * 0.08;
    const noise = (Math.random() - 0.5) * 0.12;
    const spike = (i % 28 === 0) ? 0.3 : 0;
    peaks.push(Math.min(1.0, Math.max(0.04, envelope + harmonic + noise + spike)));
  }
  return peaks;
}

/**
 * Paints a continuous analog oscilloscope-style audio waveform onto a canvas context.
 * Features symmetrical acoustic envelope, glowing contour traces, and center reference axis.
 */
export function drawWaveform(
  ctx: CanvasRenderingContext2D,
  peaks: number[],
  width: number,
  height: number,
  startRatio: number = 0,
  endRatio: number = 1
) {
  ctx.clearRect(0, 0, width, height);
  if (!peaks || peaks.length === 0 || width <= 0 || height <= 0) return;

  const midY = height / 2;
  const maxAmp = (height / 2) * 0.88;
  const n = peaks.length;

  // 1. Subtle analog center zero-crossing reference axis
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(52, 211, 153, 0.18)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 4]);
  ctx.moveTo(0, midY);
  ctx.lineTo(width, midY);
  ctx.stroke();
  ctx.setLineDash([]);

  // 2. Sample envelope points across the visible viewport slice
  const sampleCount = Math.max(50, Math.min(Math.round(width / 3), 600));
  const points: { x: number; yTop: number; yBottom: number }[] = [];

  const clampedStartRatio = Math.max(0, Math.min(1, startRatio));
  const clampedEndRatio = Math.max(clampedStartRatio, Math.min(1, endRatio));
  const span = Math.max(0.00001, clampedEndRatio - clampedStartRatio);

  for (let s = 0; s < sampleCount; s++) {
    const progress = s / (sampleCount - 1);
    const x = progress * width;
    const ratio = clampedStartRatio + progress * span;
    const virtualIndex = Math.max(0, Math.min(n - 1, ratio * (n - 1)));
    const i0 = Math.floor(virtualIndex);
    const i1 = Math.min(n - 1, i0 + 1);
    const frac = virtualIndex - i0;
    const rawVal = (peaks[i0] ?? 0.05) * (1 - frac) + (peaks[i1] ?? 0.05) * frac;

    const amp = Math.max(0.04, Math.min(1.0, rawVal)) * maxAmp;
    points.push({
      x,
      yTop: midY - amp,
      yBottom: midY + amp,
    });
  }

  // 3. Faint analog vertical luminous filaments (CRT phosphor aesthetic)
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.09)';
  ctx.lineWidth = 1;
  const filamentStep = Math.max(1, Math.floor(points.length / 80));
  for (let i = 0; i < points.length; i += filamentStep) {
    ctx.moveTo(points[i].x, points[i].yTop);
    ctx.lineTo(points[i].x, points[i].yBottom);
  }
  ctx.stroke();

  // 4. Trace the continuous smooth analog envelope
  ctx.beginPath();
  ctx.moveTo(points[0].x, midY);

  // Upper wave curve (left to right)
  for (let i = 0; i < points.length - 1; i++) {
    const pCurrent = points[i];
    const pNext = points[i + 1];
    const cpX = (pCurrent.x + pNext.x) / 2;
    ctx.quadraticCurveTo(pCurrent.x, pCurrent.yTop, cpX, (pCurrent.yTop + pNext.yTop) / 2);
  }
  ctx.lineTo(points[points.length - 1].x, points[points.length - 1].yTop);
  ctx.lineTo(points[points.length - 1].x, midY);

  // Lower wave curve (right to left)
  for (let i = points.length - 1; i > 0; i--) {
    const pCurrent = points[i];
    const pPrev = points[i - 1];
    const cpX = (pCurrent.x + pPrev.x) / 2;
    ctx.quadraticCurveTo(pCurrent.x, pCurrent.yBottom, cpX, (pCurrent.yBottom + pPrev.yBottom) / 2);
  }
  ctx.lineTo(points[0].x, points[0].yBottom);
  ctx.closePath();

  // Analog gradient fill: high luminance at outer peaks, translucent at zero-crossing
  const grad = ctx.createLinearGradient(0, midY - maxAmp, 0, midY + maxAmp);
  grad.addColorStop(0, 'rgba(52, 211, 153, 0.52)');     // Emerald 400 (top peak)
  grad.addColorStop(0.35, 'rgba(16, 185, 129, 0.32)'); // Mid upper body
  grad.addColorStop(0.5, 'rgba(5, 150, 105, 0.08)');   // Center axis translucent
  grad.addColorStop(0.65, 'rgba(16, 185, 129, 0.32)'); // Mid lower body
  grad.addColorStop(1, 'rgba(52, 211, 153, 0.52)');     // Emerald 400 (bottom peak)
  ctx.fillStyle = grad;
  ctx.fill();

  // 5. Glowing oscilloscope contour traces along upper and lower wave boundaries
  ctx.save();
  ctx.shadowColor = 'rgba(52, 211, 153, 0.45)';
  ctx.shadowBlur = 3;
  ctx.strokeStyle = 'rgba(52, 211, 153, 0.9)';
  ctx.lineWidth = 1.3;

  // Upper trace
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].yTop);
  for (let i = 0; i < points.length - 1; i++) {
    const pCurrent = points[i];
    const pNext = points[i + 1];
    const cpX = (pCurrent.x + pNext.x) / 2;
    ctx.quadraticCurveTo(pCurrent.x, pCurrent.yTop, cpX, (pCurrent.yTop + pNext.yTop) / 2);
  }
  ctx.lineTo(points[points.length - 1].x, points[points.length - 1].yTop);
  ctx.stroke();

  // Lower trace
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].yBottom);
  for (let i = 0; i < points.length - 1; i++) {
    const pCurrent = points[i];
    const pNext = points[i + 1];
    const cpX = (pCurrent.x + pNext.x) / 2;
    ctx.quadraticCurveTo(pCurrent.x, pCurrent.yBottom, cpX, (pCurrent.yBottom + pNext.yBottom) / 2);
  }
  ctx.lineTo(points[points.length - 1].x, points[points.length - 1].yBottom);
  ctx.stroke();

  ctx.restore();
}

