<script>

// logic
import * as email from './../logic/email.js'

export let decryptedMail = {
    subject: null,
    headers: [{}],
    from: {},
    to: [],
    html: null,
    attachments: [{}]
}
    
</script>


<div class="header">
    <b>Subject:</b> {decryptedMail.subject} <br>
    <b>Date:</b> {decryptedMail.headers[0]["value"]} <br>
    <b>From (Sender):</b> {decryptedMail.from.name} &lt;{decryptedMail.from.address}&gt; <br>
    <b>To Recipient(s): </b> 

    {#each decryptedMail.to as { name, address } }
        {name} &lt;{address}&gt;,
    {/each}<br><br>

    {#if decryptedMail.attachments[0]}
    <b>Attachments</b>
{/if}
    {#each decryptedMail.attachments as att}
    <div id="att" on:click|preventDefault={() => email.downloadAttachment(att.content, att.mimeType, att.filename)} on:keypress >
        {att.filename},
    </div>
    {/each}
</div>

<div class="content">
    <b>Body</b>
    <iframe id="myIframe" srcdoc={decryptedMail.html} title="Mail message" sandbox />
</div>

<style>

.header {
    margin-bottom: 5px;
}

.content {
    padding-top: 5px;
    height: 65%;
}

#myIframe {
    border: none;
    width: 100%;
    height: 100%;
}

#att:hover {
    text-decoration: underline;
    cursor: pointer;
}

</style>