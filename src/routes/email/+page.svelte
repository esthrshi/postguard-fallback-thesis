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

async function showMail(email) {
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

}

function deleteAll() {
    //ask for confirmation
}

function downloadMail() {
    
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
        <div id="sb-th" on:click|preventDefault={() => showMail(email.raw)} on:keypress >
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

    <div id="content">
        <h2>Email Body</h2>

        {#if showBody}
            From: {from}<br>
            To: {to}<br>
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

#sb-th:hover, #sb-th:focus{  /** focus doesn't work */
    background: green;    
}

#content {
    overflow: scroll;
}

</style>