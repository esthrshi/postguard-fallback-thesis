<script>
import { emails } from './../../store/email.js'
import * as PostalMime from 'postal-mime'

function test() {
    //console.log("id: ", $emails[0].id)
    $emails = $emails.filter(x => x.id != 1)

    console.log("deleted item with id 1")
    //console.log("find x: ", $emails.find(x => x.id === 1))
    //arr.find(o => o.name === 'string 1');
    //someArray = someArray.filter(person => person.name != 'John');  // is there a more efficient way to remove an element...?

    //someArray = someArray.filter(person => person.name != 'John');
}

let showBody = false
let from, to, subject, date, body
let currentEmail, currentID

async function showMail(id, email) {
    currentEmail = email
    currentID = id
    const parser = new PostalMime.default()
    let preview = await parser.parse(email)
    from = preview.from
    to = preview.to
    date = preview.headers[0]["value"]
    subject = preview.subject
    body = preview.html
    showBody = true
}

function deleteMail() {
    $emails = $emails.filter(x => x.id != currentID)
}

function deleteAll() {
    //ask for confirmation
}

function downloadMail() {
    const downFile = new Blob([currentEmail], { type: "text/html"}) // not sure if text/html is correct....
    let a = document.createElement("a"),
        url = URL.createObjectURL(downFile)

    a.href = url;
    a.download = "postguard.eml"
    document.body.appendChild(a)

    a.click()
    URL.revokeObjectURL(url)
    a.remove()
}

// zip
function downloadAll() {
    
}



</script>

<h2>E-mail History</h2>

<button on:click={test}>
	test
</button><br>

<div id="client">

<div id="sidebar">
    {#each $emails as email}
        <div id="sb-th" tabindex="-1" on:click|preventDefault={() => showMail(email.id, email.raw)} on:keypress >
        From: {email.from.name} {email.from.address} <br>
        To: 
            {#each email.to as { name, address } }
            {name} &lt;{address}&gt;,
            {/each}
        <br>
        Date: {email.date} <br>
        Subject: {email.subject} <br><br>
        </div>
    {/each}
    </div>

    <div id="content"> <!-- make component of this?-->
        <h2>Email Body</h2>

        {#if showBody}

        <button on:click={downloadMail}>
            Download
        </button>
        <button on:click={deleteMail}>
            Delete
        </button>
        <br>
            From: {from.name} &lt;{from.address}&gt;<br>
            To: 
                {#each to as {name, address} }
                {name} &lt;{address}&gt;,
                {/each}
            <br>
            Date: {date}<br>
            Subject: {subject}<br><br>

            Body:<br>
            {@html body}
        {/if}
    </div>
</div>


<style>

#client {
    display: flex;
    border: 1px solid;
}

#sidebar {
    overflow: scroll;
}

#sb-th {
    border-bottom: 1px solid;
    border-right: 1px solid;
    cursor: pointer;
}

#sb-th:hover {
    background: rgb(219, 219, 219); 
}

#sb-th:focus {  /** focus doesn't work */
    background: rgb(184, 184, 184);    
}

#content {
    overflow: scroll;
}

</style>