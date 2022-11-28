import { writable } from 'svelte/store'
import { browser } from '$app/environment'

export const curMailSubject = writable ('')
export const curMailDate = writable ('')
export const curMailHTML = writable ('')