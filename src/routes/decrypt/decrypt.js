// imports
// stores
import { krCache } from '../../store/jwt.js'
import { get } from 'svelte/store';

// sort the recipient credentials on alphabetical order
export function sortPolicies(con) {
    console.log("sort policies")
    const sorted = con.sort(
        (att1, att2) =>
            att1.t.localeCompare(att2.t) || att1.v.localeCompare(att2.v)
    )
    return sorted
}

export function secondsTill4AM() {
    const now = Date.now()
    const nextMidnight = new Date(now).setHours(24, 0, 0, 0)
    const secondsTillMidnight = Math.round((nextMidnight - now) / 1000)
    const secondsTill4AM = secondsTillMidnight + 4 * 60 * 60
    return secondsTill4AM % (24 * 60 * 60)
}