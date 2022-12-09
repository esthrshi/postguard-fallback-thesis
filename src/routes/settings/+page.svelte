<script>

import { boolCacheEmail, boolCacheIRMA } from './../../store/settings.js'
import { emails } from './../../store/email.js'

function deleteAllMails() {
  if (confirm('Are you sure you want to delete all emails? This action is permanent!')) {
    // Save it!
    $emails = []
    console.log('All emails deleted');
  } else {
    // Do nothing!
    console.log('Action canceled');
}
}

function deleteAllIRMA() {
  if (confirm('Are you sure you want to delete all IRMA credentials? This action is permanent!')) {
    // Save it!
    console.log('All IRMA credentials deleted');
  } else {
    // Do nothing!
    console.log('Action canceled');
  }
}

</script>

<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">

<h1>Settings</h1>

<p>All IRMA credentials and decrypted e-mails are cached locally in the user's browser, no information is sent to a server.</p>


<div id='block2'>
<h3>Caching</h3>

<input id="emailCache" type="checkbox" bind:checked={$boolCacheEmail} />
<label for="emailCache">Cache my emails</label> <br>

<input id="irmaCache" type="checkbox" bind:checked={$boolCacheIRMA} />
<label for="irmaCache">Cache my IRMA credentials</label>
</div>

<div id='block2'>
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

<button class="button" on:click={deleteAllIRMA}>
	Delete all IRMA credentials
</button>
</div>

<div id='block2'>
<h3>Email History</h3>
<button class="button" on:click={deleteAllMails}>
	Delete all cached emails
</button>
</div>

<style>

#block2 {
    margin-bottom: 40px;
}

h3 {
  margin-bottom: 5px;
}

#creds {
  border-collapse: collapse;
  margin-bottom: 20px;
}

#creds td, #creds th {
  border: 1px solid #d6d6d6;
  padding: 7px;
}

/* #creds tr:nth-child(even) {
  background-color: #f9f9f9;
} */

#creds tr:hover {
  background-color: #ddd;
}

#creds th {
  padding: 7px;
  text-align: left;
  background-color: #d6d6d6;
}

</style>