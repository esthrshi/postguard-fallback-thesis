import { writable } from 'svelte/store'
import { browser } from '$app/environment'

export const curMail = writable ()
export const curMailSubject = writable ('')
export const curMailDate = writable ('')
export const curMailHTML = writable ('')


const storeEmails = [
  {
    user_name: "educative 1",
    user_id: "123"
  },

  {
    user_name: "educative 2",
    user_id: "1234"
  },

  {
    user_name: "educative 3",
    user_id: "12345"
  }
]

export const emails = writable (
  browser && (JSON.parse(localStorage.getItem("emails") || JSON.stringify(storeEmails)))
)
emails.subscribe((val) => browser && (localStorage.emails = JSON.stringify(val)))