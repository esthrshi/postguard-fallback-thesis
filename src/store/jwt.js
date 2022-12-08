import { writable } from 'svelte/store'
import { browser } from '$app/environment'

const storeJWTString = [
  // {
  //   jwt: ''
  //   all the credentials associated with it. the exact phone number and student number must also match
  // }
]

export const jwtString = writable (
  browser && (JSON.parse(localStorage.getItem("emails") || JSON.stringify(storeJWTString)))
)
jwtString.subscribe((val) => browser && (localStorage.emails = JSON.stringify(val)))