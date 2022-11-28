<script>

import { userName } from './../../store/settings.js'


    //import { doCacheEmails, doCacheIRMA } from './../../store/settings'
    //import { alert } from "../store/alert.js";

    //document.getElementById("emailCache").addEventListener("click", savedAlert)

    // function savedAlert() {
    //     $alert = `Settings updated`
    // }

</script>

<h1>Settings</h1>

<h1>{$userName}</h1>

<input type="text"
    bind:value={$userName}
>

<p>All IRMA credentials and decrypted e-mails are cached locally in the user's browser, no information is sent to a server.</p>
<!-- 
<input id="emailCache" type="checkbox" bind:checked={$storeCacheEmails} />
<label for="emailCache">Cache my emails</label> <br>

<input id="irmaCache" type="checkbox" bind:checked={$storeCacheIRMA} />
<label for="irmaCache">Cache my IRMA credentials</label>
<input type="checkbox" on:click={() => $alert = `Settings updated`} bind:checked={$storeCacheEmails} /> -->

<style>


</style>