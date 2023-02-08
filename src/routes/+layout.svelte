<script>
	import Header from './Header.svelte';
</script>

<div class="app">
	<Header />

	<main>
		<slot />
	</main>

</div>

<style global>

@import url('https://fonts.googleapis.com/css2?family=Overpass:ital,wght@0,400;0,700;1,400;1,700&display=swap');

.app {
	font-family: 'Overpass', Arial, Helvetica, sans-serif;
	width: 80%;
	margin: auto;
}

button, input {
	font-family: 'Overpass', Arial, Helvetica, sans-serif;
}

h1, h2 {
	color: #022e3d;
	font-weight: 700;
}

#block {
    margin-bottom: 20px;
}

.button {
  background-color: #d6d6d6;
  border: none;
  padding: 10px 15px;
  margin-right: 5px;
  text-align: center;
  cursor: pointer;
  border-radius: 25px;
}

.button:hover {
	background-color: #bababa;
}
    
</style>