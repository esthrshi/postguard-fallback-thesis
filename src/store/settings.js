import { writable } from 'svelte/store'
import { browser } from '$app/environment'


export const boolCacheEmail = writable (
    browser && (JSON.parse(localStorage.getItem("boolCacheEmail") || "false" ) )
)
boolCacheEmail.subscribe((val) => browser && (localStorage.boolCacheEmail = JSON.stringify(val)))

export const boolCacheIRMA = writable (
    browser && (JSON.parse(localStorage.getItem("boolCacheIRMA") || "false" ) )
)
boolCacheIRMA.subscribe((val) => browser && (localStorage.boolCacheIRMA = JSON.stringify(val)))