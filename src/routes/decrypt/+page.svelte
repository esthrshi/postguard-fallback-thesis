<script>

import * as IrmaCore from "@privacybydesign/irma-core";
import * as IrmaClient from "@privacybydesign/irma-client";
import * as IrmaPopup from "@privacybydesign/irma-popup";
import "@privacybydesign/irma-css";

//import { PolyfilledWritableStream } from "web-streams-polyfill";
import { createWriteStream } from "streamsaver";

import { onMount } from 'svelte';

const pkg = "https://main.irmaseal-pkg.ihub.ru.nl";
var mpk;
var mod;
//let decryptfile;
let planetPromise = getPlanet();

let files;

const listener = async (event) => {
  const decrypt = event.srcElement.classList.contains("decrypt");
  const [inFile] = event.srcElement.files;

  const outFileName = decrypt
    ? inFile.name.replace(".encrypted", ".eml")
    : `${inFile.name}.encrypted`;
  const fileWritable = createWriteStream(outFileName);

  const readable = inFile.stream();
};

async function getPlanet() {
  const resp = await fetch(`${pkg}/v2/parameters`);
  mpk = await resp.json().then((r) => r.publicKey);

  console.log("retrieved public key: ", mpk);
  //console.log("resp: ", resp);
}

// removed await (async) here, will that cause problems?
onMount(() => {
  
  //mpk = await resp.json().then((r) => r.publicKey);

  //console.log("retrieved public key: ", mpk);

  mod = import("@e4a/irmaseal-wasm-bindings");
  console.log("loaded WASM module");

  //const buttons = document.querySelectorAll("input");
  //buttons.forEach((btn) => btn.addEventListener("change", listener));
});

</script>

<!-- <script>

import * as IrmaCore from "@privacybydesign/irma-core";
import * as IrmaClient from "@privacybydesign/irma-client";
import * as IrmaPopup from "@privacybydesign/irma-popup";
import "@privacybydesign/irma-css";

var mod;

window.onload = async () => {

  mod = await import("@e4a/irmaseal-wasm-bindings");
  console.log("loaded WASM module");

 };

</script> -->

<h2>Decryption</h2>

<!-- <input 
    bind:decryptfile
    id="decrypt"
    type="file"
    /> -->

  {#await planetPromise}
		Loading planet...
	{:then planet}
		Retrieved public key
	{:catch someError}
		System error: {someError.message}.
	{/await}

  <label for="decrypt">Upload an encrypted file:</label>
<input
	bind:files
	id="decrypt"
	type="file"
/>

<!-- <input type="file" class="encrypt">encrypt file />
<input type="file" class="decrypt">decrypt file /> -->