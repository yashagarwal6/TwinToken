import { SaveSystem } from "./SaveSystem.js";

// Web Audio API Sound Effects Synthesizer (pure zero-dependency sound effects)
export class SoundEffects {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.initialized = false;
    }

    init() {
        if (this.initialized && this.ctx) return;
        if (typeof window === 'undefined') return;
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
                this.initialized = true;
            }
        } catch (e) {
            console.warn("AudioContext not available", e);
        }
    }

    play(name) {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        switch (name) {
            case 'jump':
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(160, now);
                osc.frequency.exponentialRampToValueAtTime(360, now + 0.12);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
                osc.start(now);
                osc.stop(now + 0.12);
                break;
            case 'land':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(100, now);
                osc.frequency.exponentialRampToValueAtTime(50, now + 0.08);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                osc.start(now);
                osc.stop(now + 0.08);
                break;
            case 'echo_commit':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.exponentialRampToValueAtTime(600, now + 0.2);
                gain.gain.setValueAtTime(0.18, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
                break;
            case 'rift_scrub':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(220, now);
                osc.frequency.setValueAtTime(260, now + 0.04);
                gain.gain.setValueAtTime(0.06, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                osc.start(now);
                osc.stop(now + 0.05);
                break;
            case 'plate_press':
                osc.type = 'square';
                osc.frequency.setValueAtTime(180, now);
                osc.frequency.setValueAtTime(220, now + 0.05);
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                osc.start(now);
                osc.stop(now + 0.08);
                break;
            case 'door_open':
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(200, now);
                osc.frequency.linearRampToValueAtTime(400, now + 0.25);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
                osc.start(now);
                osc.stop(now + 0.25);
                break;
            case 'reset':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(220, now);
                osc.frequency.exponentialRampToValueAtTime(110, now + 0.1);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
                break;
            case 'goal':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.setValueAtTime(554.37, now + 0.1);
                osc.frequency.setValueAtTime(659.25, now + 0.2);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
                osc.start(now);
                osc.stop(now + 0.4);
                break;
            case 'point_of_no_return':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(140, now);
                osc.frequency.linearRampToValueAtTime(90, now + 0.35);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
                osc.start(now);
                osc.stop(now + 0.35);
                break;
        }
    }
}

// Built-in Royalty-Free Procedural Ambient Music + External Audio Track Player
export class AmbientMusicSystem {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.filter = null;
        this.isPlaying = false;
        this.volume = 0.5; // 0.0 to 1.0
        this.muted = false;

        // External audio element if user provides file
        this.externalAudio = null;
        this.usingExternal = false;

        // Procedural synth voice state
        this.oscillators = [];
        this.chordTimer = null;
        this.chordIndex = 0;

        // Atmospheric chords (A minor, F major 7, C major, E minor)
        this.chords = [
            [110, 164.81, 220, 261.63], // Am
            [87.31, 130.81, 174.61, 220], // Fmaj7
            [130.81, 164.81, 196, 246.94], // C
            [82.41, 123.47, 164.81, 196]  // Em
        ];

        this.loadSettings();
    }

    loadSettings() {
        try {
            const data = SaveSystem.load();
            if (data && data.settings) {
                if (data.settings.musicVolume !== undefined) {
                    this.volume = data.settings.musicVolume;
                }
                if (data.settings.musicMuted !== undefined) {
                    this.muted = data.settings.musicMuted;
                }
            }
        } catch (e) {}
    }

    saveSettings() {
        try {
            const data = SaveSystem.load();
            data.settings = data.settings || {};
            data.settings.musicVolume = this.volume;
            data.settings.musicMuted = this.muted;
            SaveSystem.save(data);
        } catch (e) {}
    }

    init() {
        if (this.ctx) return;
        if (typeof window === 'undefined') return;
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
                this.masterGain = this.ctx.createGain();
                this.masterGain.gain.setValueAtTime(this.muted ? 0 : this.volume * 0.25, this.ctx.currentTime);

                // Low-pass filter for warm, dreamy ambient tone
                this.filter = this.ctx.createBiquadFilter();
                this.filter.type = 'lowpass';
                this.filter.frequency.setValueAtTime(450, this.ctx.currentTime);
                this.filter.Q.setValueAtTime(2.0, this.ctx.currentTime);

                this.filter.connect(this.masterGain);
                this.masterGain.connect(this.ctx.destination);
            }
        } catch (e) {
            console.warn("AmbientMusic AudioContext initialization error:", e);
        }
    }

    // Set custom audio file (e.g. from YouTube / assets/bgm.mp3)
    loadExternalTrack(url) {
        if (!url || typeof window === 'undefined' || typeof Audio === 'undefined') return;
        try {
            if (this.externalAudio) {
                this.externalAudio.pause();
                this.externalAudio = null;
            }
            this.externalAudio = new Audio(url);
            this.externalAudio.loop = true;
            this.externalAudio.volume = this.muted ? 0 : this.volume;
            this.usingExternal = true;

            if (this.isPlaying && !this.muted) {
                this.stopProcedural();
                this.externalAudio.play().catch(() => {});
            }
        } catch (e) {
            console.warn("Could not load external audio track:", e);
            this.usingExternal = false;
        }
    }

    start() {
        this.init();
        this.isPlaying = true;

        if (this.usingExternal && this.externalAudio) {
            this.externalAudio.volume = this.muted ? 0 : this.volume;
            this.externalAudio.play().catch(() => {});
            return;
        }

        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }

        this.startProcedural();
    }

    stop() {
        this.isPlaying = false;
        if (this.externalAudio) {
            this.externalAudio.pause();
        }
        this.stopProcedural();
    }

    startProcedural() {
        if (!this.ctx || this.oscillators.length > 0) return;
        this.chordIndex = 0;
        this.playChord(this.chords[this.chordIndex]);

        // Evolve chord every 6 seconds
        this.chordTimer = setInterval(() => {
            if (!this.isPlaying || this.usingExternal) return;
            this.chordIndex = (this.chordIndex + 1) % this.chords.length;
            this.playChord(this.chords[this.chordIndex]);
        }, 6000);
    }

    playChord(frequencies) {
        if (!this.ctx || !this.filter) return;
        const now = this.ctx.currentTime;

        // Fade out previous oscillators
        for (let i = 0; i < this.oscillators.length; i++) {
            const { osc, gain } = this.oscillators[i];
            gain.gain.setValueAtTime(gain.gain.value, now);
            gain.gain.linearRampToValueAtTime(0.001, now + 1.8);
            setTimeout(() => {
                try { osc.stop(); osc.disconnect(); } catch (e) {}
            }, 1900);
        }
        this.oscillators = [];

        // Create new chord voices
        frequencies.forEach((freq, index) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = index % 2 === 0 ? 'sine' : 'triangle';
            osc.frequency.setValueAtTime(freq, now);

            // Detune slightly for lush stereo chorusing
            osc.detune.setValueAtTime((index - 1.5) * 4, now);

            gain.gain.setValueAtTime(0.001, now);
            gain.gain.linearRampToValueAtTime(0.08 / frequencies.length, now + 1.5);

            osc.connect(gain);
            gain.connect(this.filter);

            osc.start(now);
            this.oscillators.push({ osc, gain });
        });
    }

    stopProcedural() {
        if (this.chordTimer) {
            clearInterval(this.chordTimer);
            this.chordTimer = null;
        }
        for (let i = 0; i < this.oscillators.length; i++) {
            try {
                this.oscillators[i].osc.stop();
                this.oscillators[i].osc.disconnect();
            } catch (e) {}
        }
        this.oscillators = [];
    }

    cycleVolume() {
        // Cycles: 50% -> 75% -> 100% -> OFF (0%) -> 25% -> 50%
        if (this.muted || this.volume === 0) {
            this.muted = false;
            this.volume = 0.25;
        } else if (this.volume === 0.25) {
            this.volume = 0.50;
        } else if (this.volume === 0.50) {
            this.volume = 0.75;
        } else if (this.volume === 0.75) {
            this.volume = 1.0;
        } else {
            this.muted = true;
            this.volume = 0;
        }

        this.applyVolume();
        this.saveSettings();
        return this.getStatusString();
    }

    toggleMute() {
        this.muted = !this.muted;
        this.applyVolume();
        this.saveSettings();
        return this.getStatusString();
    }

    setVolume(val) {
        this.volume = Math.max(0, Math.min(1, val));
        this.muted = (this.volume === 0);
        this.applyVolume();
        this.saveSettings();
        return this.getStatusString();
    }

    applyVolume() {
        const effectiveVol = this.muted ? 0 : this.volume;
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setValueAtTime(effectiveVol * 0.25, this.ctx.currentTime);
        }
        if (this.externalAudio) {
            this.externalAudio.volume = effectiveVol;
        }
        if (effectiveVol > 0 && !this.isPlaying) {
            this.start();
        }
    }

    getStatusString() {
        if (this.muted || this.volume === 0) {
            return "🎵 Music: OFF";
        }
        return `🎵 Music: ON (${Math.round(this.volume * 100)}%)`;
    }
}
