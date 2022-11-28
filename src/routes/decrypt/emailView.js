import * as PostalMime from 'postal-mime'
import { curMailSubject, curMailDate, curMailHTML } from './../../store/email.js'

//export let email
export let preview
export let subject
export let date
export let html

export async function displayMail(email) {

    console.log("email1: ", email)
    const parser = new PostalMime.default()
    preview = await parser.parse(email)

    console.log("subject1: ", email.subject)

    curMailSubject.set(JSON.stringify(email.subject))
    curMailDate.set(JSON.stringify(email.date))
    curMailHTML.set(JSON.stringify(email.html))

    console.log("current mail subject: ", curMailSubject)
    // curMailDate.set(email.date)
    // curMailHTML.set(email.html)


    //date = email.date
    //html = email.html

    // console.log("subject: ", subject)
    // console.log("date: ", date)
    // console.log("html: ", html)

}