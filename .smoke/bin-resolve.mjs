// Run from the plugin's bin/ folder: checks the copied package resolves and its native binary loads.
const { mediaDevices, OfflineAudioContext } = await import("node-web-audio-api");
const devices = await mediaDevices.enumerateDevices();
console.log("platform", process.platform, process.arch, "node", process.version);
console.log("outputs:", JSON.stringify(devices.filter((d) => d.kind === "audiooutput")));
const ctx = new OfflineAudioContext(1, 44100, 44100);
console.log("offline context sampleRate", ctx.sampleRate);
console.log("BIN RESOLVE OK");
