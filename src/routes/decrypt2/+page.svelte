<script>
import * as IrmaCore from "@privacybydesign/irma-core";
import * as IrmaClient from "@privacybydesign/irma-client";
import * as IrmaPopup from "@privacybydesign/irma-popup";
import "@privacybydesign/irma-css";

//import { PolyfilledWritableStream } from "web-streams-polyfill";
import { createWriteStream } from "streamsaver";

import { onMount } from 'svelte';

import * as Functions from './+page.js'


const pkg = "https://main.irmaseal-pkg.ihub.ru.nl";
var mpk;
var mod;

let sel1 = '';

var testbool = false;

$: if (Functions.showSelection) {
    console.log("show selection is on");
}

//export var test1 = false;
var showthis = false;
var showcreds = false;
var enableButton = false;
var senddecrypt = false;


let planetPromise = getPlanet();

function doDecrypt() {
    senddecrypt = true;
    console.log("hello");
  }


async function getPlanet() {
    mod = await import("@e4a/irmaseal-wasm-bindings");
    console.log("loaded WASM module");

    const resp = await fetch(`${pkg}/v2/parameters`);
    mpk = await resp.json().then((r) => r.publicKey);

    console.log("type of mpk: ", typeof mpk);

    console.log("retrieved public key: ", mpk);
    //console.log("resp: ", resp);
}

// function handleClick() {
// 	console.log("send missile");

//     console.log("input file: ", inFile);
// }


onMount(() => {
    

    const buttons = document.querySelectorAll("input");
    buttons.forEach((btn) => btn.addEventListener("change", listener));
});

const listener = async (event) => {
  const decrypt = event.srcElement.classList.contains("decrypt");
  const [inFile] = event.srcElement.files;

  console.log("infile: ", [inFile]);

  const outFileName = decrypt
    ? inFile.name.replace(".encrypted", ".eml")
    : `${inFile.name}.encrypted`;
  const fileWritable = createWriteStream(outFileName);

  const readable = inFile.stream();
  const writable = fileWritable;

    try {
        const unsealer = await mod.Unsealer.new(readable);
        //const unsealer = mod.Unsealer.new(readable);
        const hidden = unsealer.get_hidden_policies();

        console.log("hidden: ", hidden)

        Functions.handleRecipients(hidden);

        // this is a workaround, can be easier?
        if(Functions.showSelection) {
            showthis = true;
        }

        if(Functions.showCreds) {
            showcreds = true;
        }

        if(Functions.enableButton) {
            enableButton = true;
        }




        //if(true) {

        const keyRequest = Functions.keyRequest
        const identifier = Functions.identifier
        const timestamp = Functions.timestamp

        console.log("timestamp: ", timestamp);
        // what is the timestamp for?

        testbool = true;

        const session = {
        url: pkg,
        start: {
            url: (o) => `${o.url}/v2/request/start`,
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(keyRequest),
        },
        mapping: {
            // temporary fix, what is this fix for?
            sessionPtr: (r) => {
            const ptr = r.sessionPtr;
            ptr.u = `https://ihub.ru.nl/irma/1/${ptr.u}`;
            return ptr;
            },
        },
        result: {
            url: (o, { sessionToken }) =>
            `${o.url}/v2/request/jwt/${sessionToken}`,
            parseResponse: (r) => {
            return r
                .text()
                .then((jwt) =>
                fetch(`${pkg}/v2/request/key/${timestamp.toString()}`, {
                    headers: {
                    Authorization: `Bearer ${jwt}`,
                    },
                })
                )
                .then((r) => r.json())
                .then((json) => {
                if (json.status !== "DONE" || json.proofStatus !== "VALID")
                    throw new Error("not done and valid");
                return json.key;
                })
                .catch((e) => console.log("error: ", e));
            },
        },
        };

            const irma = new IrmaCore({ debugging: true, session });

            irma.use(IrmaClient);
            irma.use(IrmaPopup);

            const usk = await irma.start();
            console.log("retrieved usk: ", usk);

            const t0 = performance.now();

            await unsealer.unseal(identifier, usk, writable);
            
            const tDecrypt = performance.now() - t0;

            console.log(`tDecrypt ${tDecrypt}$ ms`);
            console.log(`average MB/s: ${inFile.size / (1000 * tDecrypt)}`);
        }

   // } 
    catch (e) {
        console.log("error during unsealing: ", e);
    }
  
};

</script>


<h2>Decryption2</h2>


{#await planetPromise}
Loading planet...
{:then planet}
Retrieved public key
{:catch someError}
System error: {someError.message}.
{/await}

<input 
    type=file 
    id="decrypt"
/>

<!-- this doesn't work if the variable isn't from this file?????-->
<!-- show selection dropdown when there are multiple recipients-->
{#if showthis }
	<p>show selection</p>
    <select bind:value={sel1} on:change={() => Functions.bla(sel1) }>
        {#each Functions.allkeys as key}
            <option value={key}>
                {key}
            </option>
        {/each}
    </select>

    <p>selected value is {sel1}</p>
{/if}


{#if showcreds}
<p>Your credentials:</p>
    {#each Functions.thecredst as t}
        {t}<br>
    {/each}
{/if}


<!-- added submit button for UX reasons -->
<button disabled={!enableButton} on:click={doDecrypt}>
	Decrypt
</button>