import { browser } from '$app/environment'

let PostalMime

// postalmime only works in browser
if (browser) {
    import('postal-mime').then((module) => {
        PostalMime = module
    });
}

// parse email using postalmime
export function parseMail(unparsed) {
    const parser = new PostalMime.default()
    return parser.parse(unparsed)
}

// download email on button click
export function downloadFile(outFile) {
    const downFile = new Blob([outFile], { type: "text/html"}) // not sure if text/html is correct....
    let a = document.createElement("a"),
        url = URL.createObjectURL(downFile)

    a.href = url;
    a.download = "postguard.eml"
    document.body.appendChild(a)

    a.click()
    URL.revokeObjectURL(url)
    a.remove()
}