<script>
import * as PostalMime from 'postal-mime'

export let email
let preview

async function displayMail() {
    const parser = new PostalMime.default()
    preview = await parser.parse(email)
}

</script>


<!-- load wasm module -->
{#await displayMail()}
Loading e-mail preview...
{:catch someError}
System error: {someError.message}.
{/await}


<h3>Email Preview</h3>

{email.subject} <br>
{email.date} <br>
<!-- {email.from.address} <br> -->
<!-- {email.to.address} <br> -->
{email.html} <br>