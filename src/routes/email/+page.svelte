<script>
// imports
import { onMount } from 'svelte';
import { browser } from '$app/environment'

// stores
import { emails } from './../../store/email.js'

// components
import EmailView from './../../components/emailView.svelte'

//import * as PostalMime from 'postal-mime'

let showBody = false

//let from, to, subject, date, body
let email   // email.js
let currentID, currentParsed, currentRaw

// async function showMail(id, email) {
//     currentEmail = email
//     currentID = id
//     const parser = new PostalMime.default()
//     let preview = await parser.parse(email)
//     from = preview.from
//     to = preview.to
//     date = preview.headers[0]["value"]
//     subject = preview.subject
//     body = preview.html
//     showBody = true
// }

onMount(() => {
    // postalmime only works in browser
    if (browser) {
        import('./../../logic/email.js').then((module) => {
            email = module
        });
    }
})

async function showMail(id, unparsed) {
    currentRaw = unparsed
    currentID = id
    currentParsed = await email.parseMail(unparsed)
    showBody = true
}

function deleteMail() {
    $emails = $emails.filter(x => x.id != currentID)
    showBody = false
}

function downloadMail() {
    const downFile = new Blob([currentRaw], { type: "text/html"})
    let a = document.createElement("a"),
        url = URL.createObjectURL(downFile)

    a.href = url;
    a.download = "postguard.eml"
    document.body.appendChild(a)

    a.click()
    URL.revokeObjectURL(url)
    a.remove()
}

</script>

<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">

<h2>E-mail History</h2>

<div id="client">

<div id="sidebar">

    {#each $emails as email}
        <div id="sb-th" tabindex="-1" on:click|preventDefault={() => showMail(email.id, email.raw)} on:keypress >

            <b>{email.subject}</b> <br>
            {#if email.from.name}
                {email.from.name}
            {:else}
                {email.from.address}
            {/if} <br>

            {email.date}
        </div>
    {/each}
    </div>

    <div id="content"> <!-- make component of this?-->

        {#if !$emails[0]}
        <div id='noemails'>
            <span class="material-icons">mail</span><br>
            There are no emails here.<br>
            Want to save your decrypted emails? Head over to <a href="/settings">settings</a> to have your emails stored in your browser.
        </div>
        {/if}

        {#if showBody}

            <div id='header'>
                <div id='title'>
                    Email preview
                </div>

                <div id='buttons'>
                    <button on:click={downloadMail}>
                        <span class="material-icons">download</span>
                    </button>
                    <button on:click={deleteMail}>
                        <span class="material-icons">delete</span>
                    </button>
                </div>
            </div>

            <EmailView decryptedMail={currentParsed} />

            <!-- <div id='content-body'>

                <b>From:</b> {from.name} &lt;{from.address}&gt;<br>
                <b>To:</b> 
                    {#each to as {name, address} }
                    {name} &lt;{address}&gt;,
                    {/each}
                <br>
                <b>Date:</b> {date}<br>

                {@html body}

            </div> -->
        {/if}
        
    </div>
</div>


<style>

#client {
    display: flex;
    border: 1px dashed;
    border-radius: 10px;
    overflow: hidden;
    width: 100%;
    min-width: 800px;
    height: 600px;
}

#sidebar {
    overflow: scroll;
    /* background-color: rgb(59, 131, 195); */
    border-right: 1px solid;
    width: 20em;
}

#sb-th {
    padding: 3px;
    border-bottom: 1px solid rgb(173, 173, 173);
    cursor: pointer;
    padding: 5px;
}

#sb-th:hover {
    background: rgb(236, 236, 236); 
}

#sb-th:focus {  /** focus doesn't work */
    background: rgb(212, 212, 212);    
}

#content {
    overflow: auto;
    /* background-color: rgb(193, 59, 195); */
    width: 100%;
    padding: 10px;
}

#header {
    display: flex;
}

#title {
    width: 100%;
    font-size: 20px;
}

#buttons {
    min-width: 6em;
    /* background-color: rgb(59, 131, 195); */
}

#noemails {
    padding-left: 20px;
    padding-top: 100px;
    padding-right: 20px;
}

</style>