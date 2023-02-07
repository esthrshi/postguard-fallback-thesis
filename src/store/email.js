import { writable } from 'svelte/store'
import { browser } from '$app/environment'

const storeEmails = [
  // {
  //   id: 0,
  //   from: '',
  //   to: '',
  //   date: '',
  //   subject: '',
  //   raw: ''
  // }
]
export const emails = writable (
  browser && (JSON.parse(localStorage.getItem("emails") || JSON.stringify(storeEmails)))
)
emails.subscribe((val) => browser && (localStorage.emails = JSON.stringify(val)))