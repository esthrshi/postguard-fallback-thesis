<script>
import * as IrmaCore from "@privacybydesign/irma-core";
import * as IrmaClient from "@privacybydesign/irma-client";
import * as IrmaPopup from "@privacybydesign/irma-popup";
import "@privacybydesign/irma-css";

//import { PolyfilledWritableStream } from "web-streams-polyfill";
import { createWriteStream } from "streamsaver";
import { onMount } from 'svelte';

import { curMail, curMailSubject, curMailDate, curMailHTML, emails } from './../../store/email.js'
import { boolCacheEmail, boolCacheIRMA } from './../../store/settings.js'
import { krCache } from './../../store/jwt.js'

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

let krCacheSorted
let jwtCache


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

    // must first sort this recip before we can compare it to the stored values
    
    let key

    // check if there is one (1) recipient or multiple
    if (Object.keys(recip).length == 1) {
        key = Object.keys(recip)[0]
        hashCon(recip[key])
        console.log("one recipient")
        checkJWT(recip)
        
    } else {
        console.log("multiple recipients")
        showSelection = true;
        allkeys = Object.keys(recip)
    }
}

let krCacheTemp =
  {
    jwt: null,
    jwtValid: null,
    key: null,
    krCon: {}
  }

// set up recipient
function getRecipient(key) {
    listOfKeys = []
    console.log('key: ', key)
    identifier = String(key)  // get the identifier, cast it to a string
    timestamp = recip[identifier].ts  // create timestamp

    console.log("recip: ", recip)

    let kr = JSON.parse(JSON.stringify(recip))  // set up key request

    console.log("sort kr")
    let test1 = hashCon(recip[key]["con"])
    console.log("sorted kr: ", test1)
    krCacheTemp.krCon = test1
    krCacheTemp.key = key



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
        else if (kr[key]["con"][i]["t"] == "pbdf.pbdf.surfnet-2.id") { // not sure if else if syntax is correct here?
            showCreds = true;
            listOfKeys.push("Student ID: " + recip[key]["con"][i]["v"])
        }

        delete kr[key]["con"][i]["v"];
    }

    checkJWT2(kr, key)

    createKr(kr, key)
}

function createKr(kr, key) {
        // create key request
        keyRequest = {
        con: 
            kr[key]["con"],
        validity: secondsTill4AM()
    }
    //krCacheTemp.krStripped = keyRequest

    console.log("key request: ", keyRequest)
    enableSubmit = true;
}

function secondsTill4AM() {
    const now = Date.now()
    const nextMidnight = new Date(now).setHours(24, 0, 0, 0)
    const secondsTillMidnight = Math.round((nextMidnight - now) / 1000)
    const secondsTill4AM = secondsTillMidnight + 4 * 60 * 60
    return secondsTill4AM % (24 * 60 * 60)
}

function getCachedRecipient(krConCache) {

}

let krJWT
let cached = false

function checkJWT(recip) {
    let key2 = Object.keys(recip)[0]

    for (const kr of $krCache) { 
        if (kr.key === key2 && JSON.stringify(kr.krCon) === JSON.stringify(recip[key2]["con"]) ) {
            cached = true
            krJWT = kr.jwt
            // check if this key is still valid. if not, remove it from the list
            break;
        }
    }

    if (!cached) {
        getRecipient(key2)
    }
}

function checkJWT2(recip, key2) {

    for (const kr of $krCache) { 
        if (kr.key === key2 && JSON.stringify(kr.krCon) === JSON.stringify(recip[key2]["con"]) ) {
            cached = true
            krJWT = kr.jwt
            // check if this key is still valid. if not, remove it from the list
            break;
        }
    }

    if (!cached) {
        createKr(key2)
    }
}

function hashCon(con) { // rename this function
    const sorted = con.sort(
        (att1, att2) =>
            att1.t.localeCompare(att2.t) || att1.v.localeCompare(att2.v)
    )
    return sorted
}

