<script>
// imports
//irma
import * as IrmaCore from "@privacybydesign/irma-core";
import * as IrmaClient from "@privacybydesign/irma-client";
import * as IrmaPopup from "@privacybydesign/irma-popup";
import "@privacybydesign/irma-css";

// extra
import jwt_decode from "jwt-decode";
import { onMount } from 'svelte';
import { page } from '$app/stores';
import {Base64} from 'js-base64';

// stores
import { boolCacheEmail, boolCacheIRMA } from '../../store/settings.js'
import { emails } from '../../store/email.js'
import { krCache } from '../../store/jwt.js'

// logic
import * as decrypt from './decrypt.js'
import * as email from './../../logic/email.js'

// components
import EmailView from './../../components/emailView.svelte'

// variables
const pkg = "https://main.irmaseal-pkg.ihub.ru.nl"  // server for private key generator
let mod     // WASM module
let unsealer 

let inFile          // input file
let outFile = "";   // output file
const unsealerWritable = new WritableStream({
write: (chunk) => {
        outFile += new TextDecoder().decode(chunk);
    },
});

let policies    // hidden policies
let usk     // user secret key
let keylist     // list of keys (if there are multiple recipients)
let key         // key (email of recipient)
let keyRequest  // key request: sent to server
let recipientAndCreds   // chosen recipient and their credentials
let recipientStripped   // chosen recipient stripepd from credentials: sent to server
var timestamp

let boolRecipientCached
let jwtCached   // cached jwt, if it exists

let enableSubmit = false
let enableDownload = false
let showSelection = false
let showCreds = false

let keySelection = ''
let credslist = []

// JWT cache
let krCacheTemp =
  {
    jwt: '',
    jwtValid: '',
    key: '',
    krCon: {}
  }

let decryptedMail

let param

onMount( async () => {
    mod = await import("@e4a/irmaseal-wasm-bindings");  // load WASM module and get key

    // check if there's an encrypted file in the url
    param = $page.url.hash
    if(param) {
        await fromParam()
    }

    // listen for file upload
    const buttons = document.querySelectorAll("input");
    buttons.forEach((btn) => btn.addEventListener("change", listener));
})

//take input file and get hidden policies
const listener = async (event) => {
  const decrypt = event.srcElement.classList.contains("decrypt");
  [inFile] = event.srcElement.files;
  const readable = inFile.stream();

  try {
        console.log("try")
        unsealer = await mod.Unsealer.new(readable);
        console.log("after unsealer")
        policies = unsealer.get_hidden_policies();
        console.log("policies: ", policies)
        oneOrMultipleRecipients();
    }
    catch (e) {
        console.log("error during unsealing: ", e);
    }
}

async function fromParam() {
    let spliced = param.slice(11)
    let decoded2 = Base64.toUint8Array(spliced);

    let sealerReadable = new ReadableStream({
    start: (controller) => {
        const encoded = decoded2
        controller.enqueue(encoded);
        controller.close();
        },
    });

    await getUnsealer(sealerReadable)
}

async function getUnsealer(readable) {
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
        key = Object.keys(policies)[0]
        krCacheTemp.key = key
        processPolicy()
        processCredentials(key)
    } else {
        showSelection = true
        keylist = Object.keys(policies)
    }
    enableSubmit = true
}

// the chosen recipient is now checked for whether it is already cached in the store
function processPolicy() {
    timestamp = policies[key].ts 
    recipientAndCreds = decrypt.sortPolicies(policies[key]["con"])     // sort the recipient credentials on alphabetical order
    boolRecipientCached = checkRecipientCached()
}

// check if the recipient with the credentials is already in the store
function checkRecipientCached() {
    for (const kr of $krCache) { 
        if (kr.key === key && JSON.stringify(kr.krCon) === JSON.stringify(recipientAndCreds) ) {
            if (Date.now()/1000 < kr.jwtValid) {
                jwtCached = kr.jwt
                return true
            } else {    // jwt expired, so delete it
                $krCache = $krCache.filter(x => x.exp != kr.exp)
                break
            }
        }
    }
    return false
}

