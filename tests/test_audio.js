import { AmbientMusicSystem, SoundEffects } from "../src/systems/AudioSystem.js";
import { SaveSystem } from "../src/systems/SaveSystem.js";

console.log("=== RUNNING AUDIO & AMBIENT MUSIC TESTS ===");

// 1. SoundEffects test
const sfx = new SoundEffects();
if (sfx.muted !== false) throw new Error("SFX should start unmuted");
sfx.muted = true;
sfx.play('jump'); // Safe no-op when muted
console.log("✓ Test 1: SoundEffects instantiates and handles mute safely");

// 2. AmbientMusicSystem volume cycling test
const music = new AmbientMusicSystem();
music.volume = 0.5;
music.muted = false;

// Cycle sequence: 50% -> 75% -> 100% -> OFF (0%) -> 25% -> 50%
let s1 = music.cycleVolume();
if (music.volume !== 0.75 || music.muted) throw new Error(`Expected 75%, got ${music.volume}`);
console.log("✓ Test 2A: Volume cycles to 75% ->", s1);

let s2 = music.cycleVolume();
if (music.volume !== 1.0 || music.muted) throw new Error(`Expected 100%, got ${music.volume}`);
console.log("✓ Test 2B: Volume cycles to 100% ->", s2);

let s3 = music.cycleVolume();
if (music.volume !== 0 || !music.muted) throw new Error(`Expected OFF / muted, got volume ${music.volume}, muted ${music.muted}`);
console.log("✓ Test 2C: Volume cycles to OFF ->", s3);

let s4 = music.cycleVolume();
if (music.volume !== 0.25 || music.muted) throw new Error(`Expected 25%, got ${music.volume}`);
console.log("✓ Test 2D: Volume cycles to 25% ->", s4);

let s5 = music.cycleVolume();
if (music.volume !== 0.50 || music.muted) throw new Error(`Expected 50%, got ${music.volume}`);
console.log("✓ Test 2E: Volume cycles back to 50% ->", s5);

// 3. Status string check
if (!s5.includes("50%")) throw new Error("Status string format mismatch");
music.muted = true;
if (music.getStatusString() !== "🎵 Music: OFF") throw new Error("Muted status string mismatch");
console.log("✓ Test 3: Status strings correctly format ON (%) and OFF");

// 4. External track loader handles fallback safely in node
music.loadExternalTrack("assets/bgm.mp3");
console.log("✓ Test 4: loadExternalTrack handles audio paths safely without exceptions");

console.log("\nALL AUDIO & MUSIC TESTS PASSED!\n");
