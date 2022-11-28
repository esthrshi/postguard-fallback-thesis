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

			<li aria-current={$page.url.pathname === '/email' ? 'page' : undefined}>
				<a href="/email">Email History</a>
			</li>

			<li aria-current={$page.url.pathname === '/settings' ? 'page' : undefined}>
				<a href="/settings">Settings</a>
			</li>
		</ul>
    </nav>

</header>