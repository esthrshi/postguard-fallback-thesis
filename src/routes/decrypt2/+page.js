import * as Bla from './+page.svelte'

export var keyRequest
export var identifier
export var timestamp
export var showSelection = false;
export let selected;
export var allkeys;

export var showCreds = false;
export var thecredst = [];
export var thecredsv;

let thecreds = [
    { t: 'weee', v: '' }
];

export var enableButton;

var recip1;

// takes the recipient(s) from the encrypted file and processes them
export function handleRecipients(recip) {
    recip1 = recip;

    // check if there is one (1) recipient or multiple
    if (Object.keys(recip).length == 1) {
        console.log("one recipient")
        oneRecipient(recip, 'esthrshi@gmail.com');
    } else {
        console.log("multiple recipients")
        multRecipients(recip)
    }
}

// in case there is only one recipient specified
export function oneRecipient(recip, id) {

    //Object.keys(hidden)
    let key = Object.keys(recip)  // get the key (email) of the recipient
    console.log('key: ', key)
    identifier = String(key)  // get the identifier, cast it to a string
    timestamp = recip[identifier].ts  // create timestamp

    console.log("recip: ", recip)

    let kr = recip  // set up key request
    kr[key[0]]["con"]["0"]["v"] = identifier  // put the email in the email value of the keyrequest

    // remove value key from all non-email attributes
    for (var i = 1; i < kr[key[0]]["con"].length; i++) {

        // check if there are attributes of the following type: mobile number, surf ID
        // display their preview to the user
        // ask leon if i need to pay attention to any other attributes
        if(kr[key[0]]["con"][i]["t"] == "pbdf.sidn-pbdf.mobilenumber.mobilenumber" || 
           kr[key[0]]["con"][i]["t"] == "pbdf.pbdf.surfnet-2.id") {
            showCreds = true;
            thecredst.push(kr[key[0]]["con"][i]["t"] + ": " + kr[key[0]]["con"][i]["v"])
            //thecredsv.push(kr[key[0]]["con"][i]["v"])
            console.log("t: ", kr[key[0]]["con"][i]["t"])
        }

        delete kr[key[0]]["con"][i]["v"];
    }

    // create key request
    keyRequest = {
        con: 
            kr[key[0]]["con"] // check this
    }

    console.log("key request: ", keyRequest)
    enableButton = true;
}

// in case there are multiple recipients specified, ask user to identify themselves
export function multRecipients(recip) {
    showSelection = true;
    allkeys = Object.keys(recip)
    console.log("all keys: ", allkeys)
}


// most of this is same as oneRecipient so better to merge them
export function bla(identifier) {
    console.log("selected someone: ", identifier)
    //console.log("typeof: ", typeof x)

        //Object.keys(hidden)
    //let key = Object.keys(recip)  // get the key (email) of the recipient
    //console.log('key: ', key)
    //identifier = String(key)  // get the identifier, cast it to a string
    timestamp = recip1[identifier].ts  // create timestamp

    console.log("recip: ", recip1)

    //console.log()
    let kr = recip1  // set up key request
    kr[identifier]["con"]["0"]["v"] = identifier  // put the email in the email value of the keyrequest

    // remove value key from all non-email attributes
    for (var i = 1; i < kr[identifier]["con"].length; i++) {

        // check if there are attributes of the following type: mobile number, surf ID
        // display their preview to the user
        // ask leon if i need to pay attention to any other attributes
        if(kr[identifier]["con"][i]["t"] == "pbdf.sidn-pbdf.mobilenumber.mobilenumber" || 
           kr[identifier]["con"][i]["t"] == "pbdf.pbdf.surfnet-2.id") {
            console.log("t: ", kr[identifier]["con"][i]["t"])
        }

        delete kr[identifier]["con"][i]["v"];
    }

    // create key request
    keyRequest = {
        con: 
            kr[identifier]["con"]
    }

    console.log("key request: ", keyRequest)
    console.log("multiple recipientssss")
    enableButton = true;


   // console.log("this rec: ", recip1[key])
}