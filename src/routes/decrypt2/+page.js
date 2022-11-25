export var keyRequest
export var identifier
export var timestamp
export var showSelection = false;

// takes the recipient(s) from the encrypted file and processes them
export function handleRecipients(recip) {

    // check if there is one (1) recipient or multiple
    if (Object.keys(recip).length == 1) {
        console.log("one recipient")
        oneRecipient(recip);
    } else {
        console.log("multiple recipients")
    }
}

// in case there is only one recipient specified
export function oneRecipient(recip) {
    let key = Object.keys(recip)  // get the key (email) of the recipient
    identifier = String(Object.keys(recip))  // get the identifier, cast it to a string
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
            console.log("t: ", kr[key[0]]["con"][i]["t"])
        }

        delete kr[key[0]]["con"][i]["v"];
    }

    // create key request
    keyRequest = {
        con: 
            recip[key[0]]["con"]
    }

    console.log("key request: ", keyRequest)
}

// in case there are multiple recipients specified, ask user to identify themselves
export function multRecipients(recip) {
    
    showSelection = true;


}