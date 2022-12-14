<script>
// imports
//irma
import * as IrmaCore from "@privacybydesign/irma-core";
import * as IrmaClient from "@privacybydesign/irma-client";
import * as IrmaPopup from "@privacybydesign/irma-popup";
import "@privacybydesign/irma-css";

// extra
//import { createWriteStream } from "streamsaver";
//import * as PostalMime from 'postal-mime'
import jwt_decode from "jwt-decode";
import {Base64} from 'js-base64';
import { onMount } from 'svelte';
import { page } from '$app/stores';

// stores
import { boolCacheEmail, boolCacheIRMA } from '../../store/settings.js'
import { currentMail, emails } from '../../store/email.js'
import { krCache } from '../../store/jwt.js'

// logic
import * as decrypt from './decrypt.js'
import * as email from './email.js'

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

let fileSubmitted = false
let enableSubmit = false
let enableDownload = false
let showSelection = false
let showCreds = false

let keySelection = ''
let credslist = []

let inputtext

let param

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

let parsedMail

// listen for file upload
onMount(() => {
    const buttons = document.querySelectorAll("input");
   // buttons.forEach((btn) => btn.addEventListener("change", listener));

    // see if there's a parameter in the url
    // TODO: should be improved
    param = $page.url.search
})

// take input file and get hidden policies
// const listener = async (event) => {
//   const decrypt = event.srcElement.classList.contains("decrypt");
//   [inFile] = event.srcElement.files;
//   const readable = inFile.stream();

// //   let content = await inFile.text()
// //   console.log("content: ", content)

//     // let sealerReadable = new ReadableStream({
//     // start: (controller) => {
//     //     const encoded = new TextEncoder().encode(encodethis);
//     //     controller.enqueue(encoded);
//     //     //controller.close();
//     //     },
//     // });

//     try {
//         doReset()
//         console.log("try")
//         unsealer = await mod.Unsealer.new(readable);
//         console.log("after unsealer")
//         policies = unsealer.get_hidden_policies();
//         oneOrMultipleRecipients();
//     }
//     catch (e) {
//         console.log("error during unsealing: ", e);
//     }
// }

async function fromParam() {
    let spliced = param.slice(11)
    console.log("url: ", spliced)
    let decoded2 = Base64.toUint8Array(spliced);

    let sealerReadable = new ReadableStream({
    start: (controller) => {
        const encoded = decoded2
        controller.enqueue(encoded);
        controller.close();
        },
    });

    try {
        doReset()
        console.log("try")
        unsealer = await mod.Unsealer.new(sealerReadable);
        console.log("after unsealer")
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
        processCredentials(key)
    } else {
        console.log("multiple recipients")
        showSelection = true
        keylist = Object.keys(policies)
    }
    enableSubmit = true
}

// the chosen recipient is now checked for whether it is already cached in the store
function processPolicy() {
    console.log("process policy")
    timestamp = policies[key].ts 
    recipientAndCreds = decrypt.sortPolicies(policies[key]["con"])     // sort the recipient credentials on alphabetical order
    boolRecipientCached = checkRecipientCached()
}

// check if the recipient with the credentials is already in the store
function checkRecipientCached() {
    console.log("check recipient cached")
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
function doDecrypt() {
    if(showSelection) {
        key = keySelection
        processPolicy()
    }

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
    console.log("cache credentials")
    let jwtdecoded = jwt_decode(krCacheTemp.jwt)
    let blabla = JSON.parse(JSON.stringify(jwtdecoded))

    krCacheTemp.jwtValid = blabla.exp

    if($boolCacheIRMA) {
            $krCache = [
                    ...$krCache, krCacheTemp
            ]
    }

    console.log("end cache credentials")
}

// check if there are credentials with hints
// if so, show them
// TODO: ask leon if i need to pay attention to any other attributes
function processCredentials(key) {
    credslist = []
    showCreds = false
    let pol = policies[key]["con"]

    for (var i = 0; i < pol.length; i++) {

        if(pol[i]["t"] == "pbdf.sidn-pbdf.mobilenumber.mobilenumber") {
            showCreds = true;
            credslist.push("Mobile number: " + pol[i]["v"])
        }
        else if (pol[i]["t"] == "pbdf.pbdf.surfnet-2.id") { // not sure if else if syntax is correct here?
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

    console.log("decrypt file")
    await unsealer.unseal(key, usk, unsealerWritable);
    console.log("after unsealer")
    console.log("outfile: ", outFile)
    enableDownload = true
    console.log("end decrypt file")
}

// reset values, not sure if necessary, maybe force page reload?
function doReset() {
    enableSubmit = enableDownload = showSelection = showCreds = false   // would this make all the values change when you change one in the future?
    keySelection = ''
    credslist = []
    //window.location.reload();   // produces error
}

// async function parseMail(unparsed) {
    
//     const parser = new PostalMime.default()
//     let preview = await parser.parse(unparsed)
//     $currentMail.from = preview.from      // when should i use $?
//     $currentMail.to = preview.to    
//     $currentMail.date = preview.headers[0]["value"]
//     $currentMail.subject = preview.subject
//     $currentMail.body = preview.html

//     // only cache email if option is checked
//     if ($boolCacheEmail) {
//         let currentID
//         if ($emails[0]) {
//             console.log("not empty")
//             currentID = $emails[0].id+1
//         } else {
//             console.log("empty")
//             currentID = 0
//         }

//         $emails = [ // can this be more optimized?
//                     {
//                         id: currentID,
//                         from: preview.from,
//                         to: preview.to,
//                         date: preview.headers[0]["value"],
//                         subject: preview.subject, 
//                         raw: unparsed
//                     },
//                     ...$emails,
//         ]
//     }
// }

function processText() {
    let decodedbase64 = atob(inputtext)
    console.log("decoded base64: ", decodedbase64)

    console.log("compare: ", inputtext == decodedbase64)

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

<!-- put in separate component? -->
{#if enableDownload}
    <h3>E-mail Preview</h3>

    <b>Subject:</b> {$currentMail.subject} <br>
    <b>Date:</b> {$currentMail.date} <br>    <!-- need to parse this date, convert to local timezone, or not? -->
    <b>From (Sender):</b> {$currentMail.from.name} &lt;{$currentMail.from.address}&gt; <br>
    <b>To Recipient(s): </b> 

    {#each $currentMail.to as { name, address } }
        {name} &lt;{address}&gt;, <!-- only add , if there are more than 1 recipients-->
    {/each}


    {@html $currentMail.body}

{/if}

<!-- download decrypted file -->
<div id='block'>
    <button class="button" disabled={!enableDownload} on:click={() => email.downloadFile(outFile)}>
        Download
    </button>
</div>

<!-- <div id='block'>
    <button class="button" on:click={testURI}>
        process text
    </button>
</div> -->


<!-- {#if fileSubmitted}
  <p>{inFile.name} {inFile.size} bytes</p>
  {#await inFile.text() then text}
    {text}
  {/await}
{/if} -->

{#if param}

    <div id="textbox">
        {param}
    </div>

    <button class="button" on:click={fromParam}>
        send nuke
    </button>
{/if}




<style>

select {
    padding: 5px;
    border: 1px solid #d6d6d6;
    border-radius: 5px;
}

#textbox {
    width: 500px;
    height: 300px;
    overflow: scroll;
    overflow-wrap: break-word;
    border: 1px solid black;
}

</style>