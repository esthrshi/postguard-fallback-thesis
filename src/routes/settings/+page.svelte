<script>

import { boolCacheEmail, boolCacheIRMA } from './../../store/settings.js'
import { emails } from './../../store/email.js'
import { krCache } from './../../store/jwt.js'

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
    $krCache = []
    console.log('All IRMA credentials deleted');
  } else {
    // Do nothing!
    console.log('Action canceled');
  }
}

function deleteThisIRMA(selected) {
    $krCache = $krCache.filter(x => x.jwtValid != selected.jwtValid)
}

function getstuff(input) {
  console.log(input)
  let str = []
    for (const e of input) {
      console.log(e)
      switch (e["t"]) {
        case 'pbdf.gemeente.personalData.surname': str.push("Surname"); break;
        case 'pbdf.pbdf.surfnet-2.id': str.push("Student ID: " + e["v"]); break;
        case 'pbdf.sidn-pbdf.mobilenumber.mobilenumber': str.push("Mobile number: " + e["v"]); break;
        case 'pbdf.nuts.agb.agbcode': str.push("BSN\n"); break;
      }  
    }

    console.log(str)
    return str
  //   switch (expr) {
  // case 'Oranges':
  //   console.log('Oranges are $0.59 a pound.');
  //   break;
  // case 'Mangoes':
  // case 'Papayas':
  //   console.log('Mangoes and papayas are $2.79 a pound.');
  //   // Expected output: "Mangoes and papayas are $2.79 a pound."
  //   break;
  // default:
}

// put in separate file
function timeConverter(UNIX_timestamp){
  var a = new Date(UNIX_timestamp * 1000);
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var year = a.getFullYear();
  var month = months[a.getMonth()];
  var date = a.getDate();
  var hour = a.getHours();
  var min = a.getMinutes();
  var sec = a.getSeconds();
  var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;
  return time;
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

    {#each $krCache as kr}
    <tr>
        <td>{kr.key} <br>
          {#each getstuff(kr.krCon) as cred }
            {cred}<br>
          {/each}
        </td>
        <td>{timeConverter (kr.jwtValid) }</td>
        <td><span id="deletebutton" class="material-icons" on:click|preventDefault={() => deleteThisIRMA(kr)} on:keypress>delete</span></td>
    </tr>
    {/each}

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

#deletebutton {
  cursor: pointer;
}

</style>