// send out decryption request to IRMA server
async function doDecrypt() {

        //check if there already exists a JWT for this specific combination of creds
        //checkJWT()
        // console.log("timestamp: ", timestamp);
        // what is the timestamp for?

        let usk

        if (cached) {
            usk = await fetch(`${pkg}/v2/request/key/${timestamp.toString()}`, {
                    headers: {
                    Authorization: `Bearer ${jwtCache}`,
                    },
                }).then((r) => r.json().then((o) => o.key))
                .catch(e => {
                        console.log(e);
                        return e;
                });
        } else {
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
                        //console.log("JWT: ", jwt)
                        krCacheTemp.jwt = jwt
                        //var decoded = jwt_decode(jwtCache)
                        //console.log("jwt decoded: ", decoded)
                        // only need to do fetch request when keyrequest is same
                        return fetch(`${pkg}/v2/request/key/${timestamp.toString()}`, {
                            headers: {
                            Authorization: `Bearer ${jwt}`,
                        },
                    })
                    
                    }
                    
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
            }

            const irma = new IrmaCore({ debugging: true, session });

            irma.use(IrmaClient);
            irma.use(IrmaPopup);
            usk = await irma.start();
        }

        //jwtCache = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2NzA4NTc0NjMsImlhdCI6MTY3MDg1Mzg2MywiaXNzIjoiaXJtYXNlcnZlciIsInN1YiI6ImRpc2Nsb3NpbmdfcmVzdWx0IiwidG9rZW4iOiJVT2doY1BNYlpyR3JFbkN4MEdMciIsInN0YXR1cyI6IkRPTkUiLCJ0eXBlIjoiZGlzY2xvc2luZyIsInByb29mU3RhdHVzIjoiVkFMSUQiLCJkaXNjbG9zZWQiOltbeyJyYXd2YWx1ZSI6ImVzdGhyc2hpQGdtYWlsLmNvbSIsInZhbHVlIjp7IiI6ImVzdGhyc2hpQGdtYWlsLmNvbSIsImVuIjoiZXN0aHJzaGlAZ21haWwuY29tIiwibmwiOiJlc3RocnNoaUBnbWFpbC5jb20ifSwiaWQiOiJwYmRmLnNpZG4tcGJkZi5lbWFpbC5lbWFpbCIsInN0YXR1cyI6IlBSRVNFTlQiLCJpc3N1YW5jZXRpbWUiOjE2NjgwMzg0MDB9XV19.nRDpkHVV6QcgU-DuM19SWgRm7nudIYnNgITxgqPHW1ramoRBC_zbCNIU0LdnsFvwZueozQhwjQk2f5NeOSRIwwodPDTx3oJT4yfTWPc0Xqg_x8cuqI3k0ibAhK0prXrKbEMiHQmYRQ_QwjTzS8lDjaorQxwCQcWUShlPArMqfLDvNh2KH6xw_JFIELqmvXdhqKiGM5GKk9zpXJIWEj6I_E5bKE7fxeoyCT6NBltJGz1FyQ_kq9NO1XeN1N-rqMz--fjMpJINVUPt50QuXD8exEGq4gMrnZ18aLXb9c2i5QWQ_YQnaVoqzfTL8gwQZah7Pv91bR4HG4PhUGq7FrmowQ'

    //     var decoded = jwt_decode(jwtCache)
    //    console.log("jwt decoded: ", decoded)

    //     let usk

    //     usk = await fetch(`${pkg}/v2/request/key/${timestamp.toString()}`, {
    //                 headers: {
    //                 Authorization: `Bearer ${jwtCache}`,
    //                 },
    //             }).then((r) => r.json().then((o) => o.key))
    //             .catch(e => {
    //                     console.log(e);
    //                     return e;
    //             });

    //     console.log("usk: ", usk)


        
        //const usk = "j1rZ6shxKcYB7sX0XYdQ802MNSLKo4qYgXYbE6Pb5m8mSYUxbZ4P1oasSocJp3MCGF8Wrnmc/oy4cRyGb+TBJfxULn0GHKhGLxXC5y5eFLU2wyAC3xxzYClmqk8jYVk4s13H4zFq16ZnZ98ChVZxxLefZY+ILcVjC9v6Ifw+Ohdl5ysI5jAidGPWrixcQEIcBDOgZZ2iBIqK1BRnfxOhWHVZicroyGpe8hbLFgS8e4lbg4j0Zj87Q3ZffnuNa7T5tnNbZJxnah7d8Nt672wumjdgSYOy9Dy2Sx7Zee6qDYnJWkP30nvUGne75JIzpXdFA320ZCZ1gcXDb4LsUZvRxeFYJYAwEtkow2Y6ubTLCjRRFGZy5rvq3NnfESNDwSkWjAja6eG8wRaAmCGzamlUljJl861KlNwKZNamx05EeS7vX2DfFYHpV3ErAlDZrrceF41jX+BNlFTEzZumlhmfOgP6gWFpQSRl56CpICgptsPXN9upEME49sU5js3f1ereijEGPyrHhuQvCGDt78wZEdICGAiuO1BwMHO8taUIkJOXM0d88uUnuV56GOCzqUs5FSIEas+CsRc3f4E/PnEPj4U+eUVCWX1aWKPz4OFcKAIlBXSw2mhoxzS8/1hixDI8pfpxoirgUSnC1J6A1IAtkB4+1qBfcTvfN+BxZEpQz6eoI3PhgImyZJhOe7h5/hEzFe1cc4GwmBbxfrE9A3AzOgM1dl0AE3bgwchKcGjWq93K6cSnxaCh/puf3/M5JnuC"
        console.log("retrieved usk: ", usk);

        const t0 = performance.now();

        await unsealer.unseal(identifier, usk, unsealerWritable);
        
        const tDecrypt = performance.now() - t0;

        console.log(`tDecrypt ${tDecrypt}$ ms`);
        console.log(`average MB/s: ${inFile.size / (1000 * tDecrypt)}`);


        console.log('decrypted file: ', outFile)
        //emailView.displayMail(outFile)

        let ordered
        console.log("check bool IRMA")

        if($boolCacheIRMA) {
            $krCache = [
                    ...$krCache, krCacheTemp
            ]

            console.log("keyrequest to print: ", krCacheTemp)
        }

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

