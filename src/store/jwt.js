import { writable } from 'svelte/store'
import { browser } from '$app/environment'

const storeKrCache = [
  // {
  //   jwt: '',
  //   krStripped: '',
  //   krSorted: {
  //       email: 0,
  //       mobilenumber: '',
  //       surname: '',
  //       dateofbirth: '',
  //       studentid: '',
  //       agb: ''
  //   }
  // }
]
export const krCache = writable (
  browser && (JSON.parse(localStorage.getItem("jwtcache") || JSON.stringify(storeKrCache)))
)
krCache.subscribe((val) => browser && (localStorage.jwtcache = JSON.stringify(val)))