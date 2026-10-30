import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import url from "node:url";

const isWatching = !!process.env.ROLLUP_WATCH;
const sdPlugin = "com.bknadir.streamboard.sdPlugin";

/**
 * Packages that contain native binaries cannot be bundled into plugin.js:
 * they are kept external and copied (with their dependencies) into
 * `<plugin>/bin/node_modules`, where Node resolves them at runtime.
 */
const nativePackages = ["node-web-audio-api"];

/** Native binaries the plugin never needs (the plugin runs on Windows and macOS only). */
const skipFile = (file) => /\.linux-[^/\\]*\.node$/.test(file);

/**
 * Finds a package folder the way Node does (walking up `node_modules`), without
 * `require.resolve`, which fails for packages whose `exports` hide package.json.
 */
function findPackageDir(name, fromDir) {
	let dir = fromDir;
	for (;;) {
		const candidate = path.join(dir, "node_modules", name);
		if (existsSync(path.join(candidate, "package.json"))) {
			return candidate;
		}
		const parent = path.dirname(dir);
		if (parent === dir) {
			throw new Error(`Cannot find package "${name}" from ${fromDir}`);
		}
		dir = parent;
	}
}

/** Collects a package and its runtime dependencies, recursively. */
function collectPackages(name, fromDir, found = new Map()) {
	if (found.has(name)) {
		return found;
	}
	const dir = findPackageDir(name, fromDir);
	found.set(name, dir);
	const manifest = JSON.parse(readFileSync(path.join(dir, "package.json"), "utf8"));
	for (const dependency of Object.keys(manifest.dependencies ?? {})) {
		collectPackages(dependency, dir, found);
	}
	return found;
}

function copyNativePackages() {
	return {
		name: "copy-native-packages",
		writeBundle() {
			const target = path.join(sdPlugin, "bin", "node_modules");
			rmSync(target, { recursive: true, force: true });
			const packages = new Map();
			for (const name of nativePackages) {
				collectPackages(name, process.cwd(), packages);
			}
			for (const [name, dir] of packages) {
				const destination = path.join(target, name);
				mkdirSync(path.dirname(destination), { recursive: true });
				cpSync(dir, destination, {
					recursive: true,
					filter: (source) => !skipFile(source) && !source.includes(`${path.sep}node_modules${path.sep}`, dir.length),
				});
			}
			if (!existsSync(path.join(target, nativePackages[0]))) {
				this.error(`Failed to copy ${nativePackages[0]} into ${target}`);
			}
		},
	};
}

/**
 * @type {import('rollup').RollupOptions}
 */
const config = {
	input: "src/plugin.ts",
	external: (id) => nativePackages.some((name) => id === name || id.startsWith(`${name}/`)),
	output: {
		file: `${sdPlugin}/bin/plugin.js`,
		sourcemap: isWatching,
		sourcemapPathTransform: (relativeSourcePath, sourcemapPath) => {
			return url.pathToFileURL(path.resolve(path.dirname(sourcemapPath), relativeSourcePath)).href;
		}
	},
	plugins: [
		{
			name: "watch-externals",
			buildStart: function () {
				this.addWatchFile(`${sdPlugin}/manifest.json`);
			},
		},
		typescript({
			mapRoot: isWatching ? "./" : undefined
		}),
		nodeResolve({
			browser: false,
			exportConditions: ["node"],
			preferBuiltins: true
		}),
		commonjs(),
		!isWatching && terser(),
		{
			name: "emit-module-package-file",
			generateBundle() {
				this.emitFile({ fileName: "package.json", source: `{ "type": "module" }`, type: "asset" });
			}
		},
		copyNativePackages(),
	]
};

export default config;
