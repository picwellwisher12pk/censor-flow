/**
 * Generates an in-memory synthetic WebM video with an audio track,
 * visual timecodes, target moving objects (faces/plates/boxes), and spoken tones.
 * This allows instant testing of blur, pixelation, muting, bleeping, and auto-skipping
 * without needing an external video file!
 */
export async function createSyntheticDemoVideo(durationSec: number = 45): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d')!;

  const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  const dest = audioCtx.createMediaStreamDestination();
  
  // Create an audio oscillator that generates rhythmic beeps and hums
  const osc = audioCtx.createOscillator();
  const oscGain = audioCtx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(220, audioCtx.currentTime);
  oscGain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  osc.connect(oscGain);
  oscGain.connect(dest);
  osc.start();

  const canvasStream = canvas.captureStream(30);
  const combinedStream = new MediaStream([
    ...canvasStream.getVideoTracks(),
    ...dest.stream.getAudioTracks(),
  ]);

  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
    ? 'video/webm;codecs=vp9,opus'
    : 'video/webm';

  const recorder = new MediaRecorder(combinedStream, { mimeType });
  const chunks: Blob[] = [];

  recorder.ondataavailable = e => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  return new Promise((resolve) => {
    recorder.onstop = () => {
      osc.stop();
      audioCtx.close();
      const blob = new Blob(chunks, { type: 'video/webm' });
      resolve(URL.createObjectURL(blob));
    };

    recorder.start(100);

    const startTime = performance.now();
    const totalMs = durationSec * 1000;

    const renderLoop = () => {
      const elapsed = performance.now() - startTime;
      if (elapsed >= totalMs) {
        recorder.stop();
        return;
      }

      const currentSec = (elapsed / 1000).toFixed(1);

      // Gradient background
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#1e293b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 80) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 80) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Title & Timecode
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 36px monospace';
      ctx.fillText(`CENSORFLOW TEST PATTERN: ${currentSec}s / ${durationSec}s`, 60, 90);

      // Section Indicator
      ctx.fillStyle = '#94a3b8';
      ctx.font = '20px sans-serif';
      let statusText = 'Normal Safe Segment';
      if (elapsed >= 8000 && elapsed <= 13000) {
        statusText = '🚨 VIOLENCE / COMBAT ZONE (Auto-Skip Demo)';
      } else if (elapsed >= 16500 && elapsed <= 17800) {
        statusText = '🤬 PROFANITY AUDIO ZONE (Audio Bleep Demo)';
      } else if (elapsed >= 22000 && elapsed <= 28000) {
        statusText = '👀 VISUAL NUDITY ZONE (Video Blur Demo)';
      } else if (elapsed >= 32000 && elapsed <= 36500) {
        statusText = '🔒 SENSITIVE PII ZONE (Video Pixelation Demo)';
      }
      ctx.fillText(statusText, 60, 130);

      // Target 1: A mock "Face / Sensitive Region" that moves
      const faceX = 0.35 * canvas.width + Math.sin(elapsed / 1000) * 100;
      const faceY = 0.25 * canvas.height;
      const faceW = 0.3 * canvas.width;
      const faceH = 0.45 * canvas.height;
      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.roundRect(faceX, faceY, faceW, faceH, 16);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('TARGET 1: [SIMULATED SENSITIVE]', faceX + 20, faceY + 50);

      // Target 2: License plate / PII at bottom
      const plateX = 0.55 * canvas.width;
      const plateY = 0.65 * canvas.height;
      const plateW = 0.35 * canvas.width;
      const plateH = 0.25 * canvas.height;
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.roundRect(plateX, plateY, plateW, plateH, 12);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 24px monospace';
      ctx.fillText('ID: 4920-8192-3021', plateX + 30, plateY + plateH / 2);

      // Audio frequency modulation
      osc.frequency.setValueAtTime(220 + (Math.sin(elapsed / 500) * 80), audioCtx.currentTime);

      requestAnimationFrame(renderLoop);
    };

    renderLoop();
  });
}
