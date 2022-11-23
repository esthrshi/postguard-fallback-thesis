import { sveltekit } from '@sveltejs/kit/vite';
import type { UserConfig } from 'vite';
//import wasmPack from 'vite-plugin-wasm-pack';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill'
import rollupNodePolyFill from 'rollup-plugin-node-polyfills'


//export default defineConfig({
//  plugins: [
//    wasm(),
//    topLevelAwait()
//  ]
//});
const config: UserConfig = {

	resolve: {
		alias: {
			util: 'rollup-plugin-node-polyfills/polyfills/util',
			events: 'rollup-plugin-node-polyfills/polyfills/events',
			url: 'rollup-plugin-node-polyfills/polyfills/url',
			http: 'rollup-plugin-node-polyfills/polyfills/http',
            https: 'rollup-plugin-node-polyfills/polyfills/http'
		}
	},

	optimizeDeps: {
        esbuildOptions: {
            // Node.js global to browser globalThis
            define: {
                global: 'globalThis'
            },
            // Enable esbuild polyfill plugins
            plugins: [
                NodeGlobalsPolyfillPlugin({
                    process: true,
                    buffer: true
                }),
                NodeModulesPolyfillPlugin()
            ]
        }
    },

	plugins: [
		sveltekit(),
		wasm(),
		topLevelAwait() /*, wasmPack([], ['@e4a/irmaseal-wasm-bindings'])*/
	]
};

export default config;
