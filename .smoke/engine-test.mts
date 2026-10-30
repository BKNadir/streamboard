import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { OfflineAudioContext, AudioContext } from "node-web-audio-api";
import { AudioEngine } from "../src/audio/engine.ts";
import { Player } from "../src/actions/player.ts";
import { SoundRegistry } from "../src/sound-registry.ts";

const samples = process.argv[2];
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// 1. Formats: decode each sample with an offline context (works without an audio device).
const results: Record<string, string> = {};
for (const name of ["sample.mp3", "sample.wav", "sample.flac", "sample.ogg", "sample.aiff", "sample.webm"]) {
  const ctx = new OfflineAudioContext(2, 1, 48000);
  try {
    const data = await readFile(path.join(samples, name));
    const buf = await ctx.decodeAudioData(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength));
    results[name] = `ok ${buf.duration.toFixed(2)}s ${buf.numberOfChannels}ch`;
  } catch (e) {
    results[name] = `FAIL ${(e as Error).message}`;
  }
}
console.table(results);
for (const n of ["sample.mp3", "sample.wav", "sample.flac", "sample.ogg"]) assert.match(results[n], /^ok/, n);

// 2. Engine end-to-end, only if this machine has an audio output.
let hasOutput = true;
try { const c = new AudioContext(); await c.close(); } catch (e) { hasOutput = false; console.log("No audio output on this runner:", (e as Error).message); }

if (hasOutput) {
  const engine = new AudioEngine({ info: console.log, warn: console.warn });
  console.log("outputs:", await engine.listOutputs());
  const reg = new SoundRegistry();
  const mp3 = path.join(samples, "sample.mp3");
  const start = (loop: boolean, device?: string) => {
    const p = new Player("K", mp3, { volume: 50, loop, audioDevice: device }, engine);
    let err: Error | undefined;
    p.once("end", () => reg.remove("K", p));
    p.once("playerror", (_i, e) => { err = e; reg.remove("K", p); });
    reg.add("K", p); p.play();
    return { p, get err() { return err; } };
  };
  // loop + stop
  const a = start(true); await wait(500);
  assert.equal(a.err, undefined); assert.equal(a.p.isRunning, true);
  reg.stopAction("K"); await wait(100); assert.equal(a.p.isRunning, false);
  // overlap: two at once, then stopAll
  const b = start(false); const c = start(false); await wait(300);
  assert.equal(reg.stopAll(), 2); await wait(100); assert.equal(b.p.isRunning || c.p.isRunning, false);
  // stop while decoding (cold cache with a different file)
  const p2 = new Player("K2", path.join(samples, "sample.flac"), { volume: 50 }, engine);
  let ended = false; p2.once("end", () => (ended = true)); p2.play(); p2.stop(); await wait(500);
  assert.equal(ended, true); assert.equal(p2.isRunning, false);
  // unknown device falls back to default output
  const d = start(false, "wasapi/{does-not-exist}"); await wait(300); assert.equal(d.err, undefined, String(d.err)); reg.stopAll();
  // natural end
  const short = new Player("K3", path.join(samples, "sample.wav"), { volume: 10 }, engine);
  let shortEnded = false; short.once("end", () => (shortEnded = true)); short.play();
  // missing file -> playerror
  const bad = new Player("K4", path.join(samples, "nope.mp3"), {}, engine);
  let badErr: Error | undefined; bad.once("playerror", (_i, e) => (badErr = e)); bad.play(); await wait(300);
  assert.ok(badErr, "missing file reports playerror");
  for (let i = 0; i < 100 && !shortEnded; i++) await wait(200);
  assert.equal(shortEnded, true, "natural end emitted");
  await engine.closeAll();
  console.log("ENGINE E2E OK");
}
console.log("ENGINE TEST DONE");
