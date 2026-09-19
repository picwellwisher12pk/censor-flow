import type { CensorCue } from '../types/censor';

export class AudioCensorEngine {
  private ctx: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private bleepOsc: OscillatorNode | null = null;
  private bleepGain: GainNode | null = null;
  private isMutedDueToCensor: boolean = false;
  private isBleeping: boolean = false;
  private attachedElement: HTMLVideoElement | null = null;

  public init(videoElement: HTMLVideoElement) {
    if (this.attachedElement === videoElement && this.ctx) {
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.attachedElement = videoElement;

      // Connect video to gainNode -> destination
      this.sourceNode = this.ctx.createMediaElementSource(videoElement);
      this.gainNode = this.ctx.createGain();

      // Setup bleep path
      this.bleepGain = this.ctx.createGain();
      this.bleepGain.gain.setValueAtTime(0, this.ctx.currentTime);

      this.sourceNode.connect(this.gainNode);
      this.gainNode.connect(this.ctx.destination);
      this.bleepGain.connect(this.ctx.destination);
    } catch (err) {
      console.warn('Web Audio API could not connect to video element (might already be connected or restricted by CORS):', err);
    }
  }

  public resumeContext() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public update(currentTimeMs: number, cues: CensorCue[], masterVolume: number = 1.0) {
    if (!this.ctx || !this.gainNode || !this.bleepGain) {
      return;
    }

    // Find active audio cues
    const activeAudioCues = cues.filter(
      c => c.type === 'audio' && c.enabled !== false && currentTimeMs >= c.startMs && currentTimeMs <= c.endMs
    );

    const hasMute = activeAudioCues.some(c => c.action === 'mute');
    const hasBleep = activeAudioCues.some(c => c.action === 'bleep');
    const duckCue = activeAudioCues.find(c => c.action === 'duck');

    const now = this.ctx.currentTime;
    const rampTime = 0.01; // 10ms smooth ramp to prevent audio clicks

    if (hasBleep) {
      // Start bleep tone and mute video track
      this.gainNode.gain.linearRampToValueAtTime(0, now + rampTime);
      this.isMutedDueToCensor = true;
      this.startBleep(1000, masterVolume * 0.4);
    } else if (hasMute) {
      // Complete mute
      this.gainNode.gain.linearRampToValueAtTime(0, now + rampTime);
      this.isMutedDueToCensor = true;
      this.stopBleep();
    } else if (duckCue) {
      // Lower volume
      const duckRatio = duckCue.params?.duckRatio ?? 0.2;
      this.gainNode.gain.linearRampToValueAtTime(masterVolume * duckRatio, now + rampTime);
      this.isMutedDueToCensor = false;
      this.stopBleep();
    } else {
      // Normal playback
      this.gainNode.gain.linearRampToValueAtTime(masterVolume, now + rampTime);
      this.isMutedDueToCensor = false;
      this.stopBleep();
    }
  }

  private startBleep(freq: number = 1000, volume: number = 0.3) {
    if (!this.ctx || !this.bleepGain) return;

    if (!this.isBleeping) {
      this.isBleeping = true;
      try {
        this.bleepOsc = this.ctx.createOscillator();
        this.bleepOsc.type = 'sine';
        this.bleepOsc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        this.bleepOsc.connect(this.bleepGain);
        this.bleepOsc.start();
        this.bleepGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.bleepGain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 0.005);
      } catch (e) {
        console.warn('Failed to start bleep oscillator:', e);
      }
    }
  }

  private stopBleep() {
    if (this.isBleeping && this.bleepGain && this.ctx) {
      this.isBleeping = false;
      try {
        this.bleepGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.bleepGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.005);
        if (this.bleepOsc) {
          const osc = this.bleepOsc;
          setTimeout(() => {
            try {
              osc.stop();
              osc.disconnect();
            } catch {
              // ignore cleanup error
            }
          }, 20);
          this.bleepOsc = null;
        }
      } catch (e) {
        console.warn('Failed to stop bleep oscillator:', e);
      }
    }
  }

  public getStatus() {
    return {
      isMutedDueToCensor: this.isMutedDueToCensor,
      isBleeping: this.isBleeping,
    };
  }

  public destroy() {
    this.stopBleep();
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close();
    }
    this.ctx = null;
    this.sourceNode = null;
    this.gainNode = null;
    this.bleepGain = null;
    this.attachedElement = null;
  }
}
