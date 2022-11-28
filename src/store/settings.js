import { writable } from 'svelte/store'
import {browser} from '$app/environment';

//export const doCacheEmails = writable(false)
//export const doCacheIRMA = writable(false)

export const userName = writable (
    browser && (localStorage.getItem("userName") || "blabla")
)

userName.subscribe((val) => browser && (localStorage.userName = val))

// export const storeCacheEmails = localStore('cache emails', doCacheEmails)
// export const storeCacheIRMA = localStore('cache IRMA', doCacheIRMA)