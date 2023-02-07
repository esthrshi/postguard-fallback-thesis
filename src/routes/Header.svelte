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


<style>

nav {
	margin-left:-2.5em;
}

ul {
	list-style-type: none;
	overflow: hidden;
}

li {
	float: left;
}

li a {
	display: block;
	text-align: center;
	margin-top: 16px;
	padding-right: 16px;
	margin-bottom: 16px;
	color: #022e3d;
	text-decoration: none;
}

li a:hover {
	text-decoration: underline #3095de 3px;
}

[aria-current]:not([aria-current="false"]) {
	text-decoration: underline #3095de 3px;
}

</style>