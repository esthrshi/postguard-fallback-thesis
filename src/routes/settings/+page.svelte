<script>

import { boolCacheEmail, boolCacheIRMA } from './../../store/settings.js'

function deleteAllMails() {

}

</script>

<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">

<h1>Settings</h1>

<p>All IRMA credentials and decrypted e-mails are cached locally in the user's browser, no information is sent to a server.</p>

<h3>Caching</h3>

<input id="emailCache" type="checkbox" bind:checked={$boolCacheEmail} />
<label for="emailCache">Cache my emails</label> <br>

<input id="irmaCache" type="checkbox" bind:checked={$boolCacheIRMA} />
<label for="irmaCache">Cache my IRMA credentials</label>

<div id='block'>
<h3>IRMA Credentials</h3>

<table id="creds">
    <tr>
      <th>Credentials</th>
      <th>Expiry date</th>
      <th></th>
    </tr>

    <tr>
        <td>something1</td>
        <td>something2</td>
        <td><span class="material-icons" >delete</span></td>
    </tr>

</table>

<button class="button" on:click={deleteAllMails}>
	Delete all IRMA credentials
</button>
</div>

<div id='block'>
<h3>Email History</h3>
<button class="button" on:click={deleteAllMails}>
	Delete all cached emails
</button>
</div>

<style>

#creds {
  border-collapse: collapse;
}

#creds td, #creds th {
  border: 1px solid #ddd;
  padding: 8px;
}

#creds tr:nth-child(even){background-color: #f2f2f2;}

#creds tr:hover {background-color: #ddd;}

#creds th {
  padding-top: 12px;
  padding-bottom: 12px;
  text-align: left;
  background-color: #04AA6D;
  color: white;
}

</style>