// send processed policy to the server and decrypt file
async function doDecrypt() {
    console.log("dodecrypt start")
    if(showSelection) {
        key = keySelection
        krCacheTemp.key = key
        processPolicy()
    }

    if(boolRecipientCached) {
        await getUskCachedJWT()
    } else {
        stripCredentials()
        createKr()
        await getUsk()
    }
    console.log("dodecrypt end")
}

// cache the current credentials if user has chosen to
function cacheCredentials() {
    let jwtdecoded = jwt_decode(krCacheTemp.jwt)
    krCacheTemp.jwtValid = jwtdecoded.exp

    if($boolCacheIRMA) {
            $krCache = [
                    ...$krCache, krCacheTemp
            ]
    }
}

// check if there are credentials with hints
// if so, show them
function processCredentials(key) {
    credslist = []
    showCreds = false
    let pol = policies[key]["con"]

    for (var i = 0; i < pol.length; i++) {

        if(pol[i]["t"] == "pbdf.sidn-pbdf.mobilenumber.mobilenumber") {
            showCreds = true;
            credslist.push("Mobile number: " + pol[i]["v"])
        }
        else if (pol[i]["t"] == "pbdf.pbdf.surfnet-2.id") { 
            showCreds = true;
            credslist.push("Student ID: " + pol[i]["v"])
        }
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
}

// get the usk using a cached jwt value
async function getUskCachedJWT() {
    console.log("getuskcachedjwt start")

    usk = await fetch(`${pkg}/v2/request/key/${timestamp.toString()}`, {
                    headers: {
                    Authorization: `Bearer ${jwtCached}`,
                    },
                }).then((r) => r.json().then((o) => o.key))
                .catch(e => {
                        console.log(e);
                        return e;
                });

    console.log("getuskcachedjwt middle")
    await decryptFile()
    console.log("getuskcachedjwt end")
}

async function getUsk() {
    const session = {
            url: pkg,
            start: {
                url: (o) => `${o.url}/v2/request/start`,
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(keyRequest),
            },
            mapping: {
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
        await decryptFile()
}

async function decryptFile() {
    await unsealer.unseal(key, usk, unsealerWritable);
    decryptedMail = await email.parseMail(outFile)
    storeMail(outFile)
    enableDownload = true
}

function storeMail(unparsed) {
    // only cache email if option is checked
    if ($boolCacheEmail) {
        let currentID
        if ($emails[0]) {
            currentID = $emails[0].id+1
        } else {
            currentID = 0
        }

        $emails = [
                    {
                        id: currentID,
                        from: decryptedMail.from,
                        to: decryptedMail.to,
                        date: decryptedMail.headers[0]["value"],
                        subject: decryptedMail.subject, 
                        raw: unparsed
                    },
                    ...$emails,
        ]
    }
}

</script>


<h2>Decrypt E-mail</h2>

<div id='block'>
    {#if param}
        Encrypted file detected in URL
    {/if}
</div>

<!-- encrypted file upload -->
{#if !param}
    <p>Download the "postguard.encrypted" file that is attached to the encrypted email you received. Next, add the file here.</p>

    <div id='block'>
        <input 
            type=file 
            id="decrypt"
            class="button"
        />
    </div>
{/if}

<!-- show selection dropdown when there are multiple recipients-->
<div id='block'>
    {#if showSelection }
        <p><b>Please select which email belongs to you:</b></p>
        <select bind:value={keySelection} on:change={() => processCredentials(keySelection) }>
            {#each keylist as key}
                <option value={key}>
                    {key}
                </option>
            {/each}
        </select>
    
        <p>You selected {keySelection}</p>
    {/if}
</div>

<!-- if there are credentials with a preview, show them -->
<div id='block'>
    {#if showCreds}
    <b>Your credentials:</b><br>
        {#each credslist as cred }
            {cred}<br>
        {/each}
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

<!-- show email -->
{#if enableDownload}
<h2>Email preview</h2>
<EmailView decryptedMail={decryptedMail} />
{/if}

<!-- download decrypted file -->
<div id='block'>
    <button class="button" disabled={!enableDownload} on:click={() => email.downloadAttachment(outFile, "text/plain", "postguard.eml")}>
        Download
    </button>
</div>

<style>

select {
    padding: 5px;
    border: 1px solid #d6d6d6;
    border-radius: 5px;
}

</style>