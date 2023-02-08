<script>

// stores
import { emails } from './../../store/email.js'

// components
import EmailView from './../../components/emailView.svelte'

// logic
import * as email from './../../logic/email.js'

let showBody = false
let currentID, currentParsed, currentRaw


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

    <div id="content">

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
                    <button on:click={() => email.downloadAttachment(currentRaw, "text/plain", "postguard.eml")}>
                        <span class="material-icons">download</span>
                    </button>
                    <button on:click={deleteMail}>
                        <span class="material-icons">delete</span>
                    </button>
                </div>
            </div>

            <EmailView decryptedMail={currentParsed} />
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

#sb-th:focus {
    background: rgb(212, 212, 212);    
}

#content {
    overflow: auto;
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
}

#noemails {
    padding-left: 20px;
    padding-top: 100px;
    padding-right: 20px;
}

</style>