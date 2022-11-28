<script>
import * as IrmaCore from "@privacybydesign/irma-core";
import * as IrmaClient from "@privacybydesign/irma-client";
import * as IrmaPopup from "@privacybydesign/irma-popup";
import "@privacybydesign/irma-css";

//import { PolyfilledWritableStream } from "web-streams-polyfill";
import { createWriteStream } from "streamsaver";
import { onMount } from 'svelte';

import { curMailSubject, curMailDate, curMailHTML } from './../../store/email.js'

import * as PostalMime from 'postal-mime'

// var or let?

const pkg = "https://main.irmaseal-pkg.ihub.ru.nl"
var mod
var mpk
var writable
var unsealer
var inFile

var recip
var keyRequest
var identifier
var timestamp

var enableSubmit = false
var enableDownload = false
var showSelection = false
let keySelection = ''
var allkeys
var showCreds = false
var listOfKeys = []

let outFile = "";
const unsealerWritable = new WritableStream({
write: (chunk) => {
        outFile += new TextDecoder().decode(chunk);
    },
});


// listen for file upload
onMount(() => {
    const buttons = document.querySelectorAll("input");
    buttons.forEach((btn) => btn.addEventListener("change", listener));
})

// load WASM module and get key
async function loadModule() {
    mod = await import("@e4a/irmaseal-wasm-bindings");
    const resp = await fetch(`${pkg}/v2/parameters`);
    mpk = await resp.json().then((r) => r.publicKey);
}

// take input file and get hidden policies
const listener = async (event) => {
  const decrypt = event.srcElement.classList.contains("decrypt");
  [inFile] = event.srcElement.files;
  //const fileWritable = createWriteStream("postguard.eml");

  const readable = inFile.stream();

    try {
        unsealer = await mod.Unsealer.new(readable);
        recip = unsealer.get_hidden_policies();
        handleRecipients(recip);
    }
    catch (e) {
        console.log("error during unsealing: ", e);
    }
}

// takes the recipient(s) from the encrypted file and processes them
function handleRecipients(recip) {

    // check if there is one (1) recipient or multiple
    if (Object.keys(recip).length == 1) {
        console.log("one recipient")
        getRecipient(Object.keys(recip));
    } else {
        console.log("multiple recipients")
        showSelection = true;
        allkeys = Object.keys(recip)
    }
}

// set up recipient
function getRecipient(key) {
    listOfKeys = []
    console.log('key: ', key)
    identifier = String(key)  // get the identifier, cast it to a string
    timestamp = recip[identifier].ts  // create timestamp

    console.log("recip: ", recip)

    let kr = JSON.parse(JSON.stringify(recip))  // set up key request
    kr[key]["con"]["0"]["v"] = identifier  // put the email in the email value of the keyrequest

    // remove value key from all non-email attributes
    for (var i = 1; i < kr[key]["con"].length; i++) {

        // check if there are attributes of the following type: mobile number, surf ID
        // display their preview to the user
        // ask leon if i need to pay attention to any other attributes
        if(kr[key]["con"][i]["t"] == "pbdf.sidn-pbdf.mobilenumber.mobilenumber") {
            showCreds = true;
            listOfKeys.push("Mobile number: " + recip[key]["con"][i]["v"])
        }
        if(kr[key]["con"][i]["t"] == "pbdf.pbdf.surfnet-2.id") {
            showCreds = true;
            listOfKeys.push("Student ID: " + recip[key]["con"][i]["v"])
        }

        delete kr[key]["con"][i]["v"];
    }

    // create key request
    keyRequest = {
        con: 
            kr[key]["con"]
    }

    console.log("key request: ", keyRequest)
    enableSubmit = true;
}

// send out decryptio request to IRMA server
async function doDecrypt() {
        console.log("timestamp: ", timestamp);
        // what is the timestamp for?

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

        await unsealer.unseal(identifier, usk, unsealerWritable);
        
        const tDecrypt = performance.now() - t0;

        console.log(`tDecrypt ${tDecrypt}$ ms`);
        console.log(`average MB/s: ${inFile.size / (1000 * tDecrypt)}`);


        console.log('decrypted file: ', outFile)
        //emailView.displayMail(outFile)
        displayMail(outFile)
        enableDownload = true
}

// download email on button click
function downloadFile() {
    const downFile = new Blob([outFile], { type: "text/html"}) // not sure if text/html is correct....
    let a = document.createElement("a"),
        url = URL.createObjectURL(downFile)

    a.href = url;
    a.download = "postguard.eml"
    document.body.appendChild(a)

    a.click()
    URL.revokeObjectURL(url)
    a.remove()
}


async function displayMail(email) {
    const parser = new PostalMime.default()
    let preview = await parser.parse(email)

    curMailSubject.set(preview.subject)
    curMailDate.set(preview.date)
    curMailHTML.set(preview.html)

    var tag_id = document.getElementById('emailbody')
    tag_id.style.isolation="isolate"
    tag_id.innerHTML = $curMailHTML;    // is this safe?
}

</script>


<h2>Decrypt E-mail</h2>


<!-- load wasm module -->
{#await loadModule()}
Loading decryption module...
{:then x}
Retrieved public key
{:catch someError}
System error: {someError.message}.
{/await}

<!-- encrypted file upload -->
<input 
    type=file 
    id="decrypt"
/>

<!-- show selection dropdown when there are multiple recipients-->
{#if showSelection }
	<p>show selection</p>
    <select bind:value={keySelection} on:change={() => getRecipient(keySelection) }>
        {#each allkeys as key}
            <option value={key}>
                {key}
            </option>
        {/each}
    </select>

    <p>selected value is {keySelection}</p>
{/if}

<!-- if there are credentials with a preview, show them -->
{#if showCreds}
<p>Your credentials:</p>
    {#each listOfKeys as keys}
        {keys}<br>
    {/each}
{/if}

<!-- submit button for UX reasons
allows user to make and change their selection if there are multiple recipients
allows user to see the credentials before they proceed with decryption  -->
<button disabled={!enableSubmit} on:click={doDecrypt}>
	Decrypt
</button>

<!-- {#if enableDownload}
<EmailView bind:email={outFile} />
{/if} -->


{#if enableDownload}
<h3>E-mail Preview</h3>

{$curMailSubject} <br>
{$curMailDate} <br>

<div id="emailbody">
    
</div>

<!-- <iframe 
    id="emailbody"
    title="emailbody">
</iframe> -->


{/if}


<!-- download decrypted file -->
<button disabled={!enableDownload} on:click={downloadFile}>
	Download
</button>