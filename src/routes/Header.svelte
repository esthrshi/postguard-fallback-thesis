<script>
	import { page } from '$app/stores';
</script>

<header>

    <nav>
        <ul>
			<li aria-current={$page.url.pathname === '/' ? 'page' : undefined}>
				<a href="/">Home</a>
			</li>

			<li aria-current={$page.url.pathname === '/decrypt' ? 'page' : undefined}>
				<a href="/decrypt">Decrypt</a>
			</li>

			<li aria-current={$page.url.pathname === '/decrypt2' ? 'page' : undefined}>
				<a href="/decrypt2">Decrypt2</a>
			</li>
		</ul>
    </nav>

</header>