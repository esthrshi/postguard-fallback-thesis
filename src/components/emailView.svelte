<script>

    export let decryptedMail = {
        subject: null,
        headers: [{
            value: null
        }],
        from: {
            name: null,
            address: null
        },
        to: [],
        html: null
    }
    
</script>

<b>Subject:</b> {decryptedMail.subject} <br>
<b>Date:</b> {decryptedMail.headers[0]["value"]} <br>
<b>From (Sender):</b> {decryptedMail.from.name} &lt;{decryptedMail.from.address}&gt; <br>
<b>To Recipient(s): </b> 

{#each decryptedMail.to as { name, address } }
    {name} &lt;{address}&gt;,
{/each}

{@html decryptedMail.html}