let preview
let fromName // shorten to let fromName, fromAddress
let fromAddress
let to = []
// let toName
// let toAddress

// display email content on page
async function displayMail(email) {
    const parser = new PostalMime.default()
    preview = await parser.parse(email)
    curMail.set(preview)
    fromName = preview.from.name
    fromAddress = preview.from.address

    console.log("curMail: ", $curMail)

    to = preview.to

    curMailSubject.set(preview.subject)
    curMailDate.set(preview.headers[0]["value"])
    curMailHTML.set(preview.html)

    // only cache email if option is checked
    if ($boolCacheEmail) {
        let currentID
        if ($emails[0]) {
            console.log("not empty")
            currentID = $emails[0].id+1
        } else {
            console.log("empty")
            currentID = 0
        }

        $emails = [
                    {
                        id: currentID,
                        from: preview.from,
                        to: preview.to,
                        date: preview.headers[0]["value"],
                        subject: preview.subject, 
                        raw: email
                    },
                    ...$emails,
        ]
    }
    
}

</script>


<h2>Decrypt E-mail</h2>


<!-- load wasm module -->
{#await loadModule()}
Loading...

{:catch someError}
System error: {someError.message}.
{/await}

<p>Download the "postguard.encrypted" file that is attached to the encrypted email you received. Next, add the file here.</p>

<!-- encrypted file upload -->
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
    <select bind:value={keySelection} on:change={() => getRecipient(keySelection) }>
        {#each allkeys as key}
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
    {#each listOfKeys as keys}
        {keys}<br>
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

<!-- {#if enableDownload}
<EmailView bind:email={outFile} />
{/if} -->


{#if enableDownload}
<h3>E-mail Preview</h3>

<b>Subject:</b> {$curMailSubject} <br>
<b>Date:</b> {$curMailDate} <br>    <!-- need to parse this date, convert to local timezone, or not? -->
<b>From (Sender):</b> {fromName} &lt;{fromAddress}&gt; <br>
<b>To Recipient(s): </b> 

{#each to as { name, address } }
	{name} &lt;{address}&gt;, <!-- only add , if there are more than 1 recipients-->
{/each}


{@html $curMailHTML}

{/if}


<!-- download decrypted file -->
<div id='block'>
<button class="button" disabled={!enableDownload} on:click={downloadFile}>
	Download
</button>
</div>


<!-- email view (prototype -->


<style>

select {
    padding: 5px;
    border: 1px solid #d6d6d6;
    border-radius: 5px;
}

</style>