import { WeaponId } from '../types';

class SoundSystem {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private isMuted: boolean = false;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();

      this.masterGain.connect(this.ctx.destination);
      this.sfxGain.connect(this.masterGain);

      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.sfxGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolumes(master: number, sfx: number) {
    if (!this.ctx || !this.masterGain || !this.sfxGain) return;
    this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, master)), this.ctx.currentTime);
    this.sfxGain.gain.setValueAtTime(Math.max(0, Math.min(1, sfx)), this.ctx.currentTime);
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public playShoot(weaponId: WeaponId) {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain || this.isMuted) return;

      const now = this.ctx.currentTime;

      if (weaponId === 'sniper_rifle') {
        // Deep thunderous gunshot
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);

        gain.gain.setValueAtTime(1.0, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.4);

        // Noise crack
        this.playNoiseCrack(now, 0.25, 800, 1.0);
      } else if (weaponId === 'shotgun') {
        // Heavy multi-layer blast
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.25);

        gain.gain.setValueAtTime(0.9, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.3);

        this.playNoiseCrack(now, 0.22, 1200, 0.9);
      } else if (weaponId === 'revolver') {
        // Sharp metallic punch
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.18);

        gain.gain.setValueAtTime(0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.22);
        this.playNoiseCrack(now, 0.14, 2200, 0.7);
      } else if (weaponId === 'rocket_launcher') {
        // Heavy whoosh launch
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.linearRampToValueAtTime(320, now + 0.22);

        gain.gain.setValueAtTime(0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.35);
        this.playNoiseCrack(now, 0.3, 500, 0.8);
      } else if (weaponId === 'knife') {
        // Air swish
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.16);
      } else {
        // Assault rifle & SMG & semi-auto
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(380, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.1);

        gain.gain.setValueAtTime(0.65, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.12);
        this.playNoiseCrack(now, 0.08, 1800, 0.5);
      }
    } catch {
      // Audio fallback silent
    }
  }

  private playNoiseCrack(now: number, duration: number, filterFreq: number, vol: number) {
    if (!this.ctx || !this.sfxGain) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
    noise.stop(now + duration);
  }

  public playHitmarker() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain || this.isMuted) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, now);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.045);
    } catch {
      // Ignore
    }
  }

  public playHeadshotDing() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain || this.isMuted) return;
      const now = this.ctx.currentTime;

      // Two harmonic bell tones
      [2200, 3300].forEach((freq) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.2);
      });
    } catch {
      // Ignore
    }
  }

  public playReload() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain || this.isMuted) return;
      const now = this.ctx.currentTime;

      // Mechanical click 1
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'square';
      osc1.frequency.setValueAtTime(700, now);
      osc1.frequency.exponentialRampToValueAtTime(250, now + 0.05);
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc1.connect(gain1);
      gain1.connect(this.sfxGain);
      osc1.start(now);
      osc1.stop(now + 0.07);

      // Mechanical click 2 (slide home)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(450, now + 0.25);
      osc2.frequency.exponentialRampToValueAtTime(900, now + 0.32);
      gain2.gain.setValueAtTime(0.3, now + 0.25);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc2.connect(gain2);
      gain2.connect(this.sfxGain);
      osc2.start(now + 0.25);
      osc2.stop(now + 0.36);
    } catch {
      // Ignore
    }
  }

  public playJump() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain || this.isMuted) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.08);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch {
      // Ignore
    }
  }

  public playSlide() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain || this.isMuted) return;
      const now = this.ctx.currentTime;
      this.playNoiseCrack(now, 0.25, 450, 0.28);
    } catch {
      // Ignore
    }
  }

  public playExplosion() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain || this.isMuted) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.exponentialRampToValueAtTime(20, now + 0.6);

      gain.gain.setValueAtTime(0.9, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.7);

      this.playNoiseCrack(now, 0.6, 350, 0.9);
    } catch {
      // Ignore
    }
  }

  public playKillFanfare() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain || this.isMuted) return;
      const now = this.ctx.currentTime;
      [440, 554, 659].forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + idx * 0.06;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.25, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(start);
        osc.stop(start + 0.26);
      });
    } catch {
      // Ignore
    }
  }

  public playMultiKill(tier: 'double' | 'triple' | 'streak3' | 'streak5' | 'spree') {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain || this.isMuted) return;
      const now = this.ctx.currentTime;
      const baseFreq = tier === 'double' ? 523 : tier === 'triple' ? 659 : 784;
      const freqs = [baseFreq, baseFreq * 1.25, baseFreq * 1.5, baseFreq * 2.0];

      freqs.forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + idx * 0.08;
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.3, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(start);
        osc.stop(start + 0.36);
      });
    } catch {
      // Ignore
    }
  }

  public playDamageTick() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain || this.isMuted) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch {
      // Ignore
    }
  }

  public playHeartbeat() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain || this.isMuted) return;
      const now = this.ctx.currentTime;
      [60, 50].forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + idx * 0.12;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.5, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.15);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(start);
        osc.stop(start + 0.16);
      });
    } catch {
      // Ignore
    }
  }

  public playUiClick() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain || this.isMuted) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.03);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.04);
    } catch {
      // Ignore
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public playDash() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain || this.isMuted) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(620, now + 0.14);

      gain.gain.setValueAtTime(0.32, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.17);
      this.playNoiseCrack(now, 0.15, 1600, 0.35);
    } catch {
      // Ignore
    }
  }

  public playGrapple() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain || this.isMuted) return;
      const now = this.ctx.currentTime;
      [520, 880, 1320].forEach((freq, i) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = now + i * 0.035;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.3, t + 0.08);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.1);
      });
    } catch {
      // Ignore
    }
  }

  public playGrenadeThrow() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain || this.isMuted) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(950, now);
      osc.frequency.exponentialRampToValueAtTime(280, now + 0.12);
      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.14);
    } catch {
      // Ignore
    }
  }

  public playMeleeSlash() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain || this.isMuted) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(780, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.14);
      gain.gain.setValueAtTime(0.38, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.16);
      this.playNoiseCrack(now, 0.12, 2400, 0.4);
    } catch {
      // Ignore
    }
  }

  public playTurretHack() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain || this.isMuted) return;
      const now = this.ctx.currentTime;
      [660, 880, 1174, 1568].forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + idx * 0.045;
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.2, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.14);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(start);
        osc.stop(start + 0.15);
      });
    } catch {
      // Ignore
    }
  }

  public playPortalWarp() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain || this.isMuted) return;
      const now = this.ctx.currentTime;
      [220, 440, 660].forEach((freq) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 2.5, now + 0.28);
        gain.gain.setValueAtTime(0.24, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.32);
      });
    } catch {
      // Ignore
    }
  }

  public playSupplyCrateOpen() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain || this.isMuted) return;
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + idx * 0.055;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.28, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(start);
        osc.stop(start + 0.24);
      });
    } catch {
      // Ignore
    }
  }

  public playUiHover() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain || this.isMuted) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.025);
    } catch {
      // Ignore
    }
  }
}

export const sound = new SoundSystem();

