<script>
// imports
//irma
import * as IrmaCore from "@privacybydesign/irma-core";
import * as IrmaClient from "@privacybydesign/irma-client";
import * as IrmaPopup from "@privacybydesign/irma-popup";
import "@privacybydesign/irma-css";

// extra
import { createWriteStream } from "streamsaver";
import * as PostalMime from 'postal-mime'
import { onMount } from 'svelte';

// stores
import { boolCacheEmail, boolCacheIRMA } from '../../store/settings.js'
import { krCache } from '../../store/jwt.js'

// logic
import * as decrypt from './decrypt.js'

// variables
const pkg = "https://main.irmaseal-pkg.ihub.ru.nl"  // server for private key generator
let mod     // WASM module
let mpk     // master private key
let unsealer    // 

let inFile          // input file
let outFile = "";   // output file
const unsealerWritable = new WritableStream({
write: (chunk) => {
        outFile += new TextDecoder().decode(chunk);
    },
});

let policies    // hidden policies
let keylist     // list of keys (if there are multiple recipients)
let key         // key (email of recipient)
let keyRequest  // key request: sent to server
let recipientAndCreds   // chosen recipient and their credentials
let recipientStripped   // chosen recipient stripepd from credentials: sent to server
var timestamp

let boolRecipientCached
let jwtCached   // cached jwt, if it exists

let usk     // user secret key

let enableSubmit = false
let enableDownload = false
let showSelection = false

let keySelection = ''

// load WASM module and get key
async function loadModule() {
    mod = await import("@e4a/irmaseal-wasm-bindings");
    const resp = await fetch(`${pkg}/v2/parameters`);
    mpk = await resp.json().then((r) => r.publicKey);
}

let krCacheTemp =
  {
    jwt: '',
    jwtValid: '',
    key: '',
    krCon: {}
  }

// listen for file upload
onMount(() => {
    const buttons = document.querySelectorAll("input");
    buttons.forEach((btn) => btn.addEventListener("change", listener));
})

// take input file and get hidden policies
const listener = async (event) => {
  const decrypt = event.srcElement.classList.contains("decrypt");
  [inFile] = event.srcElement.files;

  const readable = inFile.stream();

    try {
        unsealer = await mod.Unsealer.new(readable);
        policies = unsealer.get_hidden_policies();
        oneOrMultipleRecipients();
    }
    catch (e) {
        console.log("error during unsealing: ", e);
    }
}

// takes the hidden policies from the encrypted file, and checks whether there is one recipient
// or multiple
function oneOrMultipleRecipients() {
    if (Object.keys(policies).length == 1) {
        console.log("one recipient")
        key = Object.keys(policies)[0]
        krCacheTemp.key = key
        processPolicy()
    } else {
        console.log("multiple recipients")
        showSelection = true;
        keylist = Object.keys(policies)
    }
}

// the user selected a key
function getKey(selection) {
    key = selection
    processPolicy()
}

// the chosen recipient is now checked for whether it is already cached in the store
function processPolicy() {
    console.log("process policy")
    timestamp = policies[key].ts 
    recipientAndCreds = decrypt.sortPolicies(policies[key]["con"])     // sort the recipient credentials on alphabetical order
    boolRecipientCached = checkRecipientCached()
    enableSubmit = true
}

// check if the recipient with the credentials is already in the store
function checkRecipientCached() {
    console.log("check recipient cached")
    for (const kr of $krCache) { 
        if (kr.key === key && JSON.stringify(kr.krCon) === JSON.stringify(recipientAndCreds) ) {
            jwtCached = kr.jwt
            // TODO: check if this key is still valid. if not, remove it from the list
            return true
        }
    }
    return false
}

// send processed policy to the server and decrypt file
function doDecrypt() {
    if(boolRecipientCached) {
        getUskCachedJWT()
    } else {
        stripCredentials()
        createKr()
        getUsk()
    }
}

// cache the current credentials if user has chosen to
function cacheCredentials() {
    if($boolCacheIRMA) {
            $krCache = [
                    ...$krCache, krCacheTemp
            ]
    }
}

// strip the recipient of credentials, to prepare for key request
function stripCredentials() {
    krCacheTemp.krCon = recipientAndCreds
    recipientStripped = JSON.parse(JSON.stringify(recipientAndCreds))  // deep copy of recipient
    for (const c of recipientStripped) {
        delete c.v;
    }
}

// create the key request
function createKr() {
    keyRequest = {
        con: recipientStripped,
        validity: decrypt.secondsTill4AM()
    }
    console.log("key request: ", keyRequest)
}

// get the usk using a cached jwt value
async function getUskCachedJWT() {

    usk = await fetch(`${pkg}/v2/request/key/${timestamp.toString()}`, {
                    headers: {
                    Authorization: `Bearer ${jwtCached}`,
                    },
                }).then((r) => r.json().then((o) => o.key))
                .catch(e => {
                        console.log(e);
                        return e;
                });

    decryptFile()
}

async function getUsk() {
    console.log('get usk')
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
                    {
                        krCacheTemp.jwt = jwt
                        return fetch(`${pkg}/v2/request/key/${timestamp.toString()}`, {
                            headers: {
                            Authorization: `Bearer ${jwt}`,
                            },
                        })
                    })
                    .then((r) => r.json())
                    .then((json) => {
                    if (json.status !== "DONE" || json.proofStatus !== "VALID")
                        throw new Error("not done and valid");
                    return json.key;
                    })
                    .catch((e) => console.log("error: ", e));
                },
            },
            }

        const irma = new IrmaCore({ debugging: true, session });

        irma.use(IrmaClient);
        irma.use(IrmaPopup);
        usk = await irma.start();

        cacheCredentials()
        decryptFile()
}

async function decryptFile() {
    await unsealer.unseal(key, usk, unsealerWritable);
    console.log("outfile: ", outFile)
    //displayMail(outFile)
    enableDownload = true
}

// reset values, not sure if necessary, maybe force page reload?
function doReset() {
    enableSubmit = enableDownload = false
}

</script>


<h2>Decrypt E-mail</h2>


<!-- load wasm module -->
{#await loadModule()}
Loading...

{:catch someError}
System error: {someError.message}.
{/await}

<!-- encrypted file upload -->
<p>Download the "postguard.encrypted" file that is attached to the encrypted email you received. Next, add the file here.</p>

<div id='block'>
    <input 
        type=file 
        id="decrypt"
        class="button"
    />
</div>

<!-- show selection dropdown when there are multiple recipients-->
<div id='block'>
    {#if showSelection }
        <p><b>Please select which email belongs to you:</b></p>
        <select bind:value={keySelection} on:change={() => getKey(keySelection) }>
            {#each keylist as key}
                <option value={key}>
                    {key}
                </option>
            {/each}
        </select>
    
        <p>You selected {keySelection}</p>
    {/if}
    </div>

<!-- submit button for UX reasons
allows user to make and change their selection if there are multiple recipients
allows user to see the credentials before they proceed with decryption  -->
<div id='block'>
    <button class="button" disabled={!enableSubmit} on:click={doDecrypt}>
        Decrypt
    </button>
</div>

<div id='block'>
    <button class="button" on:click={doReset}>
        Reset
    </button>
</div>