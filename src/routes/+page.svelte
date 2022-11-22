<script>
	import { onMount } from 'svelte';

	onMount(() => {
		console.log('loading module');
		const mod = import('@e4a/irmaseal-wasm-bindings');
		mod.then((m) => console.log('module loaded: ', m));
	});
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>
