export var keyRequest
export var identifier
export var timestamp

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

    recip[key[0]]["con"]["0"]["v"] = identifier  // put the email in the value of the keyrequest

    // create key request
    keyRequest = {
        con: [
            recip[key[0]]["con"]["0"]
        ]
    }
}