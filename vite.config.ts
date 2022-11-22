import { sveltekit } from '@sveltejs/kit/vite';
import type { UserConfig } from 'vite';
//import wasmPack from 'vite-plugin-wasm-pack';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

//export default defineConfig({
//  plugins: [
//    wasm(),
//    topLevelAwait()
//  ]
//});
const config: UserConfig = {
	plugins: [
		sveltekit(),
		wasm(),
		topLevelAwait() /*, wasmPack([], ['@e4a/irmaseal-wasm-bindings'])*/
	]
};

export default